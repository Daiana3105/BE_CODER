import ProductModel from '../models/product.model.js';

export default class MongoProductManager {
  async getProducts({ limit = 10, page = 1, sort, query } = {}) {
    const nLimit = Number(limit) > 0 ? Number(limit) : 10;
    const nPage  = Number(page)  > 0 ? Number(page)  : 1;

    // Filtro por categoría o disponibilidad (status)
    let filter = {};
    if (query) {
      if (query.includes(':')) {
        const [key, raw] = query.split(':');
        if (key === 'category') filter.category = raw;
        if (key === 'status')  filter.status = raw === 'true';
      } else {
        if (query === 'true' || query === 'false') filter.status = query === 'true';
        else filter.category = query;
      }
    }

    // Orden por precio
    const sortOption = {};
    if (sort === 'asc')  sortOption.price = 1;
    if (sort === 'desc') sortOption.price = -1;

    // Paginación manual
    const skip = (nPage - 1) * nLimit;

    const [items, totalDocs] = await Promise.all([
      ProductModel.find(filter).sort(sortOption).skip(skip).limit(nLimit).lean(),
      ProductModel.countDocuments(filter)
    ]);

    const totalPages  = Math.max(1, Math.ceil(totalDocs / nLimit));
    const hasPrevPage = nPage > 1;
    const hasNextPage = nPage < totalPages;

    const base = '/api/products';
    const link = (p) =>
      `${base}?page=${p}&limit=${nLimit}` +
      (sort ? `&sort=${sort}` : '') +
      (query ? `&query=${encodeURIComponent(query)}` : '');

    return {
      docs: items,
      totalDocs,
      limit: nLimit,
      totalPages,
      page: nPage,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? nPage - 1 : null,
      nextPage: hasNextPage ? nPage + 1 : null,
      prevLink: hasPrevPage ? link(nPage - 1) : null,
      nextLink: hasNextPage ? link(nPage + 1) : null
    };
  }

  async getById(id) { return ProductModel.findById(id).lean(); }
  async create(data) { return ProductModel.create(data); }
  async update(id, data) { return ProductModel.findByIdAndUpdate(id, data, { new: true }).lean(); }
  async delete(id) { await ProductModel.findByIdAndDelete(id); return true; }
}
