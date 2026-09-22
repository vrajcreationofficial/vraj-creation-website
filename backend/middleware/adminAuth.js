const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Admin = require("../models/Admin");

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET;

const JWT_ISSUER =
  "vraj-creation-admin";

const JWT_AUDIENCE =
  "vraj-creation-dashboard";

// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================

const adminAuth = async (
  req,
  res,
  next
) => {
  try {
    if (!JWT_SECRET) {
      console.error(
        "ADMIN_JWT_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin authentication is not configured.",
      });
    }

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is required.",
      });
    }

    const token =
      authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        JWT_SECRET,
        {
          algorithms: ["HS256"],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        }
      );
    } catch (error) {
      if (
        error.name ===
        "TokenExpiredError"
      ) {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message:
            "Your session has expired. Please login again.",
        });
      }

      if (
        error.name ===
        "JsonWebTokenError"
      ) {
        return res.status(401).json({
          success: false,
          code: "INVALID_TOKEN",
          message:
            "Invalid authentication token.",
        });
      }

      return res.status(401).json({
        success: false,
        code: "TOKEN_VERIFICATION_FAILED",
        message:
          "Authentication failed.",
      });
    }

    if (
      !decoded ||
      !decoded.id
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        decoded.id
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin account.",
      });
    }

    // =====================================================
    // FIND ADMIN IN DATABASE
    // =====================================================

    const admin =
      await Admin.findById(
        decoded.id
      ).select(
        "_id username email role status tokenVersion"
      );

    if (!admin) {
      return res.status(401).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message:
          "Admin account no longer exists.",
      });
    }

    // =====================================================
    // ROLE CHECK
    // =====================================================

    if (
      !["admin", "superadmin"].includes(
        admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        code: "INVALID_ROLE",
        message:
          "You are not authorized to access this dashboard.",
      });
    }

    // =====================================================
    // STATUS CHECK
    // =====================================================

    if (
      admin.status === "pending"
    ) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_PENDING",
        message:
          "Your admin account is pending approval.",
      });
    }

    if (
      admin.status === "rejected"
    ) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_REJECTED",
        message:
          "Your admin account has been rejected.",
      });
    }

    if (
      admin.status !== "approved"
    ) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_NOT_APPROVED",
        message:
          "Your admin account is not approved.",
      });
    }

    // =====================================================
    // USERNAME CHECK
    // =====================================================

    if (
      decoded.username !==
      admin.username
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_ACCOUNT_MISMATCH",
        message:
          "Authentication token does not match the admin account.",
      });
    }

    // =====================================================
    // TOKEN VERSION CHECK
    // =====================================================

    const currentTokenVersion =
      Number(
        admin.tokenVersion || 0
      );

    const tokenVersion =
      Number(
        decoded.tokenVersion
      );

    if (
      tokenVersion !==
      currentTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_REVOKED",
        message:
          "Your session is no longer valid. Please login again.",
      });
    }

    // =====================================================
    // ATTACH ADMIN TO REQUEST
    // =====================================================

    req.admin = {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      tokenVersion:
        currentTokenVersion,
    };

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication service error.",
    });
  }
};

// =====================================================
// SUPERADMIN AUTHORIZATION
// =====================================================

const requireSuperAdmin = (
  req,
  res,
  next
) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  if (
    req.admin.role !==
    "superadmin"
  ) {
    return res.status(403).json({
      success: false,
      code: "SUPERADMIN_REQUIRED",
      message:
        "Only superadmin can perform this action.",
    });
  }

  next();
};

// =====================================================
// EXPORT
// =====================================================

module.exports = adminAuth;

module.exports.requireSuperAdmin =
  requireSuperAdmin;