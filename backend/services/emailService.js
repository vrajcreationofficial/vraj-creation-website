// =====================================================
// VRAJ CREATION - EMAIL SERVICE
// RESEND API
// GST-EXCLUSIVE / GST ADDED ON TOP
// =====================================================

const fs = require("fs/promises");

const {
  generateGSTInvoicePDF,
  deleteInvoicePDF,
} = require("./gstInvoiceService");

require("dotenv").config();

// =====================================================
// BUSINESS / GST CONFIGURATION
// =====================================================

const BUSINESS_STATE = "Rajasthan";

const GST_RATE = 5;

const CGST_RATE = 2.5;

const SGST_RATE = 2.5;

// =====================================================
// RESEND EMAIL CONFIGURATION
// =====================================================

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "onboarding@resend.dev";

const ADMIN_ORDER_EMAIL =
  process.env.ADMIN_ORDER_EMAIL;

// =====================================================
// RESEND API
// =====================================================

const RESEND_API_URL =
  "https://api.resend.com/emails";

// =====================================================
// LOG CONFIG
// =====================================================

console.log(
  "===================================="
);

console.log(
  "Email Service: Resend API"
);

console.log(
  "Resend API Key:",
  RESEND_API_KEY
    ? "LOADED"
    : "NOT CONFIGURED"
);

console.log(
  "Email From:",
  EMAIL_FROM ||
    "NOT CONFIGURED"
);

console.log(
  "Admin Email:",
  ADMIN_ORDER_EMAIL
    ? "CONFIGURED"
    : "NOT CONFIGURED"
);

console.log(
  "===================================="
);

// =====================================================
// VERIFY RESEND CONFIGURATION
// =====================================================

const verifyEmailConnection =
  async () => {
    try {
      console.log(
        "===================================="
      );

      console.log(
        "Checking Resend email configuration..."
      );

      console.log(
        "Resend API Key:",
        RESEND_API_KEY
          ? "LOADED"
          : "NOT CONFIGURED"
      );

      console.log(
        "Email From:",
        EMAIL_FROM ||
          "NOT CONFIGURED"
      );

      console.log(
        "Admin Email:",
        ADMIN_ORDER_EMAIL
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );

      if (!RESEND_API_KEY) {
        throw new Error(
          "RESEND_API_KEY is not configured."
        );
      }

      if (!EMAIL_FROM) {
        throw new Error(
          "EMAIL_FROM is not configured."
        );
      }

      console.log(
        "Resend email service configuration successful"
      );

      console.log(
        "===================================="
      );

      return true;
    } catch (error) {
      console.error(
        "===================================="
      );

      console.error(
        "Resend email configuration failed"
      );

      console.error(
        "Error:",
        error?.message ||
          error
      );

      console.error(
        "===================================="
      );

      return false;
    }
  };

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (
  value
) => {
  const amount =
    Number(value || 0);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "₹0.00";
  }

  return `₹${amount.toFixed(
    2
  )}`;
};

// =====================================================
// ROUND MONEY
// =====================================================

const round2 = (
  value
) => {
  return Number(
    Number(
      value || 0
    ).toFixed(2)
  );
};

// =====================================================
// NORMALIZE STATE
// =====================================================

const normalizeState = (
  state = ""
) => {
  return String(state)
    .trim()
    .toLowerCase();
};

// =====================================================
// HSN CODE
// =====================================================

const normalizeHSNCode = (
  value = ""
) => {
  const hsn =
    String(
      value ?? ""
    ).trim();

  if (!hsn) {
    return "";
  }

  if (
    !/^(?:\d{4}|\d{6}|\d{8})$/.test(
      hsn
    )
  ) {
    console.warn(
      "Invalid HSN Code received in email service:",
      hsn
    );

    return "";
  }

  return hsn;
};

// =====================================================
// DEFAULT HSN
// =====================================================

const getDefaultHSNCode =
  () => {
    return "";
  };

// =====================================================
// RESOLVE ITEM HSN CODE
// =====================================================

const getItemHSNCode = (
  item
) => {
  if (!item) {
    return "-";
  }

  const rawHSN =
    item.hsnCode ??
    item.hsn ??
    item.HSNCode ??
    item.hsn_code ??
    item.product?.hsnCode ??
    item.product?.hsn ??
    item.product?.HSNCode ??
    item.product?.hsn_code ??
    "";

  const hsnCode =
    normalizeHSNCode(
      rawHSN
    );

  return (
    hsnCode ||
    "-"
  );
};

