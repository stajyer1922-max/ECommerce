// controllers/authController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

// === Yardımcılar ===
const isProd = process.env.NODE_ENV === "production";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || "Lax"; // cross-site gerekiyorsa "None"
const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true" ||
  (COOKIE_SAMESITE === "None" ? true : isProd);
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d"; // istersen 15m + refresh yapısı

function signToken(user) {
  const sub = user._id?.toString?.() || user.id || String(user);
  return jwt.sign(
    { sub, email: user.email, role: user.role, typ: "access" },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE, // HTTPS veya SameSite=None ise true
    sameSite: COOKIE_SAMESITE, // SPA için "Lax", cross-site gerekiyorsa "None"
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
  });
}

function sanitizeUser(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  // (Varsa) kart tokenlarını FE'ye döndürmeyelim
  if (Array.isArray(obj.cards)) {
    obj.cards = obj.cards.map((c) => {
      const { token, ...safe } = c;
      return safe;
    });
  }
  return obj;
}

/**
 * POST /api/auth/register
 * Beklenen FE alanları: name, tckn, email, phone, password
 * (address/payment artık yok)
 */
async function register(req, res) {
  try {
    const { name, tckn, email, phone, password, role } = req.body;

    // Zorunlu alanlar
    if (!name || !tckn || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "name, tckn, email, phone ve password zorunludur" });
    }

    // Çakışma kontrolleri
    const dup = await User.findOne({
      $or: [{ email }, { tckn }, { phone }],
    }).lean();
    if (dup) {
      return res
        .status(409)
        .json({ message: "Aynı email/tckn/phone ile kullanıcı mevcut" });
    }

    // pre-save hook şifreyi hash'leyecek (User modelinde)
    const user = await User.create({
      name,
      tckn,
      email,
      phone,
      password,
      role: role && ["admin", "user"].includes(role) ? role : "user",
      // addresses/cards yok
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Kayıt başarılı",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: err.message });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email ve password zorunludur" });
    }

    // password alanı select: false olduğu için +password ile çek
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Email veya parola hatalı" });

    if (typeof user.comparePassword === "function") {
      const ok = await user.comparePassword(String(password));
      if (!ok)
        return res.status(401).json({ message: "Email veya parola hatalı" });
    } else {
      const bcrypt = require("bcryptjs");
      const ok = await bcrypt.compare(
        String(password),
        String(user.password || "")
      );
      if (!ok)
        return res.status(401).json({ message: "Email veya parola hatalı" });
    }

    // İstersen User şemasına isActive eklersin; yoksa bu kontrol zaten geçer
    if (user.isActive === false)
      return res.status(403).json({ message: "Hesap pasif" });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Giriş başarılı",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: err.message });
  }
}

/**
 * GET /api/auth/refresh
 * Cookie'deki access_token doğrulanır, yenisi üretilir.
 */
async function refresh(req, res) {
  try {
    const cookieToken = req.cookies?.[COOKIE_NAME];
    if (!cookieToken) return res.status(401).json({ message: "Oturum yok." });

    let payload;
    try {
      payload = jwt.verify(cookieToken, process.env.JWT_SECRET);
    } catch {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Geçersiz/sonlanmış oturum." });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isActive === false) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Kullanıcı bulunamadı/pasif." });
    }

    const newToken = signToken(user);
    setAuthCookie(res, newToken);

    return res.status(200).json({
      accessToken: newToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: err.message });
  }
}

/**
 * GET /api/auth/me
 * protect middleware varsa req.user.id gelir, yoksa cookie'den doğrular.
 */
async function me(req, res) {
  try {
    let userId = req.user?.id || req.user?.sub;

    if (!userId) {
      const cookieToken = req.cookies?.[COOKIE_NAME];
      if (!cookieToken) return res.status(401).json({ message: "Yetkisiz" });
      try {
        const payload = jwt.verify(cookieToken, process.env.JWT_SECRET);
        userId = payload.sub;
      } catch {
        return res.status(401).json({ message: "Yetkisiz" });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: err.message });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Çıkış yapıldı" });
}

module.exports = { register, login, refresh, me, logout };
