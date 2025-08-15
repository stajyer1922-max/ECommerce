const { validationResult } = require("express-validator");
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Doğrulama hatası", errors: errors.array() });
  }
  next();
};
