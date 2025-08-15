const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cartController");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Sepet işlemleri (kimlik gerekli)
 */
router.use(authRequired());

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Aktif sepeti getir
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sepet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sepet: { $ref: '#/components/schemas/Cart' }
 */
router.get("/", cartController.getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Sepete ürün ekle
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CartItem' }
 *     responses:
 *       200:
 *         description: Güncel sepet
 */
router.post("/add", cartController.addToCart);

/**
 * @swagger
 * /cart/update:
 *   put:
 *     summary: Sepet öğesi miktarını güncelle
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CartItem' }
 *     responses:
 *       200:
 *         description: Güncel sepet
 */
router.put("/update", cartController.updateCartItem);

/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Sepetten ürün çıkar
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: "string" }
 *     responses:
 *       200:
 *         description: Güncel sepet
 */
router.delete("/remove", cartController.removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Sepeti temizle
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sepet temizlendi
 */
router.delete("/clear", cartController.clearCart);

module.exports = router;
