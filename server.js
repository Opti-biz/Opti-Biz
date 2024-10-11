require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const app = express();

// Middleware for HTTPS redirection, but only in production
app.use((req, res, next) => {
  // Enforce HTTPS only in production and skip localhost
  if (process.env.NODE_ENV === 'production' && req.hostname !== 'localhost') {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect('https://' + req.get('Host') + req.url);
    }

    // Redirect non-www to www in production
    if (req.hostname === 'optibiz.agency') {
      return res.redirect(301, 'https://www.optibiz.agency' + req.originalUrl);
    }
  }

  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use(cors());
app.use(express.json());

// Stripe product prices
const itemPrices = new Map([
  [1, { priceInCents: 14900, name: "Course (Templates)" }],
  [2, { priceInCents: 59900, name: "Website Development (No payment Gateway)" }],
  [3, { priceInCents: 114900, name: "Website Development (Payment Gateway)" }],
  [4, { priceInCents: 124900, name: "Marketing Strategy" }],
  [5, { priceInCents: 1000, name: "Service Request" }],
  [6, { priceInCents: 9900, name: "Deposit" }],
]);

// Validate Stripe cart items
const validateItems = (req, res, next) => {
  if (!req.body.items || !Array.isArray(req.body.items)) {
    return res.status(400).json({ error: "Invalid items" });
  }

  for (const item of req.body.items) {
    if (!item.id || !item.quantity) {
      return res.status(400).json({ error: "Invalid item structure" });
    }

    const itemPrice = itemPrices.get(item.id);
    if (!itemPrice) {
      return res.status(400).json({ error: `Invalid item ID: ${item.id}` });
    }

    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
  }

  next();
};

// Stripe checkout session creation
app.post("/create-checkout-session", validateItems, async (req, res) => {
  try {
    const lineItems = req.body.items.map((item) => {
      const itemPrice = itemPrices.get(item.id);
      return {
        price_data: {
          currency: "gbp",
          product_data: { name: itemPrice.name },
          unit_amount: itemPrice.priceInCents,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/cancel.html`,
    });

    res.json({ id: session.id });
  } catch (e) {
    console.error("Error creating session:", e);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Function to create Nodemailer transporter
const createTransporter = () => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.elasticemail.com',
    port: 2525,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("Transporter verification error:", error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  return transporter;
};

// POST route to handle form submission
app.post('/send-email', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Please fill out all the fields." });
  }

  const transporter = createTransporter();

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVING_EMAIL,
    subject: "New Contact Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
});

// Test route to confirm server is working
app.get("/test", (req, res) => {
  res.send("Server is working!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});