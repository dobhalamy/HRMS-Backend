const express = require("express");

const router = express.Router();
const {
  addEvent,
  updateEvent,
  getEvents,
} = require("../controllers/eventController");

router.post("/", addEvent);
router.put("/:id", updateEvent);
router.get("/", getEvents);

module.exports = router;
