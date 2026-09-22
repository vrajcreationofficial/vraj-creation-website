import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiSave,
  FiUpload,
  FiX,
} from "react-icons/fi";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AdminLayout from "../components/AdminLayout";
import { productAdminAPI } from "../services/api";

const CATEGORY_OPTIONS = [
  "home decor",
  "wall decor",
  "table decor",
  "resin art",
  "ethnic furnishing",
  "desk accessories",
];

const SIZE_UNITS = [
  "cm",
  "inch",
  "mm",
  "ft",
];

const blankForm = {
  name: "",
  sku: "",
  hsnCode: "",
  category: "",
  subcategory: "",
  length: "",
  breadth: "",
  height: "",
  sizeUnit: "cm",
  description: "",
  sellingPrice: "",
  stock: "",
  minimumStock: "5",
  status: "active",
};

const normalizeSku = (value = "") => {
  return String(value)
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-");
};

const normalizeHsn = (value = "") => {
  return String(value)
    .replace(/\D/g, "")
    .slice(0, 8);
};

const getProductImage = (image) => {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  const backendUrl = apiUrl.replace(
    /\/api\/?$/,
    ""
  );

  if (value.startsWith("/")) {
    return `${backendUrl}${value}`;
  }

  return `${backendUrl}/${value}`;
};

const parseSize = (size = "") => {
  if (!size) {
    return {
      length: "",
      breadth: "",
      height: "",
      sizeUnit: "cm",
    };
  }

  const value = String(size).trim();

  const unitMatch = value.match(
    /(cm|inch|mm|ft)\s*$/i
  );

  const sizeUnit = unitMatch
    ? unitMatch[1].toLowerCase()
    : "cm";

  const dimensions = value
    .replace(
      /(cm|inch|mm|ft)\s*$/i,
      ""
    )
    .trim()
    .split(/\s*[×xX*]\s*/);

  return {
    length: dimensions[0] || "",
    breadth: dimensions[1] || "",
    height: dimensions[2] || "",
    sizeUnit,
  };
};

