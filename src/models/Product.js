const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
    label: { type: String, default: "" },
    source: { type: String, default: "external" }, // external | sap | upload ...
  },
  { _id: false }
);

/**
 * SAP alan eşleşmeleri:
 * - matnr -> materialNo (unique)
 * - maktx -> name
 * - stprs -> price
 * - dates -> date
 * - matkl -> materialGroup
 * - labst -> stock
 * - wgbez -> materialGroupName
 */
const productSchema = new mongoose.Schema(
  {
    materialNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "TRY" },

    materialGroup: { type: String },
    materialGroupName: { type: String },

    stock: { type: Number, default: 0 },
    date: { type: Date },

    images: { type: [ImageSchema], default: [] },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.set("toJSON", { versionKey: false });
productSchema.set("toObject", { versionKey: false });

module.exports = mongoose.model("Product", productSchema);
