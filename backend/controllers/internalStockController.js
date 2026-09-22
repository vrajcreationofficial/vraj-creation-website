const crypto = require("crypto");

const Product = require("../models/Product");

const INTERNAL_STOCK_SECRET =
  process.env.INTERNAL_STOCK_SECRET || "";

const normalizeSKU = (value = "") => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const verifyInternalSecret = (req) => {
  const receivedSecret =
    req.headers["x-internal-stock-secret"];

  if (
    !INTERNAL_STOCK_SECRET ||
    !receivedSecret
  ) {
    return false;
  }

  try {
    const receivedBuffer = Buffer.from(
      String(receivedSecret),
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      String(INTERNAL_STOCK_SECRET),
      "utf8"
    );

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    );
  } catch (error) {
    return false;
  }
};

const getOperationStore = () => {
  if (!global.__VRAJ_STOCK_OPERATIONS__) {
    global.__VRAJ_STOCK_OPERATIONS__ = new Map();
  }

  return global.__VRAJ_STOCK_OPERATIONS__;
};

const getRollbackStore = () => {
  if (!global.__VRAJ_STOCK_ROLLBACKS__) {
    global.__VRAJ_STOCK_ROLLBACKS__ = new Set();
  }

  return global.__VRAJ_STOCK_ROLLBACKS__;
};

const normalizeItems = (items = []) => {
  return items.map((item) => ({
    sku: normalizeSKU(
      item?.sku ||
        item?.SKU ||
        item?.productSku ||
        item?.productSKU ||
        ""
    ),

    quantity: Number(item?.quantity),
  }));
};

const validateItems = (items) => {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return "At least one stock item is required.";
  }

  const invalidItem = items.some(
    (item) =>
      !item.sku ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
  );

  if (invalidItem) {
    return (
      "Invalid stock item data. SKU and valid quantity are required."
    );
  }

  return null;
};

const decreaseStock = async (req, res) => {
  try {
    if (!verifyInternalSecret(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized stock operation.",
      });
    }

    const {
      operationId,
      items,
    } = req.body || {};

    if (!operationId) {
      return res.status(400).json({
        success: false,
        message: "operationId is required.",
      });
    }

    const normalizedItems =
      normalizeItems(items);

    const validationError =
      validateItems(normalizedItems);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const processedOperations =
      getOperationStore();

    if (
      processedOperations.has(operationId)
    ) {
      const previousOperation =
        processedOperations.get(operationId);

      return res.json({
        success: true,
        alreadyProcessed: true,
        operationId,
        message:
          "Stock operation already processed.",
        items:
          previousOperation?.items || [],
      });
    }

    const productsToUpdate = [];

    for (const item of normalizedItems) {
      const product =
        await Product.findOne({
          sku: item.sku,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product with SKU ${item.sku} not found.`,
        });
      }

      if (
        product.status &&
        product.status !== "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Product ${product.name || item.sku} is inactive.`,
        });
      }

      const currentStock =
        Number(product.stock);

      if (
        !Number.isFinite(currentStock) ||
        currentStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid stock for SKU ${item.sku}.`,
        });
      }

      if (
        currentStock < item.quantity
      ) {
        return res.status(409).json({
          success: false,
          message:
            `${product.name || item.sku} has only ${currentStock} item(s) available.`,
          sku: item.sku,
          availableStock: currentStock,
          requestedQuantity: item.quantity,
        });
      }

      productsToUpdate.push({
        product,
        sku: item.sku,
        quantity: item.quantity,
        previousStock: currentStock,
      });
    }

    const operationItems = [];

    for (const item of productsToUpdate) {
      const newStock =
        item.previousStock -
        item.quantity;

      item.product.stock = newStock;

      await item.product.save();

      operationItems.push({
        sku: item.sku,
        quantity: item.quantity,
        previousStock: item.previousStock,
        remainingStock: newStock,
      });
    }

    processedOperations.set(
      operationId,
      {
        operationId,
        items: operationItems,
        createdAt: Date.now(),
      }
    );

    return res.status(200).json({
      success: true,
      alreadyProcessed: false,
      operationId,
      message:
        "Stock decreased successfully.",
      items: operationItems,
    });
  } catch (error) {
    console.error(
      "DECREASE STOCK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to decrease stock.",
    });
  }
};

const increaseStock = async (req, res) => {
  try {
    if (!verifyInternalSecret(req)) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized stock operation.",
      });
    }

    const {
      operationId,
    } = req.body || {};

    if (!operationId) {
      return res.status(400).json({
        success: false,
        message:
          "operationId is required.",
      });
    }

    const processedRollbacks =
      getRollbackStore();

    if (
      processedRollbacks.has(operationId)
    ) {
      return res.json({
        success: true,
        alreadyProcessed: true,
        operationId,
        message:
          "Stock rollback already processed.",
      });
    }

    const processedOperations =
      getOperationStore();

    const operation =
      processedOperations.get(
        operationId
      );

    if (!operation) {
      return res.status(404).json({
        success: false,
        message:
          "Original stock operation was not found. Rollback cannot be performed safely.",
      });
    }

    const rollbackItems = [];

    for (const item of operation.items) {
      const product =
        await Product.findOne({
          sku: item.sku,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product with SKU ${item.sku} not found during rollback.`,
        });
      }

      const currentStock =
        Number(product.stock);

      if (
        !Number.isFinite(currentStock) ||
        currentStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid stock for SKU ${item.sku} during rollback.`,
        });
      }

      const restoredStock =
        currentStock +
        Number(item.quantity);

      product.stock =
        restoredStock;

      await product.save();

      rollbackItems.push({
        sku: item.sku,
        quantity: item.quantity,
        previousStock: currentStock,
        restoredStock,
      });
    }

    processedRollbacks.add(
      operationId
    );

    return res.status(200).json({
      success: true,
      alreadyProcessed: false,
      operationId,
      message:
        "Stock rollback completed successfully.",
      items: rollbackItems,
    });
  } catch (error) {
    console.error(
      "INCREASE STOCK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to increase stock.",
    });
  }
};

module.exports = {
  decreaseStock,
  increaseStock,
};