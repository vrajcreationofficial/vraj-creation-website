const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("@exortek/express-mongo-sanitize");
const hpp = require("hpp");
const path = require("path");

require("dotenv").config();

console.log(
  "DASHBOARD_BACKEND_URL:",
  process.env.DASHBOARD_BACKEND_URL ||
    "NOT SET"
);

console.log(
  "INTERNAL_STOCK_SECRET:",
  process.env.INTERNAL_STOCK_SECRET
    ? "LOADED"
    : "MISSING"
);

console.log(
  "ADMIN_JWT_SECRET:",
  process.env.ADMIN_JWT_SECRET
    ? "LOADED"
    : "MISSING"
);

console.log(
  "PORT:",
  process.env.PORT || "5000"
);

const connectDB =
  require("./config/db");

const {
  verifyEmailConnection,
} = require("./services/emailService");

const couponRoutes =
  require("./routes/couponRoutes");

const orderRoutes =
  require("./routes/orderRoutes");

const spinCampaignRoutes =
  require("./routes/spinCampaignRoutes");

const adminAuthRoutes =
  require("./routes/adminAuthRoutes");

const shippingRoutes =
  require("./routes/shippingRoutes");

const productRoutes =
  require("./routes/productRoutes");

const internalStockRoutes =
  require("./routes/internalStockRoutes");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,

  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      console.log(
        "Blocked CORS origin:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-internal-stock-secret",
    ],
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb",
  })
);

app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

app.use(hpp());

app.use(
  (req, res, next) => {
    console.log(
      `REQUEST: ${req.method} ${req.originalUrl}`
    );

    next();
  }
);

const generalLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 1000,

    standardHeaders: true,

    legacyHeaders: false,

    skip: (req) => {
      return (
        req.method === "GET" &&
        req.path ===
          "/products/public"
      );
    },

    message: {
      success: false,
      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api",
  generalLimiter
);

const adminLoginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many login attempts. Please try again later.",
    },
  });

app.use(
  "/api/admin/login",
  adminLoginLimiter
);

const adminRegisterLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many registration attempts. Please try again later.",
    },
  });

app.use(
  "/api/admin/register",
  adminRegisterLimiter
);

connectDB();

app.get("/", (req, res) => {
  res.json({
    success: true,

    message:
      "Vraj Creation Store Backend is running!",

    database: "MongoDB",

    adminAuth: {
      register:
        "/api/admin/register",

      login:
        "/api/admin/login",

      verify:
        "/api/admin/verify",

      logout:
        "/api/admin/logout",
    },
  });
});

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "Vraj Creation Store API is healthy",

      timestamp:
        new Date().toISOString(),
    });
  }
);

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

app.use(
  "/api/coupons",
  couponRoutes
);

console.log(
  "Loading internal stock routes..."
);

app.use(
  "/api/internal/stock",
  internalStockRoutes
);

console.log(
  "Internal stock routes loaded at /api/internal/stock"
);

app.use(
  "/api/orders",
  orderRoutes
);

console.log(
  "Order routes loaded at /api/orders"
);

app.use(
  "/api/campaign/spin",
  spinCampaignRoutes
);

app.use(
  "/api/admin",
  adminAuthRoutes
);

app.use(
  "/api/shipping",
  shippingRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.post(
  "/api/orders-test",
  (req, res) => {
    console.log(
      "ORDER TEST ROUTE HIT"
    );

    res.json({
      success: true,

      message:
        "Order test route is working",
    });
  }
);

app.use(
  (req, res) => {
    console.log(
      "404 NOT FOUND:",
      req.method,
      req.originalUrl
    );

    res.status(404).json({
      success: false,

      message:
        "API endpoint not found",

      method: req.method,

      path: req.originalUrl,
    });
  }
);

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      err
    );

    if (
      err.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        success: false,

        message:
          "CORS origin not allowed",
      });
    }

    if (
      err instanceof SyntaxError &&
      err.status === 400 &&
      err.type ===
        "entity.parse.failed"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid JSON request",
      });
    }

    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Image size maximum 5MB honi chahiye.",
      });
    }

    if (
      err.message &&
      err.message.includes(
        "Only JPG"
      )
    ) {
      return res.status(400).json({
        success: false,

        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,

      message:
        err.message ||
        "Internal server error",
    });
  }
);

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  async () => {
    console.log("");

    console.log(
      "===================================="
    );

    console.log(
      "Vraj Creation Store Backend"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      `API: http://localhost:${PORT}/api`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Orders: http://localhost:${PORT}/api/orders`
    );

    console.log(
      `Internal Stock: http://localhost:${PORT}/api/internal/stock`
    );

    console.log(
      `Internal Stock Decrease: http://localhost:${PORT}/api/internal/stock/decrease`
    );

    console.log(
      `Internal Stock Increase: http://localhost:${PORT}/api/internal/stock/increase`
    );

    console.log(
      `Admin Auth: http://localhost:${PORT}/api/admin`
    );

    console.log(
      `Product Images: http://localhost:${PORT}/uploads/products/`
    );

    console.log(
      "===================================="
    );

    try {
      await verifyEmailConnection();

      console.log(
        "Email service verified successfully"
      );
    } catch (error) {
      console.error(
        "Email service verification failed:",
        error.message
      );
    }
  }
);