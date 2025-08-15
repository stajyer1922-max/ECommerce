const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "E-Ticaret API",
      version: "1.0.0",
      description: "Katmanlı mimari E-Ticaret backend API dokümantasyonu",
    },
    servers: [{ url: "http://localhost:3000/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "HttpOnly JWT Token",
        },
      },
      schemas: {
        // ==== AUTH ====
        RegisterRequest: {
          type: "object",
          required: ["name", "tckn", "email", "phone", "password"],
          properties: {
            name: { type: "string" },
            tckn: { type: "string", example: "12345678901" },
            email: { type: "string", format: "email" },
            phone: { type: "string", example: "+905551112233" },
            password: { type: "string", minLength: 8 },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/AuthUser" },
            accessToken: { type: "string" },
          },
        },

        // ==== PRODUCT ====
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            materialNo: { type: "string" },
            shortText: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            currency: { type: "string", example: "TRY" },
            productType: { type: "string" },
            variant: { type: "object" },
            stock: { type: "integer" },
            images: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProductCreate: {
          allOf: [
            { $ref: "#/components/schemas/Product" },
            {
              required: [
                "materialNo",
                "shortText",
                "name",
                "price",
                "productType",
              ],
            },
          ],
        },
        ProductUpdate: { $ref: "#/components/schemas/Product" },

        // ==== CART ====
        CartItem: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["productId", "quantity"],
        },
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer" },
                  product: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            status: { type: "string", example: "active" },
          },
        },

        // ==== USER / ADDRESS / CARD ====
        Address: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            district: { type: "string" },
            zip: { type: "string" },
            isDefault: { type: "boolean" },
          },
          required: ["title", "address", "city", "district", "zip"],
        },
        Card: {
          type: "object",
          properties: {
            _id: { type: "string" },
            holder: { type: "string" },
            brand: { type: "string", example: "VISA" },
            last4: { type: "string", example: "4242" },
            token: { type: "string", description: "Saklanmaz, maskele" },
            isDefault: { type: "boolean" },
          },
        },
        ApiMessage: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // Aşağıdaki router dosyalarını okuyacak
};

module.exports = swaggerJsdoc(options);
