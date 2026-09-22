
import { useState, useEffect, useRef } from "react";
import {
  FiArrowUpRight,
  FiX,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiImage,
} from "react-icons/fi";
import { useProducts } from "../context/ProductContext";

// =====================================================
// API CONFIG
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const API_SERVER_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

// =====================================================
// IMAGE HELPER
// =====================================================

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

// =====================================================
// SKU HELPER
// =====================================================

const getProductSKU = (product) => {
  return String(
    product?.sku ||
      product?.SKU ||
      product?.productSku ||
      ""
  )
    .trim()
    .toUpperCase();
};

// =====================================================
// COMPONENT
// =====================================================

export default function CollectionShowcase() {
  const {
    products,
    loading,
    error,
  } = useProducts();

  const [activeItem, setActiveItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef(null);

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveItem(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // =====================================================
  // AUTO SLIDER
  // =====================================================

  useEffect(() => {
    if (
      isPaused ||
      activeItem ||
      loading ||
      products.length === 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      if (!sliderRef.current) {
        return;
      }

      const {
        scrollLeft,
        scrollWidth,
        clientWidth,
      } = sliderRef.current;

      if (
        scrollLeft + clientWidth >=
        scrollWidth - 10
      ) {
        sliderRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        sliderRef.current.scrollBy({
          left: clientWidth * 0.8,
          behavior: "smooth",
        });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [
    isPaused,
    activeItem,
    loading,
    products.length,
  ]);

  // =====================================================
  // MANUAL SLIDER
  // =====================================================

  const scrollSlider = (direction) => {
    if (!sliderRef.current) {
      return;
    }

    const {
      scrollLeft,
      clientWidth,
      scrollWidth,
    } = sliderRef.current;

    const scrollAmount = clientWidth * 0.8;

    if (direction === "left") {
      if (scrollLeft <= 10) {
        sliderRef.current.scrollTo({
          left: scrollWidth,
          behavior: "smooth",
        });
      } else {
        sliderRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      }
    } else {
      if (
        scrollLeft + clientWidth >=
        scrollWidth - 10
      ) {
        sliderRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        sliderRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  // =====================================================
  // PRODUCT CLICK
  // =====================================================

  const handleProductClick = (product) => {
    setActiveItem(product);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setActiveItem(null);
  };

  return (
    <>
      <section
        id="categories"
        className="
          relative
          w-full
          overflow-hidden
          bg-[#f8f5f0]
          py-24
          transition-colors
          duration-500
          sm:py-32
          dark:bg-[#080605]
        "
      >
        {/* =================================================
            AMBIENT GLOWS
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            -left-32
            top-1/4
            h-96
            w-96
            rounded-full
            bg-[#8f3424]/5
            blur-[120px]
            dark:bg-[#8f3424]/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-32
            bottom-1/4
            h-96
            w-96
            rounded-full
            bg-[#dca34f]/8
            blur-[120px]
            dark:bg-[#dca34f]/5
          "
        />

        <div
          className="
            relative
            mx-auto
            max-w-7xl
            px-4
            sm:px-6
            lg:px-8
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              mb-16
              flex
              flex-col
              items-start
              justify-between
              gap-6
              border-b
              border-[#e6dfd5]
              pb-10
              sm:flex-row
              sm:items-end
              dark:border-[#221c18]
            "
          >
            <div>
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                "
              >
                <FiStar
                  className="
                    text-[#8f3424]
                    dark:text-[#dca34f]
                  "
                  size={14}
                />

                <span
                  className="
                    text-[11px]
                    font-mono
                    uppercase
                    tracking-[0.3em]
                    text-[#8c6d53]
                    dark:text-[#b39276]
                  "
                >
                  // 02. Exhibition
                </span>
              </div>

              <h2
                className="
                  text-3xl
                  font-light
                  tracking-tight
                  text-[#1a1714]
                  sm:text-5xl
                  lg:text-6xl
                  dark:text-[#f4f0eb]
                "
              >
                Complete Product{" "}

                <span
                  className="
                    font-serif
                    italic
                    font-normal
                    text-[#8f3424]
                    dark:text-[#dca34f]
                  "
                >
                  Showcase
                </span>
              </h2>
            </div>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  scrollSlider("left")
                }
                aria-label="Scroll Left"
                disabled={
                  loading ||
                  products.length === 0
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dcd2c4]
                  bg-white
                  text-[#1a1714]
                  shadow-sm
                  transition-all
                  duration-300
                  hover:border-[#8f3424]
                  hover:bg-[#8f3424]
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-[#2b211b]
                  dark:bg-[#16100d]
                  dark:text-[#f4f0eb]
                  dark:hover:border-[#dca34f]
                  dark:hover:bg-[#dca34f]
                  dark:hover:text-[#080605]
                "
              >
                <FiChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollSlider("right")
                }
                aria-label="Scroll Right"
                disabled={
                  loading ||
                  products.length === 0
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dcd2c4]
                  bg-white
                  text-[#1a1714]
                  shadow-sm
                  transition-all
                  duration-300
                  hover:border-[#8f3424]
                  hover:bg-[#8f3424]
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-[#2b211b]
                  dark:bg-[#16100d]
                  dark:text-[#f4f0eb]
                  dark:hover:border-[#dca34f]
                  dark:hover:bg-[#dca34f]
                  dark:hover:text-[#080605]
                "
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div
              className="
                flex
                gap-8
                overflow-hidden
              "
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    min-w-[280px]
                    animate-pulse
                    overflow-hidden
                    rounded-2xl
                    bg-[#efe8dc]
                    sm:min-w-[340px]
                    lg:min-w-[380px]
                    dark:bg-[#14100e]
                  "
                >
                  <div
                    className="
                      h-[440px]
                      bg-[#e5dccf]
                      dark:bg-[#1b1512]
                    "
                  />
                </div>
              ))}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div
              className="
                mx-auto
                max-w-xl
                rounded-2xl
                border
                border-red-200
                bg-red-50
                p-8
                text-center
                dark:border-red-900/40
                dark:bg-red-950/20
              "
            >
              <p
                className="
                  text-sm
                  font-semibold
                  text-red-700
                  dark:text-red-400
                "
              >
                Unable to load products right now.
              </p>
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            products.length === 0 && (
              <div
                className="
                  mx-auto
                  max-w-xl
                  rounded-2xl
                  border
                  border-dashed
                  border-[#d4c5b2]
                  p-12
                  text-center
                  dark:border-[#38281e]
                "
              >
                <FiLayers
                  size={32}
                  className="
                    mx-auto
                    text-[#8f3424]
                    dark:text-[#dca34f]
                  "
                />

                <h3
                  className="
                    mt-5
                    text-xl
                    font-medium
                    text-[#1a1714]
                    dark:text-[#f4f0eb]
                  "
                >
                  No Products Available
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-[#736357]
                    dark:text-[#a6988d]
                  "
                >
                  Products added from the dashboard
                  will appear here automatically.
                </p>
              </div>
            )}

          {/* =================================================
              LIVE PRODUCT SLIDER
          ================================================= */}

          {!loading &&
            !error &&
            products.length > 0 && (
              <div
                ref={sliderRef}
                onMouseEnter={() =>
                  setIsPaused(true)
                }
                onMouseLeave={() =>
                  setIsPaused(false)
                }
                className="
                  flex
                  snap-x
                  snap-mandatory
                  gap-8
                  overflow-x-auto
                  pb-8
                  pt-2
                  scrollbar-none
                  [-ms-overflow-style:none]
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                "
              >
                {products.map((item, idx) => {
                  const sku = getProductSKU(item);

                  const productKey =
                    sku || `product-${idx}`;

                  const imageUrl =
                    getProductImage(
                      item.image
                    );

                  return (
                    <div
                      key={productKey}
                      data-aos="fade-up"
                      data-aos-delay={
                        (idx % 4) * 60
                      }
                      onClick={() =>
                        handleProductClick(item)
                      }
                      className="
                        group
                        relative
                        flex
                        min-w-[280px]
                        cursor-pointer
                        snap-start
                        flex-col
                        justify-between
                        overflow-hidden
                        rounded-2xl
                        bg-[#efe8dc]
                        h-[440px]
                        transition-all
                        duration-500
                        hover:-translate-y-2
                        sm:min-w-[340px]
                        sm:h-[480px]
                        lg:min-w-[380px]
                        dark:bg-[#14100e]
                      "
                    >
                      {/* =================================================
                          IMAGE
                      ================================================= */}

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={
                            item.name ||
                            "Vraj Creation Product"
                          }
                          loading="lazy"
                          className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            object-center
                            transition-transform
                            duration-700
                            ease-out
                            group-hover:scale-105
                            filter
                            saturate-[0.9]
                            group-hover:saturate-100
                          "
                          onError={(event) => {
                            const img =
                              event.currentTarget;

                            img.style.display =
                              "none";

                            const parent =
                              img.parentElement;

                            if (
                              parent &&
                              !parent.querySelector(
                                "[data-showcase-fallback]"
                              )
                            ) {
                              const fallback =
                                document.createElement(
                                  "div"
                                );

                              fallback.setAttribute(
                                "data-showcase-fallback",
                                "true"
                              );

                              fallback.className =
                                "absolute inset-0 flex items-center justify-center bg-[#efe8dc] dark:bg-[#14100e]";

                              fallback.innerHTML = `
                                <div class="flex flex-col items-center justify-center gap-3 text-center">
                                  <span class="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-[#8c6d53] dark:bg-white/5 dark:text-[#b39276]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                      <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                  </span>
                                  <span class="px-6 text-center text-sm text-[#8c6d53] dark:text-[#b39276]">
                                    Image not available
                                  </span>
                                </div>
                              `;

                              parent.appendChild(
                                fallback
                              );
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-[#efe8dc]
                            dark:bg-[#14100e]
                          "
                        >
                          <div
                            className="
                              flex
                              flex-col
                              items-center
                              gap-3
                              text-[#8c6d53]
                              dark:text-[#b39276]
                            "
                          >
                            <FiImage size={32} />

                            <span className="text-sm">
                              No image available
                            </span>
                          </div>
                        </div>
                      )}

                      {/* =================================================
                          GRADIENT
                      ================================================= */}

                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-black/60
                          via-transparent
                          to-transparent
                          opacity-70
                          transition-opacity
                          duration-500
                          group-hover:opacity-90
                        "
                      />

                      {/* =================================================
                          TOP
                      ================================================= */}

                      <div
                        className="
                          relative
                          z-10
                          flex
                          items-center
                          justify-between
                          p-6
                        "
                      >
                        <span
                          className="
                            max-w-[75%]
                            truncate
                            rounded-full
                            bg-black/40
                            px-3
                            py-1
                            text-[10px]
                            font-mono
                            tracking-wider
                            text-white
                            backdrop-blur-md
                          "
                        >
                          {item.category ||
                            "Handcrafted Art"}
                        </span>

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            backdrop-blur-md
                            transition-all
                            duration-500
                            group-hover:rotate-45
                            group-hover:bg-[#8f3424]
                            dark:group-hover:bg-[#dca34f]
                            dark:group-hover:text-black
                          "
                        >
                          <FiArrowUpRight
                            className="text-base"
                          />
                        </div>
                      </div>

                      {/* =================================================
                          BOTTOM CONTENT
                      ================================================= */}

                      <div
                        className="
                          relative
                          z-10
                          p-6
                          sm:p-8
                        "
                      >
                        <span
                          className="
                            text-[10px]
                            font-mono
                            uppercase
                            tracking-[0.2em]
                            text-[#dca34f]
                          "
                        >
                          // Vraj Creation
                        </span>

                        <h3
                          className="
                            mt-1
                            line-clamp-1
                            text-2xl
                            font-medium
                            tracking-tight
                            text-white
                            sm:text-3xl
                          "
                        >
                          {item.name}
                        </h3>

                        {/* LIVE PRICE */}

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          {item.sellingPrice !==
                            null &&
                            item.sellingPrice !==
                              undefined && (
                              <>
                                <span
                                  className="
                                    text-sm
                                    font-bold
                                    text-white
                                  "
                                >
                                  ₹
                                  {Number(
                                    item.sellingPrice
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>

                                <span
                                  className="
                                    rounded-md
                                    bg-white/15
                                    px-2
                                    py-0.5
                                    text-[9px]
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-white/90
                                    backdrop-blur-sm
                                  "
                                >
                                  + GST applicable
                                </span>
                              </>
                            )}

                          {item.stock !== null &&
                            item.stock !==
                              undefined && (
                              <span
                                className="
                                  text-[10px]
                                  font-mono
                                  uppercase
                                  tracking-wider
                                  text-white/70
                                "
                              >
                                {item.stock > 0
                                  ? `${item.stock} in stock`
                                  : "Out of stock"}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </section>

      {/* =====================================================
          LIGHTBOX MODAL
      ===================================================== */}

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/80
            p-4
            backdrop-blur-md
            sm:p-6
          "
          onClick={closeModal}
        >
          <div
            className="
              relative
              flex
              max-h-[90vh]
              w-full
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-3xl
              border
              border-[#e6dfd5]
              bg-[#f8f5f0]
              shadow-2xl
              dark:border-[#221c18]
              dark:bg-[#080605]
              animate-in
              fade-in
              zoom-in-95
              duration-300
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="
                absolute
                right-4
                top-4
                z-20
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-black/40
                text-white
                backdrop-blur-md
                transition-all
                duration-300
                hover:bg-[#8f3424]
                dark:hover:bg-[#dca34f]
                dark:hover:text-black
              "
            >
              <FiX size={18} />
            </button>

            {/* IMAGE */}

            <div
              className="
                relative
                aspect-[16/9]
                w-full
                overflow-hidden
                bg-[#efe8dc]
                dark:bg-[#14100e]
              "
            >
              {(() => {
                const activeImage =
                  getProductImage(
                    activeItem.image
                  );

                if (!activeImage) {
                  return (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        flex-col
                        items-center
                        justify-center
                        gap-3
                        text-[#8c6d53]
                        dark:text-[#b39276]
                      "
                    >
                      <FiImage size={40} />

                      <span className="text-sm">
                        No image available
                      </span>
                    </div>
                  );
                }

                return (
                  <img
                    src={activeImage}
                    alt={
                      activeItem.name ||
                      "Vraj Creation Product"
                    }
                    className="
                      h-full
                      w-full
                      object-cover
                      object-center
                    "
                    onError={(event) => {
                      const img =
                        event.currentTarget;

                      img.style.display =
                        "none";

                      const parent =
                        img.parentElement;

                      if (
                        parent &&
                        !parent.querySelector(
                          "[data-lightbox-fallback]"
                        )
                      ) {
                        const fallback =
                          document.createElement(
                            "div"
                          );

                        fallback.setAttribute(
                          "data-lightbox-fallback",
                          "true"
                        );

                        fallback.className =
                          "flex h-full w-full flex-col items-center justify-center gap-3 text-[#8c6d53] dark:text-[#b39276]";

                        fallback.innerHTML = `
                          <span class="text-sm">
                            Image not available
                          </span>
                        `;

                        parent.appendChild(
                          fallback
                        );
                      }
                    }}
                  />
                );
              })()}
            </div>

            {/* DETAILS */}

            <div className="p-6 sm:p-8">
              <span
                className="
                  text-xs
                  font-mono
                  uppercase
                  tracking-widest
                  text-[#8c6d53]
                  dark:text-[#b39276]
                "
              >
                {activeItem.category ||
                  "Handcrafted Masterpiece"}
              </span>

              <h3
                className="
                  mt-2
                  text-2xl
                  font-medium
                  tracking-tight
                  text-[#1a1714]
                  sm:text-3xl
                  dark:text-[#f4f0eb]
                "
              >
                {activeItem.name}
              </h3>

              {/* SKU */}

              {getProductSKU(activeItem) && (
                <p
                  className="
                    mt-2
                    text-xs
                    font-mono
                    uppercase
                    tracking-wider
                    text-[#8c6d53]
                    dark:text-[#b39276]
                  "
                >
                  SKU: {getProductSKU(activeItem)}
                </p>
              )}

              {/* PRICE */}

              {activeItem.sellingPrice !==
                null &&
                activeItem.sellingPrice !==
                  undefined && (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <p
                        className="
                          text-xl
                          font-bold
                          text-[#8f3424]
                          dark:text-[#dca34f]
                        "
                      >
                        ₹
                        {Number(
                          activeItem.sellingPrice
                        ).toLocaleString("en-IN")}
                      </p>

                      <span
                        className="
                          rounded-md
                          bg-amber-50
                          px-2
                          py-1
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-amber-700
                          dark:bg-amber-900/20
                          dark:text-amber-400
                        "
                      >
                        + GST applicable
                      </span>
                    </div>
                  </div>
                )}

              <p
                className="
                  mt-3
                  text-sm
                  leading-relaxed
                  text-[#736357]
                  dark:text-[#a6988d]
                "
              >
                {activeItem.description ||
                  "This exclusive piece is meticulously forged and hand-finished by generational master artisans in Jodhpur, bringing timeless cultural heritage and modern spatial design to your interior."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}