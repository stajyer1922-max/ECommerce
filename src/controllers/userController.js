// src/controllers/userController.js
const { User } = require("../models/User");

/* ===================== Helpers ===================== */
const maskCards = (cards = []) => cards.map(({ token, ...safe }) => safe);
const idxOf = (arr, id) => arr.findIndex((x) => String(x._id) === String(id));

// Dummy tokenize (gerçekte iyzico/Stripe vb. kullanırsın)
function tokenize({ pan, cvv }) {
  const brand = String(pan).startsWith("4") ? "VISA" : "MASTERCARD";
  const last4 = String(pan).slice(-4);
  const token = "tok_" + Math.random().toString(36).slice(2);
  return { brand, last4, token };
}

/* ===================== ADMIN ===================== */
// GET /api/users  (authRequired("admin"))
module.exports.list = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===================== ADDRESSES ===================== */
// GET /api/users/addresses
module.exports.listAddresses = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).lean();
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });
    res.json(u.addresses || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/addresses
module.exports.addAddress = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    const addr = {
      title: req.body.title,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      zip: req.body.zip,
      isDefault: !!req.body.isDefault,
    };

    if (addr.isDefault) u.addresses.forEach((a) => (a.isDefault = false));
    u.addresses.push(addr);
    await u.save();

    res.status(201).json({ message: "Adres eklendi", addresses: u.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/addresses/:addressId
module.exports.updateAddress = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    const i = idxOf(u.addresses, req.params.addressId);
    if (i === -1) return res.status(404).json({ message: "Adres bulunamadı" });

    ["title", "address", "city", "district", "zip"].forEach((f) => {
      if (req.body[f] !== undefined) u.addresses[i][f] = req.body[f];
    });

    await u.save();
    res.json({ message: "Adres güncellendi", address: u.addresses[i] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/addresses/:addressId
module.exports.deleteAddress = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    const before = u.addresses.length;
    u.addresses = u.addresses.filter(
      (a) => String(a._id) !== String(req.params.addressId)
    );
    if (u.addresses.length === before)
      return res.status(404).json({ message: "Adres bulunamadı" });

    await u.save();
    res.json({ message: "Adres silindi", addresses: u.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/addresses/:addressId/default
module.exports.setDefaultAddress = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    let found = false;
    u.addresses.forEach((a) => {
      const match = String(a._id) === String(req.params.addressId);
      a.isDefault = match;
      if (match) found = true;
    });
    if (!found) return res.status(404).json({ message: "Adres bulunamadı" });

    await u.save();
    res.json({ message: "Varsayılan adres ayarlandı", addresses: u.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===================== CARDS ===================== */
// GET /api/users/cards
module.exports.listCards = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).lean();
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });
    res.json(maskCards(u.cards || [])); // token'ı gizle
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/cards
module.exports.addCard = async (req, res) => {
  try {
    const { title, holder, pan, expMonth, expYear, cvv, isDefault } = req.body;
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    // PAN/CVV -> tokenize; DB'ye yazmayacağız
    const t = tokenize({ pan, cvv });
    if (isDefault) u.cards.forEach((c) => (c.isDefault = false));

    u.cards.push({
      title,
      holder,
      brand: t.brand,
      last4: t.last4,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      token: t.token,
      isDefault: !!isDefault,
    });

    await u.save();
    res
      .status(201)
      .json({ message: "Kart eklendi", cards: maskCards(u.cards) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/cards/:cardId
module.exports.updateCard = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    const i = idxOf(u.cards, req.params.cardId);
    if (i === -1) return res.status(404).json({ message: "Kart bulunamadı" });

    ["title", "holder", "expMonth", "expYear"].forEach((f) => {
      if (req.body[f] !== undefined) u.cards[i][f] = req.body[f];
    });

    await u.save();
    const card = u.cards[i].toObject?.() ?? u.cards[i];
    delete card.token;
    res.json({ message: "Kart güncellendi", card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/cards/:cardId
module.exports.deleteCard = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    const before = u.cards.length;
    u.cards = u.cards.filter(
      (c) => String(c._id) !== String(req.params.cardId)
    );
    if (u.cards.length === before)
      return res.status(404).json({ message: "Kart bulunamadı" });

    await u.save();
    res.json({ message: "Kart silindi", cards: maskCards(u.cards) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/cards/:cardId/default
module.exports.setDefaultCard = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Kullanıcı yok" });

    let found = false;
    u.cards.forEach((c) => {
      const match = String(c._id) === String(req.params.cardId);
      c.isDefault = match;
      if (match) found = true;
    });
    if (!found) return res.status(404).json({ message: "Kart bulunamadı" });

    await u.save();
    res.json({
      message: "Varsayılan kart ayarlandı",
      cards: maskCards(u.cards),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
