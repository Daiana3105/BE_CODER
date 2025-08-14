// src/routes/carts.router.js
import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import MongoCartManager from '../managers/MongoCartManager.js';

const router = Router();
const cm = new MongoCartManager();
const isObjectId = v => mongoose.Types.ObjectId.isValid(v);

// Middleware mini para validar
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res
    .status(400)
    .json({ status: 'error', error: 'ValidationError', details: errors.array() });
};

/* ------------------------------- RUTAS ------------------------------- */

// Crear carrito
router.post('/', async (_req, res) => {
  const cart = await cm.create();
  res.status(201).json({ status: 'success', payload: cart });
});

// Obtener carrito con populate
router.get(
  '/:cid',
  [param('cid').custom(isObjectId).withMessage('cid inválido')],
  validate,
  async (req, res) => {
    const cart = await cm.getByIdPopulate(req.params.cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Not found' });
    res.json({ status: 'success', payload: cart });
  }
);

// Agregar producto al carrito (quantity opcional → default 1)
router.post(
  '/:cid/products/:pid',
  [
    param('cid').custom(isObjectId).withMessage('cid inválido'),
    param('pid').custom(isObjectId).withMessage('pid inválido'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('quantity debe ser entero >=1'),
  ],
  validate,
  async (req, res) => {
    const qty = Number(req.body?.quantity) > 0 ? Number(req.body.quantity) : 1;
    const cart = await cm.addProduct(req.params.cid, req.params.pid, qty);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Cart Not found' });
    res.json({ status: 'success', payload: cart });
  }
);

// Eliminar un producto del carrito
router.delete(
  '/:cid/products/:pid',
  [
    param('cid').custom(isObjectId).withMessage('cid inválido'),
    param('pid').custom(isObjectId).withMessage('pid inválido'),
  ],
  validate,
  async (req, res) => {
    try {
      const { cid, pid } = req.params;
      const updated = await cm.removeProduct(cid, pid);
      if (!updated) {
        return res.status(404).json({ status: 'error', error: 'Not found' });
      }
      
      return res.json({ status: 'success', payload: updated });
    } catch (err) {
      console.error('DELETE /:cid/products/:pid error:', err);
      return res.status(500).json({ status: 'error', error: err.message || 'Server error' });
    }
  }
);

// Reemplazar TODOS los productos del carrito
router.put(
  '/:cid',
  [
    param('cid').custom(isObjectId).withMessage('cid inválido'),
    body().isArray().withMessage('body debe ser array de productos'),
    body('*.product').custom(isObjectId).withMessage('product debe ser ObjectId válido'),
    body('*.quantity').isInt({ min: 1 }).withMessage('quantity debe ser entero >=1'),
  ],
  validate,
  async (req, res) => {
    const cart = await cm.updateAllProducts(req.params.cid, req.body || []);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Not found' });
    res.json({ status: 'success', payload: cart });
  }
);

// Actualizar SOLO la cantidad de un producto
router.put(
  '/:cid/products/:pid',
  [
    param('cid').custom(isObjectId).withMessage('cid inválido'),
    param('pid').custom(isObjectId).withMessage('pid inválido'),
    body('quantity').exists().isInt({ min: 1 }).withMessage('quantity requerido (entero >=1)'),
  ],
  validate,
  async (req, res) => {
    const qty = Number(req.body.quantity);
    const cart = await cm.updateQuantity(req.params.cid, req.params.pid, qty);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Not found' });
    res.json({ status: 'success', payload: cart });
  }
);

// Vaciar carrito
router.delete(
  '/:cid',
  [param('cid').custom(isObjectId).withMessage('cid inválido')],
  validate,
  async (req, res) => {
    const cart = await cm.clear(req.params.cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Not found' });
    res.json({ status: 'success', payload: cart });
  }
);

export default router;
