const express = require("express");

const {
  adminRegister,
  adminLogin,
  forgotAdminPassword,
  verifyAdminResetOtp,
  resetAdminPassword,
  verifyAdmin,
  adminLogout,
  getPendingAdmins,
  getAllAdmins,
  approveAdmin,
  rejectAdmin,
} = require("../controllers/adminAuthController");

const adminAuthModule =
  require("../middleware/adminAuth");

const adminAuth = adminAuthModule;

const requireSuperAdmin =
  adminAuthModule.requireSuperAdmin;

const router = express.Router();

router.post(
  "/register",
  adminRegister
);

router.post(
  "/login",
  adminLogin
);

router.post(
  "/forgot-password",
  forgotAdminPassword
);

router.post(
  "/verify-reset-otp",
  verifyAdminResetOtp
);

router.post(
  "/reset-password",
  resetAdminPassword
);

router.get(
  "/verify",
  adminAuth,
  verifyAdmin
);

router.post(
  "/logout",
  adminAuth,
  adminLogout
);

router.get(
  "/registrations",
  adminAuth,
  requireSuperAdmin,
  getPendingAdmins
);

router.get(
  "/registrations/all",
  adminAuth,
  requireSuperAdmin,
  getAllAdmins
);

router.put(
  "/registrations/:id/approve",
  adminAuth,
  requireSuperAdmin,
  approveAdmin
);

router.put(
  "/registrations/:id/reject",
  adminAuth,
  requireSuperAdmin,
  rejectAdmin
);

module.exports = router;