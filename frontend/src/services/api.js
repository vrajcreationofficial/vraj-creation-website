import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const ADMIN_TOKEN_KEY = "vraj_admin_token";
export const ADMIN_DATA_KEY = "vraj_admin_data";

/* =====================================================
   ADMIN SESSION
===================================================== */

export const getAdminToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error("Get admin token error:", error);
    return null;
  }
};

export const saveAdminSession = (
  token,
  admin = null
) => {
  try {
    if (token) {
      localStorage.setItem(
        ADMIN_TOKEN_KEY,
        token
      );
    }

    if (admin) {
      localStorage.setItem(
        ADMIN_DATA_KEY,
        JSON.stringify(admin)
      );
    }
  } catch (error) {
    console.error(
      "Save admin session error:",
      error
    );
  }
};

export const clearAdminSession = () => {
  try {
    localStorage.removeItem(
      ADMIN_TOKEN_KEY
    );

    localStorage.removeItem(
      ADMIN_DATA_KEY
    );

    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "admin"
    );
  } catch (error) {
    console.error(
      "Clear admin session error:",
      error
    );
  }
};

export const getAdminData = () => {
  try {
    const data =
      localStorage.getItem(
        ADMIN_DATA_KEY
      );

    return data
      ? JSON.parse(data)
      : null;
  } catch (error) {
    console.error(
      "Admin data parse error:",
      error
    );

    return null;
  }
};

/* =====================================================
   REQUEST HELPERS
===================================================== */

const getRequestPath = (config = {}) => {
  return String(
    config?.url || ""
  ).split("?")[0];
};

const getRequestMethod = (config = {}) => {
  return String(
    config?.method || "get"
  ).toLowerCase();
};

/* =====================================================
   PUBLIC REQUESTS
===================================================== */

const isPublicRequest = (
  config = {}
) => {
  const url =
    getRequestPath(config);

  const method =
    getRequestMethod(config);

  if (
    method === "get" &&
    url === "/products/public"
  ) {
    return true;
  }

  if (
    method === "get" &&
    url === "/campaign/spin"
  ) {
    return true;
  }

  if (
    method === "post" &&
    url === "/admin/login"
  ) {
    return true;
  }

  if (
    method === "post" &&
    url === "/admin/register"
  ) {
    return true;
  }

  if (
    method === "post" &&
    (
      url === "/admin/forgot-password" ||
      url === "/admin/verify-reset-otp" ||
      url === "/admin/reset-password"
    )
  ) {
    return true;
  }

  return false;
};

/* =====================================================
   PROTECTED ADMIN REQUESTS
===================================================== */

const isProtectedAdminRequest = (
  config = {}
) => {
  const url =
    getRequestPath(config);

  if (
    isPublicRequest(config)
  ) {
    return false;
  }

  /* -------------------------
     ADMIN AUTH
  ------------------------- */

  if (
    url === "/admin/verify" ||
    url === "/admin/logout"
  ) {
    return true;
  }

  /* -------------------------
     ADMIN REGISTRATIONS
  ------------------------- */

  if (
    url === "/admin/registrations" ||
    url.startsWith(
      "/admin/registrations/"
    )
  ) {
    return true;
  }

  /* -------------------------
     PRODUCTS
  ------------------------- */

  if (
    url === "/products" ||
    url.startsWith("/products/")
  ) {
    return true;
  }

  /* -------------------------
     COUPONS
  ------------------------- */

  if (
    url === "/coupons" ||
    url.startsWith("/coupons/")
  ) {
    return true;
  }

  /* -------------------------
     SPIN CAMPAIGN ADMIN
  ------------------------- */

  if (
    url ===
      "/campaign/spin/activate" ||
    url ===
      "/campaign/spin/deactivate" ||
    url ===
      "/campaign/spin/update"
  ) {
    return true;
  }

  /* -------------------------
     ORDERS
  ------------------------- */

  if (
    url === "/orders" ||
    url.startsWith("/orders/")
  ) {
    return true;
  }

  return false;
};

/* =====================================================
   AXIOS REQUEST INTERCEPTOR
===================================================== */

api.interceptors.request.use(
  (config) => {
    const token =
      getAdminToken();

    if (
      token &&
      isProtectedAdminRequest(
        config
      )
    ) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* =====================================================
   AXIOS RESPONSE INTERCEPTOR
===================================================== */

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status =
      error?.response?.status;

    const config =
      error?.config;

    if (
      (status === 401 ||
        status === 403) &&
      isProtectedAdminRequest(
        config
      )
    ) {
      clearAdminSession();
    }

    return Promise.reject(
      error
    );
  }
);

