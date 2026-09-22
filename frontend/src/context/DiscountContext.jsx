import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DiscountContext = createContext(null);

const STORAGE_KEY = "vraj_spin_discount";

const toNumberOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const round2 = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
};

const normalizeDiscount = (data = {}) => {
  const discount = Number(
    data.discount ??
      data.wheelValue ??
      0
  );

  const couponCode = String(
    data.couponCode ??
      data.code ??
      data.rewardCode ??
      ""
  ).trim();

  return {
    discount: Number.isFinite(discount)
      ? discount
      : 0,

    couponCode,

    discountScope:
      data.discountScope === "category"
        ? "category"
        : "all",

    category:
      data.category || null,

    minOrderAmount:
      toNumberOrNull(
        data.minOrderAmount
      ) ?? 0,

    maxDiscount:
      toNumberOrNull(
        data.maxDiscount
      ),

    eligibleSubtotal:
      toNumberOrNull(
        data.eligibleSubtotal
      ),

    cartSubtotal:
      toNumberOrNull(
        data.cartSubtotal
      ),

    discountAmount:
      toNumberOrNull(
        data.discountAmount
      ),

    finalAmount:
      toNumberOrNull(
        data.finalAmount
      ),

    expiryDate:
      data.expiryDate ||
      data.expiresAt ||
      data.campaignExpiresAt ||
      null,

    campaignExpiresAt:
      data.campaignExpiresAt ||
      null,

    sessionExpiresAt:
      data.sessionExpiresAt ||
      null,

    source:
      data.source ||
      "Spin & Win",

    type:
      data.type ||
      "percentage",

    wheelValue:
      toNumberOrNull(
        data.wheelValue
      ) ?? discount,

    claimId:
      data.claimId ||
      null,

    message:
      data.message ||
      data.description ||
      "",

    description:
      data.description ||
      "",
  };
};

const isSpinCoupon = (data) => {
  if (!data) {
    return false;
  }

  const source = String(
    data.source || ""
  ).toLowerCase();

  const code = String(
    data.couponCode || ""
  ).toUpperCase();

  return (
    source.includes("spin") ||
    code.startsWith("VRAJ-SPIN-")
  );
};

