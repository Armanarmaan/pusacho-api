const express = require("express");
const router = express.Router();
const multer = require("multer");

const verifyToken = require('../middlewares/verifyToken');
const manajemen = require("../controllers/manajemen");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "data/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.get("/", (req, res) => res.json("manajemen API"));

router.get("/get", manajemen.getSomething);
router.get("/dashboard/statistics", verifyToken, manajemen.getStatistics);
router.get("/dashboard/activity", verifyToken, manajemen.getActivities);
router.get("/dashboard/download/report/log", verifyToken, manajemen.getLogsAsXslx);
router.get("/dashboard/download/report/activity", verifyToken, manajemen.getActivitiesAsXslx);

// Produk Manajemen
router.get("/categories", manajemen.getAllCategories);

router.post("/categories/add", manajemen.addNewCategory);

router.get("/products", manajemen.getAllProducts);
router.get("/products/:id", manajemen.getSingleProduct);

router.post("/product", [upload.fields([{ name: "image", maxCount: 1 }])], manajemen.addProduct);
router.post("/product/update", [upload.fields([{ name: "image", maxCount: 1 }])], manajemen.editProduct);
router.post("/products/update/amount", manajemen.updateProductAmount);

module.exports = router;