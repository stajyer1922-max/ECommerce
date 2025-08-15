// middleware/authMiddleware.js
require("dotenv").config();
const jwt = require("jsonwebtoken");

/**
 * RBAC + cookie/Bearer token destekli kimlik doğrulama middleware'i.
 * Kullanım:
 *   router.get("/path", authRequired());                // giriş gerekli
 *   router.get("/admin", authRequired("Admin", "Root")) // rol kontrolü
 */
function authRequired(...roles) {
  return (req, res, next) => {
    try {
      // 1) Bearer token veya cookie'den token al
      let token = null;

      // a) Authorization: Bearer <token>
      const authHeader = req.headers.authorization || "";
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) token = match[1].trim();

      // b) Cookie (örn. access_token)
      if (!token && req.cookies?.access_token) {
        token = req.cookies.access_token;
      }

      if (!token) {
        return res.status(401).json({ message: "Token gerekli" });
      }

      // 2) JWT_SECRET kontrolü
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET || JWT_SECRET.length < 8) {
        return res.status(500).json({
          message: "Sunucu JWT yapılandırma hatası (JWT_SECRET eksik/zayıf)",
        });
      }

      // 3) Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET);

      // 4) req.user set et
      req.user = {
        id: decoded.sub || decoded.id || decoded._id || null,
        email: decoded.email,
        role: decoded.role,
        ...decoded,
      };

      // 5) RBAC kontrolü
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Yetkin yok" });
      }

      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token süresi dolmuş", expiredAt: err.expiredAt });
      }
      if (err.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Token geçersiz", reason: err.message });
      }
      return res
        .status(500)
        .json({ message: "Token doğrulama hatası", error: err.message });
    }
  };
}

module.exports = { authRequired };
