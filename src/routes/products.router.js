import { Router } from 'express';
import { query, body, param, validationResult } from 'express-validator';
import MongoProductManager from '../managers/MongoProductManager.js';

const router = Router();
const pm = new MongoProductManager();

// Middleware corto para devolver 400 si hay errores
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    status: 'error',
    error: 'ValidationError',
    details: errors.array()
  });
};

// GET /api/products  (limit/page/sort/query)
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser entero 1..100'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser entero >=1'),
    query('sort').optional().isIn(['asc','desc']).withMessage('sort debe ser asc o desc'),
    query('query').optional().isString().trim().isLength({ max: 200 }).withMessage('query inválido')
  ],
  validate,
  async (req, res) => {
    try {
      const result = await pm.getProducts(req.query);
      res.json({
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  }
);

// GET /api/products/:pid
router.get(
  '/:pid',
  [param('pid').isMongoId().withMessage('pid inválido')],
  validate,
  async (req, res) => {
    try {
      const product = await pm.getById(req.params.pid);
      if (!product) return res.status(404).json({ status: 'error', error: 'Not found' });
      res.json({ status: 'success', payload: product });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  }
);

// POST /api/products
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('title requerido'),
    body('price').isFloat({ gt: 0 }).withMessage('price debe ser > 0'),
    body('category').notEmpty().withMessage('category requerida'),
    body('status').optional().isBoolean().withMessage('status debe ser boolean')
  ],
  validate,
  async (req, res) => {
    try {
      const created = await pm.create(req.body);
      res.status(201).json({ status: 'success', payload: created });
    } catch (err) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  }
);

// PUT /api/products/:pid
router.put(
  '/:pid',
  [
    param('pid').isMongoId().withMessage('pid inválido'),
    body('_id').not().exists().withMessage('no se permite cambiar _id'),
    body('title').optional().isString().trim().notEmpty(),
    body('price').optional().isFloat({ gt: 0 }),
    body('category').optional().isString().trim().notEmpty(),
    body('status').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const updated = await pm.update(req.params.pid, req.body);
      if (!updated) return res.status(404).json({ status: 'error', error: 'Product Not found' });
      res.json({ status: 'success', payload: updated });
    } catch (err) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  }
);

// DELETE /api/products/:pid
router.delete(
  '/:pid',
  [param('pid').isMongoId().withMessage('pid inválido')],
  validate,
  async (req, res) => {
    try {
      await pm.delete(req.params.pid);
      res.json({ status: 'success' });
    } catch (err) {
      res.status(404).json({ status: 'error', error: err.message });
    }
  }
);

export default router;
