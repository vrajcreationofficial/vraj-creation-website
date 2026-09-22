const mongoose = require("mongoose");

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    hsnCode: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (value) {
          if (!value) return true;

          return /^\d{4}(\d{2}|\d{4})?$/.test(value);
        },

        message:
          "HSN code must contain 4, 6 or 8 digits.",
      },
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    subcategory: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    size: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// CUSTOMER SCHEMA
// =====================================================

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    stateCode: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// PRICING SCHEMA
// =====================================================

const pricingSchema = new mongoose.Schema(
  {
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    eligibleSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmountBeforeTax: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    totalGST: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    igst: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
    },

    sgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
    },

    igstRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    finalTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    wheelValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    source: {
      type: String,
      trim: true,
      default: "",
    },

    discountScope: {
      type: String,
      trim: true,
      default: "all",
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// SHIPPING SCHEMA
// =====================================================

const shippingSchema = new mongoose.Schema(
  {
    charge: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    stateCode: {
      type: String,
      trim: true,
      default: "",
    },

    weightGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    billableWeightGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    lengthCm: {
      type: Number,
      default: 0,
      min: 0,
    },

    widthCm: {
      type: Number,
      default: 0,
      min: 0,
    },

    heightCm: {
      type: Number,
      default: 0,
      min: 0,
    },

    courier: {
      type: String,
      trim: true,
      default: "",
    },

    estimatedDays: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// PAYMENT SCHEMA
// =====================================================

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod", "upi"],
      default: "cod",
    },

    type: {
      type: String,
      enum: ["upi_id", "qr", null],
      default: null,
    },

    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    transactionId: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "rejected",
      ],
      default: "pending",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: String,
      trim: true,
      default: "",
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    screenshot: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// BUSINESS SCHEMA
// =====================================================

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Vraj Creation",
    },

    gstin: {
      type: String,
      trim: true,
      default: "08AADPO3512A1ZB",
    },

    state: {
      type: String,
      trim: true,
      default: "Rajasthan",
    },

    stateCode: {
      type: String,
      trim: true,
      default: "08",
    },

    address: {
      type: String,
      trim: true,
      default: "Madhuban Colony Basni Jodhpur",
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// GST SCHEMA
// =====================================================

const gstSchema = new mongoose.Schema(
  {
    gstRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    totalGST: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    igst: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
    },

    sgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
    },

    igstRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    taxableValue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    customer: {
      type: customerSchema,
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "Order must contain at least one item.",
      },
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    coupon: {
      type: couponSchema,
      default: null,
    },

    shipping: {
      type: shippingSchema,
      default: () => ({}),
    },

    pricing: {
      type: pricingSchema,
      default: () => ({}),
    },

    gst: {
      type: gstSchema,
      default: () => ({}),
    },

    payment: {
      type: paymentSchema,
      default: () => ({}),
    },

    business: {
      type: businessSchema,
      default: () => ({}),
    },

    // =================================================
    // STOCK
    // =================================================

    stockOperationId: {
      type: String,
      trim: true,
      default: "",
    },

    stockRestored: {
      type: Boolean,
      default: false,
    },

    stockRestoredAt: {
      type: Date,
      default: null,
    },

    // =================================================
    // INVOICE
    // =================================================

    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    invoiceGeneratedAt: {
      type: Date,
      default: null,
    },

    // =================================================
    // EMAIL
    // =================================================

    email: {
      status: {
        type: String,
        default: "pending",
      },

      sentAt: {
        type: Date,
        default: null,
      },

      error: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // =================================================
    // WHATSAPP
    // =================================================

    whatsapp: {
      status: {
        type: String,
        default: "pending",
      },

      sentAt: {
        type: Date,
        default: null,
      },

      error: {
        type: String,
        trim: true,
        default: "",
      },
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// PRE VALIDATE
// =====================================================

orderSchema.pre(
  "validate",
  function () {
    if (Array.isArray(this.items)) {
      this.totalItems =
        this.items.reduce(
          (total, item) =>
            total +
            Number(
              item.quantity || 0
            ),
          0
        );
    }

    if (!this.gst) {
      this.gst = {};
    }

    if (!this.payment) {
      this.payment = {};
    }

    if (
      this.payment.method ===
      "cod"
    ) {
      this.payment.status =
        "pending";
    }

    if (
      this.payment.transactionId
    ) {
      this.payment.transactionId =
        String(
          this.payment.transactionId
        )
          .trim()
          .replace(/\s+/g, "")
          .toUpperCase();
    }
  }
);

// =====================================================
// INDEXES
// =====================================================

orderSchema.index({
  "customer.mobile": 1,
});

orderSchema.index({
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

orderSchema.index({
  "payment.method": 1,
  "payment.status": 1,
});

orderSchema.index({
  "payment.status": 1,
});

orderSchema.index({
  "payment.transactionId": 1,
});

orderSchema.index({
  "shipping.pincode": 1,
});

orderSchema.index({
  "customer.state": 1,
});

orderSchema.index({
  stockOperationId: 1,
});

// =====================================================
// MODEL
// =====================================================

const Order =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    orderSchema
  );

module.exports = Order;