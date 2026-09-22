const express = require("express");

const {
  createCoupon,
  getCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  startSpinSession,
  spinCoupon,
  validateCoupon,
  useCoupon,
} = require("../controllers/couponController");

const adminAuth = require("../middleware/adminAuth");
const {
  validateCouponRequest,
  validateCouponPublicRequest,
  validateSpinStart,
  validateSpinAction,
} = require("../middleware/serverValidation");

const router = express.Router();

router.post("/", adminAuth, validateCouponRequest, createCoupon);
router.get("/", adminAuth, getCoupons);
router.get("/code/:code", adminAuth, getCouponByCode);
router.get("/:id", adminAuth, getCouponById);
router.put("/:id", adminAuth, validateCouponRequest, updateCoupon);
router.delete("/:id", adminAuth, deleteCoupon);

router.post("/spin/start", validateSpinStart, startSpinSession);
router.post("/spin", validateSpinAction, spinCoupon);

router.post("/validate", validateCouponPublicRequest, validateCoupon);
router.post("/use", validateCouponPublicRequest, useCoupon);

module.exports = router;
