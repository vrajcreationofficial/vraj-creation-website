import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronRight,
  FiCreditCard,
  FiGift,
  FiLoader,
  FiLock,
  FiMapPin,
  FiMail,
  FiPackage,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiX,
  FiExternalLink,
} from "react-icons/fi";
import { QRCodeCanvas } from "qrcode.react";

import { useCart } from "../context/CartContext";
import { useDiscount } from "../context/DiscountContext";

// =====================================================
// API CONFIG
// =====================================================

const VRAJ_API =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5000/api";

const VRAJ_SERVER_URL =
  VRAJ_API.replace(/\/api\/?$/, "");

// =====================================================
// VRAJ CREATION PAYMENT
// =====================================================

const VRAJ_UPI_ID = "8824968974@ybl";
const VRAJ_UPI_NAME = "Vraj Creation";

// =====================================================
// GST CONFIG
// =====================================================

const BUSINESS_STATE = "Rajasthan";

const GST_RATE = 5;
const CGST_RATE = 2.5;
const SGST_RATE = 2.5;

const FREE_SHIPPING_THRESHOLD = 999;

// =====================================================
// HELPERS
// =====================================================

const safeNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const round2 = (value) => {
  return Number(
    safeNumber(value, 0).toFixed(2)
  );
};

const formatPrice = (value) => {
  return `₹${round2(value).toFixed(2)}`;
};

const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

const normalizeSKU = (value) => {
  return String(value ?? "")
    .trim();
};

const isValidPincode = (value) => {
  return /^[1-9][0-9]{5}$/.test(
    String(value ?? "")
      .trim()
      .replace(/\s+/g, "")
  );
};

const getProductSKU = (item) => {
  return normalizeSKU(
    item?.sku ||
      item?.SKU ||
      item?.productSku ||
      item?.productSKU ||
      item?.product?.sku ||
      item?.product?.SKU ||
      ""
  );
};

const getProductName = (item) => {
  return (
    item?.name ||
    item?.productName ||
    item?.title ||
    item?.product?.name ||
    item?.product?.title ||
    "Product"
  );
};

const getCategory = (item) => {
  return (
    item?.category ||
    item?.product?.category ||
    ""
  );
};

const getSubcategory = (item) => {
  return (
    item?.subcategory ||
    item?.subCategory ||
    item?.product?.subcategory ||
    item?.product?.subCategory ||
    ""
  );
};

const getProductImage = (item) => {
  return (
    item?.image ||
    item?.imageUrl ||
    item?.productImage ||
    item?.product?.image ||
    item?.product?.imageUrl ||
    ""
  );
};

const getDescription = (item) => {
  return (
    item?.description ||
    item?.product?.description ||
    ""
  );
};

const getSize = (item) => {
  return (
    item?.size ||
    item?.product?.size ||
    ""
  );
};

const getQuantity = (item) => {
  return Math.max(
    1,
    Math.floor(
      safeNumber(
        item?.quantity ??
          item?.qty ??
          item?.count ??
          1,
        1
      )
    )
  );
};

const getWeight = (item) => {
  return Math.max(
    0,
    safeNumber(
      item?.weightGrams ??
        item?.weight ??
        item?.product?.weightGrams ??
        item?.product?.weight ??
        0
    )
  );
};

const getOriginalPrice = (item) => {
  const value =
    item?.originalPrice ??
    item?.mrp ??
    item?.price ??
    item?.product?.originalPrice ??
    item?.product?.mrp ??
    item?.product?.price ??
    0;

  return Math.max(
    0,
    safeNumber(value, 0)
  );
};

const getSellingPrice = (item) => {
  const value =
    item?.sellingPrice ??
    item?.salePrice ??
    item?.price ??
    item?.product?.sellingPrice ??
    item?.product?.salePrice ??
    item?.product?.price ??
    0;

  return Math.max(
    0,
    safeNumber(value, 0)
  );
};

const getDiscountPercent = (item) => {
  const explicit =
    item?.discountPercent ??
    item?.discount ??
    item?.product?.discountPercent ??
    item?.product?.discount ??
    0;

  const explicitNumber =
    safeNumber(
      explicit,
      0
    );

  if (
    explicitNumber > 0 &&
    explicitNumber <= 100
  ) {
    return explicitNumber;
  }

  const original =
    getOriginalPrice(item);

  const selling =
    getSellingPrice(item);

  if (
    original > 0 &&
    selling < original
  ) {
    return round2(
      ((original - selling) /
        original) *
        100
    );
  }

  return 0;
};

// =====================================================
// STATE COMPARISON
// =====================================================

const isSameState = (
  state1,
  state2
) => {
  const a =
    normalizeText(state1);

  const b =
    normalizeText(state2);

  if (!a || !b) {
    return true;
  }

  return a === b;
};

// =====================================================
// GST CALCULATION
// =====================================================

const calculateGST = (
  taxableValue,
  customerState
) => {
  const base =
    round2(
      Math.max(
        0,
        safeNumber(
          taxableValue,
          0
        )
      )
    );

  const interState =
    !isSameState(
      BUSINESS_STATE,
      customerState
    );

  const totalGST =
    round2(
      base *
        (GST_RATE / 100)
    );

  if (interState) {
    return {
      taxableValue: base,
      totalGST,
      cgst: 0,
      sgst: 0,
      igst: totalGST,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: GST_RATE,
      isInterState: true,
      sellerState:
        BUSINESS_STATE,
      customerState:
        customerState ||
        "",
    };
  }

  const cgst =
    round2(
      totalGST / 2
    );

  const sgst =
    round2(
      totalGST - cgst
    );

  return {
    taxableValue: base,
    totalGST,
    cgst,
    sgst,
    igst: 0,
    cgstRate: CGST_RATE,
    sgstRate: SGST_RATE,
    igstRate: 0,
    isInterState: false,
    sellerState:
      BUSINESS_STATE,
    customerState:
      customerState ||
      BUSINESS_STATE,
  };
};

// =====================================================
// PINCODE API
// =====================================================

const fetchPincodeDetails = async (
  pincode
) => {
  const cleanPincode =
    String(pincode ?? "")
      .trim();

  if (
    !isValidPincode(
      cleanPincode
    )
  ) {
    return null;
  }

  const response =
    await fetch(
      `https://api.postalpincode.in/pincode/${cleanPincode}`
    );

  if (!response.ok) {
    throw new Error(
      "Pincode details fetch nahi ho paye."
    );
  }

  const data =
    await response.json();

  if (
    !Array.isArray(data) ||
    !data[0] ||
    data[0].Status !==
      "Success" ||
    !Array.isArray(
      data[0].PostOffice
    ) ||
    data[0].PostOffice.length ===
      0
  ) {
    throw new Error(
      "Pincode not found."
    );
  }

  const postOffice =
    data[0].PostOffice[0];

  return {
    postOffice:
      postOffice?.Name ||
      "",

    district:
      postOffice?.District ||
      "",

    state:
      postOffice?.State ||
      "",

    division:
      postOffice?.Division ||
      "",

    region:
      postOffice?.Region ||
      "",

    country:
      postOffice?.Country ||
      "India",
  };
};

