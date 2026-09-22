import {
  FiCheck,
  FiPackage,
  FiImage,
  FiGift,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import AddToCartButton from "./AddToCartButton";

import { useDiscount } from "../context/DiscountContext";

// ==========================================================
// API SERVER URL
// ==========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const API_SERVER_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

// ==========================================================
// PRODUCT IMAGE HELPER
// ==========================================================

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
    cleanImage.startsWith("data:")
  ) {
    return cleanImage;
  }

  return `${API_SERVER_URL}/${cleanImage.replace(
    /^\/+/,
    ""
  )}`;
};

// ==========================================================
// ROUND
// ==========================================================

const round2 = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  );
};

// ==========================================================
// PRODUCT CARD
// ==========================================================

const ProductCard = ({ product }) => {
  const discountContext =
    useDiscount();

  if (!product) {
    return null;
  }

  // ==========================================================
  // SPIN & WIN DATA
  // ==========================================================

  const spinDiscountData =
    discountContext?.spinDiscountData ||
    null;

  const spinDiscountPercentage =
    Number(
      discountContext?.spinDiscountPercentage ||
        spinDiscountData?.discount ||
        0
    );

  const isSpinDiscountActive =
    Boolean(
      spinDiscountData &&
        spinDiscountPercentage > 0
    );

  // ==========================================================
  // SKU
  // ==========================================================

  const sku = String(
    product.sku ||
      product.SKU ||
      ""
  )
    .trim()
    .toUpperCase();

  // ==========================================================
  // LIVE PRICE
  // ==========================================================

  const rawPrice =
    product.sellingPrice ??
    product.price;

  const price = Number(rawPrice);

  const hasValidPrice =
    rawPrice !== null &&
    rawPrice !== undefined &&
    rawPrice !== "" &&
    Number.isFinite(price) &&
    price >= 0;

  // ==========================================================
  // SPIN PRODUCT ELIGIBILITY
  // ==========================================================

  let isProductEligibleForSpin =
    false;

  if (
    isSpinDiscountActive &&
    typeof discountContext?.isProductEligible ===
      "function"
  ) {
    isProductEligibleForSpin =
      discountContext.isProductEligible(
        product
      );
  } else if (
    isSpinDiscountActive
  ) {
    isProductEligibleForSpin = true;
  }

  // ==========================================================
  // SPIN DISCOUNT FOR THIS PRODUCT
  // ==========================================================

  let productSpinDiscountPercentage =
    0;

  if (
    isSpinDiscountActive &&
    isProductEligibleForSpin
  ) {
    productSpinDiscountPercentage =
      spinDiscountPercentage;
  }

  // ==========================================================
  // SPIN DISCOUNT AMOUNT
  // ==========================================================

  const spinDiscountAmount =
    hasValidPrice &&
    productSpinDiscountPercentage > 0
      ? round2(
          (price *
            productSpinDiscountPercentage) /
            100
        )
      : 0;

  // ==========================================================
  // PRICE AFTER SPIN DISCOUNT
  // ==========================================================

  const priceAfterSpinDiscount =
    hasValidPrice
      ? round2(
          Math.max(
            0,
            price -
              spinDiscountAmount
          )
        )
      : 0;

  const hasProductSpinDiscount =
    isSpinDiscountActive &&
    isProductEligibleForSpin &&
    spinDiscountAmount > 0;

  // ==========================================================
  // LIVE STOCK
  // ==========================================================

  const rawStock = product.stock;

  const stock = Number(rawStock);

  const hasValidStock =
    rawStock !== null &&
    rawStock !== undefined &&
    rawStock !== "" &&
    Number.isFinite(stock) &&
    stock >= 0;

  // ==========================================================
  // STATUS
  // ==========================================================

  const isActive =
    String(
      product.status || "active"
    ).toLowerCase() === "active";

  // ==========================================================
  // OUT OF STOCK
  // ==========================================================

  const isOutOfStock =
    !hasValidStock ||
    stock <= 0 ||
    !isActive;

  // ==========================================================
  // PRICE FORMAT
  // ==========================================================

  const formatPrice = (value) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  };

  const formattedPrice =
    hasValidPrice
      ? formatPrice(price)
      : "Price unavailable";

  const formattedSpinPrice =
    hasProductSpinDiscount
      ? formatPrice(
          priceAfterSpinDiscount
        )
      : formattedPrice;

  // ==========================================================
  // PRODUCT IMAGE
  // ==========================================================

  const image = getProductImage(
    product.image
  );

  // ==========================================================
  // WHATSAPP
  // ==========================================================

  const whatsappNumber =
    "918824968974";

  const whatsappMessage =
    encodeURIComponent(
      `Hello Vraj Creation,

I am interested in this product:

Product: ${
        product.name ||
        "Handcrafted Product"
      }

SKU: ${
        sku || "N/A"
      }

Price: ${
        hasValidPrice
          ? formattedPrice
          : "Please confirm price"
      }

${
  hasProductSpinDiscount
    ? `Spin & Win Discount: ${productSpinDiscountPercentage}% OFF
Spin Discount Price: ${formattedSpinPrice}`
    : ""
}

GST will be applicable separately.

Please share more details.`
    );

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ==========================================================
  // CART PRODUCT
  // ==========================================================

  const cartProduct = {
    ...product,

    _id:
      product._id,

    id:
      product.id ||
      product._id,

    sku:
      sku,

    price:
      hasValidPrice
        ? price
        : null,

    sellingPrice:
      hasValidPrice
        ? price
        : null,

    stock:
      hasValidStock
        ? stock
        : null,
  };

  // ==========================================================
  // IMAGE ERROR HANDLER
  // ==========================================================

  const handleImageError = (
    event
  ) => {
    const img =
      event.currentTarget;

    img.style.display = "none";

    const parent =
      img.parentElement;

    if (!parent) {
      return;
    }

    const existingFallback =
      parent.querySelector(
        "[data-image-fallback]"
      );

    if (existingFallback) {
      return;
    }

    const fallback =
      document.createElement(
        "div"
      );

    fallback.setAttribute(
      "data-image-fallback",
      "true"
    );

    fallback.className =
      "absolute inset-0 flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500";

    fallback.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-2">
        <span class="text-gray-400">
          Image not available
        </span>
      </div>
    `;

    parent.appendChild(
      fallback
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:shadow-xl
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      {/* ======================================================
          IMAGE
      ====================================================== */}

      <div
        className="
          relative
          aspect-[4/3]
          overflow-hidden
          bg-gray-100
          dark:bg-gray-800
        "
      >
        {image ? (
          <img
            src={image}
            alt={
              product.name ||
              "Vraj Creation Product"
            }
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
            loading="lazy"
            onError={
              handleImageError
            }
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              flex-col
              items-center
              justify-center
              gap-2
              text-gray-400
              dark:text-gray-500
            "
          >
            <FiImage
              size={35}
            />

            <span className="text-xs">
              Image not available
            </span>
          </div>
        )}

        {/* CATEGORY */}

        {product.category && (
          <span
            className="
              absolute
              left-3
              top-3
              rounded-full
              bg-black/70
              px-3
              py-1
              text-xs
              font-medium
              text-white
              backdrop-blur-sm
            "
          >
            {product.category}
          </span>
        )}

        {/* ==================================================
            SPIN & WIN IMAGE BADGE
        ================================================== */}

        {hasProductSpinDiscount && (
          <div
            className="
              absolute
              right-3
              top-3
              flex
              items-center
              gap-1.5
              rounded-full
              bg-gradient-to-r
              from-pink-600
              via-purple-600
              to-indigo-600
              px-3
              py-1.5
              text-xs
              font-bold
              text-white
              shadow-lg
              shadow-purple-500/30
            "
          >
            <FiGift
              size={14}
            />

            {productSpinDiscountPercentage}% OFF
          </div>
        )}

        {/* ==================================================
            SPIN WIN CORNER LABEL
        ================================================== */}

        {hasProductSpinDiscount && (
          <div
            className="
              absolute
              bottom-3
              left-3
              rounded-lg
              bg-white/95
              px-3
              py-1.5
              text-xs
              font-bold
              text-purple-700
              shadow-md
              backdrop-blur-sm
              dark:bg-gray-900/95
              dark:text-purple-300
            "
          >
            🎉 Spin & Win
          </div>
        )}
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="p-5">

        {/* ==================================================
            SPIN & WIN DISCOUNT ANNOUNCEMENT
        ================================================== */}

        {hasProductSpinDiscount && (
          <div
            className="
              mb-4
              rounded-xl
              border
              border-purple-200
              bg-gradient-to-r
              from-purple-50
              to-pink-50
              p-3
              dark:border-purple-800
              dark:from-purple-950/30
              dark:to-pink-950/30
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-purple-600
                  text-white
                "
              >
                <FiGift
                  size={16}
                />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    text-purple-800
                    dark:text-purple-300
                  "
                >
                  Spin & Win Reward
                </p>

                <p
                  className="
                    text-xs
                    text-purple-600
                    dark:text-purple-400
                  "
                >
                  Your {productSpinDiscountPercentage}% discount is active
                </p>
              </div>
            </div>

            {spinDiscountData?.couponCode && (
              <div
                className="
                  mt-2
                  text-[11px]
                  text-purple-600
                  dark:text-purple-400
                "
              >
                Coupon:{" "}
                <span className="font-bold">
                  {
                    spinDiscountData.couponCode
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {/* NAME */}

        <h3
          className="
            line-clamp-2
            text-lg
            font-bold
            text-gray-900
            dark:text-white
          "
        >
          {product.name ||
            "Handcrafted Product"}
        </h3>

        {/* DESCRIPTION */}

        {product.description && (
          <p
            className="
              mt-2
              line-clamp-2
              text-sm
              leading-6
              text-gray-600
              dark:text-gray-400
            "
          >
            {product.description}
          </p>
        )}

        {/* PRICE + STOCK */}

        <div
          className="
            mt-4
            flex
            items-start
            justify-between
            gap-4
          "
        >
          {/* PRICE */}

          <div>
            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Price
            </p>

            {hasProductSpinDiscount ? (
              <>
                <div
                  className="
                    mt-1
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <p
                    className="
                      text-2xl
                      font-bold
                      text-[#8f3424]
                      dark:text-[#dca34f]
                    "
                  >
                    {formattedSpinPrice}
                  </p>

                  <span
                    className="
                      rounded-md
                      bg-green-100
                      px-2
                      py-1
                      text-xs
                      font-bold
                      text-green-700
                      dark:bg-green-900/30
                      dark:text-green-400
                    "
                  >
                    {productSpinDiscountPercentage}% OFF
                  </span>
                </div>

                <div
                  className="
                    mt-1
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      text-sm
                      text-gray-400
                      line-through
                      dark:text-gray-500
                    "
                  >
                    {formattedPrice}
                  </span>

                  <span
                    className="
                      text-xs
                      font-semibold
                      text-green-600
                      dark:text-green-400
                    "
                  >
                    Save{" "}
                    {formatPrice(
                      spinDiscountAmount
                    )}
                  </span>
                </div>
              </>
            ) : (
              <p
                className="
                  text-2xl
                  font-bold
                  text-[#8f3424]
                  dark:text-[#dca34f]
                "
              >
                {formattedPrice}
              </p>
            )}

            {/* GST APPLICABLE */}

            <span
              className="
                mt-1
                inline-flex
                items-center
                rounded-md
                bg-amber-50
                px-2
                py-0.5
                text-[11px]
                font-semibold
                text-amber-700
                dark:bg-amber-900/20
                dark:text-amber-400
              "
            >
              + GST applicable
            </span>
          </div>

          {/* STOCK */}

          <div
            className="
              flex
              items-center
              gap-1.5
              pt-5
              text-sm
            "
          >
            <FiPackage
              size={15}
            />

            {isOutOfStock ? (
              <span
                className="
                  font-medium
                  text-red-500
                "
              >
                Out of Stock
              </span>
            ) : (
              <span
                className="
                  font-medium
                  text-green-600
                  dark:text-green-400
                "
              >
                {stock} in stock
              </span>
            )}
          </div>
        </div>

        {/* ==================================================
            SPIN SAVING MESSAGE
        ================================================== */}

        {hasProductSpinDiscount && (
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              rounded-lg
              bg-green-50
              px-3
              py-2
              dark:bg-green-900/20
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-green-700
                dark:text-green-400
              "
            >
              🎁 Spin & Win Saving
            </span>

            <span
              className="
                text-sm
                font-bold
                text-green-700
                dark:text-green-400
              "
            >
              -{formatPrice(
                spinDiscountAmount
              )}
            </span>
          </div>
        )}

        {/* PRODUCT DETAILS */}

        <div
          className="
            mt-4
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            p-3
            dark:border-gray-800
            dark:bg-gray-950
          "
        >
          {/* SKU */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              text-sm
            "
          >
            <span
              className="
                text-gray-500
                dark:text-gray-400
              "
            >
              SKU
            </span>

            <span
              className="
                max-w-[60%]
                truncate
                text-right
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              {sku || "N/A"}
            </span>
          </div>

          {/* SIZE */}

          {product.size && (
            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                gap-3
                text-sm
              "
            >
              <span
                className="
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Size
              </span>

              <span
                className="
                  text-right
                  text-gray-800
                  dark:text-gray-200
                "
              >
                {product.size}
              </span>
            </div>
          )}
        </div>

        {/* FEATURES */}

        <div className="mt-4 space-y-2">

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              text-gray-600
              dark:text-gray-400
            "
          >
            <FiCheck
              className="text-green-500"
              size={15}
            />

            Handcrafted Design
          </div>

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              text-gray-600
              dark:text-gray-400
            "
          >
            <FiCheck
              className="text-green-500"
              size={15}
            />

            Traditional Indian Craft
          </div>

        </div>

        {/* BUTTONS */}

        <div className="mt-5 space-y-2">

          <AddToCartButton
            product={cartProduct}
          />

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-green-600
              px-4
              py-3
              text-sm
              font-semibold
              text-green-600
              transition
              hover:bg-green-600
              hover:text-white
            "
          >
            <FaWhatsapp
              size={17}
            />

            Enquire on WhatsApp
          </a>

        </div>

      </div>
    </article>
  );
};

export default ProductCard;