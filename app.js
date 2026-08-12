const products = [
  ['HOODIE ADVERSIDAD', '89,00 €', 'AMBER'],
  ['CAMISETA SIN LÍMITES', '42,00 €', 'NO LIMITS'],
  ['GORRA DROP 01', '35,00 €', 'AMBER']
];

let cart = [];

const grid = document.querySelector('#productGrid');
grid.innerHTML = products.map((p, i) => `
  <article class="product-card">
    <div class="product-img" data-mark="${p[2]}">${i === 0 ? '<span class="tag">NUEVO</span>' : ''}</div>
    <div class="product-info">
      <p>${p[0]}<br><strong>${p[1]}</strong></p>
      <button data-i="${i}">AÑADIR +</button>
    </div>
  </article>
`).join('');

const cartEl = document.querySelector('.cart');
const overlay = document.querySelector('.overlay');
const items = document.querySelector('#cartItems');
const count = document.querySelector('#count');
const total = document.querySelector('#total');
const toast = document.querySelector('.toast');

function render() {
  count.textContent = cart.length;
  items.innerHTML = cart.length
    ? cart.map(i => `<div class="cart-item"><span>${products[i][0]}</span><span>${products[i][1]}</span></div>`).join('')
    : '<p class="empty">Tu bolsa está vacía.<br>El siguiente paso empieza ahora.</p>';

  total.textContent = cart.reduce((s, i) => s + parseFloat(products[i][1].replace(',', '.')), 0).toFixed(2).replace('.', ',') + ' €';
}

function openCart() {
  cartEl.classList.add('open');
  overlay.classList.add('show');
}

document.querySelector('.bag').onclick = openCart;
document.querySelector('#closeCart').onclick = () => {
  cartEl.classList.remove('open');
  overlay.classList.remove('show');
};
overlay.onclick = () => document.querySelector('#closeCart').click();

document.addEventListener('click', e => {
  if (e.target.dataset.i !== undefined) {
    cart.push(+e.target.dataset.i);
    render();
    openCart();
    toast.textContent = 'AÑADIDO A TU BOLSA';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1900);
  }
});

document.querySelector('.menu-btn').onclick = e => {
  const n = document.querySelector('nav');
  n.classList.toggle('show');
  e.target.setAttribute('aria-expanded', n.classList.contains('show'));
};

document.querySelector('#newsletterForm').onsubmit = e => {
  e.preventDefault();
  e.target.reset();
  toast.textContent = 'BIENVENIDO A AMBER.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
};

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
