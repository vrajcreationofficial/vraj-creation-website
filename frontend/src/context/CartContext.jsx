import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useProducts } from "./ProductContext";

const CartContext = createContext(null);

const CART_STORAGE_KEY =
  "vraj_creation_cart";

// ============================================================
// NORMALIZE SKU
// ============================================================

const normalizeSKU = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toUpperCase();
};

// ============================================================
// GET PRODUCT SKU
// ============================================================

const getProductSKU = (product) => {
  return normalizeSKU(
    product?.sku ||
      product?.SKU ||
      product?.productSku
  );
};

// ============================================================
// GET PRICE
// ============================================================

const getProductPrice = (product) => {
  const price = Number(
    product?.sellingPrice ??
      product?.price
  );

  if (
    Number.isFinite(price) &&
    price >= 0
  ) {
    return price;
  }

  return null;
};

// ============================================================
// GET STOCK
// ============================================================

const getProductStock = (product) => {
  const stock = Number(
    product?.stock
  );

  if (
    Number.isFinite(stock) &&
    stock >= 0
  ) {
    return stock;
  }

  return null;
};

// ============================================================
// FIND LIVE PRODUCT BY SKU
// ============================================================

const findLiveProduct = (
  products,
  cartItem
) => {
  if (
    !Array.isArray(products) ||
    !cartItem
  ) {
    return null;
  }

  const cartSKU =
    getProductSKU(cartItem);

  if (!cartSKU) {
    return null;
  }

  return (
    products.find((product) => {
      const liveSKU =
        getProductSKU(product);

      return (
        liveSKU &&
        liveSKU === cartSKU
      );
    }) || null
  );
};

// ============================================================
// CREATE CART ITEM
// ============================================================

const createCartItem = (product) => {
  const sku =
    getProductSKU(product);

  const price =
    getProductPrice(product);

  const stock =
    getProductStock(product);

  return {
    sku,

    name:
      product?.name ||
      "Handcrafted Product",

    image:
      product?.image ||
      "",

    category:
      product?.category ||
      "",

    subcategory:
      product?.subcategory ||
      "",

    description:
      product?.description ||
      "",

    size:
      product?.size ||
      "",

    price:
      price ?? 0,

    sellingPrice:
      price ?? 0,

    stock:
      stock ?? 0,

    quantity: 1,
  };
};

// ============================================================
// NORMALIZE SAVED CART
// ============================================================

const normalizeSavedCart = (
  parsedCart
) => {
  if (
    !Array.isArray(parsedCart)
  ) {
    return [];
  }

  return parsedCart
    .map((item) => {
      const sku =
        getProductSKU(item);

      if (!sku) {
        return null;
      }

      const price =
        getProductPrice(item);

      const stock =
        getProductStock(item);

      const quantity =
        Number(item?.quantity) || 1;

      return {
        sku,

        name:
          item?.name ||
          "Handcrafted Product",

        image:
          item?.image ||
          "",

        category:
          item?.category ||
          "",

        subcategory:
          item?.subcategory ||
          "",

        description:
          item?.description ||
          "",

        size:
          item?.size ||
          "",

        price:
          price ?? 0,

        sellingPrice:
          price ?? 0,

        stock:
          stock ?? 0,

        quantity:
          Math.max(
            1,
            Math.floor(
              quantity
            )
          ),
      };
    })
    .filter(Boolean);
};

// ============================================================
// CART PROVIDER
// ============================================================

