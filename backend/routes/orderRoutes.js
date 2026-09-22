const express = require("express");

const router = express.Router();

const orderController = require("../controllers/orderController");

const {
  validateOrderRequest,
} = require("../middleware/serverValidation");

const adminAuth = require("../middleware/adminAuth");

// =====================================================
// CUSTOMER - CREATE ORDER
// PUBLIC ROUTE
// =====================================================

router.post(
  "/",
  validateOrderRequest,
  (req, res, next) => {
    console.log("🔥 POST /api/orders ROUTE HIT");

    return orderController.createOrder(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - GET ALL ORDERS
// PROTECTED
// =====================================================

router.get(
  "/",
  adminAuth,
  (req, res, next) => {
    console.log(
      "📦 GET /api/orders ROUTE HIT"
    );

    return orderController.getAllOrders(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - GET SINGLE ORDER
// PROTECTED
// =====================================================

router.get(
  "/:id",
  adminAuth,
  (req, res, next) => {
    console.log(
      "🔎 GET ORDER BY ID:",
      req.params.id
    );

    return orderController.getOrderById(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - UPDATE ORDER STATUS
// PROTECTED
// =====================================================

router.patch(
  "/:id/status",
  adminAuth,
  (req, res, next) => {
    console.log(
      "🔄 UPDATE ORDER STATUS:",
      req.params.id
    );

    return orderController.updateOrderStatus(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - VERIFY UPI PAYMENT
// PROTECTED
// =====================================================

router.patch(
  "/:id/payment/verify",
  adminAuth,
  (req, res, next) => {
    console.log(
      "💰 VERIFY UPI PAYMENT:",
      req.params.id,
      "by:",
      req.admin?.username
    );

    return orderController.verifyUPIPayment(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - REJECT UPI PAYMENT
// PROTECTED
// =====================================================

router.patch(
  "/:id/payment/reject",
  adminAuth,
  (req, res, next) => {
    console.log(
      "❌ REJECT UPI PAYMENT:",
      req.params.id,
      "by:",
      req.admin?.username
    );

    return orderController.rejectUPIPayment(
      req,
      res,
      next
    );
  }
);

// =====================================================
// ADMIN - GST INVOICE PDF
// PROTECTED
// =====================================================

router.get(
  "/:id/invoice",
  adminAuth,
  (req, res, next) => {
    console.log(
      "🧾 GET INVOICE:",
      req.params.id,
      "by:",
      req.admin?.username
    );

    return orderController.getInvoicePDF(
      req,
      res,
      next
    );
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;