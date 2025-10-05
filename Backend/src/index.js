require("./scripts/cron");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");

dotenv.config();

const aqi = require("./routes/aqi.routes");
const app = express();

// CORS
app.use(cors({ origin: "*", credentials: true }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get("/", (req, res) => res.json("running"));
app.use("/api", aqi);

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
