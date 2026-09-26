// =====================================================
// VRAJ CREATION - EMAIL SERVICE
// GMAIL + NODEMAILER
// CUSTOMER + ADMIN
// GST PDF ATTACHMENT
// BACKEND GST CALCULATION AS SOURCE OF TRUTH
// =====================================================

const nodemailer = require("nodemailer");

const {
  generateGSTInvoicePDF,
  deleteInvoicePDF,
  createInvoiceData,
  formatMoney,
  escapeHtml,
} = require("./gstInvoiceService");

require("dotenv").config();

// =====================================================
// EMAIL CONFIGURATION
// =====================================================

const EMAIL_HOST =
  String(
    process.env.EMAIL_HOST ||
      "smtp.gmail.com"
  ).trim();

const EMAIL_PORT =
  Number(
    process.env.EMAIL_PORT ||
      465
  );

const EMAIL_SECURE =
  String(
    process.env.EMAIL_SECURE ??
      "true"
  ).toLowerCase() === "true";

const EMAIL_USER =
  String(
    process.env.EMAIL_USER ||
      ""
  ).trim();

const EMAIL_PASS =
  String(
    process.env.EMAIL_PASS ||
      ""
  )
    .trim()
    .replace(/\s+/g, "");

const EMAIL_FROM =
  String(
    process.env.EMAIL_FROM ||
      ""
  ).trim() ||
  `Vraj Creation <${EMAIL_USER}>`;

const ADMIN_ORDER_EMAIL =
  String(
    process.env.ADMIN_ORDER_EMAIL ||
      ""
  ).trim();

// =====================================================
// NODEMAILER TRANSPORTER
// =====================================================

let transporter = null;

if (
  EMAIL_USER &&
  EMAIL_PASS
) {
  transporter =
    nodemailer.createTransport({
      host: EMAIL_HOST,

      port: EMAIL_PORT,

      secure:
        EMAIL_SECURE,

      auth: {
        user:
          EMAIL_USER,

        pass:
          EMAIL_PASS,
      },

      connectionTimeout:
        15000,

      greetingTimeout:
        15000,

      socketTimeout:
        30000,
    });
}

// =====================================================
// STARTUP LOG
// =====================================================

console.log(
  "=============================================="
);

console.log(
  "VRAJ CREATION EMAIL SERVICE"
);

console.log(
  "Provider: Gmail + Nodemailer"
);

console.log(
  "SMTP Host:",
  EMAIL_HOST
);

console.log(
  "SMTP Port:",
  EMAIL_PORT
);

console.log(
  "SMTP Secure:",
  EMAIL_SECURE
);

console.log(
  "Email User:",
  EMAIL_USER ||
    "NOT CONFIGURED"
);

console.log(
  "Email Password:",
  EMAIL_PASS
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
  ADMIN_ORDER_EMAIL ||
    "NOT CONFIGURED"
);

console.log(
  "=============================================="
);

// =====================================================
// VERIFY GMAIL CONNECTION
// =====================================================

const verifyEmailConnection =
  async () => {
    try {
      console.log(
        "Checking Gmail SMTP connection..."
      );

      if (!EMAIL_USER) {
        throw new Error(
          "EMAIL_USER is not configured in .env"
        );
      }

      if (!EMAIL_PASS) {
        throw new Error(
          "EMAIL_PASS is not configured in .env"
        );
      }

      if (!EMAIL_FROM) {
        throw new Error(
          "EMAIL_FROM is not configured."
        );
      }

      if (!transporter) {
        throw new Error(
          "Nodemailer transporter was not created."
        );
      }

      await transporter.verify();

      console.log(
        "✅ Gmail SMTP connection successful."
      );

      return true;
    } catch (error) {
      console.error(
        "❌ Gmail SMTP connection failed:"
      );

      console.error(
        error?.message ||
          error
      );

      return false;
    }
  };

// =====================================================
// MONEY
// =====================================================

const money = (
  value
) => {
  try {
    return formatMoney(
      Number(value || 0)
    );
  } catch {
    return `₹${Number(
      value || 0
    ).toFixed(2)}`;
  }
};

