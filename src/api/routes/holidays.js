const express = require('express');
const router = express.Router();
const {
  getAllHolidays,
  addHoliday,
  deleteHoliday,
  updateHoliday,
} = require('../controllers/holidayCalender');


router.get('/getAllHolidays', getAllHolidays);
router.post('/addHoliday', addHoliday);
router.delete('/deleteHoliday/:id', deleteHoliday);
router.put('/updateHoliday/:id', updateHoliday);

module.exports = router;
