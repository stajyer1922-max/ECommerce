const { body } = require("express-validator");

const addressCreateRules = [
  body("title").isString().notEmpty(),
  body("address").isString().notEmpty(),
  body("city").isString().notEmpty(),
  body("district").isString().notEmpty(),
  body("zip").isString().notEmpty(),
  body("isDefault").optional().isBoolean(),
];

const addressUpdateRules = [
  body("title").optional().isString(),
  body("address").optional().isString(),
  body("city").optional().isString(),
  body("district").optional().isString(),
  body("zip").optional().isString(),
];

const cardCreateRules = [
  body("title").isString().notEmpty(),
  body("holder").isString().notEmpty(),
  body("pan").isCreditCard(),
  body("expMonth").isInt({ min: 1, max: 12 }),
  body("expYear").isInt({ min: 2024 }),
  body("cvv").isLength({ min: 3, max: 4 }),
  body("isDefault").optional().isBoolean(),
];

const cardUpdateRules = [
  body("title").optional().isString(),
  body("holder").optional().isString(),
  body("expMonth").optional().isInt({ min: 1, max: 12 }),
  body("expYear").optional().isInt({ min: 2024 }),
  // PAN/CVV burada yok → yeni kart eklenmeli
];

module.exports = {
  addressCreateRules,
  addressUpdateRules,
  cardCreateRules,
  cardUpdateRules,
};