// =====================================================
// GST CALCULATION
// =====================================================
// GST EXCLUSIVE
//
// Product after discount = ₹600
// Shipping               = ₹60
// Total Before Tax       = ₹660
// GST 5%                 = ₹33
// Grand Total            = ₹693
//
// Rajasthan:
// CGST 2.5%
// SGST 2.5%
//
// Outside Rajasthan:
// IGST 5%
// =====================================================

const calculateGST = (
  totalAmountBeforeTax,
  customerState
) => {
  const baseAmount =
    round2(
      Math.max(
        0,
        Number(
          totalAmountBeforeTax ||
            0
        )
      )
    );

  const sellerState =
    normalizeState(
      BUSINESS_STATE
    );

  const buyerState =
    normalizeState(
      customerState ||
        BUSINESS_STATE
    );

  const isInterState =
    sellerState !==
    buyerState;

  const totalGST =
    round2(
      baseAmount *
        (GST_RATE / 100)
    );

  let cgst = 0;

  let sgst = 0;

  let igst = 0;

  if (isInterState) {
    // ===============================================
    // OUTSIDE RAJASTHAN
    // ===============================================

    igst =
      totalGST;
  } else {
    // ===============================================
    // WITHIN RAJASTHAN
    // ===============================================

    cgst =
      round2(
        totalGST / 2
      );

    sgst =
      round2(
        totalGST -
          cgst
      );
  }

  const finalAmount =
    round2(
      baseAmount +
        totalGST
    );

  return {
    baseAmount,

    taxableAmount:
      baseAmount,

    taxableValue:
      baseAmount,

    totalAmountBeforeTax:
      baseAmount,

    totalGST,

    cgst,

    sgst,

    igst,

    cgstRate:
      isInterState
        ? 0
        : CGST_RATE,

    sgstRate:
      isInterState
        ? 0
        : SGST_RATE,

    igstRate:
      isInterState
        ? GST_RATE
        : 0,

    rate:
      GST_RATE,

    isInterState,

    sellerState:
      BUSINESS_STATE,

    customerState:
      customerState ||
      BUSINESS_STATE,

    pricingMode:
      "gst_exclusive",

    amountWithGST:
      finalAmount,

    finalAmount,
  };
};

// =====================================================
// ESCAPE HTML
// =====================================================

const escapeHtml = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

// =====================================================
// CREATE ITEMS HTML
// =====================================================

const createItemsHtml = (
  order
) => {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  if (
    !items.length
  ) {
    return `
      <tr>
        <td
          colspan="6"
          style="
            padding:12px;
            text-align:center;
            color:#777;
          "
        >
          No items found
        </td>
      </tr>
    `;
  }

  return items
    .map(
      (
        item,
        index
      ) => {
        const quantity =
          Number(
            item.quantity ||
              item.qty ||
              0
          );

        const price =
          Number(
            item.price ??
              item.sellingPrice ??
              item.salePrice ??
              0
          );

        const subtotal =
          Number(
            item.subtotal ??
              quantity *
                price
          );

        const hsnCode =
          getItemHSNCode(
            item
          );

        return `
          <tr>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:center;
              "
            >
              ${index + 1}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
              "
            >
              <strong>
                ${escapeHtml(
                  item.name ||
                    item.productName ||
                    item.title ||
                    "Product"
                )}
              </strong>

              ${
                item.sku
                  ? `
                    <div
                      style="
                        font-size:12px;
                        color:#777;
                        margin-top:3px;
                      "
                    >
                      SKU:
                      ${escapeHtml(
                        item.sku
                      )}
                    </div>
                  `
                  : ""
              }
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:center;
                white-space:nowrap;
                font-weight:600;
              "
            >
              ${escapeHtml(
                hsnCode
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:center;
              "
            >
              ${quantity}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:right;
              "
            >
              ${formatMoney(
                price
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:right;
                font-weight:600;
              "
            >
              ${formatMoney(
                subtotal
              )}
            </td>

          </tr>
        `;
      }
    )
    .join("");
};

// =====================================================
// CREATE ORDER HTML
// =====================================================