export const CartProvider = ({
  children,
}) => {
  // ==========================================================
  // LIVE PRODUCTS
  // ==========================================================

  const {
    products,
    loading: productsLoading,
  } = useProducts();

  // ==========================================================
  // LOAD CART
  // ==========================================================

  const [cartItems, setCartItems] =
    useState(() => {
      try {
        const savedCart =
          localStorage.getItem(
            CART_STORAGE_KEY
          );

        if (!savedCart) {
          return [];
        }

        const parsedCart =
          JSON.parse(savedCart);

        return normalizeSavedCart(
          parsedCart
        );
      } catch (error) {
        console.error(
          "FAILED TO LOAD CART:",
          error
        );

        return [];
      }
    });

  // ==========================================================
  // SAVE CART
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      );

      console.log(
        "CART SAVED:",
        cartItems
      );
    } catch (error) {
      console.error(
        "FAILED TO SAVE CART:",
        error
      );
    }
  }, [cartItems]);

  // ==========================================================
  // SYNC CART WITH LIVE PRODUCTS
  // ==========================================================

  useEffect(() => {
    if (productsLoading) {
      return;
    }

    if (
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return;
    }

    setCartItems(
      (currentItems) => {
        let hasChanges = false;

        const syncedItems =
          currentItems.map(
            (cartItem) => {
              const cartSKU =
                getProductSKU(
                  cartItem
                );

              // ==================================================
              // INVALID SKU
              // ==================================================

              if (!cartSKU) {
                console.warn(
                  "CART ITEM HAS NO SKU - REMOVING:",
                  cartItem?.name
                );

                hasChanges = true;

                return null;
              }

              // ==================================================
              // FIND LIVE PRODUCT
              // ==================================================

              const liveProduct =
                findLiveProduct(
                  products,
                  cartItem
                );

              // ==================================================
              // PRODUCT NOT FOUND
              // ==================================================

              if (!liveProduct) {
                console.warn(
                  "LIVE PRODUCT NOT FOUND - KEEPING CART ITEM:",
                  cartItem?.name,
                  cartSKU
                );

                return cartItem;
              }

              // ==================================================
              // LIVE PRICE
              // ==================================================

              const livePrice =
                getProductPrice(
                  liveProduct
                );

              // ==================================================
              // LIVE STOCK
              // ==================================================

              const liveStock =
                getProductStock(
                  liveProduct
                );

              // ==================================================
              // LIVE DATA INVALID
              // ==================================================

              if (
                livePrice === null ||
                liveStock === null
              ) {
                return cartItem;
              }

              // ==================================================
              // OUT OF STOCK
              // ==================================================

              if (
                liveStock <= 0
              ) {
                console.warn(
                  "PRODUCT OUT OF STOCK:",
                  liveProduct?.name,
                  cartSKU
                );

                hasChanges = true;

                return null;
              }

              // ==================================================
              // QUANTITY
              // ==================================================

              const oldQuantity =
                Number(
                  cartItem?.quantity
                ) || 1;

              const newQuantity =
                Math.min(
                  Math.max(
                    1,
                    oldQuantity
                  ),
                  liveStock
                );

              // ==================================================
              // LIVE SKU
              // ==================================================

              const liveSKU =
                getProductSKU(
                  liveProduct
                );

              // ==================================================
              // UPDATED CART ITEM
              // ==================================================

              const updatedItem = {
                ...cartItem,

                sku:
                  liveSKU,

                name:
                  liveProduct?.name ||
                  cartItem?.name ||
                  "Handcrafted Product",

                image:
                  liveProduct?.image ||
                  cartItem?.image ||
                  "",

                category:
                  liveProduct?.category ||
                  cartItem?.category ||
                  "",

                subcategory:
                  liveProduct?.subcategory ||
                  cartItem?.subcategory ||
                  "",

                description:
                  liveProduct?.description ||
                  cartItem?.description ||
                  "",

                size:
                  liveProduct?.size ||
                  cartItem?.size ||
                  "",

                price:
                  livePrice,

                sellingPrice:
                  livePrice,

                stock:
                  liveStock,

                quantity:
                  newQuantity,
              };

              // ==================================================
              // CHANGE DETECTION
              // ==================================================

              if (
                normalizeSKU(
                  cartItem?.sku
                ) !==
                  normalizeSKU(
                    updatedItem?.sku
                  ) ||
                Number(
                  cartItem?.price
                ) !==
                  Number(
                    updatedItem?.price
                  ) ||
                Number(
                  cartItem?.stock
                ) !==
                  Number(
                    updatedItem?.stock
                  ) ||
                Number(
                  cartItem?.quantity
                ) !==
                  Number(
                    updatedItem?.quantity
                  ) ||
                cartItem?.name !==
                  updatedItem?.name ||
                cartItem?.image !==
                  updatedItem?.image ||
                cartItem?.category !==
                  updatedItem?.category ||
                cartItem?.subcategory !==
                  updatedItem?.subcategory ||
                cartItem?.description !==
                  updatedItem?.description ||
                cartItem?.size !==
                  updatedItem?.size
              ) {
                hasChanges = true;
              }

              return updatedItem;
            }
          );

        const filteredItems =
          syncedItems.filter(
            Boolean
          );

        if (!hasChanges) {
          return currentItems;
        }

        console.log(
          "================================="
        );

        console.log(
          "CART SYNC COMPLETED"
        );

        console.log(
          "Live products:",
          products.length
        );

        console.log(
          "Cart items:",
          filteredItems.length
        );

        console.log(
          "================================="
        );

        return filteredItems;
      }
    );
  }, [
    products,
    productsLoading,
  ]);

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const addToCart = (product) => {
    if (!product) {
      return {
        success: false,
        message:
          "Product not found.",
      };
    }

    // ========================================================
    // SKU
    // ========================================================

    const sku =
      getProductSKU(product);

    if (!sku) {
      console.error(
        "ADD TO CART FAILED - SKU MISSING:",
        product
      );

      return {
        success: false,
        message:
          "Product SKU is missing.",
      };
    }

    // ========================================================
    // PRICE
    // ========================================================

    const price =
      getProductPrice(product);

    if (price === null) {
      return {
        success: false,
        message:
          "Product price is not available.",
      };
    }

    // ========================================================
    // STOCK
    // ========================================================

    const stock =
      getProductStock(product);

    if (stock === null) {
      return {
        success: false,
        message:
          "Product stock is not available.",
      };
    }

    // ========================================================
    // OUT OF STOCK
    // ========================================================

    if (stock <= 0) {
      return {
        success: false,
        message:
          "Product is currently out of stock.",
      };
    }

    console.log(
      "================================="
    );

    console.log(
      "ADDING PRODUCT TO CART"
    );

    console.log(
      "Product:",
      product?.name
    );

    console.log(
      "SKU:",
      sku
    );

    console.log(
      "Price:",
      price
    );

    console.log(
      "Stock:",
      stock
    );

    console.log(
      "================================="
    );

    // ========================================================
    // UPDATE CART
    // ========================================================

    setCartItems(
      (currentItems) => {
        const existingItemIndex =
          currentItems.findIndex(
            (item) =>
              normalizeSKU(
                item?.sku
              ) === sku
          );

        // ======================================================
        // EXISTING PRODUCT
        // ======================================================

        if (
          existingItemIndex !== -1
        ) {
          const updatedItems =
            [...currentItems];

          const existingItem =
            updatedItems[
              existingItemIndex
            ];

          const currentQuantity =
            Number(
              existingItem?.quantity
            ) || 1;

          // ====================================================
          // STOCK LIMIT
          // ====================================================

          if (
            currentQuantity >=
            stock
          ) {
            console.warn(
              "STOCK LIMIT REACHED:",
              sku
            );

            return currentItems;
          }

          // ====================================================
          // UPDATE EXISTING ITEM
          // ====================================================

          updatedItems[
            existingItemIndex
          ] = {
            ...existingItem,

            sku,

            name:
              product?.name ||
              existingItem?.name ||
              "Handcrafted Product",

            image:
              product?.image ||
              existingItem?.image ||
              "",

            category:
              product?.category ||
              existingItem?.category ||
              "",

            subcategory:
              product?.subcategory ||
              existingItem?.subcategory ||
              "",

            description:
              product?.description ||
              existingItem?.description ||
              "",

            size:
              product?.size ||
              existingItem?.size ||
              "",

            price,

            sellingPrice:
              price,

            stock,

            quantity:
              currentQuantity + 1,
          };

          console.log(
            "CART QUANTITY UPDATED:",
            currentQuantity + 1
          );

          return updatedItems;
        }

        // ======================================================
        // NEW PRODUCT
        // ======================================================

        const newCartItem =
          createCartItem(product);

        console.log(
          "NEW CART ITEM:",
          newCartItem
        );

        return [
          ...currentItems,
          newCartItem,
        ];
      }
    );

    return {
      success: true,
      message:
        "Product added to cart.",
      price,
      stock,
      sku,
    };
  };

  // ==========================================================
  // REMOVE FROM CART
  // ==========================================================

  const removeFromCart = (
    sku
  ) => {
    const normalizedSKU =
      normalizeSKU(sku);

    if (!normalizedSKU) {
      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            normalizeSKU(
              item?.sku
            ) !== normalizedSKU
        )
    );
  };

  // ==========================================================
  // INCREASE QUANTITY
  // ==========================================================

  const increaseQuantity = (
    sku
  ) => {
    const normalizedSKU =
      normalizeSKU(sku);

    if (!normalizedSKU) {
      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              normalizeSKU(
                item?.sku
              ) !== normalizedSKU
            ) {
              return item;
            }

            const quantity =
              Number(
                item?.quantity
              ) || 1;

            const stock =
              Number(
                item?.stock
              );

            if (
              !Number.isFinite(
                stock
              ) ||
              stock <= 0
            ) {
              return item;
            }

            if (
              quantity >= stock
            ) {
              return item;
            }

            return {
              ...item,
              quantity:
                quantity + 1,
            };
          }
        )
    );
  };

  // ==========================================================
  // DECREASE QUANTITY
  // ==========================================================

  const decreaseQuantity = (
    sku
  ) => {
    const normalizedSKU =
      normalizeSKU(sku);

    if (!normalizedSKU) {
      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems
          .map((item) => {
            if (
              normalizeSKU(
                item?.sku
              ) !== normalizedSKU
            ) {
              return item;
            }

            const quantity =
              Number(
                item?.quantity
              ) || 1;

            if (
              quantity <= 1
            ) {
              return null;
            }

            return {
              ...item,
              quantity:
                quantity - 1,
            };
          })
          .filter(Boolean)
    );
  };

  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  const updateQuantity = (
    sku,
    quantity
  ) => {
    const normalizedSKU =
      normalizeSKU(sku);

    if (!normalizedSKU) {
      return;
    }

    const newQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        newQuantity
      ) ||
      newQuantity <= 0
    ) {
      removeFromCart(
        normalizedSKU
      );

      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              normalizeSKU(
                item?.sku
              ) !== normalizedSKU
            ) {
              return item;
            }

            const stock =
              Number(
                item?.stock
              );

            if (
              !Number.isFinite(
                stock
              ) ||
              stock <= 0
            ) {
              return item;
            }

            const finalQuantity =
              Math.min(
                Math.max(
                  1,
                  Math.floor(
                    newQuantity
                  )
                ),
                stock
              );

            return {
              ...item,
              quantity:
                finalQuantity,
            };
          }
        )
    );
  };

  // ==========================================================
  // CLEAR CART
  // ==========================================================

  const clearCart = () => {
    setCartItems([]);
  };

  // ==========================================================
  // IS IN CART
  // ==========================================================

  const isInCart = (
    sku
  ) => {
    const normalizedSKU =
      normalizeSKU(sku);

    if (!normalizedSKU) {
      return false;
    }

    return cartItems.some(
      (item) =>
        normalizeSKU(
          item?.sku
        ) === normalizedSKU
    );
  };

  // ==========================================================
  // TOTAL ITEMS
  // ==========================================================

  const totalItems =
    useMemo(() => {
      return cartItems.reduce(
        (total, item) => {
          return (
            total +
            (Number(
              item?.quantity
            ) || 0)
          );
        },
        0
      );
    }, [cartItems]);

  // ==========================================================
  // SUBTOTAL
  // ==========================================================

  const subtotal =
    useMemo(() => {
      return cartItems.reduce(
        (total, item) => {
          const price =
            Number(
              item?.sellingPrice ??
                item?.price
            );

          const quantity =
            Number(
              item?.quantity
            ) || 0;

          if (
            !Number.isFinite(
              price
            ) ||
            price < 0
          ) {
            return total;
          }

          return (
            total +
            price * quantity
          );
        },
        0
      );
    }, [cartItems]);

  // ==========================================================
  // FORMAT PRICE
  // ==========================================================

  const formatPrice = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(amount) || 0
    );
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    cartItems,

    addToCart,

    removeFromCart,

    increaseQuantity,

    decreaseQuantity,

    updateQuantity,

    clearCart,

    isInCart,

    totalItems,

    subtotal,

    formatPrice,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
};

// ============================================================
// USE CART
// ============================================================

export const useCart = () => {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};