// =====================================================
// SAFE VALUE
// =====================================================

const safe = (
  value,
  fallback = "-"
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
};

// =====================================================
// ORDER NUMBER
// =====================================================

const getOrderNumber = (
  order
) => {
  return (
    order?.orderNumber ||
    order?.orderNo ||
    order?.orderId ||
    order?._id ||
    "N/A"
  );
};

// =====================================================
// CUSTOMER EMAIL
// =====================================================

const getCustomerEmail = (
  order
) => {
  return String(
    order?.customer?.email ||
      order?.user?.email ||
      order?.billing?.email ||
      order?.email ||
      ""
  ).trim();
};

// =====================================================
// PAYMENT METHOD
// =====================================================

const getPaymentMethod = (
  order
) => {
  const payment =
    order?.payment || {};

  const method =
    String(
      payment.method ||
        payment.type ||
        payment.paymentMethod ||
        order?.paymentMethod ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    method === "cod" ||
    method ===
      "cash_on_delivery"
  ) {
    return "Cash on Delivery";
  }

  if (
    method === "upi" ||
    method === "upi_id"
  ) {
    return "Prepaid UPI";
  }

  if (
    method === "qr" ||
    method === "upi_qr"
  ) {
    return "Prepaid UPI QR";
  }

  return (
    payment.method ||
    payment.type ||
    order?.paymentMethod ||
    "Not Specified"
  );
};

// =====================================================
// ITEMS HTML
// IMPORTANT:
// USES INVOICE DATA
// =====================================================

