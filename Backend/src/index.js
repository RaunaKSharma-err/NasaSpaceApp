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
const allowedOrigins = [
  "http://localhost:8080",
  "https://nasaspaceapp-frontend-t7bg.onrender.com",
  "https://kiza.work"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.get("/", (req, res) => res.json("running"));
app.use("/api", aqi);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirnameResolved, "../Client/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirnameResolved, "../Client/dist/index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
