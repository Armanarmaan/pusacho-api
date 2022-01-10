const express = require("express");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const lapangan = require("../controllers/lapangan");

router.get("/", (req, res) => res.json("Lapangan"));

router.post("/get", lapangan.getSomething);
router.get("/produk", lapangan.getProdukbyID);
router.get("/aktivitas", lapangan.getAktivitas);
router.post("/pengurangan", lapangan.postPengurangan);

module.exports = router;