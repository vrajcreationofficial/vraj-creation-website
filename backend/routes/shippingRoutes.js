const express = require("express");
const router = express.Router();

const {
  calculateShippingController,
} = require("../controllers/shippingController");

const { validateShippingRequest } = require("../middleware/serverValidation");

router.post(
  "/calculate",
  validateShippingRequest,
  calculateShippingController
);

module.exports = router;
