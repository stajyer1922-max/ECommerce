// controllers/productController.js
const productService = require("../services/productService");

/* ===================== Helpers ===================== */
function toNumber(v, def = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : def;
  }
  return def;
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeForFE(p) {
  if (!p) return null;
  const safe = (v, d = null) => (v === undefined ? d : v);

  let primary = null;
  if (Array.isArray(p.images) && p.images.length) {
    primary = p.images.find((im) => im && im.isPrimary) || p.images[0];
  }

  // isim ve tarih güvenli normalize
  const name = String(safe(p.name ?? p.maktx ?? p.shortText, ""));
  const rawDate = p.date ?? p.dates;

  return {
    productId: String(safe(p._id ?? p.id ?? p.materialNo ?? "")),
    materialNo: String(safe(p.materialNo ?? p.matnr, "")),

    // FE artık net bir name alıyor
    name,
    // FE tarafında farklı ekranlar shortText arıyorsa da boş kalmasın
    shortText: String(safe(p.shortText ?? p.maktx ?? name, "")),

    price: toNumber(safe(p.price ?? p.stprs, 0)),
    currency: safe(p.currency, "TRY"),

    date: rawDate ? toDate(rawDate) : null,

    materialGroup: safe(p.materialGroup ?? p.matkl, null),
    materialGroupName: safe(p.materialGroupName ?? p.wgbez, null),

    stock: toNumber(safe(p.stock ?? p.labst, 0), 0),

    image: primary ? primary.url : null,
    images: Array.isArray(p.images) ? p.images : [],
  };
}

/* ===================== CRUD ===================== */
exports.createProduct = async (req, res) => {
  try {
    const created = await productService.createProduct(req.body);
    return res.status(201).json(normalizeForFE(created));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ürün eklenemedi", error: error.message });
  }
};

exports.getAllProducts = async (_req, res) => {
  try {
    const list = await productService.getAllProducts();
    return res.status(200).json(list.map(normalizeForFE));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ürünler getirilemedi", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });
    return res.status(200).json(normalizeForFE(product));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ürün getirilemedi", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Ürün bulunamadı" });
    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ürün silinemedi", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Ürün bulunamadı!" });
    return res.status(200).json(normalizeForFE(updated));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Ürün güncellenemedi", error: err.message });
  }
};

/* ===================== SAP İşlemleri ===================== */
// Body ile import (upsert)
exports.importFromSAP = async (req, res) => {
  try {
    const { items } = req.body || {};
    const summary = await productService.importFromSAP(items);
    return res
      .status(200)
      .json({ message: "SAP verileri içeri aktarıldı (upsert).", summary });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "SAP import sırasında hata", error: err.message });
  }
};

// URL'den çek + import
exports.importFromSAPUrl = async (_req, res) => {
  try {
    const items = await productService.fetchFromSAP();
    const summary = await productService.importFromSAP(items);
    return res.status(200).json({
      message: "SAP verileri URL'den çekildi ve import edildi.",
      summary,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "SAP URL import hatası", error: err.message });
  }
};

// Sadece normalize (DB yazmadan)
exports.normalizeSAP = async (req, res) => {
  try {
    const { items } = req.body || {};
    const list = Array.isArray(items) ? items : [];
    return res.status(200).json(list.map(normalizeForFE));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "SAP normalize sırasında hata", error: err.message });
  }
};

// SAP'den sadece fetch (ham veri)
exports.fetchFromSAP = async (_req, res) => {
  try {
    const items = await productService.fetchFromSAP();
    return res.status(200).json(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ürünler listelenemedi", error: error.message });
  }
};

/* ===================== Görsel Yönetimi ===================== */
exports.addExternalImage = async (req, res) => {
  try {
    const { materialNo } = req.params;
    const product = await productService.addExternalImage(materialNo, req.body);
    const doc = product.toObject?.() ?? product;
    return res.status(200).json(normalizeForFE(doc));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Resim eklenemedi", error: err.message });
  }
};

exports.setPrimaryImage = async (req, res) => {
  try {
    const { materialNo } = req.params;
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: "url gerekli" });

    const product = await productService.setPrimaryImage(materialNo, url);
    const doc = product.toObject?.() ?? product;
    return res.status(200).json(normalizeForFE(doc));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Kapak görseli ayarlanamadı", error: err.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { materialNo } = req.params;
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: "url gerekli" });

    const product = await productService.deleteImage(materialNo, url);
    const doc = product.toObject?.() ?? product;
    return res.status(200).json(normalizeForFE(doc));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Resim silinemedi", error: err.message });
  }
};