const buildSize = (form) => {
  const parts = [
    form.length,
    form.breadth,
    form.height,
  ].filter(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

  if (!parts.length) {
    return "";
  }

  return `${parts.join(" × ")} ${
    form.sizeUnit || "cm"
  }`;
};

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] =
    useState(blankForm);

  const [existingImage, setExistingImage] =
    useState("");

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      if (!id) {
        setError(
          "Product record ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        let response;

        if (
          productAdminAPI &&
          typeof productAdminAPI.getById ===
            "function"
        ) {
          response =
            await productAdminAPI.getById(id);
        } else if (
          productAdminAPI &&
          typeof productAdminAPI.get ===
            "function"
        ) {
          response =
            await productAdminAPI.get(id);
        } else {
          const { default: api } =
            await import(
              "../services/api"
            );

          response =
            await api.get(
              `/products/${encodeURIComponent(
                id
              )}`
            );
        }

        if (!mounted) {
          return;
        }

        const product =
          response?.data?.product ||
          response?.data?.data ||
          response?.data ||
          response?.product ||
          response;

        if (!product) {
          throw new Error(
            "Product not found."
          );
        }

        const parsedSize =
          parseSize(product.size);

        setForm({
          name: String(
            product.name || ""
          ),

          sku: normalizeSku(
            product.sku ||
              product.SKU ||
              ""
          ),

          hsnCode: normalizeHsn(
            product.hsnCode || ""
          ),

          category: String(
            product.category || ""
          ),

          subcategory: String(
            product.subcategory || ""
          ),

          length:
            product.length ??
            parsedSize.length ??
            "",

          breadth:
            product.breadth ??
            parsedSize.breadth ??
            "",

          height:
            product.height ??
            parsedSize.height ??
            "",

          sizeUnit:
            product.sizeUnit ||
            parsedSize.sizeUnit ||
            "cm",

          description: String(
            product.description || ""
          ),

          sellingPrice:
            product.sellingPrice ??
            product.price ??
            "",

          stock:
            product.stock ?? "",

          minimumStock:
            product.minimumStock ?? 5,

          status:
            product.status ===
            "inactive"
              ? "inactive"
              : "active",
        });

        const image =
          product.image ||
          product.imageUrl ||
          "";

        setExistingImage(
          getProductImage(image)
        );
      } catch (err) {
        console.error(
          "Load Product Error:",
          err
        );

        if (mounted) {
          setError(
            err?.response?.data
              ?.message ||
              err?.response?.data
                ?.error ||
              err?.message ||
              "Failed to load product."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    let updatedValue = value;

    if (name === "sku") {
      updatedValue =
        normalizeSku(value);
    }

    if (name === "hsnCode") {
      updatedValue =
        normalizeHsn(value);
    }

    setForm((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

    setError("");
    setSuccess("");
  };

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image size must be less than 5MB."
      );
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);

    setError("");
    setSuccess("");
  };

  const removeNewImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImageFile(null);
    setImagePreview("");
  };

  const removeExistingImage = () => {
    setExistingImage("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    if (!form.sku.trim()) {
      return "SKU is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (
      !CATEGORY_OPTIONS.includes(
        form.category
      )
    ) {
      return "Please select a valid category.";
    }

    if (form.hsnCode) {
      const validLengths = [
        4,
        6,
        8,
      ];

      if (
        !validLengths.includes(
          form.hsnCode.length
        )
      ) {
        return (
          "HSN Code must be 4, 6 or 8 digits."
        );
      }
    }

    const sellingPrice =
      Number(form.sellingPrice);

    const stock =
      Number(form.stock);

    const minimumStock =
      Number(form.minimumStock);

    if (
      form.sellingPrice === "" ||
      !Number.isFinite(
        sellingPrice
      ) ||
      sellingPrice < 0
    ) {
      return "Please enter a valid selling price.";
    }

    if (
      form.stock === "" ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return "Please enter a valid stock quantity.";
    }

    if (
      form.minimumStock === "" ||
      !Number.isFinite(
        minimumStock
      ) ||
      minimumStock < 0
    ) {
      return "Please enter a valid minimum stock.";
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (!id) {
      setError(
        "Product record ID is missing."
      );
      return;
    }

    try {
      setSaving(true);

      const data =
        new FormData();

      data.append(
        "name",
        form.name.trim()
      );

      data.append(
        "sku",
        normalizeSku(form.sku)
      );

      data.append(
        "hsnCode",
        form.hsnCode.trim()
      );

      data.append(
        "category",
        form.category.trim()
      );

      data.append(
        "subcategory",
        form.subcategory.trim()
      );

      data.append(
        "size",
        buildSize(form)
      );

      data.append(
        "length",
        form.length
      );

      data.append(
        "breadth",
        form.breadth
      );

      data.append(
        "height",
        form.height
      );

      data.append(
        "sizeUnit",
        form.sizeUnit
      );

      data.append(
        "description",
        form.description.trim()
      );

      data.append(
        "sellingPrice",
        Number(
          form.sellingPrice
        )
      );

      data.append(
        "stock",
        Number(form.stock)
      );

      data.append(
        "minimumStock",
        Number(
          form.minimumStock
        )
      );

      data.append(
        "status",
        form.status
      );

      if (imageFile) {
        data.append(
          "image",
          imageFile
        );
      }

      if (
        productAdminAPI &&
        typeof productAdminAPI.update ===
          "function"
      ) {
        await productAdminAPI.update(
          id,
          data
        );
      } else {
        const { default: api } =
          await import(
            "../services/api"
          );

        await api.put(
          `/products/${encodeURIComponent(
            id
          )}`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      setSuccess(
        "Product updated successfully."
      );

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setImageFile(null);
      setImagePreview("");

      setTimeout(() => {
        navigate(
          "/admin/products"
        );
      }, 1000);
    } catch (err) {
      console.error(
        "Update Product Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update product."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] items-center justify-center bg-[#f7efe3] dark:bg-[#15100d]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#8f3424]/20 border-t-[#8f3424] dark:border-[#b66d4d]/20 dark:border-t-[#b66d4d]" />

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading product...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f7efe3] px-4 py-6 text-[#38271d] dark:bg-[#15100d] dark:text-[#f3e5d4] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-6">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/products"
                )
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#8f3424] transition hover:text-[#713622] dark:text-[#b66d4d]"
            >
              <FiArrowLeft
                size={17}
              />

              Back to Products
            </button>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Update product details, price, stock and image.
            </p>
          </div>

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
              <FiCheckCircle
                size={20}
              />

              <span>
                {success}
              </span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <FiX
                size={20}
                className="mt-0.5"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <section className="rounded-2xl border border-[#eadbc7] bg-white p-5 shadow-sm dark:border-[#33251d] dark:bg-[#211914] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update product identification details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div className="md:col-span-2">
                  <label
                    htmlFor="sku"
                    className="mb-2 block text-sm font-medium"
                  >
                    SKU *
                  </label>

                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    value={form.sku}
                    onChange={
                      handleChange
                    }
                    placeholder="SKU-10001"
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />

                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    SKU is the unique product identifier used throughout the application.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Product Name *
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="Product name"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hsnCode"
                    className="mb-2 block text-sm font-medium"
                  >
                    HSN Code
                  </label>

                  <input
                    id="hsnCode"
                    name="hsnCode"
                    type="text"
                    inputMode="numeric"
                    value={
                      form.hsnCode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="4 / 6 / 8 digit HSN"
                    maxLength={8}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium"
                  >
                    Category *
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm capitalize outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  >
                    <option value="">
                      Select category
                    </option>

                    {CATEGORY_OPTIONS.map(
                      (category) => (
                        <option
                          key={category}
                          value={
                            category
                          }
                          className="capitalize"
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subcategory"
                    className="mb-2 block text-sm font-medium"
                  >
                    Subcategory
                  </label>

                  <input
                    id="subcategory"
                    name="subcategory"
                    type="text"
                    value={
                      form.subcategory
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Subcategory"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#eadbc7] bg-white p-5 shadow-sm dark:border-[#33251d] dark:bg-[#211914] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">
                  Product Size
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                <div>
                  <label
                    htmlFor="length"
                    className="mb-2 block text-sm font-medium"
                  >
                    Length
                  </label>

                  <input
                    id="length"
                    name="length"
                    type="number"
                    min="0"
                    step="any"
                    value={
                      form.length
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="breadth"
                    className="mb-2 block text-sm font-medium"
                  >
                    Breadth
                  </label>

                  <input
                    id="breadth"
                    name="breadth"
                    type="number"
                    min="0"
                    step="any"
                    value={
                      form.breadth
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="height"
                    className="mb-2 block text-sm font-medium"
                  >
                    Height
                  </label>

                  <input
                    id="height"
                    name="height"
                    type="number"
                    min="0"
                    step="any"
                    value={
                      form.height
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sizeUnit"
                    className="mb-2 block text-sm font-medium"
                  >
                    Unit
                  </label>

                  <select
                    id="sizeUnit"
                    name="sizeUnit"
                    value={
                      form.sizeUnit
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  >
                    {SIZE_UNITS.map(
                      (unit) => (
                        <option
                          key={unit}
                          value={unit}
                        >
                          {unit}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {buildSize(form) && (
                <div className="mt-4 rounded-xl bg-[#f7efe3] px-4 py-3 text-sm dark:bg-[#18120f]">
                  <span className="font-medium">
                    Size Preview:
                  </span>{" "}
                  {buildSize(form)}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#eadbc7] bg-white p-5 shadow-sm dark:border-[#33251d] dark:bg-[#211914] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">
                  Price & Stock
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <div>
                  <label
                    htmlFor="sellingPrice"
                    className="mb-2 block text-sm font-medium"
                  >
                    Selling Price *
                  </label>

                  <input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.sellingPrice
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="mb-2 block text-sm font-medium"
                  >
                    Stock *
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.stock
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="minimumStock"
                    className="mb-2 block text-sm font-medium"
                  >
                    Minimum Stock
                  </label>

                  <input
                    id="minimumStock"
                    name="minimumStock"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.minimumStock
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#eadbc7] bg-white p-5 shadow-sm dark:border-[#33251d] dark:bg-[#211914] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">
                  Additional Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Product description..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#eadbc7] bg-white p-5 shadow-sm dark:border-[#33251d] dark:bg-[#211914] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">
                  Product Image
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload a new image to replace the current image.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-[#44342a] dark:bg-[#18120f]">

                  {imagePreview ? (
                    <>
                      <img
                        src={
                          imagePreview
                        }
                        alt="New product preview"
                        className="h-full max-h-[320px] w-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={
                          removeNewImage
                        }
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
                      >
                        <FiX
                          size={18}
                        />
                      </button>

                      <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white">
                        New Image
                      </div>
                    </>
                  ) : existingImage ? (
                    <>
                      <img
                        src={
                          existingImage
                        }
                        alt={
                          form.name ||
                          "Product"
                        }
                        className="h-full max-h-[320px] w-full object-contain"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      <button
                        type="button"
                        onClick={
                          removeExistingImage
                        }
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
                      >
                        <FiX
                          size={18}
                        />
                      </button>

                      <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white">
                        Current Image
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                      <FiImage
                        size={45}
                        className="mx-auto mb-3"
                      />

                      <p className="text-sm">
                        No product image
                      </p>
                    </div>
                  )}
                </div>

                <label
                  htmlFor="image"
                  className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-[#8f3424] hover:bg-[#f7efe3] dark:border-[#44342a] dark:bg-[#18120f] dark:hover:border-[#b66d4d]"
                >
                  <FiUpload
                    size={32}
                    className="mb-3 text-[#8f3424] dark:text-[#b66d4d]"
                  />

                  <span className="text-sm font-semibold">
                    Upload New Image
                  </span>

                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG or WEBP
                  </span>

                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Maximum 5MB
                  </span>

                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/products"
                  )
                }
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#44342a] dark:bg-[#211914] dark:text-gray-300"
              >
                <FiArrowLeft
                  size={17}
                />

                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f3424] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#713622] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b66d4d] dark:text-[#211914]"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave
                      size={17}
                    />

                    Update Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}