/* =====================================================
   ADMIN AUTH API
===================================================== */

export const adminAuthAPI = {
  /* -------------------------
     ADMIN REGISTER
  ------------------------- */

  register: async ({
    username,
    email,
    password,
  }) => {
    try {
      const response =
        await api.post(
          "/admin/register",
          {
            username,
            email,
            password,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Admin Registration Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     ADMIN LOGIN
  ------------------------- */

  login: async ({
    username,
    password,
  }) => {
    try {
      const response =
        await api.post(
          "/admin/login",
          {
            username,
            password,
          }
        );

      const data =
        response.data;

      if (
        data?.success &&
        data?.token
      ) {
        saveAdminSession(
          data.token,
          data.admin || null
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Admin Login Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     FORGOT PASSWORD
  ------------------------- */

  forgotPassword: async ({
    email,
  }) => {
    try {
      const response =
        await api.post(
          "/admin/forgot-password",
          {
            email,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Forgot Password Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     VERIFY RESET OTP
  ------------------------- */

  verifyResetOtp: async ({
    email,
    otp,
  }) => {
    try {
      const response =
        await api.post(
          "/admin/verify-reset-otp",
          {
            email,
            otp,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Verify Reset OTP Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     RESET PASSWORD
  ------------------------- */

  resetPassword: async ({
    email,
    resetId,
    newPassword,
    confirmPassword,
  }) => {
    try {
      const response =
        await api.post(
          "/admin/reset-password",
          {
            email,
            resetId,
            newPassword,
            confirmPassword,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Reset Password Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     VERIFY ADMIN SESSION
  ------------------------- */

  verify: async () => {
    try {
      const response =
        await api.get(
          "/admin/verify"
        );

      const data =
        response.data;

      if (
        data?.success &&
        data?.admin
      ) {
        localStorage.setItem(
          ADMIN_DATA_KEY,
          JSON.stringify(
            data.admin
          )
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Admin Verify Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  /* -------------------------
     ADMIN LOGOUT
  ------------------------- */

  logout: async () => {
    try {
      const token =
        getAdminToken();

      if (!token) {
        clearAdminSession();

        return {
          success: true,
          message:
            "Admin already logged out.",
        };
      }

      const response =
        await api.post(
          "/admin/logout"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Admin Logout Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    } finally {
      clearAdminSession();
    }
  },

  /* -------------------------
     PENDING ADMINS
  ------------------------- */

  getPendingAdmins:
    async () => {
      try {
        const response =
          await api.get(
            "/admin/registrations"
          );

        return response.data;
      } catch (error) {
        console.error(
          "Get Pending Admins Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },

  /* -------------------------
     ALL ADMINS
  ------------------------- */

  getAllAdmins:
    async () => {
      try {
        const response =
          await api.get(
            "/admin/registrations/all"
          );

        return response.data;
      } catch (error) {
        console.error(
          "Get All Admins Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },

  /* -------------------------
     APPROVE ADMIN
  ------------------------- */

  approveAdmin:
    async (id) => {
      try {
        const response =
          await api.put(
            `/admin/registrations/${id}/approve`
          );

        return response.data;
      } catch (error) {
        console.error(
          "Approve Admin Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },

  /* -------------------------
     REJECT ADMIN
  ------------------------- */

  rejectAdmin:
    async (id) => {
      try {
        const response =
          await api.put(
            `/admin/registrations/${id}/reject`
          );

        return response.data;
      } catch (error) {
        console.error(
          "Reject Admin Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },
};

/* =====================================================
   ORDER API
===================================================== */

export const orderAPI = {
  getAll: async (
    params = {}
  ) => {
    try {
      const response =
        await api.get(
          "/orders",
          {
            params,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get All Orders Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  getById: async (
    id
  ) => {
    try {
      const response =
        await api.get(
          `/orders/${id}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Order Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  updateStatus: async (
    id,
    status
  ) => {
    try {
      const response =
        await api.patch(
          `/orders/${id}/status`,
          {
            status,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Update Order Status Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  verifyUPIPayment:
    async (
      id,
      paymentData = {}
    ) => {
      try {
        const response =
          await api.patch(
            `/orders/${id}/payment/verify`,
            paymentData
          );

        return response.data;
      } catch (error) {
        console.error(
          "Verify UPI Payment Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },

  rejectUPIPayment:
    async (
      id,
      paymentData = {}
    ) => {
      try {
        const response =
          await api.patch(
            `/orders/${id}/payment/reject`,
            paymentData
          );

        return response.data;
      } catch (error) {
        console.error(
          "Reject UPI Payment Error:",
          error?.response?.data ||
            error.message
        );

        throw error;
      }
    },

  getInvoice: async (
    id
  ) => {
    try {
      const response =
        await api.get(
          `/orders/${id}/invoice`,
          {
            responseType: "blob",
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Invoice Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   PRODUCT ADMIN API
===================================================== */

export const productAdminAPI = {
  list: async () => {
    try {
      const response =
        await api.get(
          "/products"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Products Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  getOne: async (
    id
  ) => {
    try {
      const response =
        await api.get(
          `/products/${id}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Product Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  create: async (
    formData
  ) => {
    try {
      const response =
        await api.post(
          "/products",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Create Product Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  update: async (
    id,
    formData
  ) => {
    try {
      const response =
        await api.put(
          `/products/${id}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Update Product Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  remove: async (
    id
  ) => {
    try {
      const response =
        await api.delete(
          `/products/${id}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   PUBLIC PRODUCT API
===================================================== */

export const publicProductAPI = {
  list: async () => {
    try {
      const response =
        await api.get(
          "/products/public"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Public Products Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   COUPON API
===================================================== */

export const couponAPI = {
  getAll: async () => {
    try {
      const response =
        await api.get(
          "/coupons"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Coupons Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  getById: async (
    id
  ) => {
    try {
      const response =
        await api.get(
          `/coupons/${id}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Coupon Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  getByCode: async (
    code
  ) => {
    try {
      const response =
        await api.get(
          `/coupons/code/${encodeURIComponent(
            code
          )}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Coupon By Code Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  create: async (
    couponData
  ) => {
    try {
      const response =
        await api.post(
          "/coupons",
          couponData
        );

      return response.data;
    } catch (error) {
      console.error(
        "Create Coupon Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  update: async (
    id,
    couponData
  ) => {
    try {
      const response =
        await api.put(
          `/coupons/${id}`,
          couponData
        );

      return response.data;
    } catch (error) {
      console.error(
        "Update Coupon Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  delete: async (
    id
  ) => {
    try {
      const response =
        await api.delete(
          `/coupons/${id}`
        );

      return response.data;
    } catch (error) {
      console.error(
        "Delete Coupon Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  validate: async ({
    code,
    mobile = "",
    category = "",
    orderAmount = 0,
    items = [],
  }) => {
    try {
      const response =
        await api.post(
          "/coupons/validate",
          {
            code,
            mobile,
            category,
            orderAmount,
            items,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Validate Coupon Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   SPIN API
===================================================== */

export const spinAPI = {
  start: async ({
    name,
    mobile,
  }) => {
    try {
      const response =
        await api.post(
          "/coupons/spin/start",
          {
            name,
            mobile,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Spin Start Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  spin: async (
    sessionId
  ) => {
    try {
      const response =
        await api.post(
          "/coupons/spin",
          {
            sessionId,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Spin Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   SPIN CAMPAIGN API
===================================================== */

export const spinCampaignAPI = {
  get: async () => {
    try {
      const response =
        await api.get(
          "/campaign/spin"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Get Spin Campaign Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  activate: async (
    campaignData
  ) => {
    try {
      const response =
        await api.post(
          "/campaign/spin/activate",
          campaignData
        );

      return response.data;
    } catch (error) {
      console.error(
        "Activate Campaign Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  deactivate: async () => {
    try {
      const response =
        await api.post(
          "/campaign/spin/deactivate"
        );

      return response.data;
    } catch (error) {
      console.error(
        "Deactivate Campaign Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },

  update: async (
    campaignData
  ) => {
    try {
      const response =
        await api.put(
          "/campaign/spin/update",
          campaignData
        );

      return response.data;
    } catch (error) {
      console.error(
        "Update Campaign Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   SHIPPING API
===================================================== */

export const shippingAPI = {
  calculate: async ({
    pincode,
    subtotal = 0,
    items = [],
  }) => {
    try {
      const response =
        await api.post(
          "/shipping/calculate",
          {
            pincode,
            subtotal,
            items,
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        "Shipping Calculate Error:",
        error?.response?.data ||
          error.message
      );

      throw error;
    }
  },
};

/* =====================================================
   DEFAULT API
===================================================== */

export default api;