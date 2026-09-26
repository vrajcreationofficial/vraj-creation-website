const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");

const {
  sendViaGmail,
} = require("../services/emailService");

const Admin = require("../models/Admin");
const AdminPasswordReset = require("../models/AdminPasswordReset");

// =====================================================
// JWT CONFIG
// =====================================================

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

const JWT_EXPIRES_IN =
  process.env.ADMIN_TOKEN_EXPIRES || "12h";

const JWT_ISSUER = "vraj-creation-admin";
const JWT_AUDIENCE = "vraj-creation-dashboard";

// =====================================================
// PASSWORD RESET CONFIG
// =====================================================

const RESET_OTP_EXPIRES_MINUTES =
  Number(process.env.ADMIN_RESET_OTP_EXPIRES_MINUTES) || 10;

const MAX_OTP_ATTEMPTS =
  Number(process.env.ADMIN_RESET_MAX_OTP_ATTEMPTS) || 5;

// =====================================================
// RESEND EMAIL CONFIG
// =====================================================

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "onboarding@resend.dev";

// =====================================================
// JWT VALIDATION
// =====================================================

const validateJwtConfig = () => {
  if (!JWT_SECRET) {
    throw new Error(
      "ADMIN_JWT_SECRET is not configured in .env"
    );
  }

  if (JWT_SECRET.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET must be at least 32 characters long"
    );
  }
};

// =====================================================
// CREATE ADMIN TOKEN
// =====================================================

const createAdminToken = (admin) => {
  validateJwtConfig();

  return jwt.sign(
    {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      tokenVersion: admin.tokenVersion || 0,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    }
  );
};

// =====================================================
// GENERATE OTP
// =====================================================

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

// =====================================================
// HASH OTP
// =====================================================

const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// =====================================================
// ESCAPE HTML
// =====================================================

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// =====================================================
// SEND PASSWORD RESET OTP USING RESEND
// =====================================================

const sendPasswordResetOtp = async ({
  email,
  username,
  otp,
}) => {
  const cleanEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  const cleanUsername =
    escapeHtml(username || "Admin");

  if (!cleanEmail) {
    throw new Error(
      "Password reset recipient email is missing."
    );
  }

  const logoUrl =
    process.env.VRAJ_LOGO_URL || "";

  const logoHtml = logoUrl
    ? `
      <div style="text-align:center;margin-bottom:20px;">
        <img
          src="${escapeHtml(logoUrl)}"
          alt="Vraj Creation India"
          style="
            width:90px;
            height:90px;
            object-fit:contain;
            border-radius:16px;
            background:#ffffff;
            padding:8px;
            border:1px solid #e5e7eb;
          "
        />
      </div>
    `
    : "";

  const subject =
    "Vraj Creation Admin - Password Reset OTP";

  const text = `
Hello ${username || "Admin"},

We received a request to reset your Vraj Creation admin dashboard password.

Your OTP is:

${otp}

This OTP will expire in ${RESET_OTP_EXPIRES_MINUTES} minutes.

If you did not request a password reset, please ignore this email.

Regards,
Vraj Creation India
Bringing Art to Life
Admin Dashboard
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset OTP</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
  "
>

<div
  style="
    width:100%;
    padding:40px 15px;
    box-sizing:border-box;
  "
>

<div
  style="
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border-radius:18px;
    overflow:hidden;
    border:1px solid #e2e8f0;
    box-shadow:0 10px 30px rgba(15,23,42,0.08);
  "
>

<!-- HEADER -->

<div
  style="
    background:linear-gradient(135deg,#4f46e5,#7c3aed);
    padding:30px 20px;
    text-align:center;
    color:#ffffff;
  "
>

${logoHtml}

<h1
  style="
    margin:0;
    font-size:27px;
    font-weight:700;
  "
>
Vraj Creation India
</h1>

<p
  style="
    margin:8px 0 0;
    font-size:14px;
    opacity:0.95;
  "
>
Bringing Art to Life
</p>

</div>

<!-- CONTENT -->

<div style="padding:35px 30px;">

<h2
  style="
    margin:0 0 15px;
    color:#0f172a;
    font-size:23px;
  "
>
Password Reset Request
</h2>

<p
  style="
    margin:0 0 15px;
    color:#475569;
    font-size:15px;
    line-height:1.7;
  "
>
Hello ${cleanUsername},
</p>

<p
  style="
    margin:0 0 25px;
    color:#475569;
    font-size:15px;
    line-height:1.7;
  "
>
We received a request to reset your Vraj Creation admin dashboard password.
Use the OTP below to continue.
</p>

<!-- OTP -->

<div
  style="
    text-align:center;
    margin:30px 0;
  "
>

<div
  style="
    display:inline-block;
    padding:18px 30px;
    background:#eef2ff;
    border-radius:14px;
    border:1px solid #c7d2fe;
  "
>

<span
  style="
    font-size:32px;
    font-weight:700;
    letter-spacing:8px;
    color:#4338ca;
  "
>
${otp}
</span>

</div>

</div>

<p
  style="
    margin:0 0 20px;
    text-align:center;
    color:#64748b;
    font-size:14px;
  "
>
This OTP will expire in ${RESET_OTP_EXPIRES_MINUTES} minutes.
</p>

<!-- SECURITY NOTE -->

<div
  style="
    margin-top:25px;
    padding:15px;
    border-radius:12px;
    background:#f8fafc;
    border:1px solid #e2e8f0;
  "
>

<p
  style="
    margin:0;
    color:#64748b;
    font-size:13px;
    line-height:1.6;
  "
>
If you did not request a password reset, you can safely ignore this email.
Your password will not be changed unless the OTP is successfully verified.
</p>

</div>

</div>

<!-- FOOTER -->

<div
  style="
    padding:20px;
    text-align:center;
    background:#f8fafc;
    border-top:1px solid #e2e8f0;
  "
>

<p
  style="
    margin:0;
    color:#64748b;
    font-size:13px;
  "
>
Vraj Creation India
</p>

<p
  style="
    margin:5px 0 0;
    color:#94a3b8;
    font-size:12px;
  "
>
Bringing Art to Life
</p>

</div>

</div>

</div>

</body>
</html>
`;

  // ===================================================
  // SEND THROUGH RESEND API
  // ===================================================

 await sendViaGmail({
  to: cleanEmail,
  subject,
  html,
  text,
});
};