const createItemsHtml = (
  invoiceData
) => {
  const items =
    Array.isArray(
      invoiceData?.items
    )
      ? invoiceData.items
      : [];

  if (!items.length) {
    return `
      <tr>
        <td
          colspan="6"
          style="
            padding:14px;
            text-align:center;
            color:#777;
            border:1px solid #eee;
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
              1
          );

        const price =
          Number(
            item.sellingPrice ??
              item.price ??
              item.salePrice ??
              item.unitPrice ??
              0
          );

        const subtotal =
          Number(
            item.sellingTotal ??
              item.subtotal ??
              price *
                quantity
          );

        const hsn =
          item.hsnCode ||
          item.hsn ||
          item.HSNCode ||
          "-";

        const productName =
          item.name ||
          item.productName ||
          item.title ||
          "Product";

        const sku =
          item.sku ||
          item.productId ||
          "";

        return `
          <tr>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
                text-align:center;
              "
            >
              ${index + 1}
            </td>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
              "
            >

              <strong>
                ${escapeHtml(
                  productName
                )}
              </strong>

              ${
                sku
                  ? `
                    <div
                      style="
                        margin-top:3px;
                        color:#777;
                        font-size:11px;
                      "
                    >
                      SKU/Product ID:
                      ${escapeHtml(
                        sku
                      )}
                    </div>
                  `
                  : ""
              }

            </td>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
                text-align:center;
              "
            >
              ${escapeHtml(
                safe(
                  hsn
                )
              )}
            </td>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
                text-align:center;
              "
            >
              ${quantity}
            </td>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
                text-align:right;
              "
            >
              ${money(
                price
              )}
            </td>

            <td
              style="
                padding:10px;
                border:1px solid #eee;
                text-align:right;
                font-weight:600;
              "
            >
              ${money(
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
// SINGLE SOURCE:
// createInvoiceData()
// =====================================================

const createOrderHtml = (
  order,
  options = {}
) => {
  const recipientType =
    options.recipientType ||
    "customer";

  const data =
    options.invoiceData ||
    createInvoiceData(
      order
    );

  const customer =
    data?.customer ||
    order?.customer ||
    {};

  const shipping =
    data?.shipping ||
    order?.shipping ||
    {};

  const gst =
    data?.gst ||
    {};

  const items =
    data?.items ||
    [];

  // ---------------------------------------------------
  // EXACT BACKEND VALUES
  // ---------------------------------------------------

  const productTotal =
    Number(
      data?.productTotal ||
        0
    );

  const productDiscount =
    Number(
      data?.productDiscount ||
        0
    );

  const spinDiscount =
    Number(
      data?.spinDiscount ||
        0
    );

  const couponDiscount =
    Number(
      data?.couponDiscount ||
        0
    );

  const totalDiscount =
    productDiscount +
    spinDiscount +
    couponDiscount;

  const sellingProductTotal =
    Number(
      data?.sellingProductTotal ??
        Math.max(
          0,
          productTotal -
            totalDiscount
        )
    );

  const shippingCharge =
    Number(
      shipping?.charge ??
        data?.shippingCharge ??
        0
    );

  const totalBeforeTax =
    Number(
      data?.totalAmountBeforeTax ??
        sellingProductTotal +
          shippingCharge
    );

  const cgst =
    Number(
      gst?.cgst ||
        0
    );

  const sgst =
    Number(
      gst?.sgst ||
        0
    );

  const igst =
    Number(
      gst?.igst ||
        0
    );

  const totalGST =
    Number(
      gst?.totalGST ??
        cgst +
          sgst +
          igst
    );

  const finalAmount =
    Number(
      data?.finalAmount ??
        totalBeforeTax +
          totalGST
    );

  const isInterState =
    Boolean(
      gst?.isInterState ||
        igst > 0
    );

  const customerState =
    customer?.state ||
    gst?.customerState ||
    "Rajasthan";

  const orderNumber =
    getOrderNumber(
      order
    );

  const invoiceNumber =
    data?.invoiceNumber ||
    data?.invoice?.invoiceNumber ||
    "";

  const paymentMethod =
    getPaymentMethod(
      order
    );

  const couponCode =
    order?.couponCode ||
    order?.coupon?.code ||
    data?.couponCode ||
    "";

  const customerName =
    customer?.fullName ||
    customer?.name ||
    "Customer";

  const isAdmin =
    recipientType ===
    "admin";

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
  Vraj Creation Order
</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f1e8;
    font-family:Arial,Helvetica,sans-serif;
    color:#2d241d;
  "
>

<div
  style="
    max-width:760px;
    margin:20px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
  "
>

<!-- ================================================= -->
<!-- HEADER -->
<!-- ================================================= -->

<div
  style="
    background:#8f3424;
    color:#ffffff;
    padding:25px;
    text-align:center;
  "
>

  <div
    style="
      font-size:27px;
      font-weight:bold;
    "
  >
    Vraj Creation
  </div>

  <div
    style="
      margin-top:6px;
      font-size:13px;
    "
  >
    Traditional Craft, Beautifully Made
  </div>

</div>

<!-- ================================================= -->
<!-- BODY -->
<!-- ================================================= -->

<div
  style="
    padding:25px;
  "
>

<h2
  style="
    margin-top:0;
    color:#8f3424;
  "
>
  ${
    isAdmin
      ? "New Order Received"
      : "Order Confirmed"
  }
</h2>

<p
  style="
    font-size:14px;
    line-height:1.6;
  "
>
  ${
    isAdmin
      ? "A new order has been received on Vraj Creation."
      : `Thank you for your order, <strong>${escapeHtml(
          customerName
        )}</strong>. Your order has been successfully received.`
  }
</p>

<!-- ================================================= -->
<!-- ORDER INFO -->
<!-- ================================================= -->

<div
  style="
    margin:20px 0;
    padding:15px;
    background:#faf7f0;
    border-left:4px solid #d39a38;
  "
>

<div style="margin:5px 0;">
  <strong>Order Number:</strong>
  ${escapeHtml(
    safe(orderNumber)
  )}
</div>

${
  invoiceNumber
    ? `
      <div style="margin:5px 0;">
        <strong>Invoice Number:</strong>
        ${escapeHtml(
          safe(invoiceNumber)
        )}
      </div>
    `
    : ""
}

<div style="margin:5px 0;">
  <strong>Payment:</strong>
  ${escapeHtml(
    safe(paymentMethod)
  )}
</div>

<div style="margin:5px 0;">
  <strong>Status:</strong>
  ${escapeHtml(
    safe(
      order?.status ||
        "pending"
    )
  )}
</div>

</div>

<!-- ================================================= -->
<!-- CUSTOMER -->
<!-- ================================================= -->

<h3
  style="
    color:#8f3424;
    border-bottom:1px solid #ddd;
    padding-bottom:8px;
  "
>
  Customer Details
</h3>

<table
  width="100%"
  cellpadding="5"
  cellspacing="0"
  style="
    font-size:14px;
  "
>

<tr>
<td width="130">
<strong>Name</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.fullName ||
      customer?.name
  )
)}
</td>
</tr>

<tr>
<td>
<strong>Email</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.email
  )
)}
</td>
</tr>

