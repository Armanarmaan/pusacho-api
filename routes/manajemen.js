const express = require("express");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const manajemen = require("../controllers/manajemen");

router.get("/", (req, res) => res.json("manajemen API"));

router.get("/get", manajemen.getSomething);
router.get("/dashboard/activity", verifyToken, manajemen.getActivities)

module.exports = router;