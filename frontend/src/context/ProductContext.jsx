import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5000/api";

const PUBLIC_PRODUCTS_API =
  import.meta.env.VITE_PUBLIC_PRODUCTS_API?.trim() ||
  `${API_BASE_URL}/products/public`;

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

const ProductContext = createContext(null);

const toNumber = (value) => {
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

const normalizeText = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const normalizeCategory = (value) => {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const normalizeImageURL = (image) => {
  const value = normalizeText(image);

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return `${BACKEND_BASE_URL}${value}`;
  }

  return `${BACKEND_BASE_URL}/${value}`;
};

const getProductSKU = (product) => {
  return normalizeSKU(
    product?.sku ||
      product?.SKU
  );
};

const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  const sku = getProductSKU(product);

  if (!sku) {
    return null;
  }

  const sellingPrice = toNumber(
    product.sellingPrice ??
      product.price
  );

  return {
    _id: product._id || "",

    sku,

    name: normalizeText(
      product.name
    ),

    hsnCode: normalizeText(
      product.hsnCode
    ),

    category: normalizeText(
      product.category
    ),

    subcategory: normalizeText(
      product.subcategory
    ),

    description: normalizeText(
      product.description
    ),

    size: normalizeText(
      product.size
    ),

    image: normalizeImageURL(
      product.image
    ),

    sellingPrice,

    price: sellingPrice,

    stock: toNumber(
      product.stock
    ),

    minimumStock: toNumber(
      product.minimumStock
    ),

    status:
      normalizeText(
        product.status
      ) || "active",

    createdAt:
      product.createdAt || null,

    updatedAt:
      product.updatedAt || null,
  };
};

const normalizeCollection = (
  collection
) => {
  if (!collection) {
    return null;
  }

  const name = normalizeText(
    collection.name
  );

  const key = normalizeCategory(
    collection.key ||
      collection.name
  );

  if (!key) {
    return null;
  }

  const products =
    Array.isArray(
      collection.products
    )
      ? collection.products
          .map((product) => ({
            ...product,

            sku: normalizeSKU(
              product?.sku ||
                product?.SKU
            ),

            image:
              normalizeImageURL(
                product?.image
              ),

            name:
              normalizeText(
                product?.name
              ),

            category:
              normalizeText(
                product?.category
              ),

            subcategory:
              normalizeText(
                product?.subcategory
              ),

            sellingPrice:
              toNumber(
                product?.sellingPrice ??
                  product?.price
              ),

            price:
              toNumber(
                product?.sellingPrice ??
                  product?.price
              ),

            stock:
              toNumber(
                product?.stock
              ),
          }))
          .filter(
            (product) =>
              Boolean(
                product.sku
              )
          )
      : [];

  return {
    key,

    name:
      name || collection.key,

    slug:
      normalizeText(
        collection.slug
      ) ||
      key.replace(
        /\s+/g,
        "-"
      ),

    count:
      Number.isFinite(
        Number(
          collection.count
        )
      )
        ? Number(
            collection.count
          )
        : products.length,

    image:
      normalizeImageURL(
        collection.image
      ),

    products,
  };
};

const normalizeCategoryItem = (
  category
) => {
  if (!category) {
    return null;
  }

  const name = normalizeText(
    category.name
  );

  const slug = normalizeText(
    category.slug
  );

  const key = normalizeCategory(
    name || slug
  );

  if (!key) {
    return null;
  }

  return {
    name:
      name || key,

    slug:
      slug ||
      key.replace(
        /\s+/g,
        "-"
      ),

    key,

    count:
      Number.isFinite(
        Number(
          category.count
        )
      )
        ? Number(
            category.count
          )
        : 0,

    image:
      normalizeImageURL(
        category.image
      ),
  };
};