const createOrderHtml = (
  order,
  options = {}
) => {
  const {
    recipientType =
      "customer",
  } = options;

  const customer =
    order?.customer || {};

  const pricing =
    order?.pricing || {};

  const shipping =
    order?.shipping || {};

  const savedGST =
    order?.gst || {};

  // ===================================================
  // PRODUCT SUBTOTAL
  // ===================================================

  const subtotal =
    round2(
      Number(
        pricing.subtotal ??
          pricing.productTotal ??
          order?.subtotal ??
          0
      )
    );

  // ===================================================
  // DISCOUNT
  // ===================================================

  const discount =
    round2(
      Number(
        pricing.couponDiscount ??
          pricing.discount ??
          order?.discount ??
          0
      )
    );

  // ===================================================
  // PRODUCT AFTER DISCOUNT
  // ===================================================

  const productAmountAfterDiscount =
    round2(
      Math.max(
        0,
        subtotal -
          discount
      )
    );

  // ===================================================
  // SHIPPING
  // ===================================================

  const shippingCharge =
    round2(
      Number(
        pricing.shipping ??
          pricing.shippingCharge ??
          shipping.charge ??
          order?.shippingCharge ??
          0
      )
    );

  // ===================================================
  // CUSTOMER STATE
  // ===================================================

  const customerState =
    String(
      customer.state ||
        savedGST.customerState ||
        shipping.state ||
        BUSINESS_STATE
    ).trim();

  // ===================================================
  // TOTAL BEFORE TAX
  // ===================================================

  const fallbackTotalBeforeTax =
    round2(
      productAmountAfterDiscount +
        shippingCharge
    );

  const savedTotalBeforeTax =
    Number(
      savedGST.totalAmountBeforeTax ??
        savedGST.taxableValue ??
        savedGST.taxableAmount ??
        pricing.totalAmountBeforeTax ??
        order?.totalAmountBeforeTax ??
        0
    );

  const totalAmountBeforeTax =
    round2(
      savedTotalBeforeTax >
        0
        ? savedTotalBeforeTax
        : fallbackTotalBeforeTax
    );

  // ===================================================
  // SAVED GST
  // ===================================================

  const savedCGST =
    round2(
      Number(
        savedGST.cgst ||
          0
      )
    );

  const savedSGST =
    round2(
      Number(
        savedGST.sgst ||
          0
      )
    );

  const savedIGST =
    round2(
      Number(
        savedGST.igst ||
          0
      )
    );

  const savedTotalGST =
    round2(
      Number(
        savedGST.totalGST ??
          savedGST.gstAmount ??
          savedCGST +
            savedSGST +
            savedIGST
      )
    );

  const hasSavedGST =
    savedTotalGST > 0 ||
    savedCGST > 0 ||
    savedSGST > 0 ||
    savedIGST > 0;

  // ===================================================
  // GST
  // ===================================================

  const gst =
    hasSavedGST
      ? {
          ...calculateGST(
            totalAmountBeforeTax,
            customerState
          ),

          taxableAmount:
            totalAmountBeforeTax,

          taxableValue:
            totalAmountBeforeTax,

          totalAmountBeforeTax:
            totalAmountBeforeTax,

          totalGST:
            savedTotalGST,

          cgst:
            savedCGST,

          sgst:
            savedSGST,

          igst:
            savedIGST,

          cgstRate:
            Number(
              savedGST.cgstRate ??
                (savedCGST > 0
                  ? CGST_RATE
                  : 0)
            ),

          sgstRate:
            Number(
              savedGST.sgstRate ??
                (savedSGST > 0
                  ? SGST_RATE
                  : 0)
            ),

          igstRate:
            Number(
              savedGST.igstRate ??
                (savedIGST > 0
                  ? GST_RATE
                  : 0)
            ),

          isInterState:
            Boolean(
              savedGST.isInterState ||
                savedIGST > 0
            ),

          sellerState:
            savedGST.sellerState ||
            BUSINESS_STATE,

          customerState:
            savedGST.customerState ||
            customerState,

          pricingMode:
            savedGST.pricingMode ||
            "gst_exclusive",

          finalAmount:
            round2(
              totalAmountBeforeTax +
                savedTotalGST
            ),

          amountWithGST:
            round2(
              totalAmountBeforeTax +
                savedTotalGST
            ),
        }
      : calculateGST(
          totalAmountBeforeTax,
          customerState
        );

  // ===================================================
  // GST VALUES
  // ===================================================

  const totalGST =
    round2(
      Number(
        gst.totalGST ||
          0
      )
    );

  const cgst =
    round2(
      Number(
        gst.cgst ||
          0
      )
    );

  const sgst =
    round2(
      Number(
        gst.sgst ||
          0
      )
    );

  const igst =
    round2(
      Number(
        gst.igst ||
          0
      )
    );

  // ===================================================
  // FINAL AMOUNT
  // ===================================================

  const finalAmount =
    round2(
      totalAmountBeforeTax +
        totalGST
    );

  // ===================================================
  // COUPON
  // ===================================================

  const couponCode =
    pricing.couponCode ||
    order?.coupon?.code ||
    order?.couponCode ||
    "";

  // ===================================================
  // SHIPPING INFO
  // ===================================================

  const weight =
    shipping.billableWeightGrams ??
    shipping.weightGrams ??
    shipping.weight ??
    0;

  const pincode =
    shipping.pincode ||
    customer.pincode ||
    "";

  const isAdmin =
    recipientType ===
    "admin";

  const isInterState =
    Boolean(
      gst.isInterState ||
        igst > 0
    );

  // ===================================================
  // HTML
  // ===================================================

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  Vraj Creation Order Confirmation
</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family:Arial,Helvetica,sans-serif;
  "
>

<div
  style="
    max-width:720px;
    margin:20px auto;
    background:#ffffff;
    border-radius:10px;
    overflow:hidden;
    box-shadow:0 2px 12px rgba(0,0,0,0.08);
  "
>

  <!-- HEADER -->

  <div
    style="
      background:#8f3424;
      color:#ffffff;
      padding:22px;
    "
  >

    <div
      style="
        font-size:24px;
        font-weight:bold;
      "
    >
      Vraj Creation
    </div>

    <div
      style="
        margin-top:6px;
        font-size:14px;
        opacity:0.95;
      "
    >
      ${
        isAdmin
          ? "New Order Received"
          : "Order Confirmation"
      }
    </div>

  </div>

  <!-- CONTENT -->

  <div
    style="
      padding:24px;
    "
  >

    <div
      style="
        font-size:18px;
        font-weight:bold;
        color:#222;
        margin-bottom:8px;
      "
    >
      ${
        isAdmin
          ? "New customer order received"
          : `Thank you for your order, ${escapeHtml(
              customer.fullName ||
                customer.name ||
                "Customer"
            )}!`
      }
    </div>

    <div
      style="
        color:#666;
        font-size:14px;
        margin-bottom:20px;
      "
    >
      Order #

      <strong>
        ${escapeHtml(
          order?.orderNumber ||
            "-"
        )}
      </strong>
    </div>

    <!-- STATUS -->

    <div
      style="
        display:inline-block;
        padding:7px 12px;
        border-radius:20px;
        background:#fff3cd;
        color:#856404;
        font-size:12px;
        font-weight:bold;
        margin-bottom:20px;
      "
    >
      Status:

      ${escapeHtml(
        order?.status ||
          "pending"
      )}
    </div>

    <!-- CUSTOMER DETAILS -->

    <h3
      style="
        margin:18px 0 10px;
        color:#333;
      "
    >
      Customer Details
    </h3>

    <table
      style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
      "
    >

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
            width:120px;
          "
        >
          Name
        </td>

        <td
          style="
            padding:6px 0;
            font-weight:600;
          "
        >
          ${escapeHtml(
            customer.fullName ||
              customer.name ||
              "-"
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          Mobile
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            customer.mobile ||
              customer.phone ||
              "-"
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          Email
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            customer.email ||
              "-"
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          Address
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            customer.address ||
              "-"
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          City
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            customer.city ||
              "-"
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          State
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            customer.state ||
              BUSINESS_STATE
          )}
        </td>
      </tr>

      <tr>
        <td
          style="
            padding:6px 0;
            color:#777;
          "
        >
          Pincode
        </td>

        <td
          style="
            padding:6px 0;
          "
        >
          ${escapeHtml(
            pincode ||
              "-"
          )}
        </td>
      </tr>

    </table>

    <!-- ORDER ITEMS -->

    <h3
      style="
        margin:24px 0 10px;
        color:#333;
      "
    >
      Order Items
    </h3>

    <table
      style="
        width:100%;
        border-collapse:collapse;
        font-size:13px;
        border:1px solid #eee;
      "
    >

      <thead>

        <tr
          style="
            background:#f8f8f8;
          "
        >

          <th
            style="
              padding:10px;
              text-align:center;
              border-bottom:1px solid #eee;
            "
          >
            #
          </th>

          <th
            style="
              padding:10px;
              text-align:left;
              border-bottom:1px solid #eee;
            "
          >
            Product
          </th>

          <th
            style="
              padding:10px;
              text-align:center;
              border-bottom:1px solid #eee;
              white-space:nowrap;
            "
          >
            HSN Code
          </th>

          <th
            style="
              padding:10px;
              text-align:center;
              border-bottom:1px solid #eee;
            "
          >
            Qty
          </th>

          <th
            style="
              padding:10px;
              text-align:right;
              border-bottom:1px solid #eee;
            "
          >
            Price
          </th>

          <th
            style="
              padding:10px;
              text-align:right;
              border-bottom:1px solid #eee;
            "
          >
            Subtotal
          </th>

        </tr>

      </thead>

      <tbody>

        ${createItemsHtml(
          order
        )}

      </tbody>

    </table>

    <!-- SHIPPING -->

    <h3
      style="
        margin:24px 0 10px;
        color:#333;
      "
    >
      Shipping
    </h3>

    <div
      style="
        background:#fafafa;
        border:1px solid #eee;
        border-radius:8px;
        padding:12px;
        font-size:13px;
      "
    >

      <div
        style="
          margin-bottom:5px;
        "
      >
        Pincode:

        <strong>
          ${escapeHtml(
            pincode ||
              "-"
          )}
        </strong>
      </div>

      <div
        style="
          margin-bottom:5px;
        "
      >
        Weight:

        <strong>
          ${
            weight
              ? `${weight} g`
              : "-"
          }
        </strong>
      </div>

      <div>
        Shipping Charge:

        <strong>
          ${formatMoney(
            shippingCharge
          )}
        </strong>
      </div>

    </div>

    <!-- TOTALS -->

    <div
      style="
        margin-top:24px;
        margin-left:auto;
        max-width:380px;
      "
    >

      <!-- PRODUCT TOTAL -->

      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:6px 0;
          color:#555;
        "
      >

        <span>
          Product Total
        </span>

        <strong>
          ${formatMoney(
            subtotal
          )}
        </strong>

      </div>

      <!-- DISCOUNT -->

      ${
        discount > 0
          ? `
            <div
              style="
                display:flex;
                justify-content:space-between;
                padding:6px 0;
                color:#198754;
              "
            >

              <span>
                Discount
              </span>

              <strong>
                -${formatMoney(
                  discount
                )}
              </strong>

            </div>
          `
          : ""
      }

      <!-- COUPON -->

      ${
        couponCode
          ? `
            <div
              style="
                padding:6px 0;
                color:#198754;
                font-size:12px;
              "
            >

              Coupon:

              <strong>
                ${escapeHtml(
                  couponCode
                )}
              </strong>

            </div>
          `
          : ""
      }

      <!-- PRODUCT AFTER DISCOUNT -->

      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:6px 0;
          color:#555;
        "
      >

        <span>
          Product After Discount
        </span>

        <strong>
          ${formatMoney(
            productAmountAfterDiscount
          )}
        </strong>

      </div>

      <!-- SHIPPING -->

      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:6px 0;
          color:#555;
        "
      >

        <span>
          Shipping
        </span>

        <strong>
          ${
            shippingCharge === 0
              ? "FREE"
              : formatMoney(
                  shippingCharge
                )
          }
        </strong>

      </div>

      <!-- TOTAL BEFORE TAX -->

      <div
        style="
          margin-top:8px;
          padding:10px;
          border-radius:7px;
          background:#fff8ed;
          border:1px solid #ead7b3;
          display:flex;
          justify-content:space-between;
          color:#333;
        "
      >

        <span>
          <strong>
            Total Amount Before Tax
          </strong>
        </span>

        <strong>
          ${formatMoney(
            totalAmountBeforeTax
          )}
        </strong>

      </div>

      <!-- GST -->

      <div
        style="
          margin-top:10px;
          padding:10px;
          border:1px solid #eee;
          border-radius:7px;
          background:#ffffff;
        "
      >

        ${
          isInterState
            ? `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:5px 0;
                  color:#555;
                "
              >

                <span>
                  IGST ${
                    Number(
                      gst.igstRate ||
                        GST_RATE
                    )
                  }%
                </span>

                <strong>
                  ${formatMoney(
                    igst
                  )}
                </strong>

              </div>
            `
            : `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:5px 0;
                  color:#555;
                "
              >

                <span>
                  CGST ${
                    Number(
                      gst.cgstRate ||
                        CGST_RATE
                    )
                  }%
                </span>

                <strong>
                  ${formatMoney(
                    cgst
                  )}
                </strong>

              </div>

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:5px 0;
                  color:#555;
                "
              >

                <span>
                  SGST ${
                    Number(
                      gst.sgstRate ||
                        SGST_RATE
                    )
                  }%
                </span>

                <strong>
                  ${formatMoney(
                    sgst
                  )}
                </strong>

              </div>
            `
        }

        <div
          style="
            display:flex;
            justify-content:space-between;
            padding:6px 0 2px;
            margin-top:4px;
            border-top:1px solid #eee;
            font-weight:bold;
            color:#333;
          "
        >

          <span>
            Total GST
          </span>

          <strong>
            ${formatMoney(
              totalGST
            )}
          </strong>

        </div>

      </div>

      <!-- GRAND TOTAL -->

      <div
        style="
          border-top:2px solid #8f3424;
          margin-top:12px;
          padding-top:12px;
          display:flex;
          justify-content:space-between;
          font-size:18px;
          font-weight:bold;
          color:#8f3424;
        "
      >

        <span>
          Grand Total
        </span>

        <span>
          ${formatMoney(
            finalAmount
          )}
        </span>

      </div>

      <!-- GST NOTE -->

      <div
        style="
          margin-top:8px;
          font-size:11px;
          color:#888;
          text-align:right;
        "
      >

        GST @ 5% added on total amount
        after discount + shipping.

      </div>

    </div>

    <!-- PAYMENT -->

    <div
      style="
        margin-top:24px;
        padding:12px;
        background:#fafafa;
        border:1px solid #eee;
        border-radius:8px;
        font-size:13px;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
        "
      >

        <span>
          Payment Method
        </span>

        <strong>
          ${escapeHtml(
            order?.payment?.method ||
              order?.paymentMethod ||
              "COD"
          )}
        </strong>

      </div>

    </div>

    <!-- PDF NOTICE -->

    <div
      style="
        margin-top:25px;
        padding:12px;
        background:#f7f1ec;
        border-left:4px solid #d39a38;
        font-size:13px;
        color:#555;
      "
    >

      Your GST invoice is attached to this
      email as a PDF.

    </div>

    <!-- FOOTER -->

    <div
      style="
        margin-top:30px;
        padding-top:18px;
        border-top:1px solid #eee;
        text-align:center;
        color:#777;
        font-size:12px;
      "
    >

      Thank you for shopping with

      <strong>
        Vraj Creation
      </strong>.

      <br/>

      We appreciate your order.

    </div>

  </div>

</div>

</body>

</html>
  `;
};

// =====================================================
// RESEND API HELPER
// =====================================================
// Supports:
// - Order emails
// - Customer emails
// - Admin emails
// - Password reset emails
// - PDF attachments
// - HTML + plain text
// - Optional custom FROM address
// =====================================================

const sendViaResend = async ({
  to,
  from,
  subject,
  html,
  text,
  attachments = [],
}) => {
  if (!RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured."
    );
  }

  const sender =
    from ||
    EMAIL_FROM;

  if (!sender) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  if (!to) {
    throw new Error(
      "Recipient email is required."
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required."
    );
  }

  // ===================================================
  // PREPARE ATTACHMENTS
  // ===================================================

  const resendAttachments = [];

  for (
    const attachment of attachments
  ) {
    if (
      !attachment
    ) {
      continue;
    }

    // -----------------------------------------------
    // FILE PATH ATTACHMENT
    // -----------------------------------------------

    if (
      attachment.path
    ) {
      const fileBuffer =
        await fs.readFile(
          attachment.path
        );

      resendAttachments.push({
        filename:
          attachment.filename ||
          "attachment.pdf",

        content:
          fileBuffer.toString(
            "base64"
          ),
      });

      continue;
    }

    // -----------------------------------------------
    // BUFFER ATTACHMENT
    // -----------------------------------------------

    if (
      attachment.content &&
      Buffer.isBuffer(
        attachment.content
      )
    ) {
      resendAttachments.push({
        filename:
          attachment.filename ||
          "attachment.pdf",

        content:
          attachment.content.toString(
            "base64"
          ),
      });

      continue;
    }

    // -----------------------------------------------
    // BASE64 / STRING ATTACHMENT
    // -----------------------------------------------

    if (
      attachment.content
    ) {
      resendAttachments.push({
        filename:
          attachment.filename ||
          "attachment.pdf",

        content:
          String(
            attachment.content
          ),
      });
    }
  }

  // ===================================================
  // RESEND PAYLOAD
  // ===================================================

  const payload = {
    from:
      sender,

    to: [
      to,
    ],

    subject,

    html,

    headers: {
      "X-Vraj-Creation":
        "Vraj Creation",
    },
  };

  // ===================================================
  // OPTIONAL TEXT VERSION
  // ===================================================

  if (
    text &&
    String(text).trim()
  ) {
    payload.text =
      String(text);
  }

  // ===================================================
  // ATTACHMENTS
  // ===================================================

  if (
    resendAttachments.length
  ) {
    payload.attachments =
      resendAttachments;
  }

  // ===================================================
  // LOG
  // ===================================================

  console.log(
    `[RESEND] Sending email to ${to} from ${sender}...`
  );

  // ===================================================
  // SEND REQUEST
  // ===================================================

  const response =
    await fetch(
      RESEND_API_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  let responseData =
    null;

  try {
    responseData =
      await response.json();
  } catch {
    responseData =
      null;
  }

  // ===================================================
  // RESEND ERROR
  // ===================================================

  if (
    !response.ok
  ) {
    const errorMessage =
      responseData?.message ||
      responseData?.error ||
      `Resend API returned HTTP ${response.status}`;

    console.error(
      `[RESEND] Email failed for ${to}:`,
      errorMessage
    );

    throw new Error(
      errorMessage
    );
  }

  // ===================================================
  // SUCCESS
  // ===================================================

  console.log(
    `[RESEND] Email sent successfully to ${to}`
  );

  return responseData;
};

// =====================================================
// SEND ADMIN ORDER EMAIL
// =====================================================

const sendAdminOrderEmail =
  async (
    order,
    attachments = []
  ) => {
    if (
      !ADMIN_ORDER_EMAIL
    ) {
      console.warn(
        "ADMIN_ORDER_EMAIL is not configured."
      );

      return {
        success: false,

        skipped: true,

        reason:
          "ADMIN_ORDER_EMAIL not configured",
      };
    }

    if (
      !RESEND_API_KEY
    ) {
      console.error(
        "Admin email skipped: RESEND_API_KEY is not configured."
      );

      return {
        success: false,

        skipped: true,

        reason:
          "RESEND_API_KEY not configured",
      };
    }

    const orderNumber =
      order?.orderNumber ||
      "New Order";

    try {
      console.log(
        `[EMAIL] Sending admin email for ${orderNumber} to ${ADMIN_ORDER_EMAIL}...`
      );

      const result =
        await sendViaResend({
          to:
            ADMIN_ORDER_EMAIL,

          subject:
            `New Vraj Creation Order - ${orderNumber}`,

          html:
            createOrderHtml(
              order,
              {
                recipientType:
                  "admin",
              }
            ),

          attachments,
        });

      const messageId =
        result?.id ||
        result?.data?.id ||
        "";

      console.log(
        `[EMAIL] Admin order email sent successfully: ${messageId}`
      );

      return {
        success: true,

        messageId,
      };
    } catch (error) {
      console.error(
        `[EMAIL] Admin order email failed for ${orderNumber}:`,
        error?.message ||
          error
      );

      return {
        success: false,

        error:
          error?.message ||
          String(error),
      };
    }
  };

// =====================================================
// SEND CUSTOMER ORDER EMAIL
// =====================================================

const sendCustomerOrderEmail =
  async (
    order,
    attachments = []
  ) => {
    const customerEmail =
      order?.customer?.email;

    if (
      !customerEmail
    ) {
      console.warn(
        "Customer email not found."
      );

      return {
        success: false,

        skipped: true,

        reason:
          "Customer email not found",
      };
    }

    if (
      !RESEND_API_KEY
    ) {
      console.error(
        "Customer email skipped: RESEND_API_KEY is not configured."
      );

      return {
        success: false,

        skipped: true,

        reason:
          "RESEND_API_KEY not configured",
      };
    }

    const orderNumber =
      order?.orderNumber ||
      "Order";

    try {
      console.log(
        `[EMAIL] Sending customer email for ${orderNumber} to ${customerEmail}...`
      );

      const result =
        await sendViaResend({
          to:
            customerEmail,

          subject:
            `Vraj Creation Order Confirmation - ${orderNumber}`,

          html:
            createOrderHtml(
              order,
              {
                recipientType:
                  "customer",
              }
            ),

          attachments,
        });

      const messageId =
        result?.id ||
        result?.data?.id ||
        "";

      console.log(
        `[EMAIL] Customer order email sent successfully: ${messageId}`
      );

      return {
        success: true,

        messageId,
      };
    } catch (error) {
      console.error(
        `[EMAIL] Customer order email failed for ${orderNumber}:`,
        error?.message ||
          error
      );

      return {
        success: false,

        error:
          error?.message ||
          String(error),
      };
    }
  };

// =====================================================
// SEND BOTH EMAILS + GST PDF
// =====================================================

const sendOrderEmails =
  async (
    order
  ) => {
    let attachments = [];

    let invoiceResult =
      null;

    let invoiceFilePath =
      null;

    const orderNumber =
      order?.orderNumber ||
      "Unknown Order";

    console.log(
      "=============================================="
    );

    console.log(
      `[EMAIL] Starting email process for ${orderNumber}`
    );

    console.log(
      "=============================================="
    );

    // =================================================
    // GENERATE GST PDF
    // =================================================

    try {
      console.log(
        `[EMAIL] Generating GST invoice for ${orderNumber}...`
      );

      invoiceResult =
        await generateGSTInvoicePDF(
          order
        );

      if (
        !invoiceResult ||
        !invoiceResult.success ||
        !invoiceResult.filePath
      ) {
        throw new Error(
          "GST invoice generator did not return a valid PDF file."
        );
      }

      invoiceFilePath =
        invoiceResult.filePath;

      attachments = [
        {
          filename:
            invoiceResult.filename,

          path:
            invoiceResult.filePath,

          contentType:
            "application/pdf",
        },
      ];

      console.log(
        "=============================================="
      );

      console.log(
        "GST invoice ready for email"
      );

      console.log(
        "Filename:",
        invoiceResult.filename
      );

      console.log(
        "Path:",
        invoiceResult.filePath
      );

      console.log(
        "Invoice Number:",
        invoiceResult.invoiceNumber
      );

      console.log(
        "=============================================="
      );
    } catch (error) {
      console.error(
        `[EMAIL] GST invoice PDF generation failed for ${orderNumber}:`,
        error?.message ||
          error
      );

      attachments = [];

      invoiceResult =
        null;
    }

    // =================================================
    // SEND BOTH EMAILS
    // =================================================

    let adminResult = {
      success: false,

      error:
        "Admin email not attempted",
    };

    let customerResult = {
      success: false,

      error:
        "Customer email not attempted",
    };

    try {
      [
        adminResult,
        customerResult,
      ] = await Promise.all([
        sendAdminOrderEmail(
          order,
          attachments
        ),

        sendCustomerOrderEmail(
          order,
          attachments
        ),
      ]);
    } catch (error) {
      console.error(
        `[EMAIL] Email Promise.all failed for ${orderNumber}:`,
        error?.message ||
          error
      );
    }

    // =================================================
    // CLEAN TEMP PDF
    // =================================================

    if (
      invoiceFilePath
    ) {
      try {
        await deleteInvoicePDF(
          invoiceFilePath
        );

        console.log(
          `[EMAIL] Temporary invoice deleted for ${orderNumber}`
        );
      } catch (error) {
        console.error(
          `[EMAIL] Temporary invoice PDF deletion failed for ${orderNumber}:`,
          error?.message ||
            error
        );
      }
    }

    // =================================================
    // RESULT
    // =================================================

    const result = {
      success:
        adminResult.success ||
        customerResult.success,

      invoice:
        invoiceResult
          ? {
              success:
                true,

              filename:
                invoiceResult.filename,

              invoiceNumber:
                invoiceResult.invoiceNumber,

              fileSize:
                invoiceResult.fileSize,
            }
          : {
              success:
                false,

              error:
                "Invoice PDF could not be generated",
            },

      admin:
        adminResult,

      customer:
        customerResult,
    };

    console.log(
      "=============================================="
    );

    console.log(
      `[EMAIL] Email process completed for ${orderNumber}`
    );

    console.log(
      "Admin:",
      adminResult.success
        ? "SUCCESS"
        : "FAILED"
    );

    console.log(
      "Customer:",
      customerResult.success
        ? "SUCCESS"
        : "FAILED"
    );

    console.log(
      "Invoice:",
      invoiceResult
        ? "SUCCESS"
        : "FAILED"
    );

    console.log(
      "=============================================="
    );

    return result;
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Kept for compatibility with existing code
  transporter: null,

  verifyEmailConnection,

  createItemsHtml,

  createOrderHtml,

  sendViaResend,

  sendAdminOrderEmail,

  sendCustomerOrderEmail,

  sendOrderEmails,

  normalizeHSNCode,

  getDefaultHSNCode,

  getItemHSNCode,
};