// index.js
const dotenv = require("dotenv");
const express = require("express");
dotenv.config();
const aqi = require("./routes/aqi.routes");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.json("running");
});
app.use("/api", aqi);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
