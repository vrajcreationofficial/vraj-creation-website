import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFileText,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiX,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiMail,
  FiPackage,
  FiTruck,
  FiUser,
  FiCalendar,
  FiHash,
  FiClock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import api, {
  getAdminToken,
  clearAdminSession,
} from "../services/api";

const PAGE_SIZE = 20;

const currency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0.00";
  }

  return `₹${amount.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getOrderId = (order) => {
  return (
    order?._id ||
    order?.id ||
    order?.orderId ||
    ""
  );
};

const getOrderNumber = (order) => {
  return (
    order?.orderNumber ||
    order?.orderNo ||
    order?.number ||
    getOrderId(order) ||
    "—"
  );
};

const getPaymentStatus = (order) => {
  return String(
    order?.payment?.status ||
      order?.paymentStatus ||
      "pending"
  ).toLowerCase();
};

const getOrderStatus = (order) => {
  return String(
    order?.status ||
      order?.orderStatus ||
      "pending"
  ).toLowerCase();
};

const getItems = (order) => {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.products)) {
    return order.products;
  }

  if (Array.isArray(order?.orderItems)) {
    return order.orderItems;
  }

  return [];
};

const getProductPrice = (item) => {
  const price = Number(
    item?.price ??
      item?.salePrice ??
      item?.sellingPrice ??
      item?.discountedPrice ??
      item?.unitPrice ??
      0
  );

  return Number.isFinite(price) ? price : 0;
};

const getProductQuantity = (item) => {
  const quantity = Number(
    item?.quantity ??
      item?.qty ??
      item?.count ??
      1
  );

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return quantity;
};

const getItemsTotal = (order) => {
  const items = getItems(order);

  return items.reduce((sum, item) => {
    const subtotal = Number(
      item?.subtotal ??
        item?.total ??
        0
    );

    if (
      Number.isFinite(subtotal) &&
      subtotal > 0
    ) {
      return sum + subtotal;
    }

    return (
      sum +
      getProductPrice(item) *
        getProductQuantity(item)
    );
  }, 0);
};

const getTotal = (order) => {
  const directValues = [
    order?.pricing?.finalTotal,
    order?.pricing?.finalAmount,
    order?.pricing?.grandTotal,
    order?.pricing?.total,
    order?.finalTotal,
    order?.finalAmount,
    order?.grandTotal,
    order?.totalAmount,
    order?.total,
    order?.payment?.amount,
  ];

  for (const value of directValues) {
    const amount = Number(value);

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return amount;
    }
  }

  const subtotal = Number(
    order?.pricing?.subtotal ??
      order?.subtotal ??
      getItemsTotal(order)
  );

  const discount = Number(
    order?.pricing?.discount ??
      order?.pricing?.couponDiscount ??
      order?.discount ??
      0
  );

  const shipping = Number(
    order?.pricing?.shippingCharge ??
      order?.pricing?.shipping ??
      order?.shipping?.shippingCharge ??
      order?.shipping?.charge ??
      order?.shippingCharge ??
      0
  );

  const gst = Number(
    order?.pricing?.totalGST ??
      order?.gst?.totalGST ??
      order?.totalGST ??
      0
  );

  const calculated =
    subtotal -
    discount +
    shipping +
    gst;

  return calculated > 0 ? calculated : 0;
};

const getCustomerName = (order) => {
  return (
    order?.customer?.fullName ||
    order?.customer?.name ||
    order?.customerName ||
    order?.name ||
    order?.billingAddress?.fullName ||
    order?.shippingAddress?.fullName ||
    "Guest Customer"
  );
};

const getCustomerEmail = (order) => {
  return (
    order?.customer?.email ||
    order?.email ||
    order?.billingAddress?.email ||
    order?.shippingAddress?.email ||
    "—"
  );
};

const getCustomerPhone = (order) => {
  return (
    order?.customer?.mobile ||
    order?.customer?.phone ||
    order?.phone ||
    order?.mobile ||
    order?.billingAddress?.mobile ||
    order?.shippingAddress?.mobile ||
    "—"
  );
};

const getTransactionId = (order) => {
  return (
    order?.payment?.transactionId ||
    order?.transactionId ||
    order?.paymentTransactionId ||
    "—"
  );
};

const getPaymentMethod = (order) => {
  return String(
    order?.payment?.method ||
      order?.paymentMethod ||
      "cod"
  ).toLowerCase();
};

const getShippingAddress = (order) => {
  const address =
    order?.customer ||
    order?.shippingAddress ||
    order?.address ||
    {};

  const parts = [
    address?.address,
    address?.city,
    address?.state,
    address?.pincode,
  ].filter(Boolean);

  return parts.join(", ") || "—";
};

const getProductName = (item) => {
  return (
    item?.name ||
    item?.title ||
    item?.productName ||
    item?.product?.name ||
    "Product"
  );
};

const getProductImage = (item) => {
  return (
    item?.image ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.product?.image ||
    ""
  );
};

const getItemsCount = (order) => {
  const items = getItems(order);

  return items.reduce(
    (total, item) =>
      total + getProductQuantity(item),
    0
  );
};

const canGenerateInvoice = (order) => {
  const paymentMethod =
    getPaymentMethod(order);

  const paymentStatus =
    getPaymentStatus(order);

  if (paymentMethod === "cod") {
    return true;
  }

  if (paymentMethod === "upi") {
    return paymentStatus === "paid";
  }

  return false;
};

const StatusBadge = ({
  value,
  type = "status",
}) => {
  const normalized = String(
    value || "pending"
  ).toLowerCase();

  const styles = {
    pending:
      "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed:
      "bg-blue-100 text-blue-700 border-blue-200",
    processing:
      "bg-indigo-100 text-indigo-700 border-indigo-200",
    shipped:
      "bg-purple-100 text-purple-700 border-purple-200",
    delivered:
      "bg-green-100 text-green-700 border-green-200",
    cancelled:
      "bg-red-100 text-red-700 border-red-200",
    failed:
      "bg-red-100 text-red-700 border-red-200",
    paid:
      "bg-green-100 text-green-700 border-green-200",
    rejected:
      "bg-red-100 text-red-700 border-red-200",
  };

  const label =
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[normalized] ||
        "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {label}
    </span>
  );
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
};

const getOrdersFromResponse = (data) => {
  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const getTotalPagesFromResponse = (data) => {
  return Math.max(
    1,
    Number(
      data?.pagination?.totalPages ??
        data?.meta?.totalPages ??
        1
    )
  );
};

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [invoiceLoading, setInvoiceLoading] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [stats, setStats] =
    useState({
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      upiPending: 0,
      paid: 0,
      rejected: 0,
      revenue: 0,
    });

  const authenticatedRequest = async (
    method,
    url,
    data,
    config = {}
  ) => {
    const token = getAdminToken();

    if (!token) {
      clearAdminSession();

      navigate("/admin/login", {
        replace: true,
      });

      throw new Error(
        "Admin session expired."
      );
    }

    try {
      const requestConfig = {
        ...config,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };

      if (
        method.toUpperCase() === "GET"
      ) {
        return await api.get(
          url,
          requestConfig
        );
      }

      if (
        method.toUpperCase() === "POST"
      ) {
        return await api.post(
          url,
          data,
          requestConfig
        );
      }

      if (
        method.toUpperCase() === "PATCH"
      ) {
        return await api.patch(
          url,
          data,
          requestConfig
        );
      }

      if (
        method.toUpperCase() === "PUT"
      ) {
        return await api.put(
          url,
          data,
          requestConfig
        );
      }

      if (
        method.toUpperCase() === "DELETE"
      ) {
        return await api.delete(
          url,
          requestConfig
        );
      }

      throw new Error(
        "Unsupported HTTP method."
      );
    } catch (requestError) {
      const statusCode =
        requestError?.response?.status;

      if (
        statusCode === 401 ||
        statusCode === 403
      ) {
        clearAdminSession();

        navigate("/admin/login", {
          replace: true,
        });
      }

      throw requestError;
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      params.set("page", String(page));
      params.set(
        "limit",
        String(PAGE_SIZE)
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (status) {
        params.set("status", status);
      }

      if (paymentStatus) {
        params.set(
          "paymentStatus",
          paymentStatus
        );
      }

      const response =
        await authenticatedRequest(
          "GET",
          `/orders?${params.toString()}`
        );

      const data =
        response?.data || {};

      setOrders(
        getOrdersFromResponse(data)
      );

      setTotalPages(
        getTotalPagesFromResponse(data)
      );
    } catch (requestError) {
      console.error(
        "LOAD ORDERS ERROR:",
        requestError
      );

      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response =
        await authenticatedRequest(
          "GET",
          "/orders?limit=1000&page=1"
        );

      const data =
        response?.data || {};

      const allOrders =
        getOrdersFromResponse(data);

      const calculated = {
        total: allOrders.length,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        upiPending: 0,
        paid: 0,
        rejected: 0,
        revenue: 0,
      };

      allOrders.forEach((order) => {
        const orderStatus =
          getOrderStatus(order);

        const payment =
          getPaymentStatus(order);

        const method =
          getPaymentMethod(order);

        if (
          calculated[orderStatus] !==
          undefined
        ) {
          calculated[orderStatus] += 1;
        }

        if (payment === "paid") {
          calculated.paid += 1;
        }

        if (
          payment === "rejected"
        ) {
          calculated.rejected += 1;
        }

        if (
          method === "upi" &&
          payment === "pending"
        ) {
          calculated.upiPending += 1;
        }

        if (
          payment === "paid" &&
          orderStatus !== "cancelled"
        ) {
          calculated.revenue +=
            getTotal(order);
        }
      });

      setStats(calculated);
    } catch (requestError) {
      console.error(
        "LOAD ORDER STATS ERROR:",
        requestError
      );
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    page,
    search,
    status,
    paymentStatus,
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const refreshOrders = async () => {
    await Promise.all([
      loadOrders(),
      loadStats(),
    ]);
  };

  const openOrder = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    try {
      setDetailsLoading(true);
      setError("");

      const response =
        await authenticatedRequest(
          "GET",
          `/orders/${orderId}`
        );

      const data =
        response?.data || {};

      setSelectedOrder(
        data?.order || order
      );
    } catch (requestError) {
      console.error(
        "OPEN ORDER ERROR:",
        requestError
      );

      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const openInvoice = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      setError(
        "Order ID is missing."
      );
      return;
    }

    if (!canGenerateInvoice(order)) {
      setError(
        "UPI payment approve hone ke baad hi invoice generate hoga."
      );
      return;
    }

    const invoiceWindow =
      window.open("", "_blank");

    if (!invoiceWindow) {
      setError(
        "Please allow pop-ups in your browser to open the invoice."
      );
      return;
    }

    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Generating Invoice...</title>
        </head>
        <body style="
          font-family: Arial, sans-serif;
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:100vh;
        ">
          <div>
            <h3>Generating Invoice...</h3>
            <p>Please wait.</p>
          </div>
        </body>
      </html>
    `);

    try {
      setInvoiceLoading(orderId);
      setError("");

      const response =
        await authenticatedRequest(
          "GET",
          `/orders/${orderId}/invoice`,
          undefined,
          {
            responseType: "blob",
          }
        );

      const blob = response?.data;

      if (!blob || blob.size === 0) {
        throw new Error(
          "Invoice PDF is empty."
        );
      }

      const contentType =
        response?.headers?.[
          "content-type"
        ];

      if (
        contentType &&
        !contentType.includes(
          "application/pdf"
        )
      ) {
        let message =
          "Unable to generate invoice.";

        try {
          const text =
            await blob.text();

          const parsed =
            JSON.parse(text);

          message =
            parsed?.message ||
            message;
        } catch {
          message =
            "Unable to generate invoice.";
        }

        throw new Error(message);
      }

      const blobUrl =
        URL.createObjectURL(blob);

      invoiceWindow.location.href =
        blobUrl;

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 300000);
    } catch (requestError) {
      console.error(
        "OPEN INVOICE ERROR:",
        requestError
      );

      try {
        invoiceWindow.close();
      } catch {}

      const backendCode =
        requestError?.response?.data?.code;

      if (
        backendCode ===
        "UPI_PAYMENT_NOT_VERIFIED"
      ) {
        setError(
          "UPI payment approve hone ke baad hi invoice generate hoga."
        );
      } else {
        setError(
          getErrorMessage(requestError)
        );
      }
    } finally {
      setInvoiceLoading(null);
    }
  };

  const verifyPayment = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    const transactionId =
      getTransactionId(order);

    if (
      !transactionId ||
      transactionId === "—"
    ) {
      setError(
        "UPI Transaction ID is missing."
      );
      return;
    }

    try {
      setActionLoading(
        `${orderId}-verify`
      );
      setError("");

      await authenticatedRequest(
        "PATCH",
        `/orders/${orderId}/payment/verify`,
        {
          transactionId,
          verifiedBy: "Admin",
        }
      );

      await refreshOrders();

      if (
        selectedOrder &&
        getOrderId(selectedOrder) ===
          orderId
      ) {
        const refreshed =
          await authenticatedRequest(
            "GET",
            `/orders/${orderId}`
          );

        setSelectedOrder(
          refreshed?.data?.order ||
            selectedOrder
        );
      }
    } catch (requestError) {
      console.error(
        "VERIFY PAYMENT ERROR:",
        requestError
      );

      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setActionLoading(null);
    }
  };

  const rejectPayment = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    const reason = window.prompt(
      "Enter payment rejection reason:"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError(
        "Rejection reason is required."
      );
      return;
    }

    try {
      setActionLoading(
        `${orderId}-reject`
      );
      setError("");

      await authenticatedRequest(
        "PATCH",
        `/orders/${orderId}/payment/reject`,
        {
          rejectionReason:
            reason.trim(),
          verifiedBy: "Admin",
        }
      );

      await refreshOrders();

      if (
        selectedOrder &&
        getOrderId(selectedOrder) ===
          orderId
      ) {
        const refreshed =
          await authenticatedRequest(
            "GET",
            `/orders/${orderId}`
          );

        setSelectedOrder(
          refreshed?.data?.order ||
            selectedOrder
        );
      }
    } catch (requestError) {
      console.error(
        "REJECT PAYMENT ERROR:",
        requestError
      );

      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setActionLoading(null);
    }
  };

  const updateOrderStatus = async (
    order,
    newStatus
  ) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      return;
    }

    try {
      setActionLoading(
        `${orderId}-status`
      );
      setError("");

      await authenticatedRequest(
        "PATCH",
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      await refreshOrders();

      if (
        selectedOrder &&
        getOrderId(selectedOrder) ===
          orderId
      ) {
        const refreshed =
          await authenticatedRequest(
            "GET",
            `/orders/${orderId}`
          );

        setSelectedOrder(
          refreshed?.data?.order ||
            selectedOrder
        );
      }
    } catch (requestError) {
      console.error(
        "UPDATE STATUS ERROR:",
        requestError
      );

      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total Orders",
        value: stats.total,
        icon: FiShoppingBag,
      },
      {
        label: "Pending",
        value: stats.pending,
        icon: FiClock,
      },
      {
        label: "UPI Pending",
        value: stats.upiPending,
        icon: FiCreditCard,
      },
      {
        label: "Paid",
        value: stats.paid,
        icon: FiCheck,
      },
      {
        label: "Processing",
        value: stats.processing,
        icon: FiPackage,
      },
      {
        label: "Shipped",
        value: stats.shipped,
        icon: FiTruck,
      },
      {
        label: "Delivered",
        value: stats.delivered,
        icon: FiCheck,
      },
      {
        label: "Revenue",
        value: currency(stats.revenue),
        icon: FiCreditCard,
      },
    ],
    [stats]
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-gray-950">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage orders, payments and invoices
              </p>
            </div>

            <button
              type="button"
              onClick={refreshOrders}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <FiAlertCircle className="mt-0.5 shrink-0" />

              <div className="flex-1">
                {error}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="shrink-0"
              >
                <FiX />
              </button>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <Icon />
                    </div>
                  </div>

                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(
                      event.target.value
                    );
                  }}
                  placeholder="Search order, customer, phone, email, SKU..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(
                    event.target.value
                  );
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">
                  All Order Status
                </option>
                <option value="pending">
                  Pending
                </option>
                <option value="confirmed">
                  Confirmed
                </option>
                <option value="processing">
                  Processing
                </option>
                <option value="shipped">
                  Shipped
                </option>
                <option value="delivered">
                  Delivered
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
                <option value="failed">
                  Failed
                </option>
              </select>

              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPage(1);
                  setPaymentStatus(
                    event.target.value
                  );
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">
                  All Payment Status
                </option>
                <option value="pending">
                  Pending
                </option>
                <option value="paid">
                  Paid
                </option>
                <option value="rejected">
                  Rejected
                </option>
                <option value="failed">
                  Failed
                </option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                  <FiLoader className="animate-spin text-xl" />
                  Loading orders...
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
                <FiShoppingBag className="mb-3 text-4xl text-gray-300" />

                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  No orders found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] w-full text-left">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Order
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Customer
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Items
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Amount
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Payment
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Order Status
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                          Date
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {orders.map((order) => {
                        const orderId =
                          getOrderId(order);

                        const method =
                          getPaymentMethod(
                            order
                          );

                        const payment =
                          getPaymentStatus(
                            order
                          );

                        const invoiceAllowed =
                          canGenerateInvoice(
                            order
                          );

                        const verifying =
                          actionLoading ===
                          `${orderId}-verify`;

                        const rejecting =
                          actionLoading ===
                          `${orderId}-reject`;

                        const statusUpdating =
                          actionLoading ===
                          `${orderId}-status`;

                        return (
                          <tr
                            key={
                              orderId ||
                              getOrderNumber(
                                order
                              )
                            }
                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          >
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {getOrderNumber(
                                  order
                                )}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {orderId}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {getCustomerName(
                                  order
                                )}
                              </div>

                              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                <FiPhone />
                                {getCustomerPhone(
                                  order
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                  {getItemsCount(
                                    order
                                  )}
                                </span>

                                <span className="text-xs text-gray-500">
                                  item(s)
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {currency(
                                  getTotal(
                                    order
                                  )
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                                {method}
                              </div>

                              <StatusBadge
                                value={
                                  payment
                                }
                                type="payment"
                              />
                            </td>

                            <td className="px-4 py-4">
                              <StatusBadge
                                value={getOrderStatus(
                                  order
                                )}
                              />
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(
                                order?.createdAt ||
                                  order?.createdDate ||
                                  order?.date
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openOrder(
                                      order
                                    )
                                  }
                                  title="View Order"
                                  className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-indigo-950/40"
                                >
                                  <FiEye />
                                </button>

                                {invoiceAllowed ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openInvoice(
                                        order
                                      )
                                    }
                                    disabled={
                                      invoiceLoading ===
                                      orderId
                                    }
                                    title="View Invoice"
                                    className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900/50 dark:hover:bg-green-950/30"
                                  >
                                    {invoiceLoading ===
                                    orderId ? (
                                      <FiLoader className="animate-spin" />
                                    ) : (
                                      <FiFileText />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    title="UPI payment approval required for invoice"
                                    className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 p-2 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <FiFileText />
                                  </button>
                                )}

                                {method ===
                                  "upi" &&
                                  payment ===
                                    "pending" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          verifyPayment(
                                            order
                                          )
                                        }
                                        disabled={
                                          verifying ||
                                          rejecting
                                        }
                                        title="Approve Payment"
                                        className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900/50"
                                      >
                                        {verifying ? (
                                          <FiLoader className="animate-spin" />
                                        ) : (
                                          <FiCheck />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          rejectPayment(
                                            order
                                          )
                                        }
                                        disabled={
                                          verifying ||
                                          rejecting
                                        }
                                        title="Reject Payment"
                                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50"
                                      >
                                        {rejecting ? (
                                          <FiLoader className="animate-spin" />
                                        ) : (
                                          <FiX />
                                        )}
                                      </button>
                                    </>
                                  )}

                                <select
                                  value={getOrderStatus(
                                    order
                                  )}
                                  disabled={
                                    statusUpdating
                                  }
                                  onChange={(event) =>
                                    updateOrderStatus(
                                      order,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                >
                                  <option value="pending">
                                    Pending
                                  </option>

                                  <option value="confirmed">
                                    Confirmed
                                  </option>

                                  <option value="processing">
                                    Processing
                                  </option>

                                  <option value="shipped">
                                    Shipped
                                  </option>

                                  <option value="delivered">
                                    Delivered
                                  </option>

                                  <option value="cancelled">
                                    Cancelled
                                  </option>

                                  <option value="failed">
                                    Failed
                                  </option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                  <p className="text-sm text-gray-500">
                    Page {page} of{" "}
                    {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                        )
                      }
                      disabled={
                        page <= 1 ||
                        loading
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <FiChevronLeft />
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                        )
                      }
                      disabled={
                        page >=
                          totalPages ||
                        loading
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      Next
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Order Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    {getOrderNumber(
                      selectedOrder
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiX />
                </button>
              </div>

              <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5">
                {detailsLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FiLoader className="animate-spin" />
                      Loading order...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                          <FiUser />

                          <span className="text-xs font-semibold uppercase">
                            Customer
                          </span>
                        </div>

                        <p className="font-semibold text-gray-900 dark:text-white">
                          {getCustomerName(
                            selectedOrder
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {getCustomerPhone(
                            selectedOrder
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                          <FiMail />

                          <span className="text-xs font-semibold uppercase">
                            Email
                          </span>
                        </div>

                        <p className="break-all text-sm font-medium text-gray-900 dark:text-white">
                          {getCustomerEmail(
                            selectedOrder
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                          <FiCreditCard />

                          <span className="text-xs font-semibold uppercase">
                            Payment
                          </span>
                        </div>

                        <p className="font-semibold uppercase text-gray-900 dark:text-white">
                          {getPaymentMethod(
                            selectedOrder
                          )}
                        </p>

                        <div className="mt-1">
                          <StatusBadge
                            value={getPaymentStatus(
                              selectedOrder
                            )}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                          <FiHash />

                          <span className="text-xs font-semibold uppercase">
                            Amount
                          </span>
                        </div>

                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {currency(
                            getTotal(
                              selectedOrder
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-3 flex items-center gap-2">
                          <FiMapPin className="text-indigo-500" />

                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Delivery Address
                          </h3>
                        </div>

                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {getShippingAddress(
                            selectedOrder
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-3 flex items-center gap-2">
                          <FiCalendar className="text-indigo-500" />

                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Order Information
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">
                              Order Date
                            </span>

                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDate(
                                selectedOrder?.createdAt
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">
                              Order Status
                            </span>

                            <StatusBadge
                              value={getOrderStatus(
                                selectedOrder
                              )}
                            />
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">
                              Transaction ID
                            </span>

                            <span className="max-w-[240px] break-all text-right font-medium text-gray-900 dark:text-white">
                              {getTransactionId(
                                selectedOrder
                              )}
                            </span>
                          </div>

                          {selectedOrder?.invoiceNumber && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">
                                Invoice No.
                              </span>

                              <span className="font-medium text-gray-900 dark:text-white">
                                {
                                  selectedOrder.invoiceNumber
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Products
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {getItems(
                          selectedOrder
                        ).map(
                          (item, index) => {
                            const image =
                              getProductImage(
                                item
                              );

                            return (
                              <div
                                key={`${getProductName(
                                  item
                                )}-${index}`}
                                className="flex gap-4 p-4"
                              >
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={getProductName(
                                        item
                                      )}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                                      <FiPackage />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {getProductName(
                                      item
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    SKU:{" "}
                                    {item?.sku ||
                                      "—"}
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                    <span>
                                      Qty:{" "}
                                      {getProductQuantity(
                                        item
                                      )}
                                    </span>

                                    <span>
                                      Price:{" "}
                                      {currency(
                                        getProductPrice(
                                          item
                                        )
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="font-bold text-gray-900 dark:text-white">
                                  {currency(
                                    Number(
                                      item?.subtotal
                                    ) ||
                                      getProductPrice(
                                        item
                                      ) *
                                        getProductQuantity(
                                          item
                                        )
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      {getPaymentMethod(
                        selectedOrder
                      ) === "upi" &&
                        getPaymentStatus(
                          selectedOrder
                        ) === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                verifyPayment(
                                  selectedOrder
                                )
                              }
                              disabled={
                                actionLoading ===
                                `${getOrderId(
                                  selectedOrder
                                )}-verify`
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading ===
                              `${getOrderId(
                                selectedOrder
                              )}-verify` ? (
                                <FiLoader className="animate-spin" />
                              ) : (
                                <FiCheck />
                              )}

                              Approve Payment
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                rejectPayment(
                                  selectedOrder
                                )
                              }
                              disabled={
                                actionLoading ===
                                `${getOrderId(
                                  selectedOrder
                                )}-reject`
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading ===
                              `${getOrderId(
                                selectedOrder
                              )}-reject` ? (
                                <FiLoader className="animate-spin" />
                              ) : (
                                <FiX />
                              )}

                              Reject Payment
                            </button>
                          </>
                        )}

                      {canGenerateInvoice(
                        selectedOrder
                      ) ? (
                        <button
                          type="button"
                          onClick={() =>
                            openInvoice(
                              selectedOrder
                            )
                          }
                          disabled={
                            invoiceLoading ===
                            getOrderId(
                              selectedOrder
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {invoiceLoading ===
                          getOrderId(
                            selectedOrder
                          ) ? (
                            <FiLoader className="animate-spin" />
                          ) : (
                            <FiFileText />
                          )}

                          View Invoice
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                          title="UPI payment approval required"
                        >
                          <FiFileText />
                          Invoice Pending Payment Approval
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedOrder(null)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Close
                      </button>
                    </div>

                    {getPaymentMethod(
                      selectedOrder
                    ) === "upi" &&
                      getPaymentStatus(
                        selectedOrder
                      ) !== "paid" && (
                        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300">
                          <div className="flex items-start gap-3">
                            <FiAlertCircle className="mt-0.5 shrink-0" />

                            <div>
                              <p className="font-semibold">
                                Invoice is locked
                              </p>

                              <p className="mt-1">
                                UPI payment approve hone ke baad hi GST invoice generate kiya ja sakta hai.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}