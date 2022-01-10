const express = require("express");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const manajemen = require("../controllers/manajemen");

router.get("/", (req, res) => res.json("manajemen API"));

router.get("/get", manajemen.getSomething);
router.get("/dashboard/statistics", verifyToken, manajemen.getStatistics);
router.get("/dashboard/activity", verifyToken, manajemen.getActivities);

// Produk Manajemen
router.get("/categories", manajemen.getAllCategories);

router.post("/categories/add", manajemen.addNewCategory);

router.get("/products", manajemen.getAllProducts);
router.get("/products/:id", manajemen.getSingleProduct);

router.post("/products/update/amount", manajemen.updateProductAmount);
// router.post("/products/update/")

module.exports = router;