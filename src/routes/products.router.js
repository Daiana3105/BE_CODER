import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager();

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
      const product = await productManager.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
    try {
      const updatedProduct = await productManager.updateProduct(req.params.id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
      }
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
    try {
      const { pid } = req.params;
      await productManager.deleteProduct(pid);
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  

export default router;
