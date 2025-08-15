// src/validators/authValidators.js
const { body } = require("express-validator");

const registerRules = [
  body("name").isString().isLength({ min: 2 }),
  body("tckn").isString().isLength({ min: 11, max: 11 }),
  body("email").isEmail(),
  body("phone").isString().isLength({ min: 10 }),
  body("password").isString().isLength({ min: 8 }),
];

const loginRules = [
  body("email").isEmail(),
  body("password").isString().isLength({ min: 8 }),
];

module.exports = { registerRules, loginRules };