<tr>
<td>
<strong>Mobile</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.mobile ||
      customer?.phone
  )
)}
</td>
</tr>

<tr>
<td>
<strong>Address</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.address
  )
)}
</td>
</tr>

<tr>
<td>
<strong>City</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.city
  )
)}
</td>
</tr>

<tr>
<td>
<strong>State</strong>
</td>

<td>
${escapeHtml(
  safe(
    customerState
  )
)}
</td>
</tr>

<tr>
<td>
<strong>Pincode</strong>
</td>

<td>
${escapeHtml(
  safe(
    customer?.pincode ||
      shipping?.pincode
  )
)}
</td>
</tr>

</table>

<!-- ================================================= -->
<!-- ITEMS -->
<!-- ================================================= -->

<h3
  style="
    margin-top:28px;
    color:#8f3424;
    border-bottom:1px solid #ddd;
    padding-bottom:8px;
  "
>
  Order Items
</h3>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    border-collapse:collapse;
    font-size:13px;
  "
>

<thead>

<tr
  style="
    background:#f8f5ee;
  "
>

<th style="padding:10px;border:1px solid #eee;">
#
</th>

<th
  style="
    padding:10px;
    border:1px solid #eee;
    text-align:left;
  "
>
Product
</th>

<th style="padding:10px;border:1px solid #eee;">
HSN
</th>

<th style="padding:10px;border:1px solid #eee;">
Qty
</th>

<th
  style="
    padding:10px;
    border:1px solid #eee;
    text-align:right;
  "
>
Price
</th>

<th
  style="
    padding:10px;
    border:1px solid #eee;
    text-align:right;
  "
>
Amount
</th>

</tr>

</thead>

<tbody>

${createItemsHtml(
  data
)}

</tbody>

</table>

<!-- ================================================= -->
<!-- PRICE SUMMARY -->
<!-- ================================================= -->

<h3
  style="
    margin-top:28px;
    color:#8f3424;
    border-bottom:1px solid #ddd;
    padding-bottom:8px;
  "
>
  Price Summary
</h3>

<table
  width="100%"
  cellpadding="7"
  cellspacing="0"
  style="
    font-size:14px;
  "
>

<tr>
<td>
Product Total
</td>

<td align="right">
${money(
  productTotal
)}
</td>
</tr>

${
  productDiscount > 0
    ? `
      <tr>
        <td>
          Product Discount
        </td>

        <td
          align="right"
          style="color:#198754;"
        >
          - ${money(
            productDiscount
          )}
        </td>
      </tr>
    `
    : ""
}

${
  spinDiscount > 0
    ? `
      <tr>
        <td>
          Spin & Win Discount
        </td>

        <td
          align="right"
          style="color:#198754;"
        >
          - ${money(
            spinDiscount
          )}
        </td>
      </tr>
    `
    : ""
}

${
  couponDiscount > 0
    ? `
      <tr>
        <td>
          Coupon Discount
        </td>

        <td
          align="right"
          style="color:#198754;"
        >
          - ${money(
            couponDiscount
          )}
        </td>
      </tr>
    `
    : ""
}

${
  totalDiscount > 0
    ? `
      <tr>
        <td>
          <strong>Total Discount</strong>
        </td>

        <td
          align="right"
          style="
            color:#198754;
            font-weight:bold;
          "
        >
          - ${money(
            totalDiscount
          )}
        </td>
      </tr>
    `
    : ""
}

