const express = require("express");

const router = express.Router();

const {
  decreaseStock,
  increaseStock,
} = require("../controllers/internalStockController");

router.post(
  "/decrease",
  decreaseStock
);

router.post(
  "/increase",
  increaseStock
);

module.exports = router;