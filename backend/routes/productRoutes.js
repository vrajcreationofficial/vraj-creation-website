const express = require("express");

const router = express.Router();

const productController =
  require("../controllers/productController");

const adminAuth =
  require("../middleware/adminAuth");

const uploadProductImage =
  require("../middleware/uploadProduct");

const {
  validateProductRequest,
} = require("../middleware/serverValidation");

router.get(
  "/public",
  productController.publicList
);

router.get(
  "/",
  adminAuth,
  productController.list
);

router.get(
  "/:id",
  adminAuth,
  productController.getById
);

router.post(
  "/",
  adminAuth,
  uploadProductImage.single("image"),
  validateProductRequest,
  productController.create
);

router.put(
  "/:id",
  adminAuth,
  uploadProductImage.single("image"),
  validateProductRequest,
  productController.update
);

router.patch(
  "/:id",
  adminAuth,
  uploadProductImage.single("image"),
  validateProductRequest,
  productController.update
);

router.delete(
  "/:id",
  adminAuth,
  productController.remove
);

module.exports = router;