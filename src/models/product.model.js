import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  code: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  status: { type: Boolean, default: true },
  stock: { type: Number, required: true },
  category: String,
  thumbnails: [String]
}, { timestamps: true });

const ProductModel = mongoose.model('Product', productSchema);
export default ProductModel;