// =====================================================
// CHECKOUT PAGE
// =====================================================

const CheckoutPage = () => {
  const navigate =
    useNavigate();

  // ===================================================
  // CONTEXT
  // ===================================================

  const cartContext =
    useCart();

  const discountContext =
    useDiscount();

  const cartItems =
    cartContext?.cartItems ||
    cartContext?.cart ||
    cartContext?.items ||
    [];

  const clearCart =
    cartContext?.clearCart ||
    cartContext?.clearCartItems ||
    (() => {});

  // ===================================================
  // DISCOUNT CONTEXT
  // ===================================================

  const appliedCoupon =
    discountContext?.appliedCoupon ||
    discountContext?.coupon ||
    null;

  const couponCode =
    discountContext?.couponCode ||
    appliedCoupon?.code ||
    "";

  const discountAmountFromContext =
    safeNumber(
      discountContext?.discountAmount ??
        discountContext?.discount ??
        appliedCoupon?.discountAmount ??
        0,
      0
    );

  const clearDiscount =
    discountContext?.clearDiscount ||
    discountContext?.removeCoupon ||
    discountContext?.clearCoupon ||
    (() => {});

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState({
      fullName: "",
      mobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });

  // ===================================================
  // PINCODE
  // ===================================================

  const [pincodeData, setPincodeData] =
    useState(null);

  const [pincodeLoading, setPincodeLoading] =
    useState(false);

  const [pincodeError, setPincodeError] =
    useState("");

  // ===================================================
  // SHIPPING
  // ===================================================

  const [shippingData, setShippingData] =
    useState(null);

  const [shippingCharge, setShippingCharge] =
    useState(0);

  const [shippingLoading, setShippingLoading] =
    useState(false);

  const [shippingError, setShippingError] =
    useState("");

  // ===================================================
  // PAYMENT
  // ===================================================

  const [paymentMethod, setPaymentMethod] =
    useState("cod");

  const [upiMethod, setUpiMethod] =
    useState("upi_id");

  // ===================================================
  // ORDER
  // ===================================================

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ===================================================
  // ORDER ITEMS
  // ===================================================

  const orderItems =
    useMemo(() => {
      if (
        !Array.isArray(
          cartItems
        )
      ) {
        return [];
      }

      return cartItems.map(
        (item) => {
          const quantity =
            getQuantity(item);

          const originalPrice =
            getOriginalPrice(
              item
            );

          const sellingPrice =
            getSellingPrice(
              item
            );

          const originalSubtotal =
            round2(
              originalPrice *
                quantity
            );

          const sellingSubtotalItem =
            round2(
              sellingPrice *
                quantity
            );

          const discountAmount =
            round2(
              Math.max(
                0,
                originalSubtotal -
                  sellingSubtotalItem
              )
            );

          return {
            sku:
              getProductSKU(
                item
              ),

            name:
              getProductName(
                item
              ),

            category:
              getCategory(
                item
              ),

            subcategory:
              getSubcategory(
                item
              ),

            image:
              getProductImage(
                item
              ),

            description:
              getDescription(
                item
              ),

            size:
              getSize(
                item
              ),

            quantity,

            originalPrice,

            mrp:
              originalPrice,

            price:
              sellingPrice,

            sellingPrice,

            discountPercent:
              getDiscountPercent(
                item
              ),

            discountAmount,

            subtotal:
              originalSubtotal,

            sellingSubtotal:
              sellingSubtotalItem,

            taxablePrice:
              sellingPrice,

            weightGrams:
              getWeight(
                item
              ),
          };
        }
      );
    }, [cartItems]);

  // ===================================================
  // INVALID SKU
  // ===================================================

  const invalidSKUItems =
    useMemo(() => {
      return orderItems.filter(
        (item) =>
          !item.sku
      );
    }, [orderItems]);

  // ===================================================
  // PRODUCT TOTALS
  // ===================================================

  const productTotal =
    useMemo(() => {
      return round2(
        orderItems.reduce(
          (total, item) =>
            total +
            safeNumber(
              item.subtotal,
              0
            ),
          0
        )
      );
    }, [orderItems]);

  const sellingSubtotal =
    useMemo(() => {
      return round2(
        orderItems.reduce(
          (total, item) =>
            total +
            safeNumber(
              item.sellingSubtotal,
              0
            ),
          0
        )
      );
    }, [orderItems]);

  const productDiscount =
    useMemo(() => {
      return round2(
        Math.max(
          0,
          productTotal -
            sellingSubtotal
        )
      );
    }, [
      productTotal,
      sellingSubtotal,
    ]);

  // ===================================================
  // TOTAL WEIGHT
  // ===================================================

  const totalWeight =
    useMemo(() => {
      return orderItems.reduce(
        (total, item) => {
          return (
            total +
            getWeight(
              item
            ) *
              getQuantity(
                item
              )
          );
        },
        0
      );
    }, [orderItems]);

  // ===================================================
  // COUPON DISCOUNT
  // ===================================================

  const couponDiscount =
    useMemo(() => {
      const direct =
        discountAmountFromContext;

      if (direct > 0) {
        return round2(
          Math.min(
            direct,
            sellingSubtotal
          )
        );
      }

      if (
        !appliedCoupon
      ) {
        return 0;
      }

      const couponDiscountValue =
        safeNumber(
          appliedCoupon?.discount ??
            appliedCoupon?.value ??
            0,
          0
        );

      const wheelValue =
        safeNumber(
          appliedCoupon?.wheelValue ??
            0,
          0
        );

      const discount =
        couponDiscountValue >
        0
          ? couponDiscountValue
          : wheelValue;

      if (
        discount <= 0
      ) {
        return 0;
      }

      const discountType =
        normalizeText(
          appliedCoupon?.type ||
            appliedCoupon?.discountType ||
            appliedCoupon?.discountMode ||
            ""
        );

      // -------------------------------------------------
      // Percentage coupon
      // -------------------------------------------------

      if (
        discountType.includes(
          "percent"
        ) ||
        discountType.includes(
          "%"
        )
      ) {
        let amount =
          round2(
            sellingSubtotal *
              (discount /
                100)
          );

        const maxDiscount =
          safeNumber(
            appliedCoupon?.maxDiscount,
            0
          );

        if (
          maxDiscount > 0
        ) {
          amount =
            Math.min(
              amount,
              maxDiscount
            );
        }

        return round2(
          Math.min(
            amount,
            sellingSubtotal
          )
        );
      }

      // -------------------------------------------------
      // Direct amount
      // -------------------------------------------------

      return round2(
        Math.min(
          discount,
          sellingSubtotal
        )
      );
    }, [
      discountAmountFromContext,
      appliedCoupon,
      sellingSubtotal,
    ]);

  // ===================================================
  // FINAL SELLING SUBTOTAL
  // ===================================================

  const finalSellingSubtotal =
    useMemo(() => {
      return round2(
        Math.max(
          0,
          sellingSubtotal -
            couponDiscount
        )
      );
    }, [
      sellingSubtotal,
      couponDiscount,
    ]);

  // ===================================================
  // TOTAL DISCOUNT
  // ===================================================

  const totalDiscount =
    useMemo(() => {
      return round2(
        productDiscount +
          couponDiscount
      );
    }, [
      productDiscount,
      couponDiscount,
    ]);

  // ===================================================
  // GST BASE
  //
  // Product after discount + shipping
  // GST is added on top.
  // ===================================================

  const totalAmountBeforeTax =
    useMemo(() => {
      return round2(
        Math.max(
          0,
          finalSellingSubtotal +
            shippingCharge
        )
      );
    }, [
      finalSellingSubtotal,
      shippingCharge,
    ]);

  // ===================================================
  // GST
  // ===================================================

  const finalGST =
    useMemo(() => {
      return calculateGST(
        totalAmountBeforeTax,
        form.state ||
          pincodeData?.state ||
          BUSINESS_STATE
      );
    }, [
      totalAmountBeforeTax,
      form.state,
      pincodeData?.state,
    ]);

  // ===================================================
  // FINAL ORDER AMOUNT
  // ===================================================

  const finalOrderAmount =
    useMemo(() => {
      return round2(
        totalAmountBeforeTax +
          finalGST.totalGST
      );
    }, [
      totalAmountBeforeTax,
      finalGST.totalGST,
    ]);

  // ===================================================
  // PINCODE LOOKUP
  // ===================================================

  useEffect(() => {
    const cleanPincode =
      String(
        form.pincode || ""
      )
        .trim()
        .replace(/\s+/g, "");

    if (
      !isValidPincode(
        cleanPincode
      )
    ) {
      setPincodeData(null);
      setPincodeError("");
      setPincodeLoading(false);
      return;
    }

    let cancelled =
      false;

    const timer =
      setTimeout(
        async () => {
          try {
            setPincodeLoading(
              true
            );

            setPincodeError("");

            const data =
              await fetchPincodeDetails(
                cleanPincode
              );

            if (
              cancelled
            ) {
              return;
            }

            setPincodeData(
              data
            );

            // ------------------------------------------------
            // Auto-fill city and state
            // ------------------------------------------------

            setForm(
              (previous) => ({
                ...previous,

                city:
                  previous.city ||
                  data?.District ||
                  data?.district ||
                  "",

                state:
                  data?.state ||
                  previous.state ||
                  "",
              })
            );
          } catch (err) {
            if (
              cancelled
            ) {
              return;
            }

            setPincodeData(null);

            setPincodeError(
              err?.message ||
                "Pincode details nahi mile."
            );
          } finally {
            if (
              !cancelled
            ) {
              setPincodeLoading(
                false
              );
            }
          }
        },
        350
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    form.pincode,
  ]);

  // ===================================================
  // FORM HANDLER
  // ===================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    let nextValue =
      value;

    if (
      name ===
      "mobile"
    ) {
      nextValue =
        value
          .replace(
            /[^0-9]/g,
            ""
          )
          .slice(0, 10);
    }

    if (
      name ===
      "pincode"
    ) {
      nextValue =
        value
          .replace(
            /[^0-9]/g,
            ""
          )
          .slice(0, 6);

      if (
        nextValue.length <
        6
      ) {
        setPincodeData(
          null
        );
        setPincodeError(
          ""
        );
      }
    }

    setForm(
      (previous) => ({
        ...previous,
        [name]:
          nextValue,
      })
    );

    setError("");
  };

  // ===================================================
  // CALCULATE SHIPPING
  // ===================================================

  const calculateShipping =
    async () => {
      // ------------------------------------------------
      // VALID PINCODE
      // ------------------------------------------------

      if (
        !isValidPincode(
          form.pincode
        )
      ) {
        return null;
      }

      // ------------------------------------------------
      // CART ITEMS VALIDATION
      // ------------------------------------------------

      if (
        !Array.isArray(
          orderItems
        ) ||
        orderItems.length ===
          0
      ) {
        setShippingData(
          null
        );

        setShippingCharge(
          0
        );

        setShippingError(
          "Cart mein koi product nahi hai."
        );

        return null;
      }

      // ------------------------------------------------
      // SKU VALIDATION
      // ------------------------------------------------

      if (
        invalidSKUItems.length >
        0
      ) {
        setShippingData(
          null
        );

        setShippingCharge(
          0
        );

        setShippingError(
          "Cart product SKU missing hai. Please cart ko refresh karke try karein."
        );

        return null;
      }

      // ------------------------------------------------
      // LOADING
      // ------------------------------------------------

      setShippingLoading(
        true
      );

      setShippingError("");

      try {
        // ==============================================
        // SHIPPING ITEMS
        // ==============================================

        const shippingItems =
          orderItems.map(
            (item) => ({
              sku:
                item?.sku ||
                "",

              name:
                item?.name ||
                "",

              quantity:
                Math.max(
                  1,
                  Number(
                    item?.quantity ??
                      1
                  )
                ),

              weightGrams:
                Number(
                  item?.weightGrams ??
                    0
                ),

              category:
                item?.category ||
                "",

              subcategory:
                item?.subcategory ||
                "",
            })
          );

        // ==============================================
        // SHIPPING REQUEST
        // ==============================================

        const shippingPayload =
          {
            pincode:
              String(
                form.pincode ||
                  ""
              ).trim(),

            // IMPORTANT:
            // Backend supports subtotal.
            subtotal:
              Number(
                sellingSubtotal ||
                  0
              ),

            // Compatibility
            sellingSubtotal:
              Number(
                sellingSubtotal ||
                  0
              ),

            totalWeightGrams:
              Number(
                totalWeight ||
                  0
              ),

            items:
              shippingItems,
          };

        // ==============================================
        // DEBUG
        // ==============================================

        console.log(
          "===================================="
        );

        console.log(
          "SHIPPING REQUEST"
        );

        console.log(
          shippingPayload
        );

        console.log(
          "Shipping items:",
          shippingItems
        );

        console.log(
          "===================================="
        );

        // ==============================================
        // API
        // ==============================================

        const response =
          await fetch(
            `${VRAJ_API}/shipping/calculate`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  shippingPayload
                ),
            }
          );

        const data =
          await response.json();

        console.log(
          "SHIPPING RESPONSE:",
          data
        );

        // ==============================================
        // ERROR
        // ==============================================

        if (
          !response.ok ||
          data?.success ===
            false
        ) {
          throw new Error(
            data?.message ||
              "Shipping calculation failed."
          );
        }

        // ==============================================
        // SHIPPING RESULT
        // ==============================================

        const result =
          data?.shipping ||
          data?.data ||
          data;

        // ==============================================
        // CHARGE
        // ==============================================

        const charge =
          round2(
            Math.max(
              0,
              safeNumber(
                result?.charge ??
                  result?.shippingCharge ??
                  result?.amount ??
                  0
              )
            )
          );

        // ==============================================
        // NORMALIZED SHIPPING
        // ==============================================

        const normalizedShipping =
          {
            ...result,

            charge,

            shippingCharge:
              charge,

            amount:
              charge,

            isFree:
              Boolean(
                result?.isFree
              ) ||
              charge === 0,

            weight:
              safeNumber(
                result?.weight ??
                  result?.weightGrams ??
                  totalWeight
              ),

            weightGrams:
              safeNumber(
                result?.weightGrams ??
                  result?.weight ??
                  totalWeight
              ),

            actualWeightGrams:
              safeNumber(
                result?.actualWeightGrams ??
                  0
              ),

            volumetricWeightGrams:
              safeNumber(
                result?.volumetricWeightGrams ??
                  0
              ),

            billableWeightGrams:
              safeNumber(
                result?.billableWeightGrams ??
                  result?.weightGrams ??
                  result?.weight ??
                  totalWeight
              ),

            billableWeight:
              safeNumber(
                result?.billableWeightGrams ??
                  result?.weightGrams ??
                  result?.weight ??
                  totalWeight
              ),

            totalVolumeCm3:
              safeNumber(
                result?.totalVolumeCm3 ??
                  0
              ),

            weightCharge:
              safeNumber(
                result?.weightCharge ??
                  0
              ),

            sizeCharge:
              safeNumber(
                result?.sizeCharge ??
                  0
              ),

            zoneCharge:
              safeNumber(
                result?.zoneCharge ??
                  0
              ),

            shippingMode:
              result?.shippingMode ??
              null,

            zone:
              result?.zone ??
              null,

            isApproximate:
              Boolean(
                result?.isApproximate
              ),
          };

        // ==============================================
        // SAVE
        // ==============================================

        setShippingData(
          normalizedShipping
        );

        setShippingCharge(
          charge
        );

        setShippingError("");

        return normalizedShipping;
      } catch (error) {
        console.error(
          "Shipping calculation error:",
          error
        );

        setShippingData(
          null
        );

        setShippingCharge(
          0
        );

        setShippingError(
          error?.message ||
            "Shipping charge calculate nahi ho saka."
        );

        return null;
      } finally {
        setShippingLoading(
          false
        );
      }
    };

  // ===================================================
  // AUTO SHIPPING
  // ===================================================

  useEffect(() => {
    if (
      !isValidPincode(
        form.pincode
      )
    ) {
      setShippingData(
        null
      );

      setShippingCharge(
        0
      );

      setShippingError("");

      return;
    }

    if (
      !Array.isArray(
        orderItems
      ) ||
      orderItems.length ===
        0
    ) {
      setShippingData(
        null
      );

      setShippingCharge(
        0
      );

      setShippingError(
        "Cart mein koi product nahi hai."
      );

      return;
    }

    if (
      invalidSKUItems.length >
        0
    ) {
      setShippingData(
        null
      );

      setShippingCharge(
        0
      );

      setShippingError(
        "Cart product SKU missing hai. Please cart ko refresh karke try karein."
      );

      return;
    }

    let cancelled =
      false;

    const timer =
      setTimeout(
        async () => {
          if (
            cancelled
          ) {
            return;
          }

          await calculateShipping();
        },
        700
      );

    return () => {
      cancelled = true;

      clearTimeout(
        timer
      );
    };
  }, [
    form.pincode,
    sellingSubtotal,
    totalWeight,
    orderItems.length,
    invalidSKUItems.length,
  ]);

  // ===================================================
  // PAYMENT UPI LINK
  // ===================================================

  const upiUrl =
    useMemo(() => {
      const amount =
        round2(
          finalOrderAmount
        );

      return (
        `upi://pay?` +
        `pa=${encodeURIComponent(
          VRAJ_UPI_ID
        )}` +
        `&pn=${encodeURIComponent(
          VRAJ_UPI_NAME
        )}` +
        `&am=${encodeURIComponent(
          amount.toFixed(2)
        )}` +
        `&cu=INR`
      );
    }, [
      finalOrderAmount,
    ]);

  // ===================================================
  // FORM VALIDATION
  // ===================================================

  const validateForm =
    () => {
      if (
        !form.fullName.trim()
      ) {
        return "Full name required hai.";
      }

      if (
        !/^[0-9]{10}$/.test(
          form.mobile.trim()
        )
      ) {
        return "Please valid 10-digit mobile number enter karein.";
      }

      if (
        !form.email.trim()
      ) {
        return "Email required hai.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        return "Please valid email enter karein.";
      }

      if (
        !form.address.trim()
      ) {
        return "Complete address required hai.";
      }

      if (
        !form.city.trim()
      ) {
        return "City required hai.";
      }

      if (
        !form.state.trim()
      ) {
        return "State required hai.";
      }

      if (
        !isValidPincode(
          form.pincode
        )
      ) {
        return "Please valid 6-digit pincode enter karein.";
      }

      if (
        !Array.isArray(
          orderItems
        ) ||
        orderItems.length ===
          0
      ) {
        return "Cart mein koi product nahi hai.";
      }

      if (
        invalidSKUItems.length >
        0
      ) {
        return "Cart mein product SKU missing hai. Please cart refresh karein.";
      }

      if (
        !shippingData
      ) {
        return "Shipping charge calculate ho raha hai. Please thoda wait karein.";
      }

      if (
        paymentMethod ===
        "upi" &&
        !upiMethod
      ) {
        return "Please UPI payment method select karein.";
      }

      return "";
    };

  // ===================================================
  // PLACE ORDER
  // ===================================================

  const placeOrder =
    async () => {
      setError("");
      setSuccessMessage("");

      // ------------------------------------------------
      // VALIDATE
      // ------------------------------------------------

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setError(
          validationError
        );
        return;
      }

      setPlacingOrder(
        true
      );

      try {
        // ==============================================
        // ENSURE SHIPPING
        // ==============================================

        let currentShipping =
          shippingData;

        if (
          !currentShipping
        ) {
          currentShipping =
            await calculateShipping();
        }

        if (
          !currentShipping
        ) {
          throw new Error(
            "Shipping charge calculate nahi ho saka."
          );
        }

        // ==============================================
        // FINAL SHIPPING
        // ==============================================

        const finalShippingCharge =
          round2(
            Math.max(
              0,
              safeNumber(
                currentShipping?.charge ??
                  currentShipping?.shippingCharge ??
                  0
              )
            )
          );

        // ==============================================
        // FINAL TAXABLE VALUE
        // ==============================================

        const finalTotalAmountBeforeTax =
          round2(
            Math.max(
              0,
              finalSellingSubtotal +
                finalShippingCharge
            )
          );

        // ==============================================
        // FINAL GST
        // ==============================================

        const finalGST =
          calculateGST(
            finalTotalAmountBeforeTax,
            form.state ||
              pincodeData?.state ||
              BUSINESS_STATE
          );

        // ==============================================
        // FINAL TOTAL
        // ==============================================

        const finalAmount =
          round2(
            finalTotalAmountBeforeTax +
              finalGST.totalGST
          );

        // ==============================================
        // PAYMENT
        // ==============================================

        const payment =
          paymentMethod ===
          "cod"
            ? {
                method:
                  "cod",

                type:
                  "cod",

                status:
                  "pending",

                amount:
                  finalAmount,
              }
            : {
                method:
                  "upi",

                type:
                  upiMethod,

                paymentType:
                  upiMethod,

                status:
                  "pending",

                amount:
                  finalAmount,

                upiId:
                  VRAJ_UPI_ID,

                upiName:
                  VRAJ_UPI_NAME,

                upiUrl:
                  upiUrl,
              };

        // ==============================================
        // ORDER PAYLOAD
        // ==============================================

        const orderPayload =
          {
            customer: {
              fullName:
                form.fullName.trim(),

              name:
                form.fullName.trim(),

              mobile:
                form.mobile.trim(),

              phone:
                form.mobile.trim(),

              email:
                form.email.trim(),

              address:
                form.address.trim(),

              city:
                form.city.trim(),

              state:
                form.state.trim(),

              pincode:
                form.pincode.trim(),

              country:
                "India",

              postOffice:
                pincodeData?.postOffice ||
                "",
            },

            items:
              orderItems.map(
                (item) => ({
                  sku:
                    item.sku,

                  name:
                    item.name,

                  category:
                    item.category,

                  subcategory:
                    item.subcategory,

                  image:
                    item.image,

                  description:
                    item.description,

                  size:
                    item.size,

                  quantity:
                    item.quantity,

                  originalPrice:
                    item.originalPrice,

                  mrp:
                    item.mrp,

                  price:
                    item.price,

                  sellingPrice:
                    item.sellingPrice,

                  discountPercent:
                    item.discountPercent,

                  discountAmount:
                    item.discountAmount,

                  subtotal:
                    item.subtotal,

                  sellingSubtotal:
                    item.sellingSubtotal,

                  taxablePrice:
                    item.taxablePrice,

                  weightGrams:
                    item.weightGrams,
                })
              ),

            // ==========================================
            // COUPON
            // ==========================================

            couponCode:
              appliedCoupon?.code ||
              couponCode ||
              null,

            coupon:
              appliedCoupon
                ? {
                    code:
                      appliedCoupon?.code ||
                      couponCode ||
                      null,

                    name:
                      appliedCoupon?.name ||
                      "",

                    discount:
                      couponDiscount,

                    description:
                      appliedCoupon?.description ||
                      "",
                  }
                : null,

            // ==========================================
            // SHIPPING
            // ==========================================

            shipping: {
              ...currentShipping,

              charge:
                finalShippingCharge,

              shippingCharge:
                finalShippingCharge,

              amount:
                finalShippingCharge,

              isFree:
                finalShippingCharge ===
                0,

              pincode:
                form.pincode.trim(),

              city:
                form.city.trim(),

              state:
                form.state.trim(),

              billableWeightGrams:
                safeNumber(
                  currentShipping?.billableWeightGrams ??
                    currentShipping?.weightGrams ??
                    currentShipping?.weight ??
                    totalWeight
                ),

              weightGrams:
                safeNumber(
                  currentShipping?.weightGrams ??
                    totalWeight
                ),

              actualWeightGrams:
                safeNumber(
                  currentShipping?.actualWeightGrams ??
                    totalWeight
                ),

              zone:
                currentShipping?.zone ??
                null,

              shippingMode:
                currentShipping?.shippingMode ??
                null,
            },

            // ==========================================
            // PRICING
            // ==========================================

            pricing: {
              subtotal:
                productTotal,

              productTotal:
                productTotal,

              sellingSubtotal:
                sellingSubtotal,

              productDiscount:
                productDiscount,

              eligibleSubtotal:
                sellingSubtotal,

              couponDiscount:
                couponDiscount,

              discount:
                totalDiscount,

              discountPercent:
                productTotal >
                0
                  ? round2(
                      (totalDiscount /
                        productTotal) *
                        100
                    )
                  : 0,

              couponCode:
                appliedCoupon?.code ||
                couponCode ||
                null,

              shipping:
                finalShippingCharge,

              shippingCharge:
                finalShippingCharge,

              // ----------------------------------------
              // GST
              // ----------------------------------------

              totalAmountBeforeTax:
                finalTotalAmountBeforeTax,

              taxableValue:
                finalTotalAmountBeforeTax,

              taxableAmount:
                finalTotalAmountBeforeTax,

              gstRate:
                GST_RATE,

              totalGST:
                finalGST.totalGST,

              cgst:
                finalGST.cgst,

              sgst:
                finalGST.sgst,

              igst:
                finalGST.igst,

              cgstRate:
                finalGST.cgstRate,

              sgstRate:
                finalGST.sgstRate,

              igstRate:
                finalGST.igstRate,

              isInterState:
                finalGST.isInterState,

              sellerState:
                BUSINESS_STATE,

              customerState:
                form.state,

              finalTotal:
                finalAmount,

              finalAmount:
                finalAmount,
            },

            // ==========================================
            // GST OBJECT
            // ==========================================

            gst: {
              ...finalGST,

              rate:
                GST_RATE,

              pricingMode:
                "gst_exclusive",

              amountWithGST:
                finalAmount,

              finalAmount:
                finalAmount,
            },

            // ==========================================
            // TOTALS
            // ==========================================

            subtotal:
              productTotal,

            sellingSubtotal:
              sellingSubtotal,

            discount:
              totalDiscount,

            couponDiscount:
              couponDiscount,

            shippingCharge:
              finalShippingCharge,

            totalAmountBeforeTax:
              finalTotalAmountBeforeTax,

            taxableValue:
              finalTotalAmountBeforeTax,

            totalGST:
              finalGST.totalGST,

            cgst:
              finalGST.cgst,

            sgst:
              finalGST.sgst,

            igst:
              finalGST.igst,

            finalAmount:
              finalAmount,

            // ==========================================
            // PAYMENT
            // ==========================================

            payment,
          };

        // ==============================================
        // DEBUG ORDER
        // ==============================================

        console.log(
          "===================================="
        );

        console.log(
          "PLACE ORDER PAYLOAD"
        );

        console.log(
          orderPayload
        );

        console.log(
          "FINAL AMOUNT:",
          finalAmount
        );

        console.log(
          "===================================="
        );

        // ==============================================
        // CREATE ORDER
        // ==============================================

        const response =
          await fetch(
            `${VRAJ_API}/orders`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  orderPayload
                ),
            }
          );

        const data =
          await response.json();

        console.log(
          "ORDER RESPONSE:",
          data
        );

        // ==============================================
        // ERROR
        // ==============================================

        if (
          !response.ok ||
          data?.success ===
            false
        ) {
          throw new Error(
            data?.message ||
              "Order place nahi ho saka."
          );
        }

        // ==============================================
        // ORDER RESULT
        // ==============================================

        const order =
          data?.order ||
          data?.data ||
          data;

        const orderNumber =
          order?.orderNumber ||
          order?.orderId ||
          order?.id ||
          data?.orderNumber ||
          `VRJ-${Date.now()}`;

        // ==============================================
        // SAVE ORDER
        // ==============================================

        const orderForSuccess =
          {
            ...orderPayload,

            ...order,

            orderNumber,

            finalAmount:
              order?.finalAmount ??
              finalAmount,

            pricing: {
              ...orderPayload.pricing,

              ...(order?.pricing ||
                {}),
            },

            shipping: {
              ...orderPayload.shipping,

              ...(order?.shipping ||
                {}),
            },

            gst: {
              ...orderPayload.gst,

              ...(order?.gst ||
                {}),
            },
          };

        // ==============================================
        // SESSION STORAGE
        // ==============================================

        sessionStorage.setItem(
          "vraj_order",
          JSON.stringify(
            orderForSuccess
          )
        );

        // ==============================================
        // LOCAL STORAGE
        // ==============================================

        const oldOrders =
          JSON.parse(
            localStorage.getItem(
              "vraj_orders"
            ) || "[]"
          );

        const orders =
          Array.isArray(
            oldOrders
          )
            ? oldOrders
            : [];

        orders.push(
          orderForSuccess
        );

        localStorage.setItem(
          "vraj_orders",
          JSON.stringify(
            orders
          )
        );

        localStorage.setItem(
          "vraj_last_order_number",
          orderNumber
        );

        // ==============================================
        // CLEAR CART
        // ==============================================

        try {
          clearCart();
        } catch (
          clearCartError
        ) {
          console.warn(
            "Cart clear warning:",
            clearCartError
          );
        }

        // ==============================================
        // CLEAR COUPON
        // ==============================================

        try {
          clearDiscount();
        } catch (
          discountClearError
        ) {
          console.warn(
            "Discount clear warning:",
            discountClearError
          );
        }

        // ==============================================
        // SUCCESS
        // ==============================================

        setSuccessMessage(
          "Order successfully place ho gaya."
        );

        // ==============================================
        // ORDER SUCCESS PAGE
        // ==============================================

        navigate(
          "/order-success",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "Place order error:",
          err
        );

        setError(
          err?.message ||
            "Order place nahi ho saka. Please try again."
        );
      } finally {
        setPlacingOrder(
          false
        );
      }
    };

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (
    !Array.isArray(
      cartItems
    ) ||
    cartItems.length ===
      0
  ) {
    return (
      <div className="min-h-screen bg-[#fffaf2] px-4 py-12 text-[#3d2b1f]">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#eadbc8] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3e3] text-[#8f3424]">
            <FiShoppingBag
              size={30}
            />
          </div>

          <h1 className="text-2xl font-bold">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-[#7b6759]">
            Checkout karne ke liye
            pehle product cart mein
            add karein.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8f3424] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#76291d]"
          >
            Continue Shopping
            <FiChevronRight />
          </Link>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#3d2b1f]">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-[#eadbc8] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f5848] transition hover:text-[#8f3424]"
            >
              <FiArrowLeft />
              Back to Cart
            </Link>

            <div className="hidden items-center gap-2 text-xs font-medium text-[#7b6759] sm:flex">
              <FiLock />
              Secure Checkout
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b27b42]">
            Vraj Creation
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#3d2b1f] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#7b6759]">
            Apni delivery details aur
            payment method enter karke
            order complete karein.
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <FiX className="mt-0.5 shrink-0" />
            <span>
              {error}
            </span>
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
            <FiCheck className="mt-0.5 shrink-0" />
            <span>
              {successMessage}
            </span>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[1fr_390px]">
          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-6">
            {/* =================================================
                CUSTOMER DETAILS
            ================================================= */}

            <section className="rounded-3xl border border-[#eadbc8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3e3] text-[#8f3424]">
                  <FiUser />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Customer Details
                  </h2>

                  <p className="text-xs text-[#8b7565]">
                    Delivery ke liye basic
                    information
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    Full Name
                  </label>

                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8574]" />

                    <input
                      type="text"
                      name="fullName"
                      value={
                        form.fullName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                    />
                  </div>
                </div>

                {/* Mobile */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Mobile Number
                  </label>

                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8574]" />

                    <input
                      type="tel"
                      name="mobile"
                      value={
                        form.mobile
                      }
                      onChange={
                        handleChange
                      }
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile"
                      className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                    />
                  </div>
                </div>

                {/* Email */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Email
                  </label>

                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8574]" />

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                    />
                  </div>
                </div>

                {/* Address */}

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    Complete Address
                  </label>

                  <textarea
                    name="address"
                    value={
                      form.address
                    }
                    onChange={
                      handleChange
                    }
                    rows={3}
                    placeholder="House/Flat, Street, Area"
                    className="w-full resize-none rounded-xl border border-[#dfcdb8] bg-[#fffdf9] px-3 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                  />
                </div>

                {/* Pincode */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Pincode
                  </label>

                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c8574]" />

                    <input
                      type="text"
                      name="pincode"
                      value={
                        form.pincode
                      }
                      onChange={
                        handleChange
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit pincode"
                      className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] py-3 pl-10 pr-10 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                    />

                    {pincodeLoading && (
                      <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8f3424]" />
                    )}
                  </div>

                  {pincodeData && (
                    <p className="mt-2 text-xs font-medium text-green-700">
                      {pincodeData.postOffice}
                      {pincodeData.district
                        ? `, ${pincodeData.district}`
                        : ""}
                      {pincodeData.state
                        ? `, ${pincodeData.state}`
                        : ""}
                    </p>
                  )}

                  {pincodeError && (
                    <p className="mt-2 text-xs text-red-600">
                      {pincodeError}
                    </p>
                  )}
                </div>

                {/* City */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="City"
                    className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] px-3 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                  />
                </div>

                {/* State */}

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    State
                  </label>

                  <input
                    type="text"
                    name="state"
                    value={
                      form.state
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="State"
                    className="w-full rounded-xl border border-[#dfcdb8] bg-[#fffdf9] px-3 py-3 text-sm outline-none transition focus:border-[#8f3424] focus:ring-2 focus:ring-[#8f3424]/10"
                  />

                  <p className="mt-1.5 text-[11px] text-[#8b7565]">
                    Pincode enter karne par
                    city/state automatically
                    fill ho jayega.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                SHIPPING
            ================================================= */}

            <section className="rounded-3xl border border-[#eadbc8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3e3] text-[#8f3424]">
                  <FiTruck />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Shipping
                  </h2>

                  <p className="text-xs text-[#8b7565]">
                    Delivery charge pincode
                    aur cart ke according
                    calculate hoga.
                  </p>
                </div>
              </div>

              {!isValidPincode(
                form.pincode
              ) ? (
                <div className="rounded-2xl border border-dashed border-[#dfcdb8] bg-[#fffaf2] p-4 text-sm text-[#7b6759]">
                  Shipping charge dekhne ke
                  liye valid pincode enter
                  karein.
                </div>
              ) : shippingLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#eadbc8] bg-[#fffaf2] p-4 text-sm text-[#7b6759]">
                  <FiLoader className="animate-spin text-[#8f3424]" />
                  Shipping charge calculate
                  ho raha hai...
                </div>
              ) : shippingError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {shippingError}
                </div>
              ) : shippingData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-[#eadbc8] bg-[#fffaf2] p-4">
                    <div>
                      <p className="text-sm font-semibold">
                        Delivery Charge
                      </p>

                      <p className="mt-1 text-xs text-[#8b7565]">
                        {shippingData?.message ||
                          "Shipping calculated"}
                      </p>
                    </div>

                    <div className="text-right">
                      {shippingData.isFree ? (
                        <p className="text-lg font-bold text-green-700">
                          FREE
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-[#8f3424]">
                          {formatPrice(
                            shippingCharge
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {shippingData?.shippingMode ===
                    "wall-fixed" && (
                    <div className="rounded-xl bg-[#fff3e3] px-4 py-3 text-xs font-medium text-[#7b4c2f]">
                      Wall Décor shipping:
                      ₹150 fixed below ₹999.
                    </div>
                  )}

                  {shippingData?.isFree && (
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
                      ₹999 ya usse zyada
                      subtotal par free
                      shipping applied.
                    </div>
                  )}

                  {!shippingData?.isFree &&
                    shippingData?.shippingMode ===
                      "normal" && (
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="rounded-xl bg-[#fffaf2] p-3">
                          <p className="text-[#8b7565]">
                            Weight
                          </p>
                          <p className="mt-1 font-bold">
                            {formatPrice(
                              shippingData?.weightCharge ||
                                0
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#fffaf2] p-3">
                          <p className="text-[#8b7565]">
                            Size
                          </p>
                          <p className="mt-1 font-bold">
                            {formatPrice(
                              shippingData?.sizeCharge ||
                                0
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#fffaf2] p-3">
                          <p className="text-[#8b7565]">
                            Zone
                          </p>
                          <p className="mt-1 font-bold">
                            {formatPrice(
                              shippingData?.zoneCharge ||
                                0
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              ) : null}
            </section>

            {/* =================================================
                PAYMENT
            ================================================= */}

            <section className="rounded-3xl border border-[#eadbc8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3e3] text-[#8f3424]">
                  <FiCreditCard />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Payment Method
                  </h2>

                  <p className="text-xs text-[#8b7565]">
                    Available payment options
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* COD */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "cod"
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    paymentMethod ===
                    "cod"
                      ? "border-[#8f3424] bg-[#fff8ef] ring-2 ring-[#8f3424]/10"
                      : "border-[#eadbc8] bg-white hover:border-[#cdb79e]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        paymentMethod ===
                        "cod"
                          ? "border-[#8f3424] bg-[#8f3424] text-white"
                          : "border-[#bda58e]"
                      }`}
                    >
                      {paymentMethod ===
                        "cod" && (
                        <FiCheck size={12} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        Cash on Delivery
                      </p>

                      <p className="mt-1 text-xs text-[#8b7565]">
                        Delivery ke time payment
                        karein.
                      </p>
                    </div>
                  </div>
                </button>

                {/* UPI */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "upi"
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    paymentMethod ===
                    "upi"
                      ? "border-[#8f3424] bg-[#fff8ef] ring-2 ring-[#8f3424]/10"
                      : "border-[#eadbc8] bg-white hover:border-[#cdb79e]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        paymentMethod ===
                        "upi"
                          ? "border-[#8f3424] bg-[#8f3424] text-white"
                          : "border-[#bda58e]"
                      }`}
                    >
                      {paymentMethod ===
                        "upi" && (
                        <FiCheck size={12} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        Prepaid UPI
                      </p>

                      <p className="mt-1 text-xs text-[#8b7565]">
                        UPI ID ya dynamic QR
                        se payment karein.
                      </p>
                    </div>
                  </div>
                </button>

                {/* UPI OPTIONS */}

                {paymentMethod ===
                  "upi" && (
                  <div className="ml-0 space-y-3 rounded-2xl border border-[#eadbc8] bg-[#fffaf2] p-4">
                    {/* UPI ID */}

                    <button
                      type="button"
                      onClick={() =>
                        setUpiMethod(
                          "upi_id"
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                        upiMethod ===
                        "upi_id"
                          ? "border-[#8f3424] bg-white"
                          : "border-[#eadbc8] bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          UPI ID
                        </p>

                        <p className="mt-1 text-xs text-[#8b7565]">
                          {VRAJ_UPI_ID}
                        </p>
                      </div>

                      {upiMethod ===
                        "upi_id" && (
                        <FiCheck className="text-[#8f3424]" />
                      )}
                    </button>

                    {/* QR */}

                    <button
                      type="button"
                      onClick={() =>
                        setUpiMethod(
                          "qr"
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                        upiMethod ===
                        "qr"
                          ? "border-[#8f3424] bg-white"
                          : "border-[#eadbc8] bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          Dynamic QR
                        </p>

                        <p className="mt-1 text-xs text-[#8b7565]">
                          Final amount ke saath
                          QR generate hoga.
                        </p>
                      </div>

                      {upiMethod ===
                        "qr" && (
                        <FiCheck className="text-[#8f3424]" />
                      )}
                    </button>

                    {/* UPI DETAILS */}

                    <div className="rounded-xl border border-[#eadbc8] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#8b7565]">
                            UPI ID
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {VRAJ_UPI_ID}
                          </p>

                          <p className="mt-1 text-xs text-[#8b7565]">
                            {VRAJ_UPI_NAME}
                          </p>
                        </div>

                        <a
                          href={
                            upiUrl
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-[#8f3424] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Open UPI
                          <FiExternalLink />
                        </a>
                      </div>
                    </div>

                    {/* QR */}

                    {upiMethod ===
                      "qr" && (
                      <div className="flex flex-col items-center rounded-xl border border-[#eadbc8] bg-white p-5">
                        <QRCodeCanvas
                          value={
                            upiUrl
                          }
                          size={190}
                          level="M"
                          includeMargin
                        />

                        <p className="mt-4 text-sm font-bold">
                          {formatPrice(
                            finalOrderAmount
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#8b7565]">
                          Scan QR and pay exact
                          amount
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT - ORDER SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-[#eadbc8] bg-white shadow-sm">
              {/* Header */}

              <div className="border-b border-[#eadbc8] bg-[#fffaf2] px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b27b42]">
                      Order Summary
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Your Order
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8f3424] shadow-sm">
                    <FiPackage />
                  </div>
                </div>
              </div>

              {/* Products */}

              <div className="max-h-[360px] space-y-4 overflow-y-auto p-5">
                {orderItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${item.sku}-${index}`}
                      className="flex gap-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#eadbc8] bg-[#fffaf2]">
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#bca895]">
                            <FiShoppingBag />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">
                          {item.name}
                        </p>

                        {item.sku && (
                          <p className="mt-1 text-[10px] text-[#8b7565]">
                            SKU: {item.sku}
                          </p>
                        )}

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#8b7565]">
                            Qty:{" "}
                            {
                              item.quantity
                            }
                          </span>

                          <span className="text-sm font-bold">
                            {formatPrice(
                              item.sellingSubtotal
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Price Breakdown */}

              <div className="border-t border-[#eadbc8] p-5">
                <div className="space-y-3 text-sm">
                  {/* MRP */}

                  <div className="flex items-center justify-between">
                    <span className="text-[#7b6759]">
                      Subtotal
                    </span>

                    <span className="font-medium">
                      {formatPrice(
                        productTotal
                      )}
                    </span>
                  </div>

                  {/* Product Discount */}

                  {productDiscount >
                    0 && (
                    <div className="flex items-center justify-between text-green-700">
                      <span>
                        Product Discount
                      </span>

                      <span>
                        -{" "}
                        {formatPrice(
                          productDiscount
                        )}
                      </span>
                    </div>
                  )}

                  {/* Coupon */}

                  {couponDiscount >
                    0 && (
                    <div className="flex items-center justify-between text-green-700">
                      <span className="flex items-center gap-1">
                        <FiGift />
                        Coupon
                        {couponCode
                          ? ` (${couponCode})`
                          : ""}
                      </span>

                      <span>
                        -{" "}
                        {formatPrice(
                          couponDiscount
                        )}
                      </span>
                    </div>
                  )}

                  {/* Selling subtotal */}

                  <div className="flex items-center justify-between">
                    <span className="text-[#7b6759]">
                      Product Total
                    </span>

                    <span className="font-semibold">
                      {formatPrice(
                        finalSellingSubtotal
                      )}
                    </span>
                  </div>

                  {/* Shipping */}

                  <div className="flex items-center justify-between">
                    <span className="text-[#7b6759]">
                      Shipping
                    </span>

                    {shippingLoading ? (
                      <FiLoader className="animate-spin text-[#8f3424]" />
                    ) : shippingCharge ===
                      0 &&
                      shippingData ? (
                      <span className="font-bold text-green-700">
                        FREE
                      </span>
                    ) : (
                      <span className="font-semibold">
                        {formatPrice(
                          shippingCharge
                        )}
                      </span>
                    )}
                  </div>

                  {/* Taxable value */}

                  <div className="border-t border-dashed border-[#dfcdb8] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7b6759]">
                        Taxable Value
                      </span>

                      <span className="font-semibold">
                        {formatPrice(
                          totalAmountBeforeTax
                        )}
                      </span>
                    </div>
                  </div>

                  {/* GST */}

                  <div className="rounded-xl bg-[#fffaf2] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">
                        GST
                      </span>

                      <span className="font-bold">
                        {formatPrice(
                          finalGST.totalGST
                        )}
                      </span>
                    </div>

                    {finalGST.isInterState ? (
                      <div className="flex items-center justify-between text-xs text-[#7b6759]">
                        <span>
                          IGST @ 5%
                        </span>

                        <span>
                          {formatPrice(
                            finalGST.igst
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs text-[#7b6759]">
                        <div className="flex items-center justify-between">
                          <span>
                            CGST @ 2.5%
                          </span>

                          <span>
                            {formatPrice(
                              finalGST.cgst
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>
                            SGST @ 2.5%
                          </span>

                          <span>
                            {formatPrice(
                              finalGST.sgst
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final */}

                  <div className="mt-4 rounded-2xl bg-[#8f3424] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/75">
                          Grand Total
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {formatPrice(
                            finalOrderAmount
                          )}
                        </p>
                      </div>

                      <FiShield
                        size={25}
                        className="text-white/80"
                      />
                    </div>
                  </div>
                </div>

                {/* =================================================
                    GST NOTE
                ================================================= */}

                <p className="mt-4 text-[11px] leading-5 text-[#8b7565]">
                  GST 5% taxable value ke
                  upar add kiya gaya hai.
                  Rajasthan ke andar
                  CGST 2.5% + SGST 2.5%
                  aur Rajasthan ke bahar
                  IGST 5% apply hoga.
                </p>

                {/* =================================================
                    PLACE ORDER
                ================================================= */}

                <button
                  type="button"
                  onClick={
                    placeOrder
                  }
                  disabled={
                    placingOrder ||
                    shippingLoading ||
                    !shippingData
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8f3424] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#76291d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <FiChevronRight />
                    </>
                  )}
                </button>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8b7565]">
                  <FiLock />
                  Secure checkout
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;