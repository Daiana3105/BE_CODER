// src/routes/views.router.js
import { Router } from 'express';
import MongoProductManager from '../managers/MongoProductManager.js';
import MongoCartManager from '../managers/MongoCartManager.js';

const router = Router();
const pm = new MongoProductManager();
const cm = new MongoCartManager();

const CART_ID_ENV = process.env.DEMO_CART_ID || null;

// Home /products
router.get('/', (_req, res) => res.redirect('/products'));

/**
 * GET /products  (lista con filtros + asegura cartId)
 */
router.get('/products', async (req, res) => {
  try {
    const query = { ...req.query };
    const r = await pm.getProducts(query);

    const products   = r?.docs ?? r?.payload ?? r ?? [];
    const page       = r?.page ?? 1;
    const totalPages = r?.totalPages ?? 1;
    const hasPrev    = r?.hasPrevPage ?? Boolean(r?.prevPage);
    const hasNext    = r?.hasNextPage ?? Boolean(r?.nextPage);
    const prevPage   = r?.prevPage ?? (hasPrev ? page - 1 : null);
    const nextPage   = r?.nextPage ?? (hasNext ? page + 1 : null);
    const limit      = r?.limit ?? query.limit ?? 10;

    const base = '/products';
    const mk = (p) =>
      `${base}?page=${p}&limit=${limit}` +
      (query.sort  ? `&sort=${query.sort}` : '') +
      (query.query ? `&query=${encodeURIComponent(query.query)}` : '');

    // Asegurar un cartId para el front
    let cartId = CART_ID_ENV;
    if (!cartId) {
      cartId = await cm.getFirstCartId();
      if (!cartId) cartId = (await cm.create())._id.toString();
    }

    res.render('products', {
      title: 'Productos',
      products,
      page, totalPages,
      hasPrevPage: hasPrev,
      hasNextPage: hasNext,
      prevPage, nextPage,
      prevLinkView: hasPrev ? mk(prevPage) : null,
      nextLinkView: hasNext ? mk(nextPage) : null,
      sort:  query.sort  || '',
      query: query.query || '',
      limit,
      cartId,
    });
  } catch (err) {
    console.error('GET /products view error:', err);
    res.status(500).send('Error al cargar productos: ' + (err.message || err));
  }
});

/**
 * GET /carts  redirige al primer carrito
 */
router.get('/carts', async (_req, res) => {
  try {
    const firstCartId = await cm.getFirstCartId();
    if (!firstCartId) return res.status(404).send('No hay carritos en la base de datos.');
    res.redirect(`/carts/${firstCartId}`);
  } catch (err) {
    console.error('Error al buscar carrito:', err);
    res.status(500).send('Error al buscar carrito: ' + (err.message || err));
  }
});

/*
  GET /carts/:cid  (carrito con populate)
 */
router.get('/carts/:cid', async (req, res) => {
  try {
    const cid = req.params.cid;
    const cart = await cm.getByIdPopulate(cid);
    if (!cart) return res.status(404).send('Carrito no encontrado');

    const items = (cart.products || []).map((p) => {
      const prd = p.product || {};
      const price = Number(prd.price || 0);
      const quantity = Number(p.quantity || 0);
      return {
        id: prd._id?.toString() ?? '',
        title: prd.title ?? '(sin título)',
        price,
        quantity,
        subtotal: price * quantity,
        thumbnail: Array.isArray(prd.thumbnails) ? prd.thumbnails[0] : null,
        category: prd.category ?? '',
      };
    });

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);

    res.render('cart', {
      title: 'Mi carrito',
      cartId: cid,
      items,
      total,
      isEmpty: items.length === 0,
    });
  } catch (err) {
    console.error('GET /carts/:cid view error:', err);
    res.status(500).send('Error al cargar carrito: ' + (err.message || err));
  }
});

export default router;