<tr>
<td>
Product After Discount
</td>

<td align="right">
${money(
  sellingProductTotal
)}
</td>
</tr>

<tr>
<td>
Shipping
</td>

<td align="right">
${
  shippingCharge === 0
    ? "FREE"
    : money(
        shippingCharge
      )
}
</td>
</tr>

<tr
  style="
    border-top:1px solid #ddd;
    font-weight:bold;
  "
>

<td>
Total Amount Before Tax
</td>

<td align="right">
${money(
  totalBeforeTax
)}
</td>

</tr>

</table>

<!-- ================================================= -->
<!-- GST -->
<!-- ================================================= -->

<div
  style="
    margin-top:15px;
    padding:15px;
    background:#faf7f0;
    border-radius:8px;
  "
>

<div
  style="
    font-weight:bold;
    margin-bottom:8px;
  "
>
GST Details
</div>

${
  isInterState
    ? `
      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:5px 0;
        "
      >
        <span>
          IGST @ 5%
        </span>

        <strong>
          ${money(
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
        "
      >
        <span>
          CGST @ 2.5%
        </span>

        <strong>
          ${money(
            cgst
          )}
        </strong>
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:5px 0;
        "
      >
        <span>
          SGST @ 2.5%
        </span>

        <strong>
          ${money(
            sgst
          )}
        </strong>
      </div>
    `
}

<div
  style="
    border-top:1px solid #ddd;
    margin-top:5px;
    padding-top:8px;
    display:flex;
    justify-content:space-between;
    font-weight:bold;
  "
>

<span>
Total GST @ 5%
</span>

<strong>
${money(
  totalGST
)}
</strong>

</div>

</div>

<!-- ================================================= -->
<!-- GRAND TOTAL -->
<!-- ================================================= -->

<div
  style="
    margin-top:15px;
    padding:15px;
    background:#8f3424;
    color:#ffffff;
    border-radius:8px;
    display:flex;
    justify-content:space-between;
    font-size:19px;
    font-weight:bold;
  "
>

<span>
Grand Total
</span>

<span>
${money(
  finalAmount
)}
</span>

</div>

<div
  style="
    margin-top:8px;
    text-align:right;
    color:#888;
    font-size:11px;
  "
>
GST @ 5% added on taxable amount
after discount + shipping.
</div>

<!-- ================================================= -->
<!-- PDF -->
<!-- ================================================= -->

<div
  style="
    margin-top:25px;
    padding:15px;
    background:#f5f1e8;
    border-left:4px solid #d39a38;
    font-size:13px;
  "
>

<strong>
GST Invoice PDF Attached
</strong>

<br/>

<span style="color:#666;">
Your GST invoice is attached to this email.
</span>

</div>

<!-- ================================================= -->
<!-- FOOTER -->
<!-- ================================================= -->

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

Traditional Craft, Beautifully Made

</div>

</div>

</div>

</body>