// =====================================================
// ADMIN REGISTER
// =====================================================

const adminRegister = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
    } = req.body;

    const cleanUsername =
      typeof username === "string"
        ? username.trim()
        : "";

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      !cleanUsername ||
      !cleanEmail ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username, email and password are required.",
      });
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be between 3 and 50 characters.",
      });
    }

    if (cleanUsername.includes(" ")) {
      return res.status(400).json({
        success: false,
        message:
          "Username should not contain spaces.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message:
          "Password is too long.",
      });
    }

    const existingAdmin =
      await Admin.findOne({
        $or: [
          {
            username: cleanUsername,
          },
          {
            email: cleanEmail,
          },
        ],
      });

    if (existingAdmin) {
      if (
        existingAdmin.username.toLowerCase() ===
        cleanUsername.toLowerCase()
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Username is already registered.",
        });
      }

      if (
        existingAdmin.email.toLowerCase() ===
        cleanEmail
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Email is already registered.",
        });
      }
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const admin =
      await Admin.create({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: "admin",
        status: "pending",
        tokenVersion: 0,
      });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account is pending superadmin approval.",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error(
      "Admin registration error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Username or email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete admin registration.",
    });
  }
};

// =====================================================
// ADMIN LOGIN
// =====================================================

const adminLogin = async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    const cleanUsername =
      typeof username === "string"
        ? username.trim()
        : "";

    if (
      !cleanUsername ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required.",
      });
    }

    const admin =
      await Admin.findOne({
        username: cleanUsername,
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });
    }

    if (admin.status === "pending") {
      return res.status(403).json({
        success: false,
        code: "ADMIN_PENDING",
        message:
          "Your admin registration is pending approval.",
      });
    }

    if (admin.status === "rejected") {
      return res.status(403).json({
        success: false,
        code: "ADMIN_REJECTED",
        message:
          "Your admin registration has been rejected.",
      });
    }

    if (admin.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your admin account is not approved.",
      });
    }

    if (
      !["admin", "superadmin"].includes(
        admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid admin role.",
      });
    }

    const token =
      createAdminToken(admin);

    return res.status(200).json({
      success: true,
      message:
        "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login.",
    });
  }
};