export function ProductProvider({
  children,
}) {
  const [products, setProducts] =
    useState([]);

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchProducts =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            PUBLIC_PRODUCTS_API,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",
              },

              cache: "no-store",
            }
          );

        if (
          response.status === 429
        ) {
          const data =
            await response
              .json()
              .catch(
                () => null
              );

          const message =
            data?.message ||
            "Too many requests. Please try again later.";

          setProducts([]);
          setCollections([]);
          setCategories([]);
          setError(message);

          return;
        }

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(
                () => null
              );

          throw new Error(
            data?.message ||
              `Products API failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Failed to fetch products."
          );
        }

        const sourceProducts =
          Array.isArray(
            data.products
          )
            ? data.products
            : Array.isArray(
                data.data
              )
            ? data.data
            : [];

        const liveProducts =
          sourceProducts
            .map(
              normalizeProduct
            )
            .filter(Boolean);

        const sourceCollections =
          Array.isArray(
            data.collections
          )
            ? data.collections
            : [];

        const liveCollections =
          sourceCollections
            .map(
              normalizeCollection
            )
            .filter(Boolean);

        const sourceCategories =
          Array.isArray(
            data.categories
          )
            ? data.categories
            : [];

        let liveCategories =
          sourceCategories
            .map(
              normalizeCategoryItem
            )
            .filter(Boolean);

        if (
          liveCategories.length ===
          0
        ) {
          const categoryMap =
            new Map();

          liveProducts.forEach(
            (product) => {
              const key =
                normalizeCategory(
                  product.category
                );

              if (!key) {
                return;
              }

              if (
                !categoryMap.has(
                  key
                )
              ) {
                categoryMap.set(
                  key,
                  {
                    name:
                      product.category,

                    slug:
                      key.replace(
                        /\s+/g,
                        "-"
                      ),

                    key,

                    count: 0,

                    image:
                      product.image ||
                      "",
                  }
                );
              }

              const item =
                categoryMap.get(
                  key
                );

              item.count += 1;

              if (
                !item.image &&
                product.image
              ) {
                item.image =
                  product.image;
              }
            }
          );

          liveCategories =
            Array.from(
              categoryMap.values()
            );
        }

        let finalCollections =
          liveCollections;

        if (
          finalCollections.length ===
          0
        ) {
          finalCollections =
            liveCategories.map(
              (category) => ({
                key:
                  category.key,

                name:
                  category.name,

                slug:
                  category.slug,

                count:
                  category.count,

                image:
                  category.image,

                products:
                  liveProducts.filter(
                    (product) =>
                      normalizeCategory(
                        product.category
                      ) ===
                      category.key
                  ),
              })
            );
        }

        setProducts(
          liveProducts
        );

        setCategories(
          liveCategories
        );

        setCollections(
          finalCollections
        );
      } catch (error) {
        console.error(
          "PUBLIC PRODUCTS ERROR:",
          error
        );

        setProducts([]);
        setCategories([]);
        setCollections([]);

        if (
          error?.message ===
          "Failed to fetch"
        ) {
          setError(
            "Backend server is not running. Please start the backend on port 5000."
          );
        } else {
          setError(
            error?.message ||
              "Unable to load products."
          );
        }
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductBySKU =
    useCallback(
      (sku) => {
        const searchSKU =
          normalizeSKU(sku);

        if (!searchSKU) {
          return null;
        }

        return (
          products.find(
            (product) =>
              normalizeSKU(
                product?.sku
              ) === searchSKU
          ) || null
        );
      },
      [products]
    );

  const getProduct =
    useCallback(
      (sku) => {
        return getProductBySKU(
          sku
        );
      },
      [getProductBySKU]
    );

  const getProductsByCategory =
    useCallback(
      (category) => {
        const searchCategory =
          normalizeCategory(
            category
          );

        if (
          !searchCategory
        ) {
          return [];
        }

        return products.filter(
          (product) =>
            normalizeCategory(
              product?.category
            ) ===
            searchCategory
        );
      },
      [products]
    );

  const getCollectionByCategory =
    useCallback(
      (category) => {
        const searchCategory =
          normalizeCategory(
            category
          );

        if (
          !searchCategory
        ) {
          return null;
        }

        return (
          collections.find(
            (collection) =>
              normalizeCategory(
                collection?.key ||
                  collection?.name
              ) ===
              searchCategory
          ) || null
        );
      },
      [collections]
    );

  const getCategory =
    useCallback(
      (category) => {
        const searchCategory =
          normalizeCategory(
            category
          );

        if (
          !searchCategory
        ) {
          return null;
        }

        return (
          categories.find(
            (item) =>
              normalizeCategory(
                item?.key ||
                  item?.name
              ) ===
              searchCategory
          ) || null
        );
      },
      [categories]
    );

  const value =
    useMemo(
      () => ({
        products,

        categories,

        collections,

        loading,

        error,

        refreshProducts:
          fetchProducts,

        getProduct,

        getProductBySKU,

        getProductsByCategory,

        getCollectionByCategory,

        getCategory,
      }),
      [
        products,
        categories,
        collections,
        loading,
        error,
        fetchProducts,
        getProduct,
        getProductBySKU,
        getProductsByCategory,
        getCollectionByCategory,
        getCategory,
      ]
    );

  return (
    <ProductContext.Provider
      value={value}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context =
    useContext(
      ProductContext
    );

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductProvider"
    );
  }

  return context;
}