const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ---- Alt Şemalar ---- */
const AddressSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // FE: address.title
    address: { type: String, required: true }, // FE: address.address
    city: { type: String, required: true }, // FE: address.city
    district: { type: String, required: true }, // FE: address.district
    zip: { type: String, required: true }, // FE: address.zip
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const CardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // FE: payment.title
    holder: { type: String, required: true }, // FE: payment.holder
    brand: { type: String }, // Visa/Mastercard vs.
    last4: { type: String, required: true },
    expMonth: { type: Number, required: true },
    expYear: { type: Number, required: true },
    token: { type: String, required: true }, // ödeme sağlayıcısı token’ı
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

/* ---- User ---- */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // FE: name
    tckn: { type: String, required: true, unique: true }, // FE: tckn
    email: { type: String, required: true, unique: true }, // FE: email
    phone: { type: String, required: true, unique: true }, // FE: phone
    password: { type: String, required: true, minlength: 8, select: false }, // FE: password
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: { type: [AddressSchema], default: [] },
    cards: { type: [CardSchema], default: [] },
  },
  { timestamps: true }
);

/* ---- Hooks & Methods ---- */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = { User };
