const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");

router.get("/", (req, res) => res.json("pusacho auth"));

router.post("/user/register", auth.registerUser);
router.post("/user/login", auth.loginUser);

module.exports = router;