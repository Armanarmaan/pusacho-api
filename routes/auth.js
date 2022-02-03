const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");
const verifyToken = require('../middlewares/verifyToken');

router.get("/", (req, res) => res.json("pusacho auth"));

router.post("/user/register", auth.registerUser);
router.post("/user/login", auth.loginUser);
router.get("/user/verify", verifyToken, auth.verifyUser);
router.post("/user/change-password", verifyToken, auth.changePassword);

module.exports = router;