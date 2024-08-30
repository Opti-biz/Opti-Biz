require("dotenv").config();

const express = require("express");
const app = express();  // Correct instance creation
app.use(express.json());

// Example of serving static files from the root
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const itemPrices = new Map([
  [1, { priceInCents: 14900, name: "Course (Templates)" }],
  [2, { priceInCents: 99900, name: "Website Development (No payment Gateway)" }],
  [3, { priceInCents: 199900, name: "Website Development (Payment Gateway)" }],
  [4, { priceInCents: 199900, name: "Marketing Strategy" }],
  [5, { priceInCents: 199900, name: "SEO Services" }],
]);

// Input validation middleware
const validateItems = (req, res, next) => {
  console.log("Validating items:", req.body.items);  // Logging the received items

  if (!req.body.items || !Array.isArray(req.body.items)) {
    return res.status(400).json({ error: "Invalid items" });
  }

  for (const item of req.body.items) {
    console.log("Validating item:", item);  // Logging each item
    if (!item.id || !item.quantity) {
      return res.status(400).json({ error: "Invalid item structure" });
    }

    const itemPrice = itemPrices.get(item.id);
    console.log("Item price found:", itemPrice);  // Logging the item price fetched
    if (!itemPrice) {
      return res.status(400).json({ error: `Invalid item ID: ${item.id}` });
    }

    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
  }

  console.log("Validation successful");
  next();
};

app.post("/create-checkout-session", validateItems, async (req, res) => {
  try {
    console.log("Received request to create a checkout session", req.body.items);

    const lineItems = req.body.items.map((item) => {
      const itemPrice = itemPrices.get(item.id);

      if (!itemPrice) {
        console.error(`Item with ID ${item.id} not found`);
        throw new Error(`Item with ID ${item.id} not found`);
      }

      console.log(`Creating line item for ${itemPrice.name}:`, {
        price_data: {
          currency: "gbp",
          product_data: { name: itemPrice.name },
          unit_amount: itemPrice.priceInCents,
        },
        quantity: item.quantity,
      });

      return {
        price_data: {
          currency: "gbp",
          product_data: { name: itemPrice.name },
          unit_amount: itemPrice.priceInCents,
        },
        quantity: item.quantity,
      };
    });

    console.log("Line items created:", lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/cancel.html`,
    });

    console.log("Session created successfully:", session.id);

    // Return only the session ID in the response
    res.json({ id: session.id });
  } catch (e) {
    console.error("Error creating session:", e);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
