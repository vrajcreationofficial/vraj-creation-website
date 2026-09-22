const mongoose = require("mongoose");

const fail = (
  res,
  message,
  field = null,
  status = 400
) => {
  return res.status(status).json({
    success: false,
    message,
    ...(field ? { field } : {}),
  });
};

const clean = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const numberValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return NaN;
  }

  const valueString =
    String(value).trim();

  if (!valueString) {
    return NaN;
  }

  const number =
    Number(valueString);

  return Number.isFinite(number)
    ? number
    : NaN;
};

const integerValue = (value) => {
  const number =
    numberValue(value);

  return Number.isInteger(number)
    ? number
    : NaN;
};

const validateDate = (
  value,
  field,
  label,
  res
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    fail(
      res,
      `${label} must be a valid date.`,
      field
    );

    return null;
  }

  return date;
};

const validateProductRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const isUpdate =
    Boolean(req.params?.id);

  if (
    isUpdate &&
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      "Invalid product ID.",
      "id"
    );
  }

  if (
    !isUpdate ||
    body.name !== undefined
  ) {
    const name =
      clean(body.name);

    if (!name) {
      return fail(
        res,
        "Product name is required.",
        "name"
      );
    }

    if (
      name.length > 150
    ) {
      return fail(
        res,
        "Product name cannot exceed 150 characters.",
        "name"
      );
    }
  }

  if (
    !isUpdate ||
    body.sku !== undefined
  ) {
    const sku =
      clean(body.sku)
        .toUpperCase();

    if (!sku) {
      return fail(
        res,
        "SKU is required.",
        "sku"
      );
    }

    if (
      sku.length > 80
    ) {
      return fail(
        res,
        "SKU cannot exceed 80 characters.",
        "sku"
      );
    }

    if (
      !/^[A-Z0-9][A-Z0-9._/-]*$/.test(
        sku
      )
    ) {
      return fail(
        res,
        "SKU contains invalid characters.",
        "sku"
      );
    }
  }

  if (
    body.hsnCode !== undefined
  ) {
    const hsn =
      clean(body.hsnCode);

    if (
      hsn &&
      !/^(?:\d{4}|\d{6}|\d{8})$/.test(
        hsn
      )
    ) {
      return fail(
        res,
        "HSN Code must contain 4, 6 or 8 digits.",
        "hsnCode"
      );
    }
  }

  if (
    !isUpdate ||
    body.category !== undefined
  ) {
    const category =
      clean(body.category);

    if (!category) {
      return fail(
        res,
        "Category is required.",
        "category"
      );
    }

    if (
      category.length > 100
    ) {
      return fail(
        res,
        "Category cannot exceed 100 characters.",
        "category"
      );
    }
  }

  if (
    body.subcategory !== undefined &&
    clean(body.subcategory).length > 100
  ) {
    return fail(
      res,
      "Subcategory cannot exceed 100 characters.",
      "subcategory"
    );
  }

  if (
    body.description !== undefined &&
    clean(body.description).length > 5000
  ) {
    return fail(
      res,
      "Description cannot exceed 5000 characters.",
      "description"
    );
  }

  if (
    body.size !== undefined &&
    clean(body.size).length > 100
  ) {
    return fail(
      res,
      "Size cannot exceed 100 characters.",
      "size"
    );
  }

  const numericFields = [
    [
      "sellingPrice",
      "Selling price",
    ],
    [
      "stock",
      "Stock",
    ],
    [
      "minimumStock",
      "Minimum stock",
    ],
  ];

  for (
    const [field, label]
    of numericFields
  ) {
    if (
      !isUpdate ||
      body[field] !== undefined
    ) {
      const isStockField =
        field === "stock" ||
        field === "minimumStock";

      const value =
        isStockField
          ? integerValue(
              body[field]
            )
          : numberValue(
              body[field]
            );

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return fail(
          res,
          `${label} must be a valid non-negative ${
            isStockField
              ? "integer"
              : "number"
          }.`,
          field
        );
      }

      if (
        isStockField &&
        value > 100000000
      ) {
        return fail(
          res,
          `${label} is too large.`,
          field
        );
      }
    }
  }

  if (
    body.status !== undefined &&
    ![
      "active",
      "inactive",
    ].includes(
      clean(
        body.status
      ).toLowerCase()
    )
  ) {
    return fail(
      res,
      "Status must be active or inactive.",
      "status"
    );
  }

  return next();
};

const validateCouponRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const isUpdate =
    Boolean(req.params?.id);

  if (
    isUpdate &&
    !mongoose.isValidObjectId(
      req.params.id
    )
  ) {
    return fail(
      res,
      "Invalid coupon ID.",
      "id"
    );
  }

  if (
    !isUpdate ||
    body.code !== undefined
  ) {
    const code =
      clean(body.code)
        .toUpperCase();

    if (!code) {
      return fail(
        res,
        "Coupon code is required.",
        "code"
      );
    }

    if (
      code.length > 100
    ) {
      return fail(
        res,
        "Coupon code cannot exceed 100 characters.",
        "code"
      );
    }

    if (
      !/^[A-Z0-9][A-Z0-9._-]*$/.test(
        code
      )
    ) {
      return fail(
        res,
        "Coupon code contains invalid characters.",
        "code"
      );
    }
  }

  if (
    !isUpdate ||
    body.discount !== undefined
  ) {
    const discount =
      numberValue(
        body.discount
      );

    if (
      !Number.isFinite(
        discount
      ) ||
      discount < 0 ||
      discount > 100
    ) {
      return fail(
        res,
        "Discount must be between 0 and 100.",
        "discount"
      );
    }
  }

  if (
    body.wheelValue !== undefined
  ) {
    const wheelValue =
      numberValue(
        body.wheelValue
      );

    if (
      !Number.isFinite(
        wheelValue
      ) ||
      ![3, 5, 7, 10].includes(
        wheelValue
      )
    ) {
      return fail(
        res,
        "Wheel value must be 3, 5, 7 or 10.",
        "wheelValue"
      );
    }
  }

  if (
    body.name !== undefined &&
    clean(body.name).length > 150
  ) {
    return fail(
      res,
      "Coupon name cannot exceed 150 characters.",
      "name"
    );
  }

  if (
    body.description !== undefined &&
    clean(body.description).length > 2000
  ) {
    return fail(
      res,
      "Coupon description cannot exceed 2000 characters.",
      "description"
    );
  }

  if (
    body.discountScope !== undefined
  ) {
    const scope =
      clean(
        body.discountScope
      ).toLowerCase();

    if (
      ![
        "all",
        "category",
      ].includes(scope)
    ) {
      return fail(
        res,
        "Discount scope must be all or category.",
        "discountScope"
      );
    }

    if (
      scope === "category" &&
      !clean(body.category)
    ) {
      return fail(
        res,
        "Category is required for category discount.",
        "category"
      );
    }
  }

  if (
    body.category !== undefined &&
    clean(body.category).length > 100
  ) {
    return fail(
      res,
      "Category cannot exceed 100 characters.",
      "category"
    );
  }

  if (
    body.minOrderAmount !== undefined
  ) {
    const value =
      numberValue(
        body.minOrderAmount
      );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return fail(
        res,
        "Minimum order amount must be a valid non-negative number.",
        "minOrderAmount"
      );
    }
  }

  if (
    body.maxDiscount !== undefined &&
    body.maxDiscount !== "" &&
    body.maxDiscount !== null
  ) {
    const value =
      numberValue(
        body.maxDiscount
      );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return fail(
        res,
        "Maximum discount must be a valid non-negative number.",
        "maxDiscount"
      );
    }
  }

  if (
    body.maxUses !== undefined
  ) {
    const value =
      integerValue(
        body.maxUses
      );

    if (
      !Number.isInteger(value) ||
      value < 1
    ) {
      return fail(
        res,
        "Max uses must be at least 1.",
        "maxUses"
      );
    }
  }

  let startDate = null;
  let expiryDate = null;

  if (
    body.startDate !== undefined
  ) {
    startDate =
      validateDate(
        body.startDate,
        "startDate",
        "Start date",
        res
      );

    if (!startDate) {
      return;
    }
  }

  if (
    body.expiryDate !== undefined
  ) {
    expiryDate =
      validateDate(
        body.expiryDate,
        "expiryDate",
        "Expiry date",
        res
      );

    if (!expiryDate) {
      return;
    }
  }

  if (
    !isUpdate &&
    !startDate
  ) {
    return fail(
      res,
      "Start date is required.",
      "startDate"
    );
  }

  if (
    !isUpdate &&
    !expiryDate
  ) {
    return fail(
      res,
      "Expiry date is required.",
      "expiryDate"
    );
  }

  if (
    startDate &&
    expiryDate &&
    startDate >= expiryDate
  ) {
    return fail(
      res,
      "Expiry date/time must be after start date/time.",
      "expiryDate"
    );
  }

  if (
    body.active !== undefined
  ) {
    const activeValue =
      String(
        body.active
      ).toLowerCase();

    if (
      body.active !== true &&
      body.active !== false &&
      ![
        "true",
        "false",
        "1",
        "0",
      ].includes(
        activeValue
      )
    ) {
      return fail(
        res,
        "Active must be true or false.",
        "active"
      );
    }
  }

  return next();
};

const validateCouponPublicRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const code =
    clean(body.code)
      .toUpperCase();

  if (!code) {
    return fail(
      res,
      "Coupon code is required.",
      "code"
    );
  }

  if (
    code.length > 100
  ) {
    return fail(
      res,
      "Coupon code cannot exceed 100 characters.",
      "code"
    );
  }

  if (
    body.mobile !== undefined &&
    clean(body.mobile)
  ) {
    const mobile =
      clean(body.mobile)
        .replace(/\D/g, "")
        .slice(-10);

    if (
      !/^[6-9]\d{9}$/.test(
        mobile
      )
    ) {
      return fail(
        res,
        "Please enter a valid 10-digit mobile number.",
        "mobile"
      );
    }
  }

  if (
    body.category !== undefined &&
    clean(body.category).length > 100
  ) {
    return fail(
      res,
      "Category cannot exceed 100 characters.",
      "category"
    );
  }

  if (
    body.orderAmount !== undefined &&
    body.orderAmount !== null &&
    body.orderAmount !== ""
  ) {
    const amount =
      numberValue(
        body.orderAmount
      );

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return fail(
        res,
        "Order amount must be a valid non-negative number.",
        "orderAmount"
      );
    }
  }

  return next();
};

const validateSpinStart = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const name =
    clean(body.name);

  if (!name) {
    return fail(
      res,
      "Name is required.",
      "name"
    );
  }

  if (
    name.length > 150
  ) {
    return fail(
      res,
      "Name cannot exceed 150 characters.",
      "name"
    );
  }

  const mobile =
    clean(body.mobile)
      .replace(/\D/g, "")
      .slice(-10);

  if (
    !/^[6-9]\d{9}$/.test(
      mobile
    )
  ) {
    return fail(
      res,
      "Please enter a valid 10-digit mobile number.",
      "mobile"
    );
  }

  return next();
};

const validateSpinAction = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const sessionId =
    clean(body.sessionId);

  if (!sessionId) {
    return fail(
      res,
      "Session ID is required.",
      "sessionId"
    );
  }

  if (
    sessionId.length > 200
  ) {
    return fail(
      res,
      "Invalid session ID.",
      "sessionId"
    );
  }

  return next();
};

const validateSpinCampaignRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  if (
    body.name !== undefined
  ) {
    const name =
      clean(body.name);

    if (
      name.length > 150
    ) {
      return fail(
        res,
        "Campaign name cannot exceed 150 characters.",
        "name"
      );
    }
  }

  if (
    body.description !== undefined
  ) {
    const description =
      clean(body.description);

    if (
      description.length > 2000
    ) {
      return fail(
        res,
        "Campaign description cannot exceed 2000 characters.",
        "description"
      );
    }
  }

  if (
    body.rewards !== undefined
  ) {
    if (
      !Array.isArray(
        body.rewards
      )
    ) {
      return fail(
        res,
        "Rewards must be an array.",
        "rewards"
      );
    }

    if (
      body.rewards.length === 0
    ) {
      return fail(
        res,
        "At least one reward is required.",
        "rewards"
      );
    }

    for (
      const reward of body.rewards
    ) {
      const value =
        numberValue(
          reward
        );

      if (
        !Number.isFinite(value) ||
        ![3, 5, 7, 10].includes(
          value
        )
      ) {
        return fail(
          res,
          "Each reward must be 3, 5, 7 or 10.",
          "rewards"
        );
      }
    }
  }

  if (
    body.sessionMinutes !== undefined
  ) {
    const sessionMinutes =
      integerValue(
        body.sessionMinutes
      );

    if (
      !Number.isInteger(
        sessionMinutes
      ) ||
      sessionMinutes < 1 ||
      sessionMinutes > 1440
    ) {
      return fail(
        res,
        "Session duration must be between 1 and 1440 minutes.",
        "sessionMinutes"
      );
    }
  }

  let startDate = null;
  let endDate = null;

  if (
    body.startDate !== undefined
  ) {
    startDate =
      validateDate(
        body.startDate,
        "startDate",
        "Start date",
        res
      );

    if (!startDate) {
      return;
    }
  }

  if (
    body.endDate !== undefined
  ) {
    endDate =
      validateDate(
        body.endDate,
        "endDate",
        "End date",
        res
      );

    if (!endDate) {
      return;
    }
  }

  if (
    startDate &&
    endDate &&
    startDate >= endDate
  ) {
    return fail(
      res,
      "End date must be after start date.",
      "endDate"
    );
  }

  if (
    body.active !== undefined
  ) {
    const activeValue =
      String(
        body.active
      ).toLowerCase();

    if (
      body.active !== true &&
      body.active !== false &&
      ![
        "true",
        "false",
        "1",
        "0",
      ].includes(
        activeValue
      )
    ) {
      return fail(
        res,
        "Active must be true or false.",
        "active"
      );
    }
  }

  return next();
};

const validateShippingRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  const pincode =
    clean(body.pincode);

  if (
    !/^\d{6}$/.test(
      pincode
    )
  ) {
    return fail(
      res,
      "Please enter a valid 6-digit pincode.",
      "pincode"
    );
  }

  if (
    body.subtotal !== undefined &&
    body.subtotal !== null &&
    body.subtotal !== ""
  ) {
    const subtotal =
      numberValue(
        body.subtotal
      );

    if (
      !Number.isFinite(
        subtotal
      ) ||
      subtotal < 0
    ) {
      return fail(
        res,
        "Subtotal must be a valid non-negative number.",
        "subtotal"
      );
    }
  }

  return next();
};

const validateOrderRequest = (
  req,
  res,
  next
) => {
  const body =
    req.body || {};

  if (
    body.customer &&
    typeof body.customer ===
      "object"
  ) {
    const customer =
      body.customer;

    if (
      customer.email !== undefined &&
      clean(customer.email)
    ) {
      const email =
        clean(
          customer.email
        );

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return fail(
          res,
          "Invalid email address.",
          "customer.email"
        );
      }
    }

    if (
      customer.mobile !== undefined &&
      clean(customer.mobile)
    ) {
      const mobile =
        clean(
          customer.mobile
        )
          .replace(/\D/g, "")
          .slice(-10);

      if (
        !/^[6-9]\d{9}$/.test(
          mobile
        )
      ) {
        return fail(
          res,
          "Invalid mobile number.",
          "customer.mobile"
        );
      }
    }
  }

  return next();
};

module.exports = {
  validateProductRequest,
  validateCouponRequest,
  validateCouponPublicRequest,
  validateSpinStart,
  validateSpinAction,
  validateSpinCampaignRequest,
  validateShippingRequest,
  validateOrderRequest,
};