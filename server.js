import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'express-handlebars';

import viewsRouter from './src/routes/views.router.js'; // tu router para vistas
import ProductManager from './src/managers/ProductManager.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// --- Configuración de Handlebars ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src/views'));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src/public')));

// --- Rutas ---
app.use('/', viewsRouter);

const productManager = new ProductManager();

// --- WebSockets ---
io.on('connection', async (socket) => {
  console.log('Cliente conectado');

  // Enviar lista inicial de productos
  const products = await productManager.getProducts();
  socket.emit('updateProducts', products);

  // producto nuevo
  socket.on('newProduct', async (data) => {
    await productManager.addProduct(data);
    const updatedProducts = await productManager.getProducts();
    io.emit('updateProducts', updatedProducts); // actualizar a todos
  });

  // eliminar producto
  socket.on('deleteProduct', async (id) => {
    await productManager.deleteProduct(id);
    const updatedProducts = await productManager.getProducts();
    io.emit('updateProducts', updatedProducts); // actualizar a todos
  });
});

// --- Inicializar servidor ---
const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
