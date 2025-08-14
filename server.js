// server.js
console.log("🚀 Arrancando desde server.js");
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { connectMongo } from "./src/config/mongo.js"; 
import MongoProductManager from './src/managers/MongoProductManager.js';

const PORT = 8080;

// Crear servidor HTTP a partir de app
const httpServer = createServer(app);

// Inicializar socket.io
const io = new Server(httpServer);

// Manager para la vista realtime (podés migrarlo a Mongo después)
const productManager = new MongoProductManager();

io.on("connection", async (socket) => {
  console.log("Cliente conectado");

  // Enviar lista inicial
  const products = await productManager.getProducts();
  socket.emit("updateProducts", products);

  // Crear producto
  socket.on("newProduct", async (product) => {
    await productManager.create(product); 
    const updated = await productManager.getProducts();
    io.emit("updateProducts", updated);
  });

  // Eliminar producto
  socket.on("deleteProduct", async (id) => {
    await productManager.delete(id); 
    const updated = await productManager.getProducts();
    io.emit("updateProducts", updated);
  });
});

// Arranque ordenado
async function start() {
  await connectMongo(); 
  httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

start();