// =====================================================
// FORGOT ADMIN PASSWORD
// =====================================================

const forgotAdminPassword = async (
  req,
  res
) => {
  try {
    const cleanEmail =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    const genericResponse = {
      success: true,
      message:
        "If an approved admin account exists with this email, a password reset OTP has been sent.",
    };

    const admin =
      await Admin.findOne({
        email: cleanEmail,
      });

    if (!admin) {
      return res.status(200).json(
        genericResponse
      );
    }

    if (
      !["admin", "superadmin"].includes(
        admin.role
      )
    ) {
      return res.status(200).json(
        genericResponse
      );
    }

    if (
      admin.status !== "approved"
    ) {
      return res.status(200).json(
        genericResponse
      );
    }

    // Remove previous reset requests
    await AdminPasswordReset.deleteMany({
      adminId: admin._id,
    });

    // Generate OTP
    const otp =
      generateOtp();

    const otpHash =
      hashOtp(otp);

    const expiresAt =
      new Date(
        Date.now() +
          RESET_OTP_EXPIRES_MINUTES *
            60 *
            1000
      );

    // Save OTP
    await AdminPasswordReset.create({
      adminId: admin._id,
      email: cleanEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // =================================================
    // SEND OTP THROUGH RESEND
    // =================================================

    try {
    console.log(
  `[PASSWORD RESET] Sending OTP to ${cleanEmail} using Gmail SMTP...`
);
      await sendPasswordResetOtp({
        email: cleanEmail,
        username: admin.username,
        otp,
      });

      console.log(
        `[PASSWORD RESET] OTP email sent successfully to ${cleanEmail}`
      );
    } catch (emailError) {
      // Delete OTP if email failed
      await AdminPasswordReset.deleteMany({
        adminId: admin._id,
      });

      console.error(
        `[PASSWORD RESET] Email sending failed for ${cleanEmail}:`,
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later.",
      });
    }

    return res.status(200).json(
      genericResponse
    );
  } catch (error) {
    console.error(
      "Forgot admin password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request.",
    });
  }
};

// =====================================================
// VERIFY ADMIN RESET OTP
// =====================================================

const verifyAdminResetOtp = async (
  req,
  res
) => {
  try {
    const cleanEmail =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const cleanOtp =
      typeof req.body.otp === "string"
        ? req.body.otp.trim()
        : "";

    if (
      !cleanEmail ||
      !cleanOtp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be 6 digits.",
      });
    }

    const resetRequest =
      await AdminPasswordReset.findOne({
        email: cleanEmail,
        verified: false,
      }).sort({
        createdAt: -1,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP.",
      });
    }

    if (
      resetRequest.expiresAt.getTime() <
      Date.now()
    ) {
      await AdminPasswordReset.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      resetRequest.attempts >=
      MAX_OTP_ATTEMPTS
    ) {
      await AdminPasswordReset.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    const providedOtpHash =
      hashOtp(cleanOtp);

    if (
      providedOtpHash !==
      resetRequest.otpHash
    ) {
      resetRequest.attempts += 1;

      await resetRequest.save();

      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP.",
      });
    }

    resetRequest.verified = true;

    resetRequest.verifiedAt =
      new Date();

    await resetRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully.",
      resetId:
        resetRequest._id.toString(),
    });
  } catch (error) {
    console.error(
      "Verify reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP.",
    });
  }
};

// =====================================================
// RESET ADMIN PASSWORD
// =====================================================

