// src/managers/MongoCartManager.js
import mongoose from 'mongoose';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';

// Helpers
const normQty = (q) => Math.max(1, Number(q) || 1);
const isId = (id) => mongoose.Types.ObjectId.isValid(id);

export default class MongoCartManager {
  // Crear carrito vacío
  async create() {
    return CartModel.create({ products: [] });
  }

  // Listar todos los carritos (más viejo → más nuevo)
  async getCarts() {
    return CartModel.find().sort({ createdAt: 1 }).lean();
  }

  // Obtener el primer carrito (para redirecciones de /carts)
  async getFirstCartId() {
    const doc = await CartModel.findOne({}, { _id: 1 }).sort({ createdAt: 1 }).lean();
    return doc ? doc._id.toString() : null;
  }

  // Obtener carrito con populate de productos
  async getByIdPopulate(cid) {
    if (!isId(cid)) return null;
    return CartModel.findById(cid)
      .populate({ path: 'products.product', select: 'title price category status thumbnails' })
      .lean();
  }

  // Agregar producto (si existe, suma cantidad; si no, lo inserta)
  async addProduct(cid, pid, qty = 1) {
    if (!isId(cid) || !isId(pid)) return null;

    const exists = await ProductModel.exists({ _id: pid });
    if (!exists) return null;

    const nQty = normQty(qty);

    // Si ya existe el item, incrementar
    const updated = await CartModel.findOneAndUpdate(
      { _id: cid, 'products.product': pid },
      { $inc: { 'products.$.quantity': nQty } },
      { new: true }
    );
    if (updated) return updated;

    // Si no existe, pushear
    return CartModel.findByIdAndUpdate(
      cid,
      { $push: { products: { product: pid, quantity: nQty } } },
      { new: true }
    );
  }

  // Reemplazar TODO el array de productos (saneado)
  async updateAllProducts(cid, productsArray = []) {
    if (!isId(cid)) return null;

    const sanitized = (productsArray || [])
      .filter((p) => p?.product && isId(p.product))
      .map((p) => ({ product: p.product, quantity: normQty(p.quantity) }));

    return CartModel.findByIdAndUpdate(
      cid,
      { products: sanitized },
      { new: true }
    );
  }

  // Cambiar SOLO la cantidad de un item
  async updateQuantity(cid, pid, qty) {
    if (!isId(cid) || !isId(pid)) return null;

    const nQty = normQty(qty);
    return CartModel.findOneAndUpdate(
      { _id: cid, 'products.product': pid },
      { $set: { 'products.$.quantity': nQty } },
      { new: true }
    );
  }

  // Eliminar un producto del carrito
  async removeProduct(cid, pid) {
    if (!isId(cid) || !isId(pid)) return null;

    return CartModel.findByIdAndUpdate(
      cid,
      { $pull: { products: { product: pid } } },
      { new: true }
    );
  }

  // Vaciar el carrito
  async clear(cid) {
    if (!isId(cid)) return null;
    return CartModel.findByIdAndUpdate(cid, { products: [] }, { new: true });
  }
}
