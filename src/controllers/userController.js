const { User } = require('../models/User');

module.exports = {
  list: async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};
