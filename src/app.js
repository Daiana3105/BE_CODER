// src/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'express-handlebars';

import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Handlebars
const viewsPath = path.join(__dirname, 'views');
app.engine('handlebars', handlebars.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(viewsPath, 'layouts'),
  partialsDir: path.join(viewsPath, 'partials'),
  helpers: {
    multiply: (a, b) => a * b,
    eq: (a, b) => a === b,
  },
}));
app.set('view engine', 'handlebars');
app.set('views', viewsPath);

// APIs
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Vistas
app.use('/', viewsRouter);

export default app;
