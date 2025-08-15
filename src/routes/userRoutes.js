const router = require("express").Router();
const { authRequired } = require("../middlewares/authMiddleware");
const { list } = require("../controllers/userController");

// Sadece admin kullanıcılar tüm kullanıcıları görebilir
router.get("/", authRequired("admin"), list);

module.exports = router;
