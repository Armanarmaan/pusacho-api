const express = require("express");
const router = express.Router();
const manajemen = require("../controllers/manajemen");

router.get("/", (req, res) => res.json("manajemen API"));

router.get("/get", manajemen.getSomething);

module.exports = router;