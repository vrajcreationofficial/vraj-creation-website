const axios = require("axios");

const PRODUCT_API_URL =
  process.env.PRODUCT_API_URL ||
  "https://vraj-creation.onrender.com/api/products/public";

const PRODUCT_CACHE_TTL =
  Number(process.env.PRODUCT_CACHE_TTL || 30000);

let productCache = {
  data: [],
  expiresAt: 0,
};

const normalizeText = (value = "") => {
  return String(value ?? "").trim();
};

const normalizeUpper = (value = "") => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const getProductsFromAPI = async () => {
  const now = Date.now();

  if (
    Array.isArray(productCache.data) &&
    productCache.expiresAt > now
  ) {
    return productCache.data;
  }

  const response = await axios.get(
    PRODUCT_API_URL,
    {
      timeout: 10000,
    }
  );

  let products = [];

  if (Array.isArray(response?.data)) {
    products = response.data;
  } else if (
    Array.isArray(response?.data?.products)
  ) {
    products = response.data.products;
  } else if (
    Array.isArray(response?.data?.data)
  ) {
    products = response.data.data;
  }

  productCache = {
    data: products,
    expiresAt: now + PRODUCT_CACHE_TTL,
  };

  return products;
};

const findProduct = async (value) => {
  const requested = normalizeText(value);

  if (!requested) {
    return null;
  }

  const products =
    await getProductsFromAPI();

  const requestedUpper =
    requested.toUpperCase();

  const product = products.find((item) => {
    const sku = normalizeUpper(
      item?.sku ||
        item?.SKU ||
        item?.productSKU ||
        item?.productSku
    );

    const id = normalizeText(
      item?._id ||
        item?.id ||
        item?.productId
    );

    return (
      sku === requestedUpper ||
      id === requested
    );
  });

  return product || null;
};

const getProductForOrder = async ({
  sku,
  productId,
} = {}) => {
  const requestedSku =
    normalizeUpper(sku);

  const requestedProductId =
    normalizeText(productId);

  const lookupValue =
    requestedSku ||
    requestedProductId;

  if (!lookupValue) {
    const error = new Error(
      "SKU or product ID is required."
    );

    error.status = 400;

    throw error;
  }

  const product =
    await findProduct(lookupValue);

  if (!product) {
    const error = new Error(
      `Product ${lookupValue} was not found.`
    );

    error.status = 404;

    throw error;
  }

  const actualSku =
    normalizeUpper(
      product?.sku ||
        product?.SKU ||
        product?.productSKU ||
        product?.productSku
    );

  if (!actualSku) {
    const error = new Error(
      "Product does not have a valid SKU."
    );

    error.status = 400;

    throw error;
  }

  if (
    product.status &&
    product.status !== "active"
  ) {
    const error = new Error(
      `Product ${product.name || actualSku} is inactive.`
    );

    error.status = 400;

    throw error;
  }

  const stock = normalizeNumber(
    product.stock,
    0
  );

  const sellingPrice =
    normalizeNumber(
      product.sellingPrice ??
        product.price,
      0
    );

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    const error = new Error(
      `Invalid stock information for SKU ${actualSku}.`
    );

    error.status = 400;

    throw error;
  }

  if (
    !Number.isFinite(sellingPrice) ||
    sellingPrice < 0
  ) {
    const error = new Error(
      `Invalid selling price for SKU ${actualSku}.`
    );

    error.status = 400;

    throw error;
  }

  return {
    ...product,
    sku: actualSku,
    stock,
    sellingPrice,
    price: sellingPrice,
  };
};

const getProductBySKU = async (
  sku
) => {
  const normalizedSku =
    normalizeUpper(sku);

  if (!normalizedSku) {
    return null;
  }

  return findProduct(
    normalizedSku
  );
};

const getProductById = async (
  productId
) => {
  const normalizedId =
    normalizeText(productId);

  if (!normalizedId) {
    return null;
  }

  return findProduct(
    normalizedId
  );
};

const checkProductStock = async (
  sku,
  quantity
) => {
  const product =
    await getProductForOrder({
      sku,
    });

  const requestedQuantity =
    Number(quantity);

  if (
    !Number.isInteger(
      requestedQuantity
    ) ||
    requestedQuantity <= 0
  ) {
    return {
      success: false,
      available: false,
      stock: Number(
        product.stock || 0
      ),
      product,
    };
  }

  const available =
    Number(product.stock || 0) >=
    requestedQuantity;

  return {
    success: true,
    available,
    stock: Number(
      product.stock || 0
    ),
    product,
  };
};

const getProductsForOrder = async (
  items = []
) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const products = [];

  for (const item of items) {
    const sku =
      normalizeUpper(
        item?.sku ||
          item?.SKU ||
          item?.productSku ||
          item?.productSKU ||
          item?.product?.sku
      );

    const productId =
      normalizeText(
        item?.productId ||
          item?.productID ||
          item?.product?._id ||
          item?.product?.id
      );

    const product =
      await getProductForOrder({
        sku,
        productId,
      });

    products.push(product);
  }

  return products;
};

const clearProductCache = () => {
  productCache = {
    data: [],
    expiresAt: 0,
  };
};

module.exports = {
  getProductForOrder,
  getProductBySKU,
  getProductById,
  checkProductStock,
  getProductsForOrder,
  clearProductCache,
};