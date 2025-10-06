require("./scripts/cron");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT || 10000;
const __dirnameResolved = path.resolve();
const aqi = require("./routes/aqi.routes");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:8080", credentials: true }));

app.get("/", (req, res) => res.json("running"));
app.use("/api", aqi);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirnameResolved, "../Client/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirnameResolved, "../Client/dist/index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
