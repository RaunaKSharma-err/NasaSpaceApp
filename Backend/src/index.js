require("./scripts/cron");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT;
const _dirname = path.resolve();

dotenv.config();

const aqi = require("./routes/aqi.routes");
const app = express();

// CORS

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:8080", credentials: true }));

// API routes
app.get("/", (req, res) => res.json("running"));
app.use("/api", aqi);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(_dirname, "../Client/dist")));

  app.get("/:path(*)", (req, res) => {
    res.sendFile(path.join(_dirname, "../Client", "dist", "index.html"));
  });
}

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
