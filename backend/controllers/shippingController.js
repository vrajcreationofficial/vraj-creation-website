// ============================================================
// VRAJ CREATION - SHIPPING CONTROLLER
// ============================================================

const {
  calculateShipping,
} = require("../services/shippingService");

// ============================================================
// CALCULATE SHIPPING
// POST /api/shipping/calculate
// ============================================================

const calculateShippingController = (req, res) => {
  try {
    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    // ========================================================
    // PINCODE
    // ========================================================

    const pincode =
      body.pincode ?? "";

    // ========================================================
    // SUBTOTAL
    //
    // Frontend may send:
    // subtotal
    // sellingSubtotal
    //
    // Support both.
    // ========================================================

    const subtotal = Number(
      body.subtotal ??
        body.sellingSubtotal ??
        0
    );

    // ========================================================
    // ITEMS
    // ========================================================

    const items = Array.isArray(
      body.items
    )
      ? body.items
      : [];

    // ========================================================
    // DEBUG LOG
    // ========================================================

    console.log(
      "=========================================="
    );

    console.log(
      "SHIPPING CALCULATION REQUEST"
    );

    console.log(
      "Pincode:",
      pincode
    );

    console.log(
      "Subtotal:",
      subtotal
    );

    console.log(
      "Items count:",
      items.length
    );

    console.log(
      "Items:",
      items.map((item) => ({
        sku:
          item?.sku ||
          "",

        name:
          item?.name ||
          "",

        quantity:
          item?.quantity ??
          1,

        category:
          item?.category ||
          "",

        subcategory:
          item?.subcategory ||
          "",

        weightGrams:
          item?.weightGrams ??
          0,
      }))
    );

    console.log(
      "=========================================="
    );

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message:
          "Pincode is required.",
      });
    }

    // ========================================================
    // ITEMS VALIDATION
    // ========================================================

    if (items.length === 0) {
      return res.status(400).json({
        success: false,

        message:
          "Cart items are required for shipping calculation.",

        debug: {
          pincode,
          subtotal,
          itemsCount: 0,
        },
      });
    }

    // ========================================================
    // SHIPPING CALCULATION
    // ========================================================

    const result =
      calculateShipping({
        pincode,
        subtotal,
        items,
      });

    // ========================================================
    // SHIPPING SERVICE ERROR
    // ========================================================

    if (
      !result ||
      result.success !== true
    ) {
      return res.status(400).json(
        result || {
          success: false,
          message:
            "Unable to calculate shipping.",
        }
      );
    }

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      shipping: {
        // ----------------------------------------------------
        // Main shipping amount
        // ----------------------------------------------------

        charge:
          Number(
            result.charge ?? 0
          ),

        // ----------------------------------------------------
        // Free shipping
        // ----------------------------------------------------

        isFree:
          Boolean(
            result.isFree
          ),

        // ----------------------------------------------------
        // Weight information
        // ----------------------------------------------------

        weightGrams:
          Number(
            result.weightGrams ?? 0
          ),

        actualWeightGrams:
          Number(
            result.actualWeightGrams ?? 0
          ),

        volumetricWeightGrams:
          Number(
            result.volumetricWeightGrams ?? 0
          ),

        billableWeightGrams:
          Number(
            result.billableWeightGrams ?? 0
          ),

        // ----------------------------------------------------
        // Package volume
        // ----------------------------------------------------

        totalVolumeCm3:
          Number(
            result.totalVolumeCm3 ?? 0
          ),

        // ----------------------------------------------------
        // Zone
        // ----------------------------------------------------

        zone:
          result.zone ??
          null,

        // ----------------------------------------------------
        // Charges
        // ----------------------------------------------------

        weightCharge:
          Number(
            result.weightCharge ?? 0
          ),

        sizeCharge:
          Number(
            result.sizeCharge ?? 0
          ),

        zoneCharge:
          Number(
            result.zoneCharge ?? 0
          ),

        // ----------------------------------------------------
        // Shipping mode
        // ----------------------------------------------------

        shippingMode:
          result.shippingMode ??
          null,

        // ----------------------------------------------------
        // Approximate flag
        // ----------------------------------------------------

        isApproximate:
          Boolean(
            result.isApproximate
          ),

        // ----------------------------------------------------
        // Message
        // ----------------------------------------------------

        message:
          result.message ||
          "Shipping calculated successfully.",
      },

      // ======================================================
      // SUBTOTAL
      // ======================================================

      subtotal:
        Number(
          result.subtotal ??
            subtotal ??
            0
        ),

      // ======================================================
      // FREE SHIPPING THRESHOLD
      // ======================================================

      freeShippingThreshold:
        999,
    });
  } catch (error) {
    // ========================================================
    // ERROR
    // ========================================================

    console.error(
      "=========================================="
    );

    console.error(
      "SHIPPING CALCULATION ERROR"
    );

    console.error(
      error
    );

    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to calculate shipping.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error?.message
          : undefined,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  calculateShippingController,
};