import express from "express";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import viewsRouter from "./routes/views.router.js";
import productsRouter from "./routes/products.router.js";
import ProductManager from "./managers/ProductManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuración de Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Rutas
app.use("/", viewsRouter);
app.use("/api/products", productsRouter);

// Inicializar servidor HTTP
const server = app.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);

// Inicializar Socket.io
const io = new Server(server);
const productManager = new ProductManager();

// Conexión de socket.io
io.on("connection", async (socket) => {
  console.log("Cliente conectado");

  // Enviar lista inicial
  const products = await productManager.getProducts();
  socket.emit("updateProducts", products);

  // Escuchar creación de producto
  socket.on("newProduct", async (product) => {
    await productManager.addProduct(product);
    const updatedProducts = await productManager.getProducts();
    io.emit("updateProducts", updatedProducts);
  });

  // Escuchar eliminación de producto
  socket.on("deleteProduct", async (id) => {
    await productManager.deleteProduct(id);
    const updatedProducts = await productManager.getProducts();
    io.emit("updateProducts", updatedProducts);
  });
});

export default app;
