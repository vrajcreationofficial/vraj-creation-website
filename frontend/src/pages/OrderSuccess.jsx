
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiShoppingBag,
  FiHome,
  FiPackage,
} from "react-icons/fi";

const OrderSuccess = () => {
  const [orderNumber, setOrderNumber] =
    useState("VRAJ-ORDER");

  const [loading, setLoading] =
    useState(true);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    // =====================================================
    // ONLY GET ORDER ID
    // =====================================================

    try {
      const savedOrder =
        sessionStorage.getItem("vraj_order");

      if (savedOrder) {
        const parsedOrder =
          JSON.parse(savedOrder);

        const id =
          parsedOrder?.orderNumber ||
          parsedOrder?.orderId ||
          parsedOrder?._id ||
          parsedOrder?.id;

        if (id) {
          setOrderNumber(String(id));
        }
      }
    } catch (error) {
      console.error(
        "Order ID loading error:",
        error
      );
    }

    // =====================================================
    // PLACE ORDER LOADING ANIMATION
    // =====================================================

    const timer = setTimeout(() => {
      setLoading(false);

      setTimeout(() => {
        setSuccess(true);
      }, 150);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8 text-gray-900 sm:px-6">

      {/* =====================================================
          BACKGROUND EFFECTS
      ===================================================== */}

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400/10 blur-[110px]" />

      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#8f3424]/10 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#dca34f]/10 blur-[100px]" />

      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center text-center">

        {/* ===================================================
            LOADING SCREEN
        =================================================== */}

        {loading && (
          <div className="flex min-h-[560px] w-full flex-col items-center justify-center">

            {/* Animated Loader */}

            <div className="relative flex h-32 w-32 items-center justify-center">

              {/* Outer pulse */}

              <div className="absolute inset-0 animate-ping rounded-full bg-[#8f3424]/10" />

              {/* Rotating ring */}

              <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-[#8f3424]/10 border-t-[#8f3424] border-r-[#dca34f]" />

              {/* Inner circle */}

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white bg-white shadow-2xl shadow-gray-300/40">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8f3424] to-[#a63d2a] shadow-lg shadow-[#8f3424]/30">

                  <FiShoppingBag
                    size={30}
                    className="animate-pulse text-white"
                  />

                </div>

              </div>
            </div>

            {/* Loading Text */}

            <div className="mt-9">

              <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#b7791f]">
                Vraj Creation
              </p>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Placing Your Order
              </h1>

              <p className="mt-3 text-sm text-gray-500 sm:text-base">
                Please wait while we confirm your order...
              </p>
            </div>

            {/* Loading Dots */}

            <div className="mt-7 flex items-center gap-2">

              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#8f3424]" />

              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#dca34f] [animation-delay:150ms]" />

              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#8f3424] [animation-delay:300ms]" />

            </div>

          </div>
        )}

        {/* ===================================================
            SUCCESS SCREEN
        =================================================== */}

        {!loading && success && (
          <div className="flex min-h-[560px] w-full flex-col items-center justify-center">

            {/* =================================================
                SUCCESS ICON
            ================================================= */}

            <div className="relative">

              {/* Ripple 1 */}

              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-green-400/20" />

              {/* Ripple 2 */}

              <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-green-400/10" />

              {/* Main Circle */}

              <div className="relative flex h-36 w-36 animate-[bounce_1s_ease-out_1] items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-[0_20px_60px_rgba(34,197,94,0.30)]">

                {/* Inner White Border */}

                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/40 bg-green-500">

                  {/* Check */}

                  <FiCheck
                    size={58}
                    strokeWidth={3.5}
                    className="animate-[pulse_0.8s_ease-out_1] text-white"
                  />

                </div>

              </div>
            </div>

            {/* =================================================
                SUCCESS TEXT
            ================================================= */}

            <div className="mt-10">

              <p className="animate-pulse text-xs font-bold uppercase tracking-[0.4em] text-[#b7791f]">
                Vraj Creation
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                Order Placed!
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                Your order has been placed successfully.
              </p>

            </div>

            {/* =================================================
                ORDER ID
            ================================================= */}

            <div className="mt-7 rounded-2xl border border-[#dca34f]/30 bg-white px-7 py-4 shadow-lg shadow-gray-200/50">

              <div className="flex items-center justify-center gap-2">

                <FiPackage
                  size={17}
                  className="text-[#b7791f]"
                />

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order ID
                </span>

              </div>

              <p className="mt-2 text-lg font-black tracking-wide text-[#8f3424] sm:text-xl">
                #{orderNumber}
              </p>

            </div>

            {/* =================================================
                CONFIRMED BADGE
            ================================================= */}

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">

              <span className="relative flex h-2.5 w-2.5">

                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />

              </span>

              <span className="text-xs font-bold text-green-700">
                Order Confirmed
              </span>

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

              {/* Home */}

              <Link
                to="/"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#dca34f] hover:text-[#8f3424] hover:shadow-lg"
              >

                <FiHome
                  size={18}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                Back to Home

              </Link>

              {/* Shopping */}

              <Link
                to="/#categorys"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f3424] px-7 py-3.5 font-semibold text-white shadow-lg shadow-[#8f3424]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#a63d2a] hover:shadow-xl"
              >

                <FiShoppingBag
                  size={18}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                Continue Shopping

              </Link>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-8">

              <p className="text-xs text-gray-400">
                Thank you for choosing Vraj Creation
              </p>

              <p className="mt-1 text-xs font-medium text-[#b7791f]">
                Traditional Craft, Beautifully Made.
              </p>

            </div>

          </div>
        )}

      </div>
    </main>
  );
};

export default OrderSuccess;
