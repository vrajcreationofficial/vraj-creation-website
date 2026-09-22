const mongoose = require("mongoose");
const Product = require("../models/Product");

const normalize = (value) =>
  String(value ?? "").trim();

const normalizeLower = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeUpper = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(
    String(value || "").trim()
  );
};

const getProductImage = (req) => {
  if (!req.file) {
    return "";
  }

  if (req.file.path) {
    return req.file.path;
  }

  if (req.file.secure_url) {
    return req.file.secure_url;
  }

  if (req.file.url) {
    return req.file.url;
  }

  return "";
};

const getPublicImageUrl = (req, image) => {
  const value = normalize(image);

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

  const protocol =
    req.headers["x-forwarded-proto"] ||
    req.protocol ||
    "http";

  const host =
    req.get("host") ||
    "localhost:5000";

  const cleanPath = value.startsWith("/")
    ? value
    : `/${value}`;

  return `${protocol}://${host}${cleanPath}`;
};

const sanitizeProduct = (req, product) => {
  if (!product) {
    return null;
  }

  const data =
    typeof product.toObject === "function"
      ? product.toObject()
      : {
          ...product,
        };

  delete data.purchasePrice;
  delete data.supplier;
  delete data.productId;

  data.sku = normalizeUpper(
    data.sku
  );

  data.category = normalize(
    data.category
  );

  data.subcategory = normalize(
    data.subcategory
  );

  data.image = getPublicImageUrl(
    req,
    data.image
  );

  return data;
};

const handleDuplicateError = (
  error,
  res
) => {
  if (error?.code === 11000) {
    const field =
      Object.keys(
        error.keyPattern || {}
      )[0] || "field";

    const value =
      error.keyValue?.[field];

    return res.status(409).json({
      success: false,
      message: `${field} already exists${
        value ? `: ${value}` : "."
      }`,
      field,
      value,
    });
  }

  return res.status(500).json({
    success: false,
    message:
      error.message ||
      "Server error.",
  });
};

const findProductByIdentifier = async (
  identifier
) => {
  const value = normalize(identifier);

  if (!value) {
    return null;
  }

  let product = null;

  if (isValidObjectId(value)) {
    product =
      await Product.findById(value);
  }

  if (!product) {
    product =
      await Product.findOne({
        sku: normalizeUpper(value),
      });
  }

  return product;
};

const buildCollections = (
  req,
  products
) => {
  const collectionMap = new Map();

  products.forEach((product) => {
    const category =
      normalizeLower(
        product.category
      );

    if (!category) {
      return;
    }

    if (
      !collectionMap.has(category)
    ) {
      collectionMap.set(
        category,
        {
          key: category,
          name: normalize(
            product.category
          ),
          slug: category
            .replace(
              /[^\w\s-]/g,
              ""
            )
            .replace(
              /\s+/g,
              "-"
            ),
          count: 0,
          image: "",
          products: [],
        }
      );
    }

    const collection =
      collectionMap.get(
        category
      );

    collection.count += 1;

    const productImage =
      getPublicImageUrl(
        req,
        product.image
      );

    if (
      !collection.image &&
      productImage
    ) {
      collection.image =
        productImage;
    }

    collection.products.push({
      sku: normalizeUpper(
        product.sku
      ),
      name: normalize(
        product.name
      ),
      image: productImage,
      sellingPrice:
        product.sellingPrice,
      stock: product.stock,
      category:
        normalize(
          product.category
        ),
      subcategory:
        normalize(
          product.subcategory
        ),
    });
  });

  const collections = Array.from(
    collectionMap.values()
  );

  const preferredOrder = [
    "home decor",
    "wall decor",
    "table decor",
    "resin art",
    "ethnic furnishing",
    "desk accessories",
  ];

  collections.sort((a, b) => {
    const aIndex =
      preferredOrder.indexOf(
        a.key
      );

    const bIndex =
      preferredOrder.indexOf(
        b.key
      );

    if (
      aIndex !== -1 &&
      bIndex !== -1
    ) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) {
      return -1;
    }

    if (bIndex !== -1) {
      return 1;
    }

    return a.name.localeCompare(
      b.name
    );
  });

  return collections;
};

