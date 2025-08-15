const mongoose = require("mongoose"); // Mongoose kütüphanesini dahil ediyoruz, ObjectId doğrulama ve MongoDB bağlantısı için
const Cart = require("../models/Cart"); // Sepet modelini dahil ediyoruz
const Product = require("../models/Product"); // Ürün modelini dahil ediyoruz

// 📌 1) Sepeti görüntüleme
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // .lean() -> düz JS objesi döner (JSON'a hazır)
    const cart = await Cart.findOne({ userId, status: "active" })
      .populate("items.productId", "name price stock isActive")
      .lean();

    // Eğer aktif sepet yoksa
    if (!cart) {
      return res.status(200).json({ message: "Sepette ürün yok" });
    }

    // Eğer sepet var ama içinde ürün yoksa
    if (!cart.items || cart.items.length === 0) {
      return res.status(200).json({ message: "Sepette ürün yok" });
    }

    // Ürün varsa normal şekilde döndür (plain JSON)
    return res.status(200).json({ sepet: cart }); // JSON Script find (lean)
  } catch (error) {
    console.error("Sepet görüntüleme hatası:", error);
    return res
      .status(500)
      .json({ message: "Sunucu hatası", error: error.message });
  }
};

// 📌 2) Sepete ürün ekleme
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ mesaj: "Geçersiz ürün ID" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ mesaj: "Miktar en az 1 olmalı" });
    }

    const product = await Product.findById(productId).select(
      "name price stock isActive"
    );
    if (!product || product.isActive === false) {
      return res.status(404).json({ mesaj: "Ürün bulunamadı" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ mesaj: "Bu ürün için yeterli stok yok" });
    }

    let cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) cart = new Cart({ userId, items: [] });

    const idx = cart.items.findIndex(
      (it) => String(it.productId) === String(productId)
    );
    if (idx > -1) {
      cart.items[idx].quantity += quantity;
      cart.items[idx].price = product.price;
      cart.items[idx].name = product.name;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        quantity,
        price: product.price,
      });
    }

    product.stock -= quantity;
    await product.save();
    await cart.save();

    // lean döndürmek için yeniden fetch + populate + lean
    const sepet = await Cart.findById(cart._id)
      .populate("items.productId", "name price stock isActive")
      .lean();

    return res.status(200).json({ mesaj: "Ürün sepete eklendi", sepet });
  } catch (error) {
    console.error("Sepete ürün ekleme hatası:", error);
    return res
      .status(500)
      .json({ mesaj: "Sunucu hatası", hata: error.message });
  }
};

// 📌 3) Sepetteki ürün miktarını güncelleme
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ mesaj: "Geçersiz ürün ID" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ mesaj: "Miktar en az 1 olmalı" });
    }

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart)
      return res.status(404).json({ mesaj: "Sepet bulunamadı veya boş" });

    const idx = cart.items.findIndex(
      (it) => String(it.productId) === String(productId)
    );
    if (idx === -1)
      return res.status(404).json({ mesaj: "Ürün sepette bulunamadı" });

    const product = await Product.findById(productId).select(
      "name price stock"
    );
    if (!product)
      return res.status(404).json({ mesaj: "Ürün veritabanında bulunamadı" });

    const diff = quantity - cart.items[idx].quantity;
    if (diff > 0) {
      if (product.stock < diff) {
        return res.status(400).json({ mesaj: "Yeterli stok yok" });
      }
      product.stock -= diff;
    } else if (diff < 0) {
      product.stock += Math.abs(diff);
    }
    await product.save();

    cart.items[idx].quantity = quantity;
    cart.items[idx].price = product.price;
    cart.items[idx].name = product.name;

    await cart.save();

    const sepet = await Cart.findById(cart._id)
      .populate("items.productId", "name price stock isActive")
      .lean();

    return res
      .status(200)
      .json({ mesaj: "Sepetteki ürün miktarı güncellendi", sepet });
  } catch (error) {
    console.error("Ürün güncelleme hatası:", error);
    return res
      .status(500)
      .json({ mesaj: "Sunucu hatası", hata: error.message });
  }
};

// 📌 4) Sepetten ürün çıkarma
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ mesaj: "Geçersiz ürün ID" });
    }

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart)
      return res.status(404).json({ mesaj: "Sepet bulunamadı veya boş" });

    const idx = cart.items.findIndex(
      (it) => String(it.productId) === String(productId)
    );
    if (idx === -1)
      return res.status(404).json({ mesaj: "Ürün sepette bulunamadı" });

    const removed = cart.items[idx];

    const product = await Product.findById(productId).select("stock");
    if (product) {
      product.stock += removed.quantity;
      await product.save();
    }

    cart.items.splice(idx, 1);

    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res
        .status(200)
        .json({ mesaj: "Ürün sepetten çıkarıldı ve sepet artık boş" });
    }

    await cart.save();

    const sepet = await Cart.findById(cart._id)
      .populate("items.productId", "name price stock isActive")
      .lean();

    return res.status(200).json({ mesaj: "Ürün sepetten çıkarıldı", sepet });
  } catch (error) {
    console.error("Sepetten ürün çıkarma hatası:", error);
    return res
      .status(500)
      .json({ mesaj: "Sunucu hatası", hata: error.message });
  }
};

// 📌 5) Sepeti temizleme
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) return res.status(200).json({ mesaj: "Sepet zaten boş" });

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).select("stock");
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await Cart.deleteOne({ _id: cart._id });
    return res.status(200).json({ mesaj: "Sepet başarıyla temizlendi" });
  } catch (error) {
    console.error("Sepeti temizleme hatası:", error);
    return res
      .status(500)
      .json({ mesaj: "Sunucu hatası", hata: error.message });
  }
};
