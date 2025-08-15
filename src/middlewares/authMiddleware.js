// src/middlewares/authMiddleware.js
require("dotenv").config();
const jwt = require("jsonwebtoken");

/**
 * RBAC + Bearer/Cookie token destekli kimlik doğrulama middleware'i.
 *
 * Kullanım:
 *   router.get("/private", authRequired());
 *   router.get("/admin",  authRequired("admin"));              // tek rol
 *   router.get("/staff",  authRequired("admin", "moderator")); // birden fazla rol
 *
 * Notlar:
 * - Token alma sırası: Authorization: Bearer <token> -> Cookie (COOKIE_NAME) -> X-Access-Token -> query.access_token
 * - JWT payload beklenen alanlar: { sub, email, role, typ: "access" }
 * - COOKIE_NAME, JWT_SECRET .env'den okunur
 */
function authRequired(...roles) {
  // rolleri case-insensitive karşılaştırma için normalize et
  const requiredRoles = (roles || []).map((r) => String(r || "").toLowerCase());

  const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || JWT_SECRET.length < 8) {
    // App boot sırasında anlamak için konsola da uyarı verelim
    console.warn(
      "[authRequired] Zayıf veya eksik JWT_SECRET! .env kontrol et."
    );
  }

  return (req, res, next) => {
    try {
      /* 1) Token'ı al */
      let token = null;

      // a) Authorization header (Bearer)
      const ah = req.headers.authorization || "";
      if (/^Bearer\s+/i.test(ah)) {
        token = ah.replace(/^Bearer\s+/i, "").trim();
      }

      // b) HttpOnly Cookie (controller'da setAuthCookie ile ayarlanıyor)
      if (!token && req.cookies && req.cookies[COOKIE_NAME]) {
        token = req.cookies[COOKIE_NAME];
      }

      // c) X-Access-Token (opsiyonel header)
      if (!token && req.headers["x-access-token"]) {
        token = String(req.headers["x-access-token"]).trim();
      }

      // d) Query string (sadece debug/test amaçlı)
      if (!token && req.query && req.query.access_token) {
        token = String(req.query.access_token).trim();
      }

      if (!token) {
        return res.status(401).json({ message: "Token gerekli" });
      }

      /* 2) Token doğrula */
      const payload = jwt.verify(token, JWT_SECRET);

      // typ kontrolü (isteğe bağlı ama faydalı)
      if (payload.typ && String(payload.typ).toLowerCase() !== "access") {
        return res.status(401).json({ message: "Geçersiz token türü" });
      }

      /* 3) req.user doldur */
      req.user = {
        id: payload.sub || payload.id || payload._id || null,
        email: payload.email,
        role: payload.role ? String(payload.role).toLowerCase() : undefined,
        ...payload, // istersen diğer claim’ler de erişilebilir kalsın
      };

      /* 4) RBAC (rol kontrolü) */
      if (requiredRoles.length > 0) {
        const userRole = String(req.user.role || "").toLowerCase();
        const ok = requiredRoles.includes(userRole);
        if (!ok) return res.status(403).json({ message: "Yetkin yok" });
      }

      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token süresi dolmuş", expiredAt: err.expiredAt });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token geçersiz" });
      }
      return res
        .status(500)
        .json({ message: "Token doğrulama hatası", error: err.message });
    }
  };
}

module.exports = { authRequired };
