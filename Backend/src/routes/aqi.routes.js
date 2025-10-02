const express = require("express");
const {
  handleAddCity,
  cityDetails,
  cityTrends,
  cityList,
  deleteCity,
} = require("../controllers/aqi.controller");

const router = express.Router();

router.post("/add-city", handleAddCity);
router.get("/cities", cityList);
router.get("/city/:name", cityDetails);
router.get("/city/:name/trends", cityTrends);
router.delete("/city/:name", deleteCity);

module.exports = router;
