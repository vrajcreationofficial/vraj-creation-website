const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const CouponClaim = require("../models/CouponClaim");

const {
  getProductForOrder,
} = require("../services/productService");

const {
  calculateShipping,
} = require("../services/shippingService");

const {
  sendOrderEmails,
} = require("../services/emailService");

const {
  generateGSTInvoicePDF,
} = require("../services/gstInvoiceService");

require("dotenv").config();

// =====================================================
// CONFIG
// =====================================================

const DASHBOARD_BACKEND_URL =
  process.env.DASHBOARD_BACKEND_URL ||
  "http://localhost:5000";

const INTERNAL_STOCK_SECRET =
  process.env.INTERNAL_STOCK_SECRET || "";

const BUSINESS_NAME =
  process.env.BUSINESS_NAME ||
  "Vraj Creation";

const BUSINESS_STATE =
  process.env.BUSINESS_STATE ||
  "Rajasthan";

const BUSINESS_STATE_CODE =
  process.env.BUSINESS_STATE_CODE ||
  "08";

const GST_RATE = Number(
  process.env.GST_RATE || 5
);

const CGST_RATE = Number(
  process.env.CGST_RATE || 2.5
);

const SGST_RATE = Number(
  process.env.SGST_RATE || 2.5
);

const IGST_RATE = Number(
  process.env.IGST_RATE || 5
);

const VRAJ_UPI_ID =
  process.env.VRAJ_UPI_ID ||
  "8824968974@ybl";

const ORDER_TIMEOUT_MS = Number(
  process.env.ORDER_TIMEOUT_MS || 15000
);

// =====================================================
// BASIC HELPERS
// =====================================================

const round2 = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  );
};

const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
};

const normalizeUpper = (value) => {
  return normalizeText(value).toUpperCase();
};

const normalizeCouponCode = (value) => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const normalizeTransactionId = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
};

const normalizeMobile = (value) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
};

const isValidMobile = (value) => {
  const mobile = normalizeMobile(value);

  return /^[6-9]\d{9}$/.test(mobile);
};

const isValidPincode = (value) => {
  return /^[1-9][0-9]{5}$/.test(
    String(value ?? "").trim()
  );
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value ?? "").trim()
  );
};

const isValidUPIId = (value) => {
  const upi = String(value ?? "").trim();

  return /^[A-Za-z0-9][A-Za-z0-9._-]{1,255}@[A-Za-z0-9][A-Za-z0-9.-]{1,63}$/.test(
    upi
  );
};

const isValidTransactionId = (value) => {
  const transactionId =
    normalizeTransactionId(value);

  if (
    transactionId.length < 6 ||
    transactionId.length > 40
  ) {
    return false;
  }

  return /^[A-Z0-9._/-]+$/.test(
    transactionId
  );
};

// =====================================================
// PRODUCT HELPERS
// =====================================================

const getItemSKU = (item) => {
  return normalizeUpper(
    item?.sku ||
      item?.SKU ||
      item?.productSKU ||
      item?.product?.sku
  );
};

const getItemQuantity = (item) => {
  const quantity = Number(
    item?.quantity ??
      item?.qty ??
      item?.count ??
      0
  );

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.floor(quantity);
};

const getItemHSN = (item) => {
  return normalizeText(
    item?.hsnCode ||
      item?.hsn ||
      item?.HSNCode ||
      ""
  );
};

const getProductHSN = (product) => {
  return normalizeText(
    product?.hsnCode ||
      product?.hsn ||
      product?.HSNCode ||
      ""
  );
};

const normalizeCategory = (value) => {
  return normalizeText(value).toLowerCase();
};

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const quantity =
        getItemQuantity(item);

      const price = round2(
        Number(
          item?.price ??
            item?.salePrice ??
            item?.sellingPrice ??
            item?.discountedPrice ??
            0
        )
      );

      const originalPrice = round2(
        Number(
          item?.originalPrice ??
            item?.mrp ??
            price
        )
      );

      const discountPercent = round2(
        Number(
          item?.discountPercent ?? 0
        )
      );

      const discountAmount = round2(
        Number(
          item?.discountAmount ??
            Math.max(
              0,
              originalPrice - price
            )
        )
      );

      return {
        sku: getItemSKU(item),

        name: normalizeText(
          item?.name ||
            item?.title ||
            item?.productName ||
            "Product"
        ),

        hsnCode: getItemHSN(item),

        category: normalizeText(
          item?.category
        ),

        subcategory: normalizeText(
          item?.subcategory
        ),

        image: normalizeText(
          item?.image ||
            item?.imageUrl ||
            item?.thumbnail ||
            ""
        ),

        description: normalizeText(
          item?.description || ""
        ),

        size: normalizeText(
          item?.size ||
            item?.selectedSize ||
            ""
        ),

        quantity,

        originalPrice,

        discountPercent,

        discountAmount,

        price,

        subtotal: round2(
          price * quantity
        ),
      };
    })
    .filter(
      (item) =>
        item.sku &&
        item.quantity > 0
    );
};

// =====================================================
// STATE HELPERS
// =====================================================

const normalizeState = (value) => {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
};

const isRajasthanState = (value) => {
  const state =
    normalizeState(value);

  return [
    "rajasthan",
    "raj",
  ].includes(state);
};

// =====================================================
// GST
// =====================================================

const calculateOrderGST = ({
  taxableValue,
  customerState,
}) => {
  const taxable =
    round2(taxableValue);

  const sameState =
    isRajasthanState(
      customerState
    );

  if (sameState) {
    const totalGST = round2(
      taxable *
        (GST_RATE / 100)
    );

    const cgst = round2(
      taxable *
        (CGST_RATE / 100)
    );

    const sgst = round2(
      taxable *
        (SGST_RATE / 100)
    );

    return {
      gstRate: GST_RATE,
      totalGST,
      cgst,
      sgst,
      igst: 0,
      cgstRate: CGST_RATE,
      sgstRate: SGST_RATE,
      igstRate: 0,
      taxType: "CGST_SGST",
    };
  }

  const igst = round2(
    taxable *
      (IGST_RATE / 100)
  );

  return {
    gstRate: IGST_RATE,
    totalGST: igst,
    cgst: 0,
    sgst: 0,
    igst,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: IGST_RATE,
    taxType: "IGST",
  };
};

// =====================================================
// ORDER NUMBER
// =====================================================

const generateOrderNumber = () => {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const random = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `VRJ-${year}${month}${day}-${random}`;
};

// =====================================================
// COUPON HELPERS
// =====================================================

const itemMatchesCouponCategory = (
  item,
  coupon
) => {
  if (!coupon) {
    return true;
  }

  const discountScope =
    normalizeCategory(
      coupon.discountScope ||
        coupon.scope ||
        "all"
    );

  if (
    !discountScope ||
    discountScope === "all"
  ) {
    return true;
  }

  const itemCategory =
    normalizeCategory(
      item.category
    );

  const itemSubcategory =
    normalizeCategory(
      item.subcategory
    );

  return (
    itemCategory ===
      discountScope ||
    itemSubcategory ===
      discountScope
  );
};

const isCouponCurrentlyValid = (
  coupon
) => {
  if (!coupon) {
    return false;
  }

  if (
    coupon.status &&
    normalizeCategory(
      coupon.status
    ) !== "active"
  ) {
    return false;
  }

  const now = new Date();

  if (
    coupon.startDate &&
    new Date(coupon.startDate) >
      now
  ) {
    return false;
  }

  if (
    coupon.expiryDate &&
    new Date(coupon.expiryDate) <
      now
  ) {
    return false;
  }

  if (
    coupon.expiresAt &&
    new Date(coupon.expiresAt) <
      now
  ) {
    return false;
  }

  if (
    coupon.campaignExpiresAt &&
    new Date(
      coupon.campaignExpiresAt
    ) < now
  ) {
    return false;
  }

  return true;
};

// =====================================================
// COUPON CALCULATION
// =====================================================

const validateAndCalculateCoupon =
  async ({
    couponCode,
    items,
    subtotal,
    customerMobile,
  }) => {
    const code =
      normalizeCouponCode(
        couponCode
      );

    if (!code) {
      return {
        coupon: null,
        discount: 0,
        eligibleSubtotal: 0,
      };
    }

    const coupon =
      await Coupon.findOne({
        code,
      });

    if (!coupon) {
      const error = new Error(
        "Invalid coupon code."
      );

      error.status = 400;

      throw error;
    }

    if (
      !isCouponCurrentlyValid(
        coupon
      )
    ) {
      const error = new Error(
        "This coupon is expired or inactive."
      );

      error.status = 400;

      throw error;
    }

    const minimumOrderAmount =
      Number(
        coupon.minOrderAmount ??
          coupon.minimumOrderAmount ??
          0
      );

    if (
      Number(subtotal) <
      minimumOrderAmount
    ) {
      const error = new Error(
        `Minimum order amount for this coupon is ₹${round2(
          minimumOrderAmount
        )}.`
      );

      error.status = 400;

      throw error;
    }

    const eligibleItems =
      items.filter((item) =>
        itemMatchesCouponCategory(
          item,
          coupon
        )
      );

    const eligibleSubtotal =
      round2(
        eligibleItems.reduce(
          (sum, item) =>
            sum +
            Number(
              item.subtotal || 0
            ),
          0
        )
      );

    if (
      eligibleSubtotal <= 0
    ) {
      const error = new Error(
        "No eligible products found for this coupon."
      );

      error.status = 400;

      throw error;
    }

    const discountType =
      normalizeCategory(
        coupon.discountType ||
          coupon.type ||
          "percentage"
      );

    let discount = 0;

    const couponDiscountValue =
      Number(
        coupon.discount ??
          coupon.discountPercent ??
          coupon.value ??
          coupon.amount ??
          0
      );

    if (
      discountType === "fixed" ||
      discountType === "flat" ||
      discountType === "amount"
    ) {
      discount =
        couponDiscountValue;
    } else {
      discount = round2(
        eligibleSubtotal *
          (couponDiscountValue /
            100)
      );
    }

    const maxDiscount =
      Number(
        coupon.maxDiscount ??
          coupon.maximumDiscount ??
          0
      );

    if (maxDiscount > 0) {
      discount = Math.min(
        discount,
        maxDiscount
      );
    }

    discount = round2(
      Math.max(
        0,
        Math.min(
          discount,
          eligibleSubtotal
        )
      )
    );

    return {
      coupon,
      discount,
      eligibleSubtotal,
    };
  };

// =====================================================
// COUPON CLAIM
// =====================================================

const markCouponClaimUsed =
  async ({
    coupon,
    customerMobile,
    orderId,
  }) => {
    if (!coupon) {
      return null;
    }

    if (!CouponClaim) {
      return null;
    }

    const mobile =
      normalizeMobile(
        customerMobile
      );

    if (!mobile) {
      return null;
    }

    try {
      const claim =
        await CouponClaim.findOneAndUpdate(
          {
            coupon:
              coupon._id,
            mobile,
          },
          {
            $set: {
              used: true,
              usedAt: new Date(),
              orderId,
            },
          },
          {
            new: true,
          }
        );

      return claim;
    } catch (error) {
      console.error(
        "Coupon claim update error:",
        error
      );

      return null;
    }
  };

const restoreCouponClaim =
  async ({
    coupon,
    customerMobile,
    orderId,
  }) => {
    if (!coupon) {
      return;
    }

    if (!CouponClaim) {
      return;
    }

    const mobile =
      normalizeMobile(
        customerMobile
      );

    if (!mobile) {
      return;
    }

    try {
      await CouponClaim.findOneAndUpdate(
        {
          coupon:
            coupon._id,
          mobile,
          orderId,
        },
        {
          $set: {
            used: false,
          },
          $unset: {
            usedAt: 1,
            orderId: 1,
          },
        }
      );
    } catch (error) {
      console.error(
        "Coupon claim restore error:",
        error
      );
    }
  };

