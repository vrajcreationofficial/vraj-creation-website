import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiSave,
  FiUpload,
  FiX,
} from "react-icons/fi";

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

const SIZE_UNITS = ["cm", "inch", "mm", "ft"];

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

  return `${parts.join(" × ")} ${form.sizeUnit || "cm"}`;
};

export default function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState(blankForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    let updatedValue = value;

    if (name === "sku") {
      updatedValue = normalizeSku(value);
    }

    if (name === "hsnCode") {
      updatedValue = normalizeHsn(value);
    }

    setForm((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

    setError("");
    setSuccess("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
    setError("");
    setSuccess("");
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");

    const input = document.getElementById("image");

    if (input) {
      input.value = "";
    }
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

    if (!CATEGORY_OPTIONS.includes(form.category)) {
      return "Please select a valid category.";
    }

    if (form.hsnCode) {
      const validHsnLengths = [4, 6, 8];

      if (!validHsnLengths.includes(form.hsnCode.length)) {
        return "HSN Code must be 4, 6 or 8 digits.";
      }
    }

    const sellingPrice = Number(form.sellingPrice);
    const stock = Number(form.stock);
    const minimumStock = Number(form.minimumStock);

    if (
      form.sellingPrice === "" ||
      !Number.isFinite(sellingPrice) ||
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
      !Number.isFinite(minimumStock) ||
      minimumStock < 0
    ) {
      return "Please enter a valid minimum stock.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", form.name.trim());

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
        String(Number(form.sellingPrice))
      );

      data.append(
        "stock",
        String(Number(form.stock))
      );

      data.append(
        "minimumStock",
        String(Number(form.minimumStock))
      );

      data.append(
        "status",
        form.status
      );

      if (imageFile) {
        data.append("image", imageFile);
      }

      if (
        productAdminAPI &&
        typeof productAdminAPI.create === "function"
      ) {
        await productAdminAPI.create(data);
      } else {
        const { default: api } = await import(
          "../services/api"
        );

        await api.post("/products", data);
      }

      setSuccess(
        "Product created successfully."
      );

      setForm({
        ...blankForm,
      });

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(null);
      setImagePreview("");

      const imageInput =
        document.getElementById("image");

      if (imageInput) {
        imageInput.value = "";
      }

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (err) {
      console.error(
        "Create Product Error:",
        err
      );

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.details;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : err?.message ||
            "Failed to create product."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f7efe3] px-4 py-6 text-[#38271d] dark:bg-[#15100d] dark:text-[#f3e5d4] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-6">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/products")
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#8f3424] transition hover:text-[#713622] dark:text-[#b66d4d]"
            >
              <FiArrowLeft size={17} />
              Back to Products
            </button>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Add Product
            </h1>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Add a new product to your Vraj Creation catalog.
            </p>
          </div>

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
              <FiCheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <FiX
                size={20}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
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
                  Enter product identification details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="sku"
                    className="mb-2 block text-sm font-medium"
                  >
                    SKU
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="SKU-10001"
                    autoComplete="off"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  />

                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    SKU is the unique identifier for this product.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Product Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
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
                    value={form.hsnCode}
                    onChange={handleChange}
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
                    Category
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm capitalize outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10 dark:border-[#44342a] dark:bg-[#18120f]"
                  >
                    <option value="">
                      Select category
                    </option>

                    {CATEGORY_OPTIONS.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
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
                    value={form.subcategory}
                    onChange={handleChange}
                    placeholder="Enter subcategory"
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
                    value={form.length}
                    onChange={handleChange}
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
                    value={form.breadth}
                    onChange={handleChange}
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
                    value={form.height}
                    onChange={handleChange}
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
                    value={form.sizeUnit}
                    onChange={handleChange}
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
                    value={form.sellingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
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
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                    required
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
                    value={form.minimumStock}
                    onChange={handleChange}
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

              <div className="grid grid-cols-1 gap-5">

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
                    value={form.status}
                    onChange={handleChange}
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

                <div>
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
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter product description..."
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
                  JPG, PNG or WEBP up to 5MB.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <label
                  htmlFor="image"
                  className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-[#8f3424] hover:bg-[#f7efe3] dark:border-[#44342a] dark:bg-[#18120f] dark:hover:border-[#b66d4d]"
                >
                  <FiUpload
                    size={32}
                    className="mb-3 text-[#8f3424] dark:text-[#b66d4d]"
                  />

                  <span className="text-sm font-semibold">
                    Choose Product Image
                  </span>

                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click to upload
                  </span>

                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-[#44342a] dark:bg-[#18120f]">

                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="h-full max-h-[300px] w-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
                      >
                        <FiX size={18} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                      <FiImage
                        size={42}
                        className="mx-auto mb-3"
                      />

                      <p className="text-sm">
                        Image preview will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/products")
                }
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#44342a] dark:bg-[#211914] dark:text-gray-300"
              >
                <FiArrowLeft size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f3424] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#713622] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b66d4d] dark:text-[#211914]"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave size={17} />
                    Create Product
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
