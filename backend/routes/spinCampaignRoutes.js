const express = require("express");

const {
  getSpinCampaign,
  activateSpinCampaign,
  deactivateSpinCampaign,
  updateSpinCampaign,
} = require("../controllers/spinCampaignController");

const adminAuth = require("../middleware/adminAuth");

const {
  validateSpinCampaignRequest,
} = require("../middleware/serverValidation");

const router = express.Router();

router.get(
  "/",
  getSpinCampaign
);

router.post(
  "/activate",
  adminAuth,
  validateSpinCampaignRequest,
  activateSpinCampaign
);

router.post(
  "/deactivate",
  adminAuth,
  deactivateSpinCampaign
);

router.put(
  "/update",
  adminAuth,
  validateSpinCampaignRequest,
  updateSpinCampaign
);

module.exports = router;