// FE payload -> BE alanlarına çevir
function mapRegisterBody(req, _res, next) {
  const b = req.body || {};
  req.body = {
    name: b.name,
    tckn: b.tckn,
    email: b.email,
    phone: b.phone,
    password: b.password,
    // opsiyonel ilk adres ve kart ekleme
    address: b.address || null,
    payment: b.payment || null,
  };
  next();
}

function normalizeAddress(addr) {
  if (!addr) return null;
  return {
    title: addr.title,
    address: addr.address,
    city: addr.city,
    district: addr.district,
    zip: addr.zip,
    isDefault: addr.isDefault ?? true,
  };
}

// PAN/cvv kesinlikle burada tutulmuyor.
// Ödeme sağlayıcısı entegrasyonunda token üretip geri dön.
function mapPaymentToCard(payment, token, brand) {
  if (!payment) return null;
  return {
    title: payment.title,
    holder: payment.holder,
    brand,
    last4: String(payment.pan).slice(-4),
    expMonth: Number(payment.expMonth),
    expYear: Number(payment.expYear),
    token,
    isDefault: true,
  };
}

module.exports = { mapRegisterBody, normalizeAddress, mapPaymentToCard };