// =====================================================
// STOCK SYNC - DECREASE
// =====================================================

const syncDashboardStock = async ({
  items,
  operationId,
}) => {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return {
      success: true,
    };
  }

  const url =
    `${DASHBOARD_BACKEND_URL}/api/internal/stock/decrease`;

  try {
    const response =
      await axios.post(
        url,
        {
          operationId,

          items: items.map(
            (item) => ({
              sku: item.sku,
              quantity:
                item.quantity,
            })
          ),
        },
        {
          timeout:
            ORDER_TIMEOUT_MS,

          headers: {
            "Content-Type":
              "application/json",

            ...(INTERNAL_STOCK_SECRET
              ? {
                  "x-internal-stock-secret":
                    INTERNAL_STOCK_SECRET,
                }
              : {}),
          },
        }
      );

    return (
      response?.data || {
        success: true,
      }
    );
  } catch (error) {
    console.error(
      "Dashboard stock decrease error:",
      error?.response?.data ||
        error.message
    );

    const stockError = new Error(
      error?.response?.data?.message ||
        "Unable to reserve product stock."
    );

    stockError.status =
      error?.response?.status || 400;

    throw stockError;
  }
};

// =====================================================
// STOCK SYNC - ROLLBACK
// =====================================================

const rollbackDashboardStock =
  async ({
    items,
    operationId,
  }) => {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return {
        success: true,
      };
    }

    const url =
      `${DASHBOARD_BACKEND_URL}/api/internal/stock/rollback`;

    try {
      const response =
        await axios.post(
          url,
          {
            operationId,

            items: items.map(
              (item) => ({
                sku: item.sku,
                quantity:
                  item.quantity,
              })
            ),
          },
          {
            timeout:
              ORDER_TIMEOUT_MS,

            headers: {
              "Content-Type":
                "application/json",

              ...(INTERNAL_STOCK_SECRET
                ? {
                    "x-internal-stock-secret":
                      INTERNAL_STOCK_SECRET,
                  }
                : {}),
            },
          }
        );

      return (
        response?.data || {
          success: true,
        }
      );
    } catch (error) {
      console.error(
        "Dashboard stock rollback error:",
        error?.response?.data ||
          error.message
      );

      const rollbackError = new Error(
        error?.response?.data?.message ||
          "Unable to restore product stock."
      );

      rollbackError.status =
        error?.response?.status || 500;

      throw rollbackError;
    }
  };

// =====================================================
// RESTORE ORDER STOCK
// =====================================================