const create = async (
  req,
  res
) => {
  try {
    const {
      name,
      sku,
      hsnCode,
      category,
      subcategory,
      size,
      description,
      sellingPrice,
      stock,
      minimumStock,
      status,
    } = req.body;

    const finalName =
      normalize(name);

    const finalSku =
      normalizeUpper(sku);

    const finalHsnCode =
      normalize(hsnCode);

    const finalCategory =
      normalize(category);

    const finalSubcategory =
      normalize(subcategory);

    const finalSize =
      normalize(size);

    const finalDescription =
      normalize(description);

    const finalStatus =
      normalize(status) ||
      "active";

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
        field: "name",
      });
    }

    if (!finalSku) {
      return res.status(400).json({
        success: false,
        message:
          "SKU is required.",
        field: "sku",
      });
    }

    if (!finalCategory) {
      return res.status(400).json({
        success: false,
        message:
          "Category is required.",
        field: "category",
      });
    }

    if (
      finalHsnCode &&
      !/^\d{4}$|^\d{6}$|^\d{8}$/.test(
        finalHsnCode
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "HSN Code must be 4, 6 or 8 digits.",
        field: "hsnCode",
      });
    }

    const finalSellingPrice =
      Number(sellingPrice);

    const finalStock =
      Number(stock);

    const finalMinimumStock =
      minimumStock === undefined ||
      minimumStock === null ||
      minimumStock === ""
        ? 5
        : Number(minimumStock);

    if (
      !Number.isFinite(
        finalSellingPrice
      ) ||
      finalSellingPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid selling price.",
        field: "sellingPrice",
      });
    }

    if (
      !Number.isInteger(
        finalStock
      ) ||
      finalStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock.",
        field: "stock",
      });
    }

    if (
      !Number.isInteger(
        finalMinimumStock
      ) ||
      finalMinimumStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid minimum stock.",
        field: "minimumStock",
      });
    }

    const existingSku =
      await Product.findOne({
        sku: finalSku,
      }).lean();

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message:
          `SKU already exists: ${finalSku}`,
        field: "sku",
      });
    }

    const image =
      getProductImage(req);

    const product =
      new Product({
        name: finalName,
        sku: finalSku,
        hsnCode: finalHsnCode,
        category: finalCategory,
        subcategory:
          finalSubcategory,
        image,
        description:
          finalDescription,
        size: finalSize,
        sellingPrice:
          finalSellingPrice,
        stock: finalStock,
        minimumStock:
          finalMinimumStock,
        status:
          finalStatus === "inactive"
            ? "inactive"
            : "active",
      });

    const savedProduct =
      await product.save();

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product:
        sanitizeProduct(
          req,
          savedProduct
        ),
    });
  } catch (error) {
    console.error(
      "PRODUCT SAVE ERROR:",
      error
    );

    return handleDuplicateError(
      error,
      res
    );
  }
};

const list = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find()
        .select(
          "-purchasePrice -supplier -productId"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const cleanProducts =
      products.map((product) =>
        sanitizeProduct(
          req,
          product
        )
      );

    return res.status(200).json({
      success: true,
      products:
        cleanProducts,
      data:
        cleanProducts,
    });
  } catch (error) {
    console.error(
      "PRODUCT LIST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch products.",
    });
  }
};

const publicList = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        status: "active",
      })
        .select(
          "-purchasePrice -supplier -productId"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const cleanProducts =
      products.map((product) =>
        sanitizeProduct(
          req,
          product
        )
      );

    const collections =
      buildCollections(
        req,
        products
      );

    const categories =
      collections.map(
        (collection) => ({
          name:
            collection.name,
          slug:
            collection.slug,
          count:
            collection.count,
          image:
            collection.image,
        })
      );

    return res.status(200).json({
      success: true,
      products:
        cleanProducts,
      data:
        cleanProducts,
      count:
        cleanProducts.length,
      categories,
      collections,
    });
  } catch (error) {
    console.error(
      "PUBLIC PRODUCT LIST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch products.",
    });
  }
};

const getById = async (
  req,
  res
) => {
  try {
    const identifier =
      normalize(
        req.params.id
      );

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const product =
      await findProductByIdentifier(
        identifier
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const productData =
      sanitizeProduct(
        req,
        product
      );

    return res.status(200).json({
      success: true,
      product:
        productData,
      data:
        productData,
    });
  } catch (error) {
    console.error(
      "GET PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch product.",
    });
  }
};

const update = async (
  req,
  res
) => {
  try {
    const identifier =
      normalize(
        req.params.id
      );

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const product =
      await findProductByIdentifier(
        identifier
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const body =
      req.body || {};

    if (
      body.name !== undefined
    ) {
      const newName =
        normalize(
          body.name
        );

      if (!newName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name cannot be empty.",
          field: "name",
        });
      }

      product.name =
        newName;
    }

    if (
      body.sku !== undefined
    ) {
      const newSku =
        normalizeUpper(
          body.sku
        );

      if (!newSku) {
        return res.status(400).json({
          success: false,
          message:
            "SKU cannot be empty.",
          field: "sku",
        });
      }

      const duplicate =
        await Product.findOne({
          sku: newSku,
          _id: {
            $ne:
              product._id,
          },
        }).lean();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            `SKU already exists: ${newSku}`,
          field: "sku",
        });
      }

      product.sku =
        newSku;
    }

    if (
      body.hsnCode !== undefined
    ) {
      const value =
        normalize(
          body.hsnCode
        );

      if (
        value &&
        !/^\d{4}$|^\d{6}$|^\d{8}$/.test(
          value
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "HSN Code must be 4, 6 or 8 digits.",
          field: "hsnCode",
        });
      }

      product.hsnCode =
        value;
    }

    if (
      body.category !== undefined
    ) {
      const value =
        normalize(
          body.category
        );

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Category cannot be empty.",
          field: "category",
        });
      }

      product.category =
        value;
    }

    if (
      body.subcategory !==
      undefined
    ) {
      product.subcategory =
        normalize(
          body.subcategory
        );
    }

    if (
      body.size !== undefined
    ) {
      product.size =
        normalize(
          body.size
        );
    }

    if (
      body.description !==
      undefined
    ) {
      product.description =
        normalize(
          body.description
        );
    }

    if (
      body.sellingPrice !==
      undefined
    ) {
      const value =
        Number(
          body.sellingPrice
        );

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid selling price.",
          field: "sellingPrice",
        });
      }

      product.sellingPrice =
        value;
    }

    if (
      body.stock !== undefined
    ) {
      const value =
        Number(
          body.stock
        );

      if (
        !Number.isInteger(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid stock.",
          field: "stock",
        });
      }

      product.stock =
        value;
    }

    if (
      body.minimumStock !==
      undefined
    ) {
      const value =
        Number(
          body.minimumStock
        );

      if (
        !Number.isInteger(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid minimum stock.",
          field: "minimumStock",
        });
      }

      product.minimumStock =
        value;
    }

    if (
      body.status !== undefined
    ) {
      const newStatus =
        normalize(
          body.status
        ).toLowerCase();

      if (
        ![
          "active",
          "inactive",
        ].includes(
          newStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be active or inactive.",
          field: "status",
        });
      }

      product.status =
        newStatus;
    }

    if (req.file) {
      const newImage =
        getProductImage(req);

      if (newImage) {
        product.image =
          newImage;
      }
    }

    if (
      !product.name ||
      !normalize(product.name)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
        field: "name",
      });
    }

    if (
      !product.sku ||
      !normalizeUpper(product.sku)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SKU is required.",
        field: "sku",
      });
    }

    if (
      !product.category ||
      !normalize(product.category)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Category is required.",
        field: "category",
      });
    }

    if (
      !Number.isFinite(
        Number(
          product.sellingPrice
        )
      ) ||
      Number(
        product.sellingPrice
      ) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid selling price.",
        field: "sellingPrice",
      });
    }

    if (
      !Number.isInteger(
        Number(product.stock)
      ) ||
      Number(product.stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock.",
        field: "stock",
      });
    }

    if (
      !Number.isInteger(
        Number(
          product.minimumStock
        )
      ) ||
      Number(
        product.minimumStock
      ) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid minimum stock.",
        field: "minimumStock",
      });
    }

    const updatedProduct =
      await product.save();

    const productData =
      sanitizeProduct(
        req,
        updatedProduct
      );

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      product:
        productData,
      data:
        productData,
    });
  } catch (error) {
    console.error(
      "PRODUCT UPDATE ERROR:",
      error
    );

    return handleDuplicateError(
      error,
      res
    );
  }
};

const remove = async (
  req,
  res
) => {
  try {
    const identifier =
      normalize(
        req.params.id
      );

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const product =
      await findProductByIdentifier(
        identifier
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    await Product.deleteOne({
      _id:
        product._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "PRODUCT DELETE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete product.",
    });
  }
};

module.exports = {
  create,
  list,
  publicList,
  getById,
  update,
  remove,

  createProduct:
    create,

  getProducts:
    list,

  getPublicProducts:
    publicList,

  getProduct:
    getById,

  updateProduct:
    update,

  deleteProduct:
    remove,
};