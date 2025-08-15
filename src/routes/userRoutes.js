const router = require("express").Router();
const { authRequired } = require("../middlewares/authMiddleware");
const c = require("../controllers/userController");
const v = require("../validators/userValidators");
const validate = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Kullanıcı işlemleri (admin)
 *   - name: Addresses
 *     description: Kullanıcı adresleri
 *   - name: Cards
 *     description: Kullanıcı kartları
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Tüm kullanıcıları listele (admin)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/AuthUser' }
 *       403:
 *         description: Yetkisiz rol
 */
router.get("/", authRequired("admin"), c.list);

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     summary: Kullanıcının adreslerini listele
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Address' }
 *   post:
 *     summary: Yeni adres ekle
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201:
 *         description: Eklendi
 */
router.get("/addresses", authRequired(), c.listAddresses);
router.post(
  "/addresses",
  authRequired(),
  v.addressCreateRules,
  validate,
  c.addAddress
);

/**
 * @swagger
 * /users/addresses/{addressId}:
 *   patch:
 *     summary: Adres güncelle
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200:
 *         description: Güncellendi
 *   delete:
 *     summary: Adres sil
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Silindi
 */
router.patch(
  "/addresses/:addressId",
  authRequired(),
  v.addressUpdateRules,
  validate,
  c.updateAddress
);
router.delete("/addresses/:addressId", authRequired(), c.deleteAddress);

/**
 * @swagger
 * /users/addresses/{addressId}/default:
 *   patch:
 *     summary: Adresi varsayılan yap
 *     tags: [Addresses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.patch(
  "/addresses/:addressId/default",
  authRequired(),
  c.setDefaultAddress
);

/**
 * @swagger
 * /users/cards:
 *   get:
 *     summary: Kartları listele (token maskelenmiş)
 *     tags: [Cards]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste
 *   post:
 *     summary: Yeni kart ekle (tokenize eder)
 *     tags: [Cards]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [holder, pan, cvv, expiryMonth, expiryYear]
 *             properties:
 *               holder: { type: "string" }
 *               pan: { type: "string", example: "4242424242424242" }
 *               cvv: { type: "string", example: "123" }
 *               expiryMonth: { type: "string", example: "12" }
 *               expiryYear: { type: "string", example: "2030" }
 *     responses:
 *       201:
 *         description: Eklendi
 */
router.get("/cards", authRequired(), c.listCards);
router.post("/cards", authRequired(), v.cardCreateRules, validate, c.addCard);

/**
 * @swagger
 * /users/cards/{cardId}:
 *   patch:
 *     summary: Kartı güncelle (örn. holder)
 *     tags: [Cards]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Güncellendi
 *   delete:
 *     summary: Kartı sil
 *     tags: [Cards]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Silindi
 */
router.patch(
  "/cards/:cardId",
  authRequired(),
  v.cardUpdateRules,
  validate,
  c.updateCard
);
router.delete("/cards/:cardId", authRequired(), c.deleteCard);

/**
 * @swagger
 * /users/cards/{cardId}/default:
 *   patch:
 *     summary: Kartı varsayılan yap
 *     tags: [Cards]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.patch("/cards/:cardId/default", authRequired(), c.setDefaultCard);

module.exports = router;
