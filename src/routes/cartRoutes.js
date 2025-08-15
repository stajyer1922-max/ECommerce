const express = require("express");
const router = express.Router();

const { authRequired } = require("../middlewares/authMiddleware"); // <-- doğru import
const cartController = require("../controllers/cartController");

// Tüm rotaları koru (rol kısıtı yok)
router.use(authRequired()); // <-- fonksiyonu ÇAĞIR, dönen handler'ı ver

// Sepeti görüntüle
router.get("/", cartController.getCart);

// Sepete ürün ekle
router.post("/add", cartController.addToCart);

// Sepetteki ürün miktarını güncelle
router.put("/update", cartController.updateCartItem);

// Sepetten ürün çıkar
router.delete("/remove", cartController.removeFromCart);

// Sepeti temizle
router.delete("/clear", cartController.clearCart);

module.exports = router;
