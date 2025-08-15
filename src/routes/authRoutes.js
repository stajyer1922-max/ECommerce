const router = require("express").Router();
const authController = require("../controllers/authController");
const { authRequired } = require("../middlewares/authMiddleware");
const { registerRules, loginRules } = require("../validators/authValidators");
const validate = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Kullanıcı kimlik doğrulama
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Kayıt başarılı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validasyon hatası
 */
router.post("/register", registerRules, validate, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Giriş yap (HttpOnly cookie + access jwt döner)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: access_token=jwt; HttpOnly; Path=/; Max-Age=604800
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Yetkisiz
 */
router.post("/login", loginRules, validate, authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh token ile yeni access üret (cookie)
 *     tags: [Auth]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Yetkisiz
 *   post:
 *     summary: (Alternatif) Refresh POST
 *     tags: [Auth]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get("/refresh", authController.refresh);
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Çıkış yap (cookie temizler)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Çıkış yapıldı
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiMessage' }
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Oturum sahibi kullanıcı bilgisi
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Kullanıcı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/AuthUser' }
 *       401:
 *         description: Yetkisiz
 */
router.get("/me", authRequired(), authController.me);

module.exports = router;
