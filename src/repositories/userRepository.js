const { User } = require("../models/User");

class UserRepository {
  // Her zaman user olarak oluştur
  async create(data) {
    const { name, email, password } = data; // role'ü body'den almayız
    return await User.create({ name, email, password, role: "user" });
  }

  // Login için password dahil çek
  async findByEmailWithPassword(email) {
    return await User.findOne({ email }).select("+password");
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(id) {
    return await User.findById(id);
  }
}

module.exports = new UserRepository();