const resetAdminPassword = async (
  req,
  res
) => {
  try {
    const {
      email,
      resetId,
      newPassword,
      confirmPassword,
    } = req.body;

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const cleanResetId =
      typeof resetId === "string"
        ? resetId.trim()
        : "";

    if (
      !cleanEmail ||
      !cleanResetId ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, reset ID, new password and confirm password are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        cleanResetId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset request.",
      });
    }

    if (
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (
      newPassword.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password is too long.",
      });
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    const resetRequest =
      await AdminPasswordReset.findOne({
        _id: cleanResetId,
        email: cleanEmail,
        verified: true,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    if (
      resetRequest.expiresAt.getTime() <
      Date.now()
    ) {
      await AdminPasswordReset.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Password reset request has expired. Please request a new OTP.",
      });
    }

    const admin =
      await Admin.findById(
        resetRequest.adminId
      );

    if (!admin) {
      await AdminPasswordReset.deleteOne({
        _id: resetRequest._id,
      });

      return res.status(404).json({
        success: false,
        message:
          "Admin account not found.",
      });
    }

    if (
      admin.email.toLowerCase() !==
      cleanEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset request.",
      });
    }

    if (
      !["admin", "superadmin"].includes(
        admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid admin account.",
      });
    }

    if (
      admin.status !== "approved"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your admin account is not approved.",
      });
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    admin.passwordHash =
      newPasswordHash;

    // Invalidate old JWT tokens
    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    // Delete all reset requests
    await AdminPasswordReset.deleteMany({
      adminId: admin._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset admin password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password.",
    });
  }
};

// =====================================================
// VERIFY ADMIN
// =====================================================

const verifyAdmin = async (
  req,
  res
) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: req.admin.id,
        username: req.admin.username,
        email: req.admin.email,
        role: req.admin.role,
        status: req.admin.status,
      },
    });
  } catch (error) {
    console.error(
      "Admin verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify admin.",
    });
  }
};

// =====================================================
// ADMIN LOGOUT
// =====================================================

const adminLogout = async (
  req,
  res
) => {
  try {
    if (!req.admin?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.admin.id
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin account.",
      });
    }

    const admin =
      await Admin.findById(
        req.admin.id
      );

    if (admin) {
      admin.tokenVersion =
        (admin.tokenVersion || 0) + 1;

      await admin.save();
    }

    return res.status(200).json({
      success: true,
      message:
        "Admin logged out successfully.",
    });
  } catch (error) {
    console.error(
      "Admin logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to logout.",
    });
  }
};

// =====================================================
// GET PENDING ADMINS
// =====================================================

const getPendingAdmins = async (
  req,
  res
) => {
  try {
    const admins =
      await Admin.find({
        role: "admin",
        status: "pending",
      })
        .select(
          "_id username email role status createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error(
      "Get pending admins error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch pending admin registrations.",
    });
  }
};

// =====================================================
// GET ALL ADMINS
// =====================================================

const getAllAdmins = async (
  req,
  res
) => {
  try {
    const admins =
      await Admin.find({
        role: "admin",
      })
        .select(
          "_id username email role status approvedAt approvedBy rejectedAt rejectedBy createdAt updatedAt"
        )
        .populate(
          "approvedBy",
          "username email"
        )
        .populate(
          "rejectedBy",
          "username email"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error(
      "Get all admins error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch admin registrations.",
    });
  }
};

// =====================================================
// APPROVE ADMIN
// =====================================================

const approveAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid admin ID.",
      });
    }

    if (
      req.admin.id === id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot approve your own account.",
      });
    }

    const admin =
      await Admin.findOne({
        _id: id,
        role: "admin",
      });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "Admin registration not found.",
      });
    }

    if (
      admin.status === "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Admin is already approved.",
      });
    }

    admin.status = "approved";
    admin.approvedAt = new Date();
    admin.approvedBy = req.admin.id;
    admin.rejectedAt = null;
    admin.rejectedBy = null;

    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    return res.status(200).json({
      success: true,
      message:
        "Admin approved successfully.",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        approvedAt: admin.approvedAt,
      },
    });
  } catch (error) {
    console.error(
      "Approve admin error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to approve admin.",
    });
  }
};

// =====================================================
// REJECT ADMIN
// =====================================================

const rejectAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid admin ID.",
      });
    }

    if (
      req.admin.id === id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot reject your own account.",
      });
    }

    const admin =
      await Admin.findOne({
        _id: id,
        role: "admin",
      });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "Admin registration not found.",
      });
    }

    if (
      admin.status === "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Admin is already rejected.",
      });
    }

    admin.status = "rejected";
    admin.rejectedAt = new Date();
    admin.rejectedBy = req.admin.id;
    admin.approvedAt = null;
    admin.approvedBy = null;

    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    return res.status(200).json({
      success: true,
      message:
        "Admin rejected successfully.",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        rejectedAt: admin.rejectedAt,
      },
    });
  } catch (error) {
    console.error(
      "Reject admin error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reject admin.",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
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
};