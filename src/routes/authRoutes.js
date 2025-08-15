// routes/authRoutes.js
const router = require("express").Router();
const authController = require("../controllers/authController");
const { authRequired } = require("../middlewares/authMiddleware");

// === PUBLIC ===
// Kayıt
router.post("/register", authController.register);

// Giriş (access döner + HttpOnly refresh cookie set edilir)
router.post("/login", authController.login);

// Refresh (GET/POST) — sadece HttpOnly refresh cookie ile çalışır
router.get("/refresh", authController.refresh);
router.post("/refresh", authController.refresh);

// Çıkış — refresh cookie'yi temizle (authRequired yok; cookie'yi her koşulda silelim)
router.post("/logout", authController.logout);

// === PROTECTED ===
// Mevcut kullanıcı bilgisi (Bearer access zorunlu)
router.get("/me", authRequired(), authController.me);

module.exports = router;
