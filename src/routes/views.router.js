import { Router } from "express";
import ProductManager from "../managers/ProductManager.js";

const router = Router();
const productManager = new ProductManager();

// Vista principal con la lista de productos estática
router.get("/", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("home", { products });
});

// Vista dinámica con WebSockets
router.get("/realtimeproducts", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("realTimeProducts", { products });
});

export default router;
