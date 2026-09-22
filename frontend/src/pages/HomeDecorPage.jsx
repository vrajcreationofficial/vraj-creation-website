import CategoryLayout from "../components/CategoryLayout";
import { useProducts } from "../context/ProductContext";

const HOME_DECOR_CATEGORIES = [
  "home decor",
  "home décor",
];

export default function HomeDecorPage() {
  const {
    products,
    loading,
    error,
  } = useProducts();

  if (loading) {
    return (
      <section
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          bg-white
          dark:bg-gray-950
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-[#8f3424]
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-gray-600
              dark:text-gray-400
            "
          >
            Loading Home Décor products...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          px-6
          bg-white
          dark:bg-gray-950
        "
      >
        <div
          className="
            w-full
            max-w-lg
            rounded-2xl
            border
            border-red-200
            dark:border-red-900
            bg-red-50
            dark:bg-red-950/30
            p-6
            text-center
          "
        >
          <h2
            className="
              text-xl
              font-bold
              text-red-700
              dark:text-red-400
            "
          >
            Unable to load products
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-red-600
              dark:text-red-300
            "
          >
            {error}
          </p>
        </div>
      </section>
    );
  }

  const liveProducts = Array.isArray(products)
    ? products
    : [];

  const homeDecorProducts = liveProducts.filter(
    (product) => {
      const category = String(
        product?.category || ""
      )
        .trim()
        .toLowerCase();

      return HOME_DECOR_CATEGORIES.includes(category);
    }
  );

  console.log(
    "HOME DECOR - ALL LIVE PRODUCTS:",
    liveProducts
  );

  console.log(
    "HOME DECOR - ONLY HOME DECOR PRODUCTS:",
    homeDecorProducts
  );

  return (
    <CategoryLayout
      title="Home Décor"
      subtitle="Discover artisan-crafted Jodhpur home accents fusing rich Rajasthani heritage with ultra-modern architectural silhouettes."
      products={homeDecorProducts}
    />
  );
}
