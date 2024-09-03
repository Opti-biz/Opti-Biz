require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const app = express();

// Serve static files from the 'OPTIBIZTESTER' directory
app.use(express.static(path.join(__dirname, '..')));

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://optibiz.agency',
}));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Item prices map
const itemPrices = new Map([
  [1, { priceInCents: 14900, name: 'Course (Templates)' }],
  [2, { priceInCents: 99900, name: 'Website Development (No payment Gateway)' }],
  [3, { priceInCents: 199900, name: 'Website Development (Payment Gateway)' }],
  [4, { priceInCents: 199900, name: 'Marketing Strategy' }],
  [5, { priceInCents: 199900, name: 'SEO Services' }],
]);

// Middleware to validate items
const validateItems = (req, res, next) => {
  if (!req.body.items || !Array.isArray(req.body.items)) {
    return res.status(400).json({ error: 'Invalid items' });
  }

  for (const item of req.body.items) {
    const itemPrice = itemPrices.get(item.id);
    if (!item.id || !item.quantity || !itemPrice || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return res.status(400).json({ error: `Invalid item structure or ID: ${item.id}` });
    }
  }
  
  next();
};

// Route to create a Stripe checkout session
app.post('/create-checkout-session', validateItems, async (req, res) => {
  try {
    const lineItems = req.body.items.map(item => {
      const itemPrice = itemPrices.get(item.id);
      return {
        price_data: {
          currency: 'gbp',
          product_data: { name: itemPrice.name },
          unit_amount: itemPrice.priceInCents,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/cancel.html`,
    });

    res.json({ id: session.id });
  } catch (e) {
    console.error('Error creating session:', e);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Test route to confirm server is running
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
