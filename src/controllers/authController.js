// controllers/authController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");

// === Yardımcılar ===
const isProd = process.env.NODE_ENV === "production";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || "Lax"; // cross-site gerekiyorsa "None"
const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true" ||
  (COOKIE_SAMESITE === "None" ? true : isProd);
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d"; // kısa ömür + refresh istiyorsan 15m yap

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
    httpOnly: true, // JS erişemez
    secure: COOKIE_SECURE, // prod/https veya SameSite=None ise true olmalı
    sameSite: COOKIE_SAMESITE, // "Lax" (SPA’de F5 sıkıntısız), cross-site için "None"
    path: "/", // tüm API
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün (env ile yönetebilirsin)
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
  return obj;
}

// === POST /api/auth/register ===
async function register(req, res) {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email ve password zorunludur" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Bu email ile kayıt zaten var" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: role && ["admin", "user"].includes(role) ? role : "user",
      isActive: true,
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Kayıt başarılı",
      token, // FE isterse header’a koyabilir
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: err.message });
  }
}

// === POST /api/auth/login ===
async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log(email);
    if (!email || !password) {
      return res.status(400).json({ message: "email ve password zorunludur" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Email veya parola hatalı" });

    if (!user.password) {
      console.error("LOGIN ERROR: user.password undefined for", email);
      return res.status(500).json({ message: "Hesap parolası eksik." });
    }

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok)
      return res.status(401).json({ message: "Email veya parola hatalı" });

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

// === GET /api/auth/refresh ===
// Cookie’deki access_token doğrulanır; geçerliyse yenisi üretilir ve cookie tazelenir.
// SPA’de F5 sonrası oturumu sürdürmek için FE bu endpoint’i çağırabilir.
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

// === GET /api/auth/me ===
// protect middleware (JWT verify) kullanıyorsan req.user.id gelir.
// Yoksa burada cookie’den de doğrulayabiliriz (fallback).
async function me(req, res) {
  try {
    let userId = req.user?.id || req.user?.sub;

    if (!userId) {
      // middleware yoksa cookie’den oku (fallback)
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

// === POST /api/auth/logout ===
async function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Çıkış yapıldı" });
}

module.exports = { register, login, refresh, me, logout };
