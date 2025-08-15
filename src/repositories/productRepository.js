const Product = require("../models/Product");

class ProductRepository {
  async create(productData) {
    return await Product.create(productData);
  }

  async findAll() {
    return await Product.find();
  }

  async findById(id) {
    return await Product.findById(id);
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async update(id, data) {
    return await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
}

module.exports = new ProductRepository();
