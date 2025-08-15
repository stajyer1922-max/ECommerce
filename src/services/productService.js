const axios = require("axios");
const productRepository = require("../repositories/productRepository");
const Product = require("../models/Product");
const https = require("https");

/* ---------- helpers ---------- */
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
function isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** SAP -> Model map (şemayla birebir) */
function sapToModel(item) {
  return {
    materialNo: String(item.matnr || "").trim(),
    name: String(item.maktx || "").trim(),
    price: toNumber(item.stprs, 0),
    currency: "TRY",
    materialGroup: item.matkl ? String(item.matkl) : undefined,
    materialGroupName: item.wgbez ? String(item.wgbez) : undefined,
    stock: toNumber(item.labst, 0),
    date: toDate(item.dates),
    // images'a dokunmuyoruz (mevcut görseller korunur)
  };
}

/* ---------- class ---------- */
class ProductService {
  /* CRUD */
  async createProduct(data) {
    return productRepository.create(data);
  }
  async getAllProducts() {
    return productRepository.findAll();
  }
  async getProductById(id) {
    return productRepository.findById(id);
  }
  async deleteProduct(id) {
    return productRepository.delete(id);
  }
  async updateProduct(id, d) {
    return productRepository.update(id, d);
  }

  /* SAP: URL'den çekme */
  async fetchFromSAP() {
    const SAP_API_URL = process.env.SAP_API_URL;
    if (!SAP_API_URL || !isValidHttpUrl(SAP_API_URL)) {
      throw new Error("SAP_API_URL geçersiz veya tanımlı değil");
    }

    // TLS (self-signed dev sertifikası için destek)
    const rejectUnauthorized =
      String(
        process.env.SAP_TLS_REJECT_UNAUTHORIZED || "true"
      ).toLowerCase() !== "false";
    const agent = new https.Agent({ rejectUnauthorized });

    // Auth
    const authType = String(process.env.SAP_AUTH_TYPE || "none").toLowerCase();
    const headers = {};
    const axiosConfig = { httpsAgent: agent, headers };

    if (authType === "basic") {
      axiosConfig.auth = {
        username: process.env.SAP_BASIC_USER || "",
        password: process.env.SAP_BASIC_PASS || "",
      };
    } else if (authType === "bearer") {
      headers.Authorization = `Bearer ${process.env.SAP_BEARER_TOKEN || ""}`;
    }

    const res = await axios.get(SAP_API_URL, axiosConfig);

    // Beklenen format: { items: [...] } veya doğrudan []
    const data = res.data ?? {};
    let items = data.items ?? data;
    if (!Array.isArray(items) && Array.isArray(data)) items = data;

    if (!Array.isArray(items)) {
      throw new Error("SAP yanıtı beklenen formatta değil (items listesi yok)");
    }
    return items;
  }

  /* SAP: toplu upsert (materialNo=matnr üzerinden) */
  async importFromSAP(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("items boş olamaz");
    }

    // aynı matnr tekrarında SON geleni baz al
    const latestByMatnr = new Map();
    for (const raw of items) {
      if (!raw || !raw.matnr) continue;
      latestByMatnr.set(raw.matnr, raw);
    }

    const ops = [];
    for (const raw of latestByMatnr.values()) {
      const doc = sapToModel(raw);
      if (!doc.materialNo || !doc.name) continue;

      ops.push({
        updateOne: {
          filter: { materialNo: doc.materialNo },
          update: { $set: { ...doc } }, // images'a dokunmuyoruz
          upsert: true,
        },
      });
    }

    if (!ops.length) throw new Error("Geçerli SAP verisi yok");

    const result = await Product.bulkWrite(ops, { ordered: false });

    // Farklı Mongo sürümlerine uyumlu sayaçlar
    const matched =
      typeof result.matchedCount === "number"
        ? result.matchedCount
        : result.nMatched ?? 0;
    const modified =
      typeof result.modifiedCount === "number"
        ? result.modifiedCount
        : result.nModified ?? 0;
    const upserted =
      result.upsertedCount ??
      (Array.isArray(result.upsertedIds) ? result.upsertedIds.length : 0);

    return { matched, modified, upserted };
  }

  /* Görsel işlemleri */
  async addExternalImage(
    materialNo,
    { url, label = "", isPrimary = false, source = "external" }
  ) {
    if (!url || !isValidHttpUrl(url))
      throw new Error("Geçerli bir http/https URL gerekli");
    const product = await Product.findOne({ materialNo });
    if (!product) throw new Error("Ürün bulunamadı");

    const already = product.images.some((im) => im.url === url);
    if (!already) product.images.push({ url, label, isPrimary: false, source });

    if (isPrimary) {
      product.images.forEach((im) => (im.isPrimary = im.url === url));
    } else if (
      !product.images.some((im) => im.isPrimary) &&
      product.images.length > 0
    ) {
      product.images[0].isPrimary = true;
    }

    await product.save();
    return product;
  }

  async setPrimaryImage(materialNo, url) {
    const product = await Product.findOne({ materialNo });
    if (!product) throw new Error("Ürün bulunamadı");

    let found = false;
    product.images.forEach((im) => {
      if (im.url === url) {
        im.isPrimary = true;
        found = true;
      } else im.isPrimary = false;
    });
    if (!found) throw new Error("Bu URL üründe yok");

    await product.save();
    return product;
  }

  async deleteImage(materialNo, url) {
    const product = await Product.findOne({ materialNo });
    if (!product) throw new Error("Ürün bulunamadı");

    const before = product.images.length;
    const wasPrimary = product.images.some(
      (im) => im.url === url && im.isPrimary
    );
    product.images = product.images.filter((im) => im.url !== url);

    if (product.images.length === before) throw new Error("Bu URL üründe yok");

    if (wasPrimary && product.images.length > 0) {
      product.images.forEach((im, idx) => (im.isPrimary = idx === 0));
    }

    await product.save();
    return product;
  }
}

module.exports = new ProductService();
