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

// Pengaturan
router.get("/pengaturan/user", verifyToken, manajemen.getUsers);
router.delete("/pengaturan/user", verifyToken, manajemen.deleteUser);
router.post("/pengaturan/user/edit", verifyToken, manajemen.editUser);

// Produk Manajemen
router.get("/categories", verifyToken, manajemen.getAllCategories);

router.post("/categories/add", verifyToken, manajemen.addNewCategory);

router.get("/products", verifyToken, manajemen.getAllProducts);
router.get("/products/:id", verifyToken, manajemen.getSingleProduct);

router.post("/product", verifyToken, [upload.fields([{ name: "image", maxCount: 1 }])], manajemen.addProduct);
router.post("/product/update", verifyToken, [upload.fields([{ name: "image", maxCount: 1 }])], manajemen.editProduct);
router.post("/category/product/add", verifyToken, verifyToken, [upload.fields([{ name: "image", maxCount: 1 }])], manajemen.addBoth);
router.post("/products/update/amount", verifyToken, manajemen.updateProductAmount);

router.post("/delete/product", verifyToken, manajemen.deleteProduct);

module.exports = router;