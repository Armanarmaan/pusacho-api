const express = require("express");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const lapangan = require("../controllers/lapangan");

router.get("/", (req, res) => res.json("Lapangan"));

router.post("/get", verifyToken, lapangan.getSomething);
router.get("/produk", verifyToken, lapangan.getProdukbyID);
router.get("/aktivitas", verifyToken, lapangan.getAktivitas);
router.post("/pengurangan", verifyToken, lapangan.postPengurangan);

module.exports = router;