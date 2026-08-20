const http = require('http');
const Stripe = require('stripe');

const PORT = 4242;

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: falta STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    id: 0,
    name: 'HOODIE ADVERSIDAD',
    price: 8900
  },
  {
    id: 1,
    name: 'CAMISETA SIN LÍMITES',
    price: 4200
  },
  {
    id: 2,
    name: 'GORRA DROP 01',
    price: 3500
  }
];

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8'
  });

  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 100000) {
        reject(new Error('Request too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'amber-payment-server',
      stripe: true
    });
    return;
  }


  if (req.method === 'GET' && req.url.startsWith('/api/verify-payment')) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const sessionId = url.searchParams.get('session_id');

      if (!sessionId) {
        sendJson(res, 400, {
          ok: false,
          error: 'Falta session_id'
        });
        return;
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      sendJson(res, 200, {
        ok: true,
        paid: session.payment_status === 'paid',
        status: session.status,
        sessionId: session.id
      });

    } catch (error) {
      console.error('Stripe verification error:', error.message);

      sendJson(res, 500, {
        ok: false,
        error: error.message
      });
    }

    return;
  }

  if (req.method === 'POST' && req.url === '/api/create-checkout-session') {
    try {
      const body = await readBody(req);

      if (!Array.isArray(body.items) || body.items.length === 0) {
        sendJson(res, 400, {
          ok: false,
          error: 'El carrito está vacío'
        });
        return;
      }

      const lineItems = body.items.map(item => {
        const product = products.find(
          product => product.id === Number(item.id)
        );

        if (!product) {
          throw new Error('Producto no válido');
        }

        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.name
            },
            unit_amount: product.price
          },
          quantity: Number(item.quantity) || 1
        };
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        success_url:
          'http://localhost:5173/?payment=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url:
          'http://localhost:5173/?payment=cancelled'
      });

      sendJson(res, 200, {
        ok: true,
        url: session.url
      });

    } catch (error) {
      console.error('Stripe Checkout error:', error.message);

      sendJson(res, 500, {
        ok: false,
        error: error.message
      });
    }

    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: 'Not found'
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `AMBER payment server running on http://0.0.0.0:${PORT}`
  );
});