const restoreOrderStock = async (
  order
) => {
  if (!order) {
    return {
      success: false,
      restored: false,
      message:
        "Order is required.",
    };
  }

  if (
    order.stockRestored === true
  ) {
    return {
      success: true,
      restored: false,
      alreadyRestored: true,
      message:
        "Order stock was already restored.",
    };
  }

  const operationId =
    normalizeText(
      order.stockOperationId
    );

  if (!operationId) {
    return {
      success: false,
      restored: false,
      message:
        "Stock operation ID is missing.",
    };
  }

  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  if (!items.length) {
    return {
      success: false,
      restored: false,
      message:
        "Order items are missing.",
    };
  }

  await rollbackDashboardStock({
    items,
    operationId,
  });

  order.stockRestored = true;

  order.stockRestoredAt =
    new Date();

  return {
    success: true,
    restored: true,
  };
};

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (
  req,
  res,
  next
) => {
  let stockOperationId = null;
  let stockReserved = false;
  let couponUsed = null;

  try {
    const body =
      req.body || {};

    const customer =
      body.customer || {};

    const rawItems =
      Array.isArray(body.items)
        ? body.items
        : [];

    if (!rawItems.length) {
      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty.",
      });
    }

    const fullName =
      normalizeText(
        customer.fullName ||
          customer.name
      );

    const mobile =
      normalizeMobile(
        customer.mobile ||
          customer.phone
      );

    const email =
      normalizeText(
        customer.email
      ).toLowerCase();

    const address =
      normalizeText(
        customer.address
      );

    const city =
      normalizeText(
        customer.city
      );

    const state =
      normalizeText(
        customer.state
      );

    const stateCode =
      normalizeText(
        customer.stateCode ||
          BUSINESS_STATE_CODE
      );

    const pincode =
      String(
        customer.pincode || ""
      ).trim();

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name is required.",
      });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid mobile number.",
      });
    }

    if (
      email &&
      !isValidEmail(email)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery address is required.",
      });
    }

    if (!city) {
      return res.status(400).json({
        success: false,
        message:
          "City is required.",
      });
    }

    if (!state) {
      return res.status(400).json({
        success: false,
        message:
          "State is required.",
      });
    }

    if (!isValidPincode(pincode)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6-digit pincode.",
      });
    }

    // =================================================
    // NORMALIZE ITEMS
    // =================================================

    const requestedItems =
      normalizeOrderItems(
        rawItems
      );

    if (!requestedItems.length) {
      return res.status(400).json({
        success: false,
        message:
          "No valid products found in the order.",
      });
    }

    // =================================================
    // TRUSTED PRODUCT DATA
    // =================================================

    const trustedItems = [];

    for (
      const requestedItem of requestedItems
    ) {
      const sku =
        requestedItem.sku;

      const quantity =
        requestedItem.quantity;

      if (
        !sku ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product or quantity.",
        });
      }

      let product;

      try {
        product =
          await getProductForOrder({
            sku,
          });
      } catch (error) {
        console.error(
          "================================="
        );

        console.error(
          "PRODUCT LOOKUP ERROR"
        );

        console.error(
          "SKU:",
          sku
        );

        console.error(
          "MESSAGE:",
          error?.message
        );

        console.error(
          "STATUS:",
          error?.status
        );

        console.error(
          "FULL ERROR:",
          error
        );

        console.error(
          "================================="
        );

        return res.status(
          error?.status || 400
        ).json({
          success: false,
          message:
            error?.message ||
            `Unable to verify product ${sku}.`,
        });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product ${sku} was not found.`,
        });
      }

      const availableStock =
        Number(
          product.stock ??
            product.quantity ??
            product.inventory ??
            0
        );

      if (
        !Number.isFinite(
          availableStock
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid stock information for ${product.name || sku}.`,
        });
      }

      if (
        availableStock < quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name || sku} has only ${availableStock} item(s) available.`,
        });
      }

      const trustedPrice =
        round2(
          Number(
            product.sellingPrice ??
              product.price ??
              product.salePrice ??
              0
          )
        );

      if (
        !Number.isFinite(
          trustedPrice
        ) ||
        trustedPrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name || sku} has an invalid selling price.`,
        });
      }

      const originalPrice =
        round2(
          Number(
            product.originalPrice ??
              product.mrp ??
              trustedPrice
          )
        );

      const discountAmount =
        round2(
          Math.max(
            0,
            originalPrice -
              trustedPrice
          )
        );

      const discountPercent =
        originalPrice > 0
          ? round2(
              (discountAmount /
                originalPrice) *
                100
            )
          : 0;

      const hsnCode =
        getProductHSN(
          product
        );

      if (
        hsnCode &&
        !/^\d{4}(\d{2}|\d{4})?$/.test(
          hsnCode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid HSN code for ${product.name || sku}.`,
        });
      }

      trustedItems.push({
        sku,

        name: normalizeText(
          product.name ||
            requestedItem.name ||
            "Product"
        ),

        hsnCode,

        category:
          normalizeText(
            product.category ||
              requestedItem.category
          ),

        subcategory:
          normalizeText(
            product.subcategory ||
              requestedItem.subcategory
          ),

        image:
          normalizeText(
            product.image ||
              product.imageUrl ||
              product.thumbnail ||
              requestedItem.image
          ),

        description:
          normalizeText(
            product.description ||
              requestedItem.description
          ),

        size:
          normalizeText(
            requestedItem.size ||
              product.size ||
              ""
          ),

        quantity,

        originalPrice,

        discountPercent,

        discountAmount,

        price:
          trustedPrice,

        subtotal:
          round2(
            trustedPrice *
              quantity
          ),
      });
    }

    // =================================================
    // SUBTOTAL
    // =================================================

    const subtotal =
      round2(
        trustedItems.reduce(
          (sum, item) =>
            sum +
            item.subtotal,
          0
        )
      );

    if (subtotal <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Order amount must be greater than zero.",
      });
    }

    // =================================================
    // COUPON
    // =================================================

    const couponCode =
      normalizeCouponCode(
        body.coupon?.code ||
          body.couponCode
      );

    let coupon = null;
    let couponDiscount = 0;
    let eligibleSubtotal = 0;

    if (couponCode) {
      const couponResult =
        await validateAndCalculateCoupon({
          couponCode,
          items: trustedItems,
          subtotal,
          customerMobile:
            mobile,
        });

      coupon =
        couponResult.coupon;

      couponDiscount =
        couponResult.discount;

      eligibleSubtotal =
        couponResult.eligibleSubtotal;
    }

    // =================================================
    // SHIPPING
    // =================================================

    let shippingResult;

    try {
      shippingResult =
        await calculateShipping({
          items: trustedItems,

          subtotal:
            round2(
              subtotal -
                couponDiscount
            ),

          pincode,

          state,

          customer,
        });
    } catch (error) {
      console.error(
        "Shipping calculation error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Unable to calculate shipping.",
      });
    }

    const shippingCharge =
      round2(
        Number(
          shippingResult?.shippingCharge ??
            shippingResult?.charge ??
            shippingResult?.amount ??
            0
        )
      );

    const taxableValue =
      round2(
        Math.max(
          0,
          subtotal -
            couponDiscount
        )
      );

    // =================================================
    // GST
    // =================================================

    const gst =
      calculateOrderGST({
        taxableValue,

        customerState:
          state,
      });

    const totalAmountBeforeTax =
      round2(
        taxableValue +
          shippingCharge
      );

    const finalTotal =
      round2(
        totalAmountBeforeTax +
          gst.totalGST
      );

    if (finalTotal <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Final order amount is invalid.",
      });
    }

    // =================================================
    // PAYMENT
    // =================================================

    const paymentBody =
      body.payment || {};

    const paymentMethod =
      normalizeText(
        paymentBody.method ||
          body.paymentMethod ||
          "cod"
      ).toLowerCase();

    if (
      !["cod", "upi"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method.",
      });
    }

    let paymentType = null;
    let upiId = "";
    let transactionId = "";

    if (
      paymentMethod === "upi"
    ) {
      paymentType =
        normalizeText(
          paymentBody.type ||
            body.paymentType ||
            "upi_id"
        ).toLowerCase();

      if (
        ![
          "upi_id",
          "qr",
        ].includes(
          paymentType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid UPI payment type.",
        });
      }

      upiId =
        normalizeText(
          paymentBody.upiId ||
            body.upiId ||
            VRAJ_UPI_ID
        );

      if (
        !isValidUPIId(upiId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Configured UPI ID is invalid.",
        });
      }

      transactionId =
        normalizeTransactionId(
          paymentBody.transactionId ||
            body.transactionId
        );

      if (
        !isValidTransactionId(
          transactionId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid UPI Transaction ID / UTR.",
        });
      }

      // =================================================
      // DUPLICATE UTR
      // =================================================

      const existingPayment =
        await Order.findOne({
          "payment.transactionId":
            transactionId,
        })
          .select(
            "_id orderNumber payment.status"
          )
          .lean();

      if (existingPayment) {
        return res.status(409).json({
          success: false,

          code:
            "DUPLICATE_TRANSACTION_ID",

          message:
            "This UPI Transaction ID / UTR has already been used.",
        });
      }
    }

    // =================================================
    // STOCK OPERATION ID
    // =================================================

    stockOperationId =
      crypto.randomUUID
        ? crypto.randomUUID()
        : crypto
            .randomBytes(16)
            .toString("hex");

    // =================================================
    // RESERVE STOCK
    // =================================================

    try {
      await syncDashboardStock({
        items: trustedItems,

        operationId:
          stockOperationId,
      });

      stockReserved = true;
    } catch (error) {
      return res.status(
        error?.status || 400
      ).json({
        success: false,
        message:
          error?.message ||
          "Unable to reserve product stock.",
      });
    }

    // =================================================
    // ORDER NUMBER
    // =================================================

    const orderNumber =
      generateOrderNumber();

    // =================================================
    // COUPON CLAIM
    // =================================================

    if (coupon) {
      couponUsed =
        await markCouponClaimUsed({
          coupon,

          customerMobile:
            mobile,

          orderId:
            orderNumber,
        });
    }

    // =================================================
    // ORDER DATA
    // =================================================

    const orderData = {
      orderNumber,

      status:
        paymentMethod === "upi"
          ? "pending"
          : "confirmed",

      customer: {
        fullName,

        mobile,

        email,

        address,

        city,

        state,

        stateCode,

        pincode,
      },

      items:
        trustedItems,

      totalItems:
        trustedItems.reduce(
          (sum, item) =>
            sum +
            item.quantity,
          0
        ),

      coupon: coupon
        ? {
            code:
              normalizeCouponCode(
                coupon.code
              ),

            name:
              normalizeText(
                coupon.name
              ),

            discount:
              couponDiscount,

            wheelValue:
              Number(
                coupon.wheelValue ||
                  0
              ),

            description:
              normalizeText(
                coupon.description
              ),

            source:
              normalizeText(
                coupon.source
              ),

            discountScope:
              normalizeText(
                coupon.discountScope ||
                  "all"
              ),
          }
        : {
            code: "",
            name: "",
            discount: 0,
            wheelValue: 0,
            description: "",
            source: "",
            discountScope:
              "all",
          },

      shipping: {
        charge:
          shippingCharge,

        shippingCharge:
          shippingCharge,

        pincode,

        state,

        stateCode,

        weightGrams:
          Number(
            shippingResult?.weightGrams ||
              0
          ),

        billableWeightGrams:
          Number(
            shippingResult?.billableWeightGrams ||
              0
          ),

        lengthCm:
          Number(
            shippingResult?.lengthCm ||
              0
          ),

        widthCm:
          Number(
            shippingResult?.widthCm ||
              0
          ),

        heightCm:
          Number(
            shippingResult?.heightCm ||
              0
          ),

        courier:
          normalizeText(
            shippingResult?.courier
          ),

        estimatedDays:
          normalizeText(
            shippingResult?.estimatedDays
          ),
      },

      pricing: {
        subtotal,

        eligibleSubtotal,

        discountPercent:
          subtotal > 0
            ? round2(
                (couponDiscount /
                  subtotal) *
                  100
              )
            : 0,

        discount:
          couponDiscount,

        couponDiscount,

        couponCode,

        shipping:
          shippingCharge,

        shippingCharge,

        totalAmountBeforeTax,

        taxableValue,

        gstRate:
          gst.gstRate,

        totalGST:
          gst.totalGST,

        cgst:
          gst.cgst,

        sgst:
          gst.sgst,

        igst:
          gst.igst,

        cgstRate:
          gst.cgstRate,

        sgstRate:
          gst.sgstRate,

        igstRate:
          gst.igstRate,

        finalTotal,

        finalAmount:
          finalTotal,
      },

      gst: {
        gstRate:
          gst.gstRate,

        totalGST:
          gst.totalGST,

        cgst:
          gst.cgst,

        sgst:
          gst.sgst,

        igst:
          gst.igst,

        cgstRate:
          gst.cgstRate,

        sgstRate:
          gst.sgstRate,

        igstRate:
          gst.igstRate,

        taxableValue,
      },

      payment: {
        method:
          paymentMethod,

        type:
          paymentMethod === "upi"
            ? paymentType
            : null,

        upiId:
          paymentMethod === "upi"
            ? upiId
            : "",

        transactionId:
          paymentMethod === "upi"
            ? transactionId
            : "",

        amount:
          finalTotal,

        status:
          "pending",

        submittedAt:
          paymentMethod === "upi"
            ? new Date()
            : null,

        verifiedAt: null,

        verifiedBy: "",

        rejectedAt: null,

        rejectionReason: "",

        screenshot:
          normalizeText(
            paymentBody.screenshot ||
              body.screenshot
          ),
      },

      business: {
        name:
          BUSINESS_NAME,

        gstin:
          process.env.BUSINESS_GSTIN ||
          "08AADPO3512A1ZB",

        state:
          BUSINESS_STATE,

        stateCode:
          BUSINESS_STATE_CODE,

        address:
          process.env.BUSINESS_ADDRESS ||
          "Madhuban Colony Basni Jodhpur",
      },

      stockOperationId,

      stockRestored:
        false,

      stockRestoredAt:
        null,

      invoiceNumber:
        "",

      invoiceGeneratedAt:
        null,

      email: {
        status:
          "pending",
      },

      whatsapp: {
        status:
          "pending",
      },

      notes:
        "",
    };

    // =================================================
    // CREATE ORDER
    // =================================================

    let order;

    try {
      order =
        await Order.create(
          orderData
        );
    } catch (error) {
      if (
        coupon &&
        couponUsed
      ) {
        await restoreCouponClaim({
          coupon,

          customerMobile:
            mobile,

          orderId:
            orderNumber,
        });
      }

      if (stockReserved) {
        try {
          await rollbackDashboardStock({
            items:
              trustedItems,

            operationId:
              stockOperationId,
          });
        } catch (rollbackError) {
          console.error(
            "CREATE ORDER ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      throw error;
    }

    
  // =================================================
// EMAIL - BACKGROUND / NON-BLOCKING
// =================================================

if (
  typeof sendOrderEmails === "function"
) {
  Promise.resolve()
    .then(() =>
      sendOrderEmails(order)
    )
    .then((emailResult) => {
      console.log(
        `[EMAIL] Order ${order.orderNumber} email process completed.`,
        emailResult || ""
      );
    })
    .catch((emailError) => {
      console.error(
        `[EMAIL] Order ${order.orderNumber} email failed:`,
        emailError?.message ||
          emailError
      );
    });
}

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        paymentMethod === "upi"
          ? "Order created successfully. UPI payment is pending verification."
          : "Order placed successfully.",

      order:
        order.toObject
          ? order.toObject()
          : order,

      orderId:
        order._id,

      orderNumber:
        order.orderNumber,

      paymentStatus:
        order.payment?.status ||
        "pending",

      orderStatus:
        order.status,

      finalAmount:
        order.pricing?.finalTotal ||
        finalTotal,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    if (
      stockReserved &&
      stockOperationId
    ) {
      try {
        await rollbackDashboardStock({
          items:
            normalizeOrderItems(
              req.body?.items
            ),

          operationId:
            stockOperationId,
        });
      } catch (rollbackError) {
        console.error(
          "CREATE ORDER STOCK ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    return res.status(
      error?.status ||
        error?.statusCode ||
        500
    ).json({
      success: false,

      message:
        error?.message ||
        "Unable to create order.",
    });
  }
};

// =====================================================
// FIND ORDER
// =====================================================

const findOrder = async (
  id
) => {
  const value =
    String(id || "").trim();

  if (!value) {
    return null;
  }

  if (
    mongoose.Types.ObjectId.isValid(
      value
    )
  ) {
    const order =
      await Order.findById(
        value
      );

    if (order) {
      return order;
    }
  }

  return Order.findOne({
    orderNumber:
      value,
  });
};

// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      1,
      Number(req.query.page) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit) || 20
      )
    );

    const skip =
      (page - 1) * limit;

    const status =
      normalizeText(
        req.query.status
      ).toLowerCase();

    const paymentStatus =
      normalizeText(
        req.query.paymentStatus
      ).toLowerCase();

    const search =
      normalizeText(
        req.query.search
      );

    const filter = {};

    const allowedOrderStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "failed",
    ];

    const allowedPaymentStatuses = [
      "pending",
      "paid",
      "failed",
      "rejected",
    ];

    if (
      allowedOrderStatuses.includes(
        status
      )
    ) {
      filter.status = status;
    }

    if (
      allowedPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      filter[
        "payment.status"
      ] = paymentStatus;
    }

    if (search) {
      const regex =
        new RegExp(
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );

      filter.$or = [
        {
          orderNumber:
            regex,
        },

        {
          "customer.fullName":
            regex,
        },

        {
          "customer.mobile":
            regex,
        },

        {
          "customer.email":
            regex,
        },

        {
          "customer.city":
            regex,
        },

        {
          "customer.pincode":
            regex,
        },

        {
          "payment.transactionId":
            regex,
        },

        {
          "items.sku":
            regex,
        },

        {
          "items.name":
            regex,
        },
      ];
    }

    const [
      orders,
      total,
    ] = await Promise.all([
      Order.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit
        )
      );

    return res.status(200).json({
      success: true,

      orders,

      data: orders,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },

      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET ALL ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch orders.",
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await findOrder(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch order.",
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus =
  async (
    req,
    res
  ) => {
    try {
      const order =
        await findOrder(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      const newStatus =
        normalizeText(
          req.body?.status
        ).toLowerCase();

      const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ];

      if (
        !allowedStatuses.includes(
          newStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status.",
        });
      }

      const paymentMethod =
        normalizeText(
          order.payment?.method ||
            "cod"
        ).toLowerCase();

      const paymentStatus =
        normalizeText(
          order.payment?.status ||
            "pending"
        ).toLowerCase();

      // =================================================
      // UPI PAYMENT VERIFICATION CHECK
      // =================================================

      if (
        paymentMethod === "upi" &&
        paymentStatus !== "paid" &&
        [
          "confirmed",
          "processing",
          "shipped",
          "delivered",
        ].includes(
          newStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "UPI_PAYMENT_NOT_VERIFIED",

          message:
            "UPI payment must be verified before this order can proceed.",
        });
      }

      // =================================================
      // CANCELLED ORDER STOCK RESTORE
      // =================================================

      let stockRestored =
        order.stockRestored === true;

      let stockRestoredAt =
        order.stockRestoredAt ||
        null;

      if (
        newStatus ===
          "cancelled" &&
        !stockRestored
      ) {
        try {
          const restoreResult =
            await restoreOrderStock(
              order
            );

          if (
            restoreResult?.success ===
            false
          ) {
            return res.status(500).json({
              success: false,

              code:
                "STOCK_RESTORE_FAILED",

              message:
                restoreResult?.message ||
                "Unable to restore product stock.",
            });
          }

          stockRestored =
            order.stockRestored ===
            true;

          stockRestoredAt =
            order.stockRestoredAt ||
            null;
        } catch (stockError) {
          console.error(
            "CANCEL ORDER STOCK RESTORE ERROR:",
            stockError
          );

          return res.status(500).json({
            success: false,

            code:
              "STOCK_RESTORE_FAILED",

            message:
              stockError?.message ||
              "Unable to restore product stock.",
          });
        }
      }

      const updatedOrder =
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              status:
                newStatus,

              stockRestored:
                stockRestored,

              stockRestoredAt:
                stockRestoredAt,
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Order could not be updated.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Order status updated successfully.",

        order:
          updatedOrder,
      });
    } catch (error) {
      console.error(
        "UPDATE ORDER STATUS ERROR:",
        error
      );

      console.error(
        "ERROR NAME:",
        error?.name
      );

      console.error(
        "ERROR MESSAGE:",
        error?.message
      );

      console.error(
        "ERROR DETAILS:",
        error?.errors
      );

      const isValidationError =
        error?.name ===
        "ValidationError";

      return res.status(
        isValidationError
          ? 400
          : 500
      ).json({
        success: false,

        message:
          error?.message ||
          "Unable to update order status.",

        ...(isValidationError
          ? {
              code:
                "ORDER_VALIDATION_ERROR",

              errors:
                error.errors,
            }
          : {}),
      });
    }
  };

// =====================================================
// VERIFY UPI PAYMENT
// =====================================================

const verifyUPIPayment =
  async (
    req,
    res
  ) => {
    try {
      const order =
        await findOrder(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        order.payment?.method !==
        "upi"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order does not use UPI payment.",
        });
      }

      if (
        order.payment?.status ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This UPI payment has already been verified.",
        });
      }

      const transactionId =
        normalizeTransactionId(
          req.body?.transactionId ||
            order.payment
              ?.transactionId
        );

      if (
        !isValidTransactionId(
          transactionId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A valid UPI Transaction ID / UTR is required.",
        });
      }

      // =================================================
      // DUPLICATE UTR
      // =================================================

      const duplicate =
        await Order.findOne({
          _id: {
            $ne:
              order._id,
          },

          "payment.transactionId":
            transactionId,
        })
          .select(
            "_id orderNumber payment.status"
          )
          .lean();

      if (duplicate) {
        return res.status(409).json({
          success: false,

          code:
            "DUPLICATE_TRANSACTION_ID",

          message:
            `This UTR is already linked to order ${
              duplicate.orderNumber ||
              "another order"
            }.`,
        });
      }

      // =================================================
      // EXPECTED PAYMENT AMOUNT
      // =================================================

      const expectedAmount =
        round2(
          Number(
            order.payment?.amount ??
              order.pricing?.finalTotal ??
              order.pricing?.finalAmount ??
              0
          )
        );

      if (
        expectedAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order payment amount is invalid.",
        });
      }

      // =================================================
      // OPTIONAL ADMIN AMOUNT
      // =================================================

      const suppliedAmount =
        req.body?.amount !==
          undefined &&
        req.body?.amount !==
          null &&
        req.body?.amount !== ""
          ? round2(
              Number(
                req.body.amount
              )
            )
          : expectedAmount;

      if (
        !Number.isFinite(
          suppliedAmount
        ) ||
        suppliedAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment amount.",
        });
      }

      if (
        Math.abs(
          suppliedAmount -
            expectedAmount
        ) > 0.01
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_AMOUNT_MISMATCH",

          message:
            `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${suppliedAmount}.`,
        });
      }

      // =================================================
      // ADMIN IDENTITY
      // =================================================

      const verifiedBy =
        normalizeText(
          req.admin?.username
        ) ||
        normalizeText(
          req.admin?.email
        ) ||
        "Admin";

      // =================================================
      // MARK PAYMENT PAID
      // =================================================

      const updatedFields = {
        "payment.transactionId":
          transactionId,

        "payment.amount":
          expectedAmount,

        "payment.status":
          "paid",

        "payment.verifiedAt":
          new Date(),

        "payment.verifiedBy":
          verifiedBy,

        "payment.rejectedAt":
          null,

        "payment.rejectionReason":
          "",
      };

      if (
        order.status ===
        "pending"
      ) {
        updatedFields.status =
          "confirmed";
      }

      const updatedOrder =
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set:
              updatedFields,
          },
          {
            new: true,
            runValidators: false,
          }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Order could not be updated.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "UPI payment verified successfully.",

        order:
          updatedOrder,

        paymentStatus:
          updatedOrder.payment?.status,

        orderStatus:
          updatedOrder.status,

        verifiedBy,
      });
    } catch (error) {
      console.error(
        "VERIFY UPI PAYMENT ERROR:",
        error
      );

      console.error(
        "VERIFY PAYMENT ERROR NAME:",
        error?.name
      );

      console.error(
        "VERIFY PAYMENT ERROR MESSAGE:",
        error?.message
      );

      return res.status(
        error?.name ===
          "ValidationError"
          ? 400
          : 500
      ).json({
        success: false,

        message:
          error?.message ||
          "Unable to verify UPI payment.",

        ...(error?.name ===
        "ValidationError"
          ? {
              code:
                "ORDER_VALIDATION_ERROR",

              errors:
                error.errors,
            }
          : {}),
      });
    }
  };

// =====================================================
// REJECT UPI PAYMENT
// =====================================================

const rejectUPIPayment =
  async (
    req,
    res
  ) => {
    try {
      const order =
        await findOrder(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        order.payment?.method !==
        "upi"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order does not use UPI payment.",
        });
      }

      if (
        order.payment?.status ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A paid UPI payment cannot be rejected.",
        });
      }

      const rejectionReason =
        normalizeText(
          req.body?.rejectionReason
        );

      if (
        rejectionReason.length < 3
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please provide a valid rejection reason.",
        });
      }

      // =================================================
      // ADMIN IDENTITY
      // =================================================

      const verifiedBy =
        normalizeText(
          req.admin?.username
        ) ||
        normalizeText(
          req.admin?.email
        ) ||
        "Admin";

      // =================================================
      // RESTORE STOCK FIRST
      // =================================================

      let stockRestored =
        order.stockRestored === true;

      let stockRestoredAt =
        order.stockRestoredAt ||
        null;

      let stockRestoreResult;

      if (
        !stockRestored
      ) {
        try {
          stockRestoreResult =
            await restoreOrderStock(
              order
            );

          if (
            stockRestoreResult?.success ===
            false
          ) {
            return res.status(500).json({
              success: false,

              code:
                "STOCK_RESTORE_FAILED",

              message:
                stockRestoreResult?.message ||
                "Payment rejected, but product stock could not be restored. Please retry the rejection.",
            });
          }

          stockRestored =
            order.stockRestored ===
            true;

          stockRestoredAt =
            order.stockRestoredAt ||
            null;
        } catch (stockError) {
          console.error(
            "UPI REJECTION STOCK RESTORE ERROR:",
            stockError
          );

          return res.status(500).json({
            success: false,

            code:
              "STOCK_RESTORE_FAILED",

            message:
              stockError?.message ||
              "Payment rejected, but product stock could not be restored. Please retry the rejection.",
          });
        }
      } else {
        stockRestoreResult = {
          success: true,

          restored: false,

          alreadyRestored: true,
        };
      }

      // =================================================
      // ORDER STATUS
      // =================================================

      let newOrderStatus =
        order.status;

      if (
        ![
          "delivered",
          "cancelled",
        ].includes(
          order.status
        )
      ) {
        newOrderStatus =
          "cancelled";
      }

      // =================================================
      // PAYMENT REJECTED
      // =================================================

      const updatedOrder =
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              "payment.status":
                "rejected",

              "payment.rejectedAt":
                new Date(),

              "payment.rejectionReason":
                rejectionReason,

              "payment.verifiedBy":
                verifiedBy,

              "payment.verifiedAt":
                null,

              status:
                newOrderStatus,

              stockRestored:
                stockRestored,

              stockRestoredAt:
                stockRestoredAt,
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Order could not be updated.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "UPI payment rejected and product stock restored successfully.",

        order:
          updatedOrder,

        paymentStatus:
          updatedOrder.payment?.status,

        orderStatus:
          updatedOrder.status,

        rejectedBy:
          verifiedBy,

        stockRestored:
          updatedOrder.stockRestored ===
          true,

        stockRestoredAt:
          updatedOrder.stockRestoredAt,

        stockRestoreResult,
      });
    } catch (error) {
      console.error(
        "REJECT UPI PAYMENT ERROR:",
        error
      );

      console.error(
        "REJECT PAYMENT ERROR NAME:",
        error?.name
      );

      console.error(
        "REJECT PAYMENT ERROR MESSAGE:",
        error?.message
      );

      return res.status(
        error?.name ===
          "ValidationError"
          ? 400
          : 500
      ).json({
        success: false,

        message:
          error?.message ||
          "Unable to reject UPI payment.",

        ...(error?.name ===
        "ValidationError"
          ? {
              code:
                "ORDER_VALIDATION_ERROR",

              errors:
                error.errors,
            }
          : {}),
      });
    }
  };

// =====================================================
// GST INVOICE PDF
// =====================================================

const getInvoicePDF = async (
  req,
  res
) => {
  try {
    const order =
      await findOrder(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // =================================================
    // INVOICE PAYMENT RULE
    // =================================================

    const paymentMethod =
      normalizeText(
        order.payment?.method ||
          "cod"
      ).toLowerCase();

    const paymentStatus =
      normalizeText(
        order.payment?.status ||
          "pending"
      ).toLowerCase();

    if (
      paymentMethod === "upi" &&
      paymentStatus !== "paid"
    ) {
      return res.status(400).json({
        success: false,

        code:
          "UPI_PAYMENT_NOT_VERIFIED",

        message:
          "GST invoice cannot be generated until the UPI payment is verified.",
      });
    }

    if (
      paymentMethod !== "cod" &&
      paymentMethod !== "upi"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invoice is not available for this payment method.",
      });
    }

    if (
      typeof generateGSTInvoicePDF !==
      "function"
    ) {
      return res.status(500).json({
        success: false,

        message:
          "GST invoice service is not configured.",
      });
    }

    let result;

    try {
      result =
        await generateGSTInvoicePDF(
          order
        );
    } catch (firstError) {
      console.error(
        "Invoice generation attempt 1 failed:",
        firstError
      );

      try {
        result =
          await generateGSTInvoicePDF({
            order,
          });
      } catch (secondError) {
        console.error(
          "Invoice generation attempt 2 failed:",
          secondError
        );

        throw firstError;
      }
    }

    // =================================================
    // BUFFER
    // =================================================

    if (
      Buffer.isBuffer(result)
    ) {
      const updatedOrder =
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              invoiceGeneratedAt:
                new Date(),
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${order.orderNumber}-invoice.pdf"`
      );

      return res.send(
        result
      );
    }

    // =================================================
    // OBJECT BUFFER
    // =================================================

    if (
      result &&
      Buffer.isBuffer(
        result.buffer
      )
    ) {
      const updateData = {
        invoiceGeneratedAt:
          new Date(),
      };

      if (
        result.invoiceNumber
      ) {
        updateData.invoiceNumber =
          normalizeText(
            result.invoiceNumber
          );
      }

      await Order.findByIdAndUpdate(
        order._id,
        {
          $set:
            updateData,
        },
        {
          new: true,
          runValidators: false,
        }
      );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${order.orderNumber}-invoice.pdf"`
      );

      return res.send(
        result.buffer
      );
    }

    // =================================================
    // PDF PATH
    // =================================================

    if (
      result?.path ||
      result?.filePath
    ) {
      const filePath =
        result.path ||
        result.filePath;

      const fs =
        require("fs");

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            "Generated invoice file was not found.",
        });
      }

      const updateData = {
        invoiceGeneratedAt:
          new Date(),
      };

      if (
        result.invoiceNumber
      ) {
        updateData.invoiceNumber =
          normalizeText(
            result.invoiceNumber
          );
      }

      await Order.findByIdAndUpdate(
        order._id,
        {
          $set:
            updateData,
        },
        {
          new: true,
          runValidators: false,
        }
      );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${order.orderNumber}-invoice.pdf"`
      );

      return res.sendFile(
        filePath
      );
    }

    // =================================================
    // UNKNOWN RESPONSE
    // =================================================

    return res.status(500).json({
      success: false,

      message:
        "Invoice service did not return a valid PDF.",
    });
  } catch (error) {
    console.error(
      "GET INVOICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to generate GST invoice.",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,

  getOrderById,

  getAllOrders,

  updateOrderStatus,

  verifyUPIPayment,

  rejectUPIPayment,

  getInvoicePDF,
};