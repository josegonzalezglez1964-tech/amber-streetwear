

// ================================
// RESULTADO DEL PAGO STRIPE
// ================================

async function handlePaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const sessionId = params.get('session_id');

  if (payment === 'success') {
    if (!sessionId) {
      showAmberToast('NO SE PUDO VERIFICAR EL PAGO');

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:4242/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`
      );

      const result = await response.json();

      if (!response.ok || !result.ok || !result.paid) {
        throw new Error(
          result.error || 'El pago no está confirmado'
        );
      }

      cart = [];
      saveCart();
      render();

      showAmberToast('PEDIDO CONFIRMADO — GRACIAS POR TU COMPRA');

    } catch (error) {
      console.error('Error verificando pago:', error);
      showAmberToast('NO SE PUDO VERIFICAR EL PAGO');
    }

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    return;
  }

  if (payment === 'cancelled') {
    showAmberToast('PAGO CANCELADO — TU BOLSA SIGUE INTACTA');

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}

const products = [
  ['HOODIE ADVERSIDAD', '89,00 €', 'AMBER'],
  ['CAMISETA SIN LÍMITES', '42,00 €', 'NO LIMITS'],
  ['GORRA DROP 01', '35,00 €', 'AMBER']
];

// ================================
// CESTA PERSISTENTE
// ================================

let cart = [];

try {
  const savedCart = localStorage.getItem('amber-cart');
  cart = savedCart ? JSON.parse(savedCart) : [];

  if (!Array.isArray(cart)) {
    cart = [];
  }

  cart = cart.filter(
    index => Number.isInteger(index) && index >= 0 && index < products.length
  );
} catch (error) {
  console.warn('No se pudo recuperar la cesta:', error);
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('amber-cart', JSON.stringify(cart));
  } catch (error) {
    console.warn('No se pudo guardar la cesta:', error);
  }
}

// ================================
// PRODUCTOS
// ================================

const grid = document.querySelector('#productGrid');

grid.innerHTML = products.map((product, index) => `
  <article class="product-card">
    <div class="product-img" data-mark="${product[2]}">
      ${index === 0 ? '<span class="tag">NUEVO</span>' : ''}
    </div>

    <div class="product-info">
      <p>
        ${product[0]}<br>
        <strong>${product[1]}</strong>
      </p>

      <button type="button" data-i="${index}">
        AÑADIR +
      </button>
    </div>
  </article>
`).join('');

// ================================
// ELEMENTOS
// ================================

const cartEl = document.querySelector('.cart');
const overlay = document.querySelector('.overlay');
const items = document.querySelector('#cartItems');
const count = document.querySelector('#count');
const total = document.querySelector('#total');
const toast = document.querySelector('.toast');

// ================================
// RENDER CESTA
// ================================

function render() {
  count.textContent = cart.length;

  if (cart.length) {
    const quantities = cart.reduce((result, index) => {
      result[index] = (result[index] || 0) + 1;
      return result;
    }, {});

    items.innerHTML = Object.entries(quantities).map(([index, quantity]) => `
      <div class="cart-item">
        <div>
          <strong>${products[index][0]}</strong>

          <div class="cart-quantity">
            <button
              type="button"
              data-cart-action="decrease"
              data-product="${index}"
              aria-label="Disminuir cantidad"
            >−</button>

            <span>${quantity}</span>

            <button
              type="button"
              data-cart-action="increase"
              data-product="${index}"
              aria-label="Aumentar cantidad"
            >+</button>
          </div>
        </div>

        <div>
          <span>${products[index][1]}</span>

          <button
            type="button"
            data-cart-action="remove"
            data-product="${index}"
            aria-label="Eliminar producto"
          >ELIMINAR</button>
        </div>
      </div>
    `).join('');
  } else {
    items.innerHTML = `
      <p class="empty">
        Tu bolsa está vacía.<br>
        El siguiente paso empieza ahora.
      </p>
    `;
  }

  const totalValue = cart.reduce((sum, index) => {
    const price = parseFloat(
      products[index][1]
        .replace('€', '')
        .replace(',', '.')
        .trim()
    );

    return sum + price;
  }, 0);

  total.textContent =
    totalValue.toFixed(2).replace('.', ',') + ' €';
}
// ================================
// ABRIR / CERRAR CESTA
// ================================

function openCart() {
  cartEl.classList.add('open');
  overlay.classList.add('show');
}

function closeCart() {
  cartEl.classList.remove('open');
  overlay.classList.remove('show');
}

document.querySelector('.bag').addEventListener('click', openCart);

document
  .querySelector('#closeCart')
  .addEventListener('click', closeCart);

overlay.addEventListener('click', closeCart);

// ================================
// AÑADIR PRODUCTOS
// ================================

document.addEventListener('click', event => {
  const button = event.target.closest('[data-i]');

  if (!button) {
    return;
  }

  const index = Number(button.dataset.i);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= products.length
  ) {
    return;
  }

  cart.push(index);

  saveCart();
  render();
  openCart();

  toast.textContent = 'AÑADIDO A TU BOLSA';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 1900);
});

// ================================
// CONTROLES DE CANTIDAD DE LA CESTA
// ================================

document.addEventListener('click', event => {
  const button = event.target.closest('[data-cart-action]');

  if (!button) {
    return;
  }

  const index = Number(button.dataset.product);
  const action = button.dataset.cartAction;

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= products.length
  ) {
    return;
  }

  if (action === 'increase') {
    cart.push(index);
  } else if (action === 'decrease') {
    const position = cart.lastIndexOf(index);

    if (position !== -1) {
      cart.splice(position, 1);
    }
  } else if (action === 'remove') {
    cart = cart.filter(item => item !== index);
  } else {
    return;
  }

  saveCart();
  render();
});

// ================================
// MENÚ
// ================================

const menuButton = document.querySelector('.menu-btn');
const nav = document.querySelector('nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', event => {
    nav.classList.toggle('show');

    event.currentTarget.setAttribute(
      'aria-expanded',
      nav.classList.contains('show')
    );
  });
}

// ================================
// NEWSLETTER
// ================================

const newsletterForm =
  document.querySelector('#newsletterForm');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', event => {
    event.preventDefault();

    event.target.reset();

    toast.textContent = 'BIENVENIDO A AMBER.';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  });
}

// ================================
// INICIO
// ================================

render();
handlePaymentResult();

// ================================
// SERVICE WORKER
// ================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .catch(error => {
      console.warn(
        'No se pudo registrar el Service Worker:',
        error
      );
    });
}

/* ================================
   CUENTA AMBER
   Persistencia mediante localStorage
   ================================ */

const accountButton = document.querySelector('#accountButton');
const accountStatus = document.querySelector('#accountStatus');
const accountPanel = document.querySelector('#accountPanel');
const closeAccount = document.querySelector('#closeAccount');
const loginForm = document.querySelector('#loginForm');
const accountContent = document.querySelector('#accountContent');

function getAmberAccount() {
  try {
    return JSON.parse(localStorage.getItem('amber-account') || 'null');
  } catch {
    return null;
  }
}

function saveAmberAccount(account) {
  localStorage.setItem('amber-account', JSON.stringify(account));
}

function renderAccount() {
  const account = getAmberAccount();

  if (!account) {
    accountStatus.textContent = 'ENTRAR';
    accountContent.innerHTML = `
      <p class="empty">
        Inicia sesión para guardar tu cuenta y tus compras.
      </p>

      <form id="loginForm">
        <label for="loginName">NOMBRE</label>
        <input id="loginName" type="text" required autocomplete="name">

        <label for="loginEmail">EMAIL</label>
        <input id="loginEmail" type="email" required autocomplete="email">

        <button class="button amber" type="submit">
          ENTRAR EN AMBER →
        </button>
      </form>
    `;

    document.querySelector('#loginForm').addEventListener('submit', handleLogin);
    return;
  }

  accountStatus.textContent = account.name;

  accountContent.innerHTML = `
    <p class="empty">
      BIENVENIDO/A, <strong>${account.name}</strong>.
    </p>

    <p>${account.email}</p>

    <button id="logoutButton" class="button amber" type="button">
      CERRAR SESIÓN
    </button>
  `;

  document.querySelector('#logoutButton').addEventListener('click', () => {
    localStorage.removeItem('amber-account');
    renderAccount();
    showAmberToast('HAS CERRADO SESIÓN');
  });
}

/* ================================
   CHECKOUT AMBER
   Resumen del pedido
   ================================ */

const checkoutButton = document.querySelector('#checkoutButton');
const checkoutPanel = document.querySelector('#checkoutPanel');
const checkoutContent = document.querySelector('#checkoutContent');
const closeCheckout = document.querySelector('#closeCheckout');

function getCheckoutAccount() {
  try {
    return JSON.parse(localStorage.getItem('amber-account') || 'null');
  } catch {
    return null;
  }
}

function renderCheckout() {
  if (!checkoutContent) return;

  const account = getCheckoutAccount();

  if (!cart.length) {
    checkoutContent.innerHTML = `
      <p class="empty">
        Tu bolsa está vacía.<br>
        Añade algún producto para continuar.
      </p>
    `;
    return;
  }

  const totalValue = cart.reduce((sum, index) => {
    return sum + parseFloat(
      products[index][1]
        .replace('€', '')
        .replace(',', '.')
        .trim()
    );
  }, 0);

  checkoutContent.innerHTML = `
    <div class="checkout-section">
      <p class="eyebrow">RESUMEN DEL PEDIDO</p>

      ${cart.map(index => `
        <div class="checkout-item">
          <span>${products[index][0]}</span>
          <strong>${products[index][1]}</strong>
        </div>
      `).join('')}

      <div class="checkout-total">
        <span>TOTAL</span>
        <strong>${totalValue.toFixed(2).replace('.', ',')} €</strong>
      </div>
    </div>

    <div class="checkout-section">
      <p class="eyebrow">CLIENTE</p>
      ${
        account
          ? `
            <p class="checkout-customer">
              <strong>${account.name}</strong><br>
              ${account.email}
            </p>
          `
          : `
            <p class="empty">
              No has iniciado sesión.
            </p>
            <button id="checkoutLoginButton" class="button amber" type="button">
              ENTRAR EN AMBER →
            </button>
          `
      }
    </div>

    <button id="continueCheckoutButton" class="button amber checkout-continue" type="button">
      CONTINUAR →
    </button>
  `;

  const loginButton = document.querySelector('#checkoutLoginButton');

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      checkoutPanel.classList.remove('open');
      accountPanel.classList.add('open');
      accountButton.setAttribute('aria-expanded', 'true');
    });
  }

  const continueButton = document.querySelector('#continueCheckoutButton');

  if (continueButton) {
    continueButton.addEventListener('click', () => {
      const currentAccount = getCheckoutAccount();

      if (!currentAccount) {
        showAmberToast('INICIA SESIÓN PARA CONTINUAR');
        checkoutPanel.classList.remove('open');
        accountPanel.classList.add('open');
        accountButton.setAttribute('aria-expanded', 'true');
        return;
      }

      renderShipping();
    });
  }
}

function getShippingData() {
  try {
    return JSON.parse(localStorage.getItem('amber-shipping') || 'null');
  } catch {
    return null;
  }
}

function saveShippingData(data) {
  localStorage.setItem('amber-shipping', JSON.stringify(data));
}

function renderShipping() {
  if (!checkoutContent) return;

  const account = getCheckoutAccount();
  const shipping = getShippingData();

  checkoutContent.innerHTML = `
    <div class="checkout-section">
      <p class="eyebrow">02 / DATOS DE ENVÍO</p>

      <form id="shippingForm" class="shipping-form">

        <label for="shippingName">NOMBRE COMPLETO</label>
        <input
          id="shippingName"
          type="text"
          required
          autocomplete="name"
          value="${shipping?.name || account?.name || ''}"
        >

        <label for="shippingPhone">TELÉFONO</label>
        <input
          id="shippingPhone"
          type="tel"
          required
          autocomplete="tel"
          value="${shipping?.phone || ''}"
        >

        <label for="shippingAddress">DIRECCIÓN</label>
        <input
          id="shippingAddress"
          type="text"
          required
          autocomplete="street-address"
          value="${shipping?.address || ''}"
        >

        <div class="shipping-grid">
          <div>
            <label for="shippingPostal">CÓDIGO POSTAL</label>
            <input
              id="shippingPostal"
              type="text"
              required
              autocomplete="postal-code"
              value="${shipping?.postal || ''}"
            >
          </div>

          <div>
            <label for="shippingCity">CIUDAD</label>
            <input
              id="shippingCity"
              type="text"
              required
              autocomplete="address-level2"
              value="${shipping?.city || ''}"
            >
          </div>
        </div>

        <label for="shippingProvince">PROVINCIA / ISLA</label>
        <input
          id="shippingProvince"
          type="text"
          required
          autocomplete="address-level1"
          value="${shipping?.province || ''}"
        >

        <label for="shippingCountry">PAÍS</label>
        <input
          id="shippingCountry"
          type="text"
          required
          autocomplete="country-name"
          value="${shipping?.country || 'España'}"
        >

        <button class="button amber checkout-continue" type="submit">
          CONTINUAR AL PAGO →
        </button>
      </form>
    </div>
  `;

  const shippingForm = document.querySelector('#shippingForm');

  if (shippingForm) {
    shippingForm.addEventListener('submit', event => {
      event.preventDefault();

      const data = {
        name: document.querySelector('#shippingName').value.trim(),
        phone: document.querySelector('#shippingPhone').value.trim(),
        address: document.querySelector('#shippingAddress').value.trim(),
        postal: document.querySelector('#shippingPostal').value.trim(),
        city: document.querySelector('#shippingCity').value.trim(),
        province: document.querySelector('#shippingProvince').value.trim(),
        country: document.querySelector('#shippingCountry').value.trim()
      };

      if (
        !data.name ||
        !data.phone ||
        !data.address ||
        !data.postal ||
        !data.city ||
        !data.province ||
        !data.country
      ) {
        showAmberToast('COMPLETA TODOS LOS DATOS');
        return;
      }

      saveShippingData(data);
      renderPayment();
    });
  }
}

function renderPayment() {
  if (!checkoutContent) return;

  const account = getCheckoutAccount();
  const shipping = getShippingData();

  const totalValue = cart.reduce((sum, index) => {
    return sum + parseFloat(
      products[index][1]
        .replace('€', '')
        .replace(',', '.')
        .trim()
    );
  }, 0);

  checkoutContent.innerHTML = `
    <div class="checkout-section">
      <p class="eyebrow">03 / PAGO</p>
      <h3 class="payment-title">CONFIRMA TU PEDIDO.</h3>

      <div class="payment-summary">
        ${cart.map(index => `
          <div class="checkout-item">
            <span>${products[index][0]}</span>
            <strong>${products[index][1]}</strong>
          </div>
        `).join('')}

        <div class="checkout-total">
          <span>TOTAL</span>
          <strong>${totalValue.toFixed(2).replace('.', ',')} €</strong>
        </div>
      </div>
    </div>

    <div class="checkout-section">
      <p class="eyebrow">CLIENTE</p>
      <p class="checkout-customer">
        <strong>${account?.name || ''}</strong><br>
        ${account?.email || ''}
      </p>
    </div>

    <div class="checkout-section">
      <p class="eyebrow">ENVÍO</p>
      <p class="checkout-customer">
        ${shipping?.name || ''}<br>
        ${shipping?.address || ''}<br>
        ${shipping?.postal || ''} ${shipping?.city || ''}<br>
        ${shipping?.province || ''}<br>
        ${shipping?.country || ''}
      </p>
    </div>

    <div class="checkout-section payment-method">
      <p class="eyebrow">MÉTODO DE PAGO</p>

      <label class="payment-option">
        <input type="radio" name="paymentMethod" value="card" checked>
        <span>TARJETA</span>
      </label>

      <label class="payment-option">
        <input type="radio" name="paymentMethod" value="paypal">
        <span>PAYPAL</span>
      </label>
    </div>

    <button
      id="confirmPaymentButton"
      class="button amber checkout-continue"
      type="button"
    >
      CONFIRMAR Y PAGAR →
    </button>
  `;

  const confirmPaymentButton =
    document.querySelector('#confirmPaymentButton');

  if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener('click', async () => {
      const selectedPayment = document.querySelector(
        'input[name="paymentMethod"]:checked'
      );

      if (!selectedPayment) {
        showAmberToast('SELECCIONA UN MÉTODO DE PAGO');
        return;
      }

      if (!cart.length) {
        showAmberToast('TU BOLSA ESTÁ VACÍA');
        return;
      }

      const items = cart.reduce((result, index) => {
        const existing = result.find(item => item.id === index);

        if (existing) {
          existing.quantity += 1;
        } else {
          result.push({
            id: index,
            quantity: 1
          });
        }

        return result;
      }, []);

      confirmPaymentButton.disabled = true;
      confirmPaymentButton.textContent = 'CONECTANDO CON STRIPE…';

      try {
        const response = await fetch(
          'http://127.0.0.1:4242/api/create-checkout-session',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items,
              paymentMethod: selectedPayment.value,
              customer: getCheckoutAccount(),
              shipping: getShippingData()
            })
          }
        );

        const result = await response.json();

        if (!response.ok || !result.ok || !result.url) {
          throw new Error(
            result.error || 'No se pudo crear el pago'
          );
        }

        window.location.href = result.url;

      } catch (error) {
        console.error('Error iniciando Stripe Checkout:', error);
        showAmberToast('NO SE PUDO INICIAR EL PAGO');

        confirmPaymentButton.disabled = false;
        confirmPaymentButton.textContent = 'CONFIRMAR Y PAGAR →';
      }
    });
  }
}


if (checkoutButton && checkoutPanel) {
  checkoutButton.addEventListener('click', () => {
    if (!cart.length) {
      showAmberToast('TU BOLSA ESTÁ VACÍA');
      return;
    }

    renderCheckout();
    checkoutPanel.classList.add('open');
    overlay.classList.add('show');
  });
}

if (closeCheckout && checkoutPanel) {
  closeCheckout.addEventListener('click', () => {
    checkoutPanel.classList.remove('open');
    overlay.classList.remove('show');
  });
}

function handleLogin(event) {
  event.preventDefault();

  const name = document.querySelector('#loginName').value.trim();
  const email = document.querySelector('#loginEmail').value.trim();

  if (!name || !email) return;

  saveAmberAccount({
    name,
    email
  });

  renderAccount();
  showAmberToast(`BIENVENIDO/A, ${name}`);
}

function showAmberToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

accountButton.addEventListener('click', () => {
  const isOpen = accountPanel.classList.toggle('open');
  accountButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

closeAccount.addEventListener('click', () => {
  accountPanel.classList.remove('open');
  accountButton.setAttribute('aria-expanded', 'false');
});

renderAccount();
