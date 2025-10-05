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

app.use(express.static(path.join(__dirname, "../Client/dist")));

// Catch all unmatched routes and serve index.html
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "../Client/dist/index.html"));
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
