import fs from 'fs/promises';
import path from 'path';

const cartsPath = path.resolve('src/data/carts.json');

class CartManager {
  async getCarts() {
    const data = await fs.readFile(cartsPath, 'utf-8');
    return JSON.parse(data);
  }

  async saveCarts(carts) {
    await fs.writeFile(cartsPath, JSON.stringify(carts, null, 2));
  }

  async createCart() {
    const carts = await this.getCarts();
    const newCart = {
      id: Date.now().toString(),
      products: []
    };
    carts.push(newCart);
    await this.saveCarts(carts);
    return newCart;
  }

  async getCartById(id) {
    const carts = await this.getCarts();
    return carts.find(c => c.id === id);
  }

  async addProductToCart(cartId, productId) {
    const carts = await this.getCarts();
    const cart = carts.find(c => c.id === cartId);
    if (!cart) throw new Error('Carrito no encontrado');

    const existingProduct = cart.products.find(p => p.product === productId);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.products.push({ product: productId, quantity: 1 });
    }

    await this.saveCarts(carts);
    return cart;
  }
}

export default CartManager;