export const DiscountProvider = ({
  children,
}) => {
  const [discountData, setDiscountData] =
    useState(null);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (!parsed) {
        localStorage.removeItem(
          STORAGE_KEY
        );
        return;
      }

      const normalized =
        normalizeDiscount(parsed);

      if (!normalized.couponCode) {
        console.warn(
          "Saved Spin & Win discount has no coupon code."
        );

        localStorage.removeItem(
          STORAGE_KEY
        );

        return;
      }

      if (
        !Number.isFinite(
          normalized.discount
        ) ||
        normalized.discount <= 0
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return;
      }

      const allowedRewards = [
        3,
        5,
        7,
        10,
      ];

      if (
        !allowedRewards.includes(
          normalized.discount
        )
      ) {
        console.warn(
          "Invalid Spin & Win reward:",
          normalized.discount
        );

        localStorage.removeItem(
          STORAGE_KEY
        );

        return;
      }

      if (
        normalized.expiryDate
      ) {
        const expiryTime =
          new Date(
            normalized.expiryDate
          ).getTime();

        if (
          Number.isFinite(
            expiryTime
          ) &&
          Date.now() >= expiryTime
        ) {
          console.log(
            "Saved Spin & Win coupon expired."
          );

          localStorage.removeItem(
            STORAGE_KEY
          );

          return;
        }
      }

      setDiscountData(
        normalized
      );

      console.log(
        "SPIN DISCOUNT RESTORED:",
        normalized
      );
    } catch (error) {
      console.error(
        "Unable to restore Spin & Win discount:",
        error
      );

      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }, []);

  const saveDiscount = (data) => {
    try {
      if (!data) {
        return {
          success: false,
          message:
            "Discount data is missing.",
        };
      }

      const normalized =
        normalizeDiscount(data);

      if (!normalized.couponCode) {
        return {
          success: false,
          message:
            "Coupon code was not received.",
        };
      }

      if (
        !Number.isFinite(
          normalized.discount
        ) ||
        normalized.discount <= 0
      ) {
        return {
          success: false,
          message:
            "Invalid discount percentage.",
        };
      }

      const allowedRewards = [
        3,
        5,
        7,
        10,
      ];

      if (
        !allowedRewards.includes(
          normalized.discount
        )
      ) {
        return {
          success: false,
          message:
            "Invalid Spin & Win reward.",
        };
      }

      if (
        normalized.expiryDate
      ) {
        const expiryTime =
          new Date(
            normalized.expiryDate
          ).getTime();

        if (
          Number.isFinite(
            expiryTime
          ) &&
          Date.now() >= expiryTime
        ) {
          return {
            success: false,
            message:
              "This Spin & Win coupon has expired.",
          };
        }
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          normalized
        )
      );

      setDiscountData(
        normalized
      );

      console.log(
        "SPIN DISCOUNT SAVED:",
        normalized
      );

      return {
        success: true,
        data: normalized,
      };
    } catch (error) {
      console.error(
        "Unable to save discount:",
        error
      );

      return {
        success: false,
        message:
          "Unable to save coupon information.",
      };
    }
  };

  const clearDiscount = () => {
    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "Unable to clear discount storage:",
        error
      );
    }

    setDiscountData(null);
  };

  const isDiscountExpired = () => {
    if (
      !discountData?.expiryDate
    ) {
      return false;
    }

    const expiryTime =
      new Date(
        discountData.expiryDate
      ).getTime();

    if (
      !Number.isFinite(
        expiryTime
      )
    ) {
      return false;
    }

    return (
      Date.now() >= expiryTime
    );
  };

  const isProductEligible = (
    product
  ) => {
    if (!discountData) {
      return false;
    }

    if (
      isDiscountExpired()
    ) {
      return false;
    }

    if (
      discountData.discountScope ===
      "all"
    ) {
      return true;
    }

    if (
      discountData.discountScope ===
      "category"
    ) {
      const productCategory =
        String(
          product?.category ||
            product?.product?.category ||
            ""
        )
          .trim()
          .toLowerCase();

      const couponCategory =
        String(
          discountData.category ||
            ""
        )
          .trim()
          .toLowerCase();

      return (
        productCategory !== "" &&
        couponCategory !== "" &&
        productCategory ===
          couponCategory
      );
    }

    return false;
  };

  const getProductDiscount = (
    product
  ) => {
    if (
      !isProductEligible(product)
    ) {
      return 0;
    }

    return Number(
      discountData?.discount || 0
    );
  };

  const getDiscountPercentage = () => {
    if (
      !discountData ||
      isDiscountExpired()
    ) {
      return 0;
    }

    return Number(
      discountData.discount || 0
    );
  };

  const getCouponCode = () => {
    if (
      !discountData ||
      isDiscountExpired()
    ) {
      return "";
    }

    return (
      discountData.couponCode ||
      ""
    );
  };

  const getDiscountScope = () => {
    return (
      discountData?.discountScope ||
      "all"
    );
  };

  const getDiscountCategory = () => {
    return (
      discountData?.category ||
      null
    );
  };

  const spinDiscountData = useMemo(() => {
    if (
      !discountData ||
      isDiscountExpired()
    ) {
      return null;
    }

    if (
      !isSpinCoupon(
        discountData
      )
    ) {
      return null;
    }

    return {
      ...discountData,
      code:
        discountData.couponCode,
      percentage:
        Number(
          discountData.discount || 0
        ),
      isSpinDiscount: true,
    };
  }, [
    discountData,
  ]);

  const spinDiscountPercentage =
    useMemo(() => {
      if (
        !spinDiscountData
      ) {
        return 0;
      }

      return Number(
        spinDiscountData.discount || 0
      );
    }, [
      spinDiscountData,
    ]);

  const getSpinDiscount = (
    subtotal = 0,
    products = []
  ) => {
    if (
      !spinDiscountData
    ) {
      return 0;
    }

    const safeSubtotal =
      Math.max(
        0,
        Number(subtotal) || 0
      );

    if (
      safeSubtotal <= 0
    ) {
      return 0;
    }

    const minOrderAmount =
      Number(
        spinDiscountData.minOrderAmount || 0
      );

    if (
      safeSubtotal <
      minOrderAmount
    ) {
      return 0;
    }

    let eligibleAmount =
      safeSubtotal;

    if (
      spinDiscountData.discountScope ===
        "category" &&
      Array.isArray(products)
    ) {
      eligibleAmount =
        products.reduce(
          (
            total,
            item
          ) => {
            if (
              !isProductEligible(
                item
              )
            ) {
              return total;
            }

            const price =
              Number(
                item?.sellingPrice ??
                  item?.salePrice ??
                  item?.price ??
                  item?.finalPrice ??
                  0
              );

            const quantity =
              Number(
                item?.quantity ??
                  item?.qty ??
                  1
              );

            return (
              total +
              Math.max(
                0,
                price
              ) *
                Math.max(
                  1,
                  quantity
                )
            );
          },
          0
        );
    }

    let amount =
      round2(
        (eligibleAmount *
          spinDiscountPercentage) /
          100
      );

    const maxDiscount =
      Number(
        spinDiscountData.maxDiscount ??
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
        safeSubtotal
      )
    );
  };

  return (
    <DiscountContext.Provider
      value={{
        discountData,

        saveDiscount,

        clearDiscount,

        isDiscountExpired,

        isProductEligible,

        getProductDiscount,

        getDiscountPercentage,

        getCouponCode,

        getDiscountScope,

        getDiscountCategory,

        spinDiscountData,

        spinDiscountPercentage,

        getSpinDiscount,

        isSpinDiscount:
          Boolean(
            spinDiscountData
          ),

        appliedCoupon:
          spinDiscountData,

        coupon:
          spinDiscountData,

        discount:
          spinDiscountData,

        spinDiscount:
          spinDiscountData,

        getSpinCouponCode:
          () =>
            spinDiscountData
              ?.couponCode || "",

        getSpinDiscountPercentage:
          () =>
            spinDiscountPercentage,

        getSpinDiscountAmount:
          (
            subtotal,
            products
          ) =>
            getSpinDiscount(
              subtotal,
              products
            ),
      }}
    >
      {children}
    </DiscountContext.Provider>
  );
};

export const useDiscount = () => {
  const context =
    useContext(
      DiscountContext
    );

  if (!context) {
    throw new Error(
      "useDiscount must be used inside DiscountProvider"
    );
  }

  return context;
};