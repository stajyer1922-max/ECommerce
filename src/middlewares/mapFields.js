function normalizeAddress(addr) {
  if (!addr) return null;
  return {
    title: String(addr.title || "").trim(),
    address: String(addr.address || "").trim(),
    city: String(addr.city || "").trim(),
    district: String(addr.district || "").trim(),
    zip: String(addr.zip || "").trim(),
    isDefault: !!addr.isDefault,
  };
}

// Dummy tokenization (gerçekte ödeme sağlayıcısına gidersin)
function tokenizeCard({ pan, cvv }) {
  if (!pan || !cvv) return null;
  const brand = String(pan).startsWith("4") ? "VISA" : "MASTERCARD";
  const last4 = String(pan).slice(-4);
  const token = "tok_" + Math.random().toString(36).slice(2);
  return { brand, last4, token };
}

function mapRegisterBody(req, _res, next) {
  const b = req.body || {};

  // Adres
  const addr = normalizeAddress(b.address);

  // Ödeme -> card objesine dönüşecek veri controller'da hazırlanacak
  req.body = {
    name: b.name,
    tckn: b.tckn,
    email: b.email,
    phone: b.phone,
    password: b.password,
    address: addr,
    payment: b.payment || null, // pan/cvv burada (DB’ye girmeyecek)
  };

  // Tokenization sonucu req içine ara bilgi koy (controller kullanacak)
  if (b.payment?.pan && b.payment?.cvv) {
    req.cardTokenInfo = tokenizeCard({
      pan: b.payment.pan,
      cvv: b.payment.cvv,
    });
  }

  next();
}

module.exports = { mapRegisterBody };
