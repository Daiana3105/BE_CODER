const socket = io();
const productList = document.getElementById('productList');
const form = document.getElementById('productForm');
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const newProduct = {
    title: titleInput.value,
    price: parseFloat(priceInput.value)
  };
  socket.emit('newProduct', newProduct);
  form.reset();
});

productList.addEventListener('click', (e) => {
  if (e.target.classList.contains('deleteBtn')) {
    const li = e.target.closest('li');
    const productId = li.getAttribute('data-id');
    socket.emit('deleteProduct', productId);
  }
});

socket.on('updateProducts', (products) => {
  productList.innerHTML = products.map(p =>
    `<li data-id="${p.id}">${p.title} - $${p.price}
      <button class="deleteBtn">Eliminar</button></li>`
  ).join('');
});
