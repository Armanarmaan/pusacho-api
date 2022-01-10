const express = require("express");
const router = express.Router();
const manajemen = require("../controllers/manajemen");

router.get("/", (req, res) => res.json("manajemen API"));

router.get("/get", manajemen.getSomething);

// Produk Manajemen
router.get("/categories", manajemen.getAllCategories);

router.post("/categories/add", manajemen.addNewCategory);

router.get("/products", manajemen.getAllProducts);
router.get("/products/:id", manajemen.getSingleProduct);

router.post("/product", manajemen.addProduct);
router.post("/products/update/amount", manajemen.updateProductAmount);
// router.post("/products/update/")

module.exports = router;