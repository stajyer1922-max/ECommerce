// src/app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;

/* === CORS (cookie göndermek için credentials:true) === */
const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman / curl gibi origin olmayan durumları da kabul et
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS engellendi: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // CSRF header'ı artık yok; Content-Type ve Authorization yeter
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// (Eğer reverse proxy/ingress arkasındaysan ve Secure cookie kullanacaksan)
/// app.set("trust proxy", 1);

/* (Opsiyonel) CORS hatalarını JSON döndür (uygulama çökmesin) */
app.use((err, _req, res, next) => {
  if (err && /CORS/.test(String(err.message || ""))) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

/* === ROUTES === */
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (_req, res) => {
  res.send("Merhaba, Node.js çok katmanlı mimari backend projesi çalışıyor!");
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Body:", req.body);
  console.log("Query:", req.query);
  console.log("Params:", req.params);
  console.log("End of Request");
  next();
});

/* === MongoDB bağlantısı & server === */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB bağlantısı başarılı!");
    console.log("CORS allowed origins:", allowedOrigins);
    app.listen(port, () => {
      console.log(`Server çalışıyor: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB bağlantı hatası:", err);
  });

module.exports = app;