</html>
  `;
};

// =====================================================
// SEND VIA GMAIL
// =====================================================

const sendViaGmail =
  async ({
    to,
    from,
    subject,
    html,
    text,
    attachments = [],
  }) => {
    if (!transporter) {
      throw new Error(
        "Gmail transporter is not configured. Check EMAIL_USER and EMAIL_PASS."
      );
    }

    const recipient =
      String(
        to || ""
      ).trim();

    if (!recipient) {
      throw new Error(
        "Recipient email is required."
      );
    }

    if (!subject) {
      throw new Error(
        "Email subject is required."
      );
    }

    const sender =
      String(
        from ||
          EMAIL_FROM ||
          EMAIL_USER
      ).trim();

    if (!sender) {
      throw new Error(
        "Email sender is not configured."
      );
    }

    const mailAttachments =
      Array.isArray(
        attachments
      )
        ? attachments
            .filter(Boolean)
            .map(
              (
                attachment
              ) => {
                if (
                  typeof attachment ===
                  "string"
                ) {
                  return {
                    filename:
                      "Vraj-Creation-GST-Invoice.pdf",

                    path:
                      attachment,

                    contentType:
                      "application/pdf",
                  };
                }

                return {
                  filename:
                    attachment.filename ||
                    "attachment.pdf",

                  path:
                    attachment.path,

                  content:
                    attachment.content,

                  contentType:
                    attachment.contentType ||
                    "application/pdf",
                };
              }
            )
        : [];

    const mailOptions = {
      from: sender,

      to: recipient,

      subject:
        String(subject),

      html:
        html || "",

      text:
        text ||
        "Vraj Creation order confirmation.",

      headers: {
        "X-Vraj-Creation":
          "Vraj Creation",
      },

      attachments:
        mailAttachments,
    };

    console.log(
      `[GMAIL] Sending email to ${recipient}...`
    );

    console.log(
      `[GMAIL] Attachments: ${mailAttachments.length}`
    );

    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      `[GMAIL] Email sent successfully to ${recipient}`
    );

    console.log(
      `[GMAIL] Message ID: ${info.messageId}`
    );

    return info;
  };

// =====================================================
// ADMIN ORDER EMAIL
// =====================================================

const sendAdminOrderEmail =
  async (
    order,
    invoiceData,
    attachments = []
  ) => {
    if (
      !ADMIN_ORDER_EMAIL
    ) {
      return {
        success: false,
        skipped: true,
        reason:
          "ADMIN_ORDER_EMAIL not configured",
      };
    }

    try {
      const orderNumber =
        getOrderNumber(
          order
        );

      const result =
        await sendViaGmail({
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

                invoiceData,
              }
            ),

          text:
            `New Vraj Creation order received. Order Number: ${orderNumber}`,

          attachments,
        });

      return {
        success: true,

        messageId:
          result?.messageId ||
          "",

        accepted:
          result?.accepted ||
          [],

        rejected:
          result?.rejected ||
          [],
      };
    } catch (error) {
      console.error(
        "❌ Admin order email failed:",
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
// CUSTOMER ORDER EMAIL
// =====================================================

const sendCustomerOrderEmail =
  async (
    order,
    invoiceData,
    attachments = []
  ) => {
    const customerEmail =
      getCustomerEmail(
        order
      );

    if (!customerEmail) {
      return {
        success: false,

        skipped: true,

        reason:
          "Customer email not found",
      };
    }

    try {
      const orderNumber =
        getOrderNumber(
          order
        );

      const customerName =
        invoiceData?.customer
          ?.fullName ||
        invoiceData?.customer
          ?.name ||
        "Customer";

      const result =
        await sendViaGmail({
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

                invoiceData,
              }
            ),

          text:
            `Hello ${customerName}, your Vraj Creation order ${orderNumber} has been confirmed. Your GST invoice PDF is attached.`,

          attachments,
        });

      return {
        success: true,

        messageId:
          result?.messageId ||
          "",

        accepted:
          result?.accepted ||
          [],

        rejected:
          result?.rejected ||
          [],
      };
    } catch (error) {
      console.error(
        "❌ Customer order email failed:",
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
// SEND CUSTOMER + ADMIN + GST PDF
// =====================================================

const sendOrderEmails =
  async (
    order
  ) => {
    let invoiceFilePath =
      null;

    let invoiceResult =
      null;

    const orderNumber =
      getOrderNumber(
        order
      );

    console.log(
      "=============================================="
    );

    console.log(
      `[EMAIL] Starting order email process: ${orderNumber}`
    );

    try {
      // =================================================
      // 1. CALCULATE INVOICE DATA
      // =================================================

      console.log(
        "[EMAIL] Calculating invoice from backend..."
      );

      const invoiceData =
        createInvoiceData(
          order
        );

      if (!invoiceData) {
        throw new Error(
          "createInvoiceData() returned no data."
        );
      }

      // =================================================
      // ACCURACY LOG
      // =================================================

      console.log(
        "[EMAIL] Invoice calculation:"
      );

      console.log({
        productTotal:
          invoiceData.productTotal,

        productDiscount:
          invoiceData.productDiscount,

        spinDiscount:
          invoiceData.spinDiscount,

        couponDiscount:
          invoiceData.couponDiscount,

        sellingProductTotal:
          invoiceData.sellingProductTotal,

        shipping:
          invoiceData.shipping?.charge,

        totalBeforeTax:
          invoiceData.totalAmountBeforeTax,

        cgst:
          invoiceData.gst?.cgst,

        sgst:
          invoiceData.gst?.sgst,

        igst:
          invoiceData.gst?.igst,

        totalGST:
          invoiceData.gst?.totalGST,

        finalAmount:
          invoiceData.finalAmount,

        customerState:
          invoiceData.customer?.state,

        isInterState:
          invoiceData.gst?.isInterState,
      });

      // =================================================
      // 2. GENERATE GST PDF
      // =================================================

      console.log(
        "[EMAIL] Generating GST invoice PDF..."
      );

      invoiceResult =
        await generateGSTInvoicePDF(
          order
        );

      if (
        !invoiceResult?.success ||
        !invoiceResult?.filePath
      ) {
        throw new Error(
          "GST invoice PDF generation failed."
        );
      }

      invoiceFilePath =
        invoiceResult.filePath;

      console.log(
        "[EMAIL] GST PDF generated:"
      );

      console.log(
        "Filename:",
        invoiceResult.filename
      );

      console.log(
        "Invoice Number:",
        invoiceResult.invoiceNumber
      );

      console.log(
        "File Size:",
        invoiceResult.fileSize
      );

      // =================================================
      // 3. PDF ATTACHMENT
      // =================================================

      const attachments = [
        {
          filename:
            invoiceResult.filename ||
            "Vraj-Creation-GST-Invoice.pdf",

          path:
            invoiceResult.filePath,

          contentType:
            "application/pdf",
        },
      ];

      // =================================================
      // 4. SEND BOTH EMAILS
      // =================================================

      const [
        adminResult,
        customerResult,
      ] =
        await Promise.all([
          sendAdminOrderEmail(
            order,
            invoiceData,
            attachments
          ),

          sendCustomerOrderEmail(
            order,
            invoiceData,
            attachments
          ),
        ]);

      // =================================================
      // 5. FINAL RESULT
      // =================================================

      const result = {
        success:
          adminResult.success ||
          customerResult.success,

        bothSent:
          adminResult.success &&
          customerResult.success,

        invoice: {
          success:
            true,

          filename:
            invoiceResult.filename,

          invoiceNumber:
            invoiceResult.invoiceNumber,

          fileSize:
            invoiceResult.fileSize,
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
        `[EMAIL] Order email process completed: ${orderNumber}`
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
        "GST PDF:",
        "ATTACHED"
      );

      console.log(
        "=============================================="
      );

      return result;
    } catch (error) {
      console.error(
        "=============================================="
      );

      console.error(
        `[EMAIL] Order email process failed: ${orderNumber}`
      );

      console.error(
        error?.message ||
          error
      );

      console.error(
        "=============================================="
      );

      return {
        success: false,

        error:
          error?.message ||
          String(error),

        invoice: {
          success:
            Boolean(
              invoiceResult
            ),

          filename:
            invoiceResult?.filename ||
            null,

          invoiceNumber:
            invoiceResult?.invoiceNumber ||
            null,
        },

        admin: {
          success:
            false,
        },

        customer: {
          success:
            false,
        },
      };
    } finally {
      // =================================================
      // DELETE TEMP PDF ONLY AFTER EMAILS
      // =================================================

      if (
        invoiceFilePath
      ) {
        try {
          await deleteInvoicePDF(
            invoiceFilePath
          );

          console.log(
            "[EMAIL] Temporary GST PDF deleted."
          );
        } catch (error) {
          console.error(
            "[EMAIL] PDF cleanup failed:",
            error?.message ||
              error
          );
        }
      }
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  transporter,

  verifyEmailConnection,

  createItemsHtml,

  createOrderHtml,

  sendViaGmail,

  sendAdminOrderEmail,

  sendCustomerOrderEmail,

  sendOrderEmails,
};