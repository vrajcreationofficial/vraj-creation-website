import { useEffect, useMemo, useState } from "react";

import {
  FiAlertCircle,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiPackage,
  FiBox,
  FiArrowUpRight,
  FiLoader,
  FiCheckCircle,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import { productAdminAPI } from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const API_SERVER_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

const getProductImage = (image) => {
  if (
    typeof image !== "string" ||
    !image.trim()
  ) {
    return null;
  }

  const cleanImage = image.trim();

  if (
    cleanImage.startsWith("http://") ||
    cleanImage.startsWith("https://") ||
    cleanImage.startsWith("data:") ||
    cleanImage.startsWith("blob:")
  ) {
    return cleanImage;
  }

  return `${API_SERVER_URL}/${cleanImage.replace(
    /^\/+/,
    ""
  )}`;
};

const CATEGORY_OPTIONS = [
  "home decor",
  "wall decor",
  "table decor",
  "resin art",
  "ethnic furnishing",
  "desk accessories",
];

const ProductAdmin = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("success");

  const [pageVisible, setPageVisible] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [loadedOnce, setLoadedOnce] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageVisible(true);
    }, 80);

    return () => clearTimeout(timer);
  }, []);

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await productAdminAPI.list();

      const productList =
        Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response)
          ? response
          : [];

      setProducts(productList);
      setLoadedOnce(true);
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      if (!isRefresh) {
        setProducts([]);
      }

      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load products."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);

  const filteredProducts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const name = String(
        product?.name || ""
      ).toLowerCase();

      const sku = String(
        product?.sku || ""
      ).toLowerCase();

      const productCategory = String(
        product?.category || ""
      ).toLowerCase();

      const subcategory = String(
        product?.subcategory || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        sku.includes(searchValue) ||
        productCategory.includes(
          searchValue
        ) ||
        subcategory.includes(
          searchValue
        );

      const matchesCategory =
        !category ||
        productCategory ===
          category.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    category,
  ]);

  const activeProducts =
    products.filter(
      (product) =>
        product?.status !== "inactive"
    ).length;

  const totalStock =
    products.reduce(
      (total, product) =>
        total +
        Number(product?.stock || 0),
      0
    );

  const lowStock =
    products.filter((product) => {
      const stock = Number(
        product?.stock || 0
      );

      const minimumStock = Number(
        product?.minimumStock ?? 5
      );

      return stock <= minimumStock;
    }).length;

  const deleteProduct = async (id) => {
    if (!id || deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await productAdminAPI.remove(id);

      setMessage(
        "Product deleted successfully."
      );

      setMessageType("success");

      await loadProducts(true);
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete product."
      );

      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (product) => {
    const id = product?._id;

    if (!id) {
      setMessage(
        "Product record ID is missing."
      );

      setMessageType("error");

      return;
    }

    navigate(
      `/admin/products/${id}/edit`
    );
  };

  const formatPrice = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString(
      "en-IN"
    )}`;
  };

  const getStatus = (product) => {
    const stock = Number(
      product?.stock || 0
    );

    if (
      product?.status ===
      "inactive"
    ) {
      return {
        text: "Inactive",
        className:
          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      };
    }

    if (stock <= 0) {
      return {
        text: "Out of Stock",
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      };
    }

    const minimumStock = Number(
      product?.minimumStock ?? 5
    );

    if (
      stock <= minimumStock
    ) {
      return {
        text: "Low Stock",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      };
    }

    return {
      text: "Active",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    };
  };

  const handleImageError = (event) => {
    event.currentTarget.style.display =
      "none";
  };

  const statCards = [
    {
      title: "Total Products",
      value: products.length,
      icon: FiPackage,
      iconClass:
        "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      glowClass:
        "bg-indigo-500/10",
    },
    {
      title: "Active Products",
      value: activeProducts,
      icon: FiBox,
      iconClass:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      glowClass:
        "bg-green-500/10",
    },
    {
      title: "Low Stock",
      value: lowStock,
      icon: FiAlertCircle,
      iconClass:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      glowClass:
        "bg-amber-500/10",
    },
  ];

  const SkeletonRow = ({ index }) => (
    <div
      style={{
        animationDelay: `${index * 80}ms`,
      }}
      className="
        flex
        items-center
        gap-4
        border-b
        border-gray-100
        px-4
        py-4
        dark:border-gray-700
        animate-pulse
      "
    >
      <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />

      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
      </div>

      <div className="hidden h-7 w-20 rounded bg-gray-200 dark:bg-gray-700 md:block" />
      <div className="hidden h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 lg:block" />
      <div className="hidden h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 lg:block" />
      <div className="h-3 w-10 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="hidden h-8 w-20 rounded bg-gray-200 dark:bg-gray-700 lg:block" />
    </div>
  );

  const SkeletonCard = ({ index }) => (
    <div
      style={{
        animationDelay: `${index * 100}ms`,
      }}
      className="
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-white
        p-4
        shadow-sm
        animate-pulse
        dark:border-gray-700
        dark:bg-gray-800
      "
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-700" />
        </div>

        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-2 w-10 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-2">
          <div className="h-2 w-14 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-2">
          <div className="h-2 w-12 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-2">
          <div className="h-2 w-10 rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="h-10 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );

  return (
    <AdminLayout title="All Products">
      <div
        className={`
          relative
          min-h-full
          w-full
          overflow-hidden
          px-3
          py-4
          transition-all
          duration-700
          sm:px-5
          sm:py-5
          lg:px-6
          lg:py-6
          xl:px-8
          ${
            pageVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-5 opacity-0"
          }
        `}
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-indigo-500/5
            blur-3xl
            transition-transform
            duration-1000
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-72
            w-72
            rounded-full
            bg-purple-500/5
            blur-3xl
          "
        />

        {message && (
          <div
            className={`
              relative
              mb-5
              flex
              items-start
              gap-3
              rounded-xl
              border
              px-4
              py-3
              text-sm
              shadow-sm
              transition-all
              duration-500
              ${
                messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                  : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300"
              }
            `}
          >
            {messageType === "error" ? (
              <FiAlertCircle className="mt-0.5 shrink-0" />
            ) : (
              <FiCheckCircle className="mt-0.5 shrink-0" />
            )}

            <span>{message}</span>
          </div>
        )}

        <div
          className="
            relative
            mb-5
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div
            className={`
              transition-all
              duration-700
              ${
                pageVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-8 opacity-0"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#f5e3d8]
                  text-[#8f3424]
                  shadow-sm
                  transition-all
                  duration-500
                  hover:scale-110
                  hover:rotate-6
                  hover:shadow-md
                  dark:bg-[#332019]
                  dark:text-[#d99a7c]
                "
              >
                <FiPackage size={20} />
              </div>

              <h1
                className="
                  text-xl
                  font-bold
                  text-gray-900
                  dark:text-white
                  sm:text-2xl
                "
              >
                Products
              </h1>
            </div>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Manage your products, stock and pricing.
            </p>
          </div>

          <div
            className={`
              flex
              flex-col
              gap-2
              transition-all
              duration-700
              sm:flex-row
              ${
                pageVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-8 opacity-0"
              }
            `}
          >
            <button
              type="button"
              onClick={() => loadProducts(true)}
              disabled={loading || refreshing}
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-indigo-200
                hover:bg-gray-50
                hover:text-indigo-600
                hover:shadow-md
                active:scale-95
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
                dark:hover:text-indigo-400
              "
            >
              <FiRefreshCw
                className={`
                  transition-transform
                  duration-500
                  ${
                    refreshing
                      ? "animate-spin"
                      : "group-hover:rotate-180"
                  }
                `}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/products/add"
                )
              }
              className="
                group
                relative
                inline-flex
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-lg
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-indigo-700
                hover:shadow-lg
                active:scale-95
              "
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  -translate-x-full
                  bg-gradient-to-r
                  from-transparent
                  via-white/20
                  to-transparent
                  transition-transform
                  duration-700
                  group-hover:translate-x-full
                "
              />

              <FiPlus
                className="
                  relative
                  transition-transform
                  duration-300
                  group-hover:rotate-90
                "
              />

              <span className="relative">
                Add Product
              </span>
            </button>
          </div>
        </div>

        <div
          className="
            relative
            mb-5
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          {statCards.map(
            (stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                  className={`
                    group
                    relative
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-4
                    shadow-sm
                    transition-all
                    duration-700
                    hover:-translate-y-1
                    hover:shadow-xl
                    dark:border-gray-700
                    dark:bg-gray-800
                    ${
                      pageVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }
                  `}
                >
                  <div
                    className={`
                      pointer-events-none
                      absolute
                      -right-8
                      -top-8
                      h-24
                      w-24
                      rounded-full
                      blur-2xl
                      transition-all
                      duration-700
                      group-hover:scale-150
                      ${stat.glowClass}
                    `}
                  />

                  <div
                    className="
                      relative
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
                          text-gray-500
                          dark:text-gray-400
                        "
                      >
                        {stat.title}
                      </p>

                      <p
                        className="
                          mt-1
                          text-2xl
                          font-bold
                          text-gray-900
                          transition-transform
                          duration-300
                          group-hover:scale-105
                          dark:text-white
                        "
                      >
                        {stat.value}
                      </p>
                    </div>

                    <div
                      className={`
                        rounded-lg
                        p-3
                        transition-all
                        duration-500
                        group-hover:rotate-6
                        group-hover:scale-110
                        ${stat.iconClass}
                      `}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div
          className={`
            relative
            mb-5
            rounded-xl
            border
            border-gray-200
            bg-white
            p-3
            shadow-sm
            transition-all
            duration-700
            hover:shadow-md
            dark:border-gray-700
            dark:bg-gray-800
            sm:p-4
            ${
              pageVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }
          `}
        >
          <div
            className="
              grid
              grid-cols-1
              gap-3
              lg:grid-cols-[1fr_220px]
            "
          >
            <div className="group relative">
              <FiSearch
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  transition-all
                  duration-300
                  group-focus-within:scale-110
                  group-focus-within:text-indigo-500
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by product name, SKU, category..."
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-200
                  bg-gray-50
                  py-2.5
                  pl-10
                  pr-4
                  text-sm
                  text-gray-900
                  outline-none
                  transition-all
                  duration-300
                  focus:border-indigo-500
                  focus:bg-white
                  focus:ring-2
                  focus:ring-indigo-100
                  dark:border-gray-700
                  dark:bg-gray-900
                  dark:text-white
                  dark:focus:bg-gray-900
                  dark:focus:ring-indigo-900/40
                "
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-3
                py-2.5
                text-sm
                text-gray-700
                outline-none
                transition-all
                duration-300
                hover:border-indigo-300
                focus:border-indigo-500
                focus:ring-2
                focus:ring-indigo-100
                dark:border-gray-700
                dark:bg-gray-900
                dark:text-gray-200
                dark:focus:ring-indigo-900/40
              "
            >
              <option value="">
                All Categories
              </option>

              {CATEGORY_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.replace(
                      /\b\w/g,
                      (letter) =>
                        letter.toUpperCase()
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {products.length}
              </span>{" "}
              products
            </span>

            {totalStock > 0 && (
              <span className="hidden sm:block">
                Total Stock:{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {totalStock}
                </span>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div
            className="
              relative
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-700
              dark:bg-gray-800
            "
          >
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                border-b
                border-gray-100
                px-6
                py-10
                dark:border-gray-700
              "
            >
              <div
                className="
                  relative
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    absolute
                    inset-0
                    animate-ping
                    rounded-full
                    bg-indigo-500/10
                  "
                />

                <div
                  className="
                    relative
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-indigo-50
                    dark:bg-indigo-900/20
                  "
                >
                  <FiPackage
                    size={26}
                    className="
                      animate-bounce
                      text-indigo-600
                      dark:text-indigo-400
                    "
                  />
                </div>
              </div>

              <p
                className="
                  mt-4
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Loading Products
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-400
                "
              >
                Fetching your product inventory...
              </p>

              <div
                className="
                  mt-4
                  h-1
                  w-40
                  overflow-hidden
                  rounded-full
                  bg-gray-100
                  dark:bg-gray-700
                "
              >
                <div
                  className="
                    h-full
                    w-1/2
                    animate-[pulse_1s_ease-in-out_infinite]
                    rounded-full
                    bg-indigo-600
                  "
                />
              </div>
            </div>

            <div className="hidden lg:block">
              {[0, 1, 2, 3, 4].map(
                (index) => (
                  <SkeletonRow
                    key={index}
                    index={index}
                  />
                )
              )}
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {[0, 1, 2].map(
                (index) => (
                  <SkeletonCard
                    key={index}
                    index={index}
                  />
                )
              )}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="
              relative
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              p-12
              text-center
              shadow-sm
              transition-all
              duration-500
              hover:shadow-lg
              dark:border-gray-700
              dark:bg-gray-800
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                h-48
                w-48
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                bg-indigo-500/5
                blur-3xl
              "
            />

            <div
              className="
                relative
                mx-auto
                mb-4
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-gray-100
                text-gray-400
                transition-all
                duration-500
                hover:rotate-6
                hover:scale-110
                dark:bg-gray-700
              "
            >
              <FiPackage size={32} />
            </div>

            <h3
              className="
                relative
                text-base
                font-semibold
                text-gray-800
                dark:text-white
              "
            >
              No products found
            </h3>

            <p
              className="
                relative
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Try changing your search or category filter.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/products/add"
                )
              }
              className="
                group
                relative
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-indigo-700
                hover:shadow-lg
                active:scale-95
              "
            >
              <FiPlus
                className="
                  transition-transform
                  duration-300
                  group-hover:rotate-90
                "
              />

              Add Product
            </button>
          </div>
        ) : (
          <>
            <div
              className="
                hidden
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                shadow-sm
                transition-all
                duration-500
                hover:shadow-lg
                dark:border-gray-700
                dark:bg-gray-800
                lg:block
              "
            >
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead
                    className="
                      border-b
                      border-gray-200
                      bg-gray-50
                      dark:border-gray-700
                      dark:bg-gray-900/50
                    "
                  >
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Product
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        SKU
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Category
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Purchase
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Selling
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Stock
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Status
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredProducts.map(
                      (product, index) => {
                        const image =
                          getProductImage(
                            product?.image
                          );

                        const status =
                          getStatus(
                            product
                          );

                        const isDeleting =
                          deletingId ===
                          product?._id;

                        return (
                          <tr
                            key={
                              product?._id ||
                              product?.sku
                            }
                            style={{
                              transitionDelay: `${index * 40}ms`,
                            }}
                            className="
                              group
                              transition-all
                              duration-500
                              hover:bg-gray-50
                              dark:hover:bg-gray-900/40
                            "
                          >
                            <td className="px-4 py-4">
                              <div className="flex min-w-[220px] items-center gap-3">
                                <div
                                  className="
                                    group/image
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    overflow-hidden
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    transition-all
                                    duration-500
                                    group-hover:scale-105
                                    group-hover:shadow-md
                                    dark:border-gray-700
                                    dark:bg-gray-900
                                  "
                                >
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={
                                        product?.name ||
                                        "Product"
                                      }
                                      onError={
                                        handleImageError
                                      }
                                      className="
                                        h-full
                                        w-full
                                        object-cover
                                        transition-transform
                                        duration-700
                                        group-hover:scale-125
                                      "
                                    />
                                  ) : (
                                    <FiPackage className="text-gray-400" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className="
                                      truncate
                                      text-sm
                                      font-semibold
                                      text-gray-900
                                      transition-colors
                                      duration-300
                                      group-hover:text-indigo-600
                                      dark:text-white
                                      dark:group-hover:text-indigo-400
                                    "
                                  >
                                    {product?.name ||
                                      "Unnamed Product"}
                                  </p>

                                  {product?.subcategory && (
                                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                      {
                                        product.subcategory
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 transition-all duration-300 group-hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400">
                                {product?.sku ||
                                  "-"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {product?.category ||
                                  "-"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {formatPrice(
                                  product?.purchasePrice
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                {formatPrice(
                                  product?.sellingPrice
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {Number(
                                  product?.stock ||
                                    0
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`
                                  inline-flex
                                  whitespace-nowrap
                                  rounded-full
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-semibold
                                  transition-all
                                  duration-300
                                  group-hover:scale-105
                                  ${status.className}
                                `}
                              >
                                {status.text}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      product
                                    )
                                  }
                                  disabled={!!deletingId}
                                  title="Edit Product"
                                  className="
                                    group/edit
                                    rounded-lg
                                    border
                                    border-gray-200
                                    p-2
                                    text-indigo-600
                                    transition-all
                                    duration-300
                                    hover:-translate-y-1
                                    hover:bg-indigo-50
                                    hover:shadow-md
                                    active:scale-90
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    dark:border-gray-700
                                    dark:text-indigo-400
                                    dark:hover:bg-indigo-900/20
                                  "
                                >
                                  <FiEdit2
                                    size={16}
                                    className="
                                      transition-transform
                                      duration-300
                                      group-hover/edit:rotate-12
                                    "
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteProduct(
                                      product?._id
                                    )
                                  }
                                  disabled={
                                    !!deletingId
                                  }
                                  title="Delete Product"
                                  className="
                                    group/delete
                                    flex
                                    min-w-[36px]
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-gray-200
                                    p-2
                                    text-red-600
                                    transition-all
                                    duration-300
                                    hover:-translate-y-1
                                    hover:bg-red-50
                                    hover:shadow-md
                                    active:scale-90
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    dark:border-gray-700
                                    dark:text-red-400
                                    dark:hover:bg-red-900/20
                                  "
                                >
                                  {isDeleting ? (
                                    <FiLoader
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FiTrash2
                                      size={16}
                                      className="
                                        transition-transform
                                        duration-300
                                        group-hover/delete:scale-110
                                      "
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredProducts.map(
                (product, index) => {
                  const image =
                    getProductImage(
                      product?.image
                    );

                  const status =
                    getStatus(
                      product
                    );

                  const isDeleting =
                    deletingId ===
                    product?._id;

                  return (
                    <div
                      key={
                        product?._id ||
                        product?.sku
                      }
                      style={{
                        transitionDelay: `${index * 70}ms`,
                      }}
                      className="
                        group
                        relative
                        overflow-hidden
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        shadow-sm
                        transition-all
                        duration-500
                        hover:-translate-y-1
                        hover:shadow-xl
                        dark:border-gray-700
                        dark:bg-gray-800
                      "
                    >
                      <div
                        className="
                          absolute
                          left-0
                          top-0
                          h-1
                          w-0
                          bg-gradient-to-r
                          from-indigo-500
                          to-purple-500
                          transition-all
                          duration-500
                          group-hover:w-full
                        "
                      />

                      <div className="flex gap-3 p-4">
                        <div
                          className="
                            flex
                            h-16
                            w-16
                            shrink-0
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-lg
                            border
                            border-gray-200
                            bg-gray-50
                            transition-all
                            duration-500
                            group-hover:scale-105
                            group-hover:rotate-1
                            dark:border-gray-700
                            dark:bg-gray-900
                          "
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={
                                product?.name ||
                                "Product"
                              }
                              onError={
                                handleImageError
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                                transition-transform
                                duration-700
                                group-hover:scale-125
                              "
                            />
                          ) : (
                            <FiPackage className="text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-gray-900
                                  transition-colors
                                  duration-300
                                  group-hover:text-indigo-600
                                  dark:text-white
                                  dark:group-hover:text-indigo-400
                                "
                              >
                                {product?.name ||
                                  "Unnamed Product"}
                              </h3>

                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {product?.category ||
                                  "No category"}
                              </p>
                            </div>

                            <span
                              className={`
                                shrink-0
                                rounded-full
                                px-2
                                py-1
                                text-[10px]
                                font-semibold
                                transition-transform
                                duration-300
                                group-hover:scale-105
                                ${status.className}
                              `}
                            >
                              {status.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 px-4 py-4 dark:border-gray-700 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-gray-400">
                            SKU
                          </p>

                          <p className="mt-1 break-all text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {product?.sku ||
                              "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-400">
                            Purchase
                          </p>

                          <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {formatPrice(
                              product?.purchasePrice
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-400">
                            Selling
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                            {formatPrice(
                              product?.sellingPrice
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-400">
                            Stock
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white">
                            {Number(
                              product?.stock ||
                                0
                            )}
                          </p>
                        </div>

                        {product?.size && (
                          <div>
                            <p className="text-[11px] text-gray-400">
                              Size
                            </p>

                            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                              {product.size}
                            </p>
                          </div>
                        )}

                        {product?.hsnCode && (
                          <div>
                            <p className="text-[11px] text-gray-400">
                              HSN
                            </p>

                            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                              {product.hsnCode}
                            </p>
                          </div>
                        )}

                        {product?.subcategory && (
                          <div>
                            <p className="text-[11px] text-gray-400">
                              Subcategory
                            </p>

                            <p className="mt-1 truncate text-xs text-gray-700 dark:text-gray-300">
                              {
                                product.subcategory
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              product
                            )
                          }
                          disabled={!!deletingId}
                          className="
                            group/edit
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-indigo-600
                            px-3
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-indigo-700
                            hover:shadow-md
                            active:scale-95
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <FiEdit2
                            size={15}
                            className="
                              transition-transform
                              duration-300
                              group-hover/edit:rotate-12
                            "
                          />

                          Edit

                          <FiArrowUpRight
                            size={14}
                            className="
                              transition-transform
                              duration-300
                              group-hover/edit:translate-x-0.5
                              group-hover/edit:-translate-y-0.5
                            "
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(
                              product?._id
                            )
                          }
                          disabled={
                            !!deletingId
                          }
                          className="
                            group/delete
                            flex
                            min-w-[95px]
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            border
                            border-red-200
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-red-600
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-red-50
                            hover:shadow-md
                            active:scale-95
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:border-red-900/50
                            dark:text-red-400
                            dark:hover:bg-red-900/20
                          "
                        >
                          {isDeleting ? (
                            <>
                              <FiLoader
                                size={15}
                                className="animate-spin"
                              />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <FiTrash2
                                size={15}
                                className="
                                  transition-transform
                                  duration-300
                                  group-hover/delete:scale-110
                                "
                              />

                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {loadedOnce &&
          !loading &&
          products.length > 0 && (
            <div
              className="
                mt-5
                flex
                items-center
                justify-center
                gap-2
                text-xs
                text-gray-400
                transition-all
                duration-700
                dark:text-gray-500
              "
            >
              <FiPackage size={13} />

              <span>
                {filteredProducts.length} product
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}{" "}
                displayed
              </span>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default ProductAdmin;