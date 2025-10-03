const express = require("express");
const {
  handleAddCity,
  cityDetails,
  cityTrends,
  cityList,
  deleteCity,
  getEnabledCity,
  handleEnableCity,
  getStations,
} = require("../controllers/aqi.controller");

const router = express.Router();

router.post("/add-city", handleAddCity);
router.post("/enable-city", handleEnableCity);
router.get("/enabled-city", getEnabledCity);
router.get("/cities", cityList);
router.get("/city/:name", cityDetails);
router.get("/city/:name/trends", cityTrends);
router.get("/stations", getStations);
router.delete("/city/:name", deleteCity);

module.exports = router;
