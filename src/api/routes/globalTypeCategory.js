const express = require("express")
const {
  addGlobalTypeCategory,
  updateGlobalTypeCategory,
  deleteGlobalTypeCategory,
  getGlobalTypeCategory,
  updateStatusGlobalTypeCategory,
} = require("../controllers/globalTypeCategoryController")

const router = express.Router()

router.post("/", addGlobalTypeCategory)
router.put("/:id", updateGlobalTypeCategory)
router.delete("/:id", deleteGlobalTypeCategory)
router.get("/", getGlobalTypeCategory)
router.put("/status/:id", updateStatusGlobalTypeCategory)

module.exports = router
