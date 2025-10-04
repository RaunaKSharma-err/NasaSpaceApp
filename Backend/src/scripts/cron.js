// cron.js
const cron = require("node-cron");
const { updateStations } = require("./updateStations");

cron.schedule("0 0 * * *", () => {
  // every midnight
  console.log("Running daily station update...");
  updateStations();
});
