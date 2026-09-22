
import { useState } from "react";
import {
  FiShoppingBag,
  FiCheck,
} from "react-icons/fi";

import { useCart } from "../context/CartContext";

const AddToCartButton = ({
  product,
}) => {
  const {
    addToCart,
    isInCart,
  } = useCart();

  const [added, setAdded] =
    useState(false);

  // ==========================================================
  // SKU
  // ==========================================================

  const sku = String(
    product?.sku ||
      product?.SKU ||
      product?.productSku ||
      ""
  )
    .trim()
    .toUpperCase();

  // ==========================================================
  // LIVE STOCK
  // ==========================================================

  const stock = Number(
    product?.stock
  );

  const hasValidStock =
    product?.stock !== null &&
    product?.stock !== undefined &&
    product?.stock !== "" &&
    Number.isFinite(stock);

  const isOutOfStock =
    !hasValidStock ||
    stock <= 0;

  // ==========================================================
  // ALREADY IN CART
  // ==========================================================

  const alreadyInCart =
    sku
      ? isInCart(sku)
      : false;

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = () => {
    if (!product) {
      alert(
        "Product not found."
      );
      return;
    }

    if (!sku) {
      alert(
        "Product SKU is missing."
      );
      return;
    }

    if (isOutOfStock) {
      alert(
        "Product is currently out of stock."
      );
      return;
    }

    const result =
      addToCart(product);

    console.log(
      "ADD TO CART RESULT:",
      result
    );

    if (!result?.success) {
      alert(
        result?.message ||
          "Unable to add product to cart."
      );
      return;
    }

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  // ==========================================================
  // OUT OF STOCK BUTTON
  // ==========================================================

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className="
          w-full
          flex
          items-center
          justify-center
          gap-2
          px-4
          py-3
          rounded-xl
          font-semibold
          text-sm
          bg-gray-400
          text-white
          cursor-not-allowed
        "
      >
        <FiShoppingBag
          size={16}
        />

        Out of Stock
      </button>
    );
  }

  // ==========================================================
  // ADD TO CART BUTTON
  // ==========================================================

  return (
    <button
      type="button"
      onClick={
        handleAddToCart
      }
      className={`
        w-full
        flex
        items-center
        justify-center
        gap-2
        px-4
        py-3
        rounded-xl
        font-semibold
        text-sm
        transition-all
        duration-300

        ${
          added ||
          alreadyInCart
            ? "bg-green-600 text-white"
            : "bg-[#8f3424] hover:bg-[#76291d] text-white"
        }
      `}
    >
      {added ||
      alreadyInCart ? (
        <>
          <FiCheck
            size={16}
          />

          <span>
            {added
              ? "Added"
              : "In Cart"}
          </span>
        </>
      ) : (
        <>
          <FiShoppingBag
            size={16}
          />

          <span>
            Add to Cart
          </span>
        </>
      )}
    </button>
  );
};

export default AddToCartButton;