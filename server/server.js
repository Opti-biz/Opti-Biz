require('dotenv').config()

const express= require('express')
const app = express

app.use(express.json())

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

const itemPrices = new Map([
    [1, {priceInCents: 14900, name: "Course (Templates)" }],
    [2, {priceInCents: 79900, name: "Website Development (No payment Gateway)" }],
    [3, {priceInCents: 99900, name: "Website Development (Payment Gateway)" }],
    [4, {priceInCents: 99900, name: "Marketing Strategy" }],
    [5, {priceInCents: 99900, name: "SEO Services" }],

])


app.listen(3000)