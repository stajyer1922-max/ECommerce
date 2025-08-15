// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// CRUD
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.delete("/:id", productController.deleteProduct);
router.put("/:id", productController.updateProduct);

// SAP
router.post("/sap/import", productController.importFromSAP); // body ile
router.post("/sap/import-from-url", productController.importFromSAPUrl); // URL'den çek + import
router.post("/sap/normalize", productController.normalizeSAP); // DB yazmadan
console.log(productController.fetchFromSAP);
router.get("/sap/fetchFromSAP", productController.fetchFromSAP); // DB yazmadan

// Images
router.post("/:materialNo/images", productController.addExternalImage);
router.patch("/:materialNo/images/primary", productController.setPrimaryImage);
router.delete("/:materialNo/images", productController.deleteImage);

module.exports = router;
