const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Ürün CRUD ve SAP entegrasyonu
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Ürün oluştur
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductCreate' }
 *     responses:
 *       201:
 *         description: Oluşturuldu
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *   get:
 *     summary: Tüm ürünleri getir
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Liste
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: ID ile ürün getir
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ürün
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Bulunamadı
 *   delete:
 *     summary: Ürün sil
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Silindi
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiMessage' }
 *   put:
 *     summary: Ürün güncelle
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductUpdate' }
 *     responses:
 *       200:
 *         description: Güncellendi
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 */
router.get("/:id", productController.getProductById);
router.delete("/:id", productController.deleteProduct);
router.put("/:id", productController.updateProduct);

/**
 * @swagger
 * /products/sap/import:
 *   post:
 *     summary: SAP datasını body ile import et (DB'ye yazar)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, additionalProperties: true }
 *     responses:
 *       200:
 *         description: Import sonucu
 */
router.post("/sap/import", productController.importFromSAP);

/**
 * @swagger
 * /products/sap/import-from-url:
 *   post:
 *     summary: SAP datasını URL'den çekip import et
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: Import sonucu
 */
router.post("/sap/import-from-url", productController.importFromSAPUrl);

/**
 * @swagger
 * /products/sap/normalize:
 *   post:
 *     summary: SAP datasını FE için normalize et (DB yazmadan)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, additionalProperties: true }
 *     responses:
 *       200:
 *         description: Normalized payload
 */
router.post("/sap/normalize", productController.normalizeSAP);

/**
 * @swagger
 * /products/sap/fetchFromSAP:
 *   get:
 *     summary: SAP'tan çek (DB yazmadan)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: SAP response
 */
router.get("/sap/fetchFromSAP", productController.fetchFromSAP);

/**
 * @swagger
 * /products/{materialNo}/images:
 *   post:
 *     summary: Ürüne harici görsel ekle
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: materialNo
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Güncel görsel listesi
 *   delete:
 *     summary: Üründen görsel sil
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: materialNo
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Güncel görsel listesi
 */
router.post("/:materialNo/images", productController.addExternalImage);
router.delete("/:materialNo/images", productController.deleteImage);

/**
 * @swagger
 * /products/{materialNo}/images/primary:
 *   patch:
 *     summary: Bir görseli kapak/primary yap
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: materialNo
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Güncel ürün
 */
router.patch("/:materialNo/images/primary", productController.setPrimaryImage);

module.exports = router;
