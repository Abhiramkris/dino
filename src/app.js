require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

/* =====================
   BODY PARSERS
===================== */

// JSON parser for normal routes
app.use(express.json());

// URL encoded (optional)
app.use(express.urlencoded({ extended: true }));

/* =====================
   VIEW ENGINE
===================== */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* =====================
   ROUTES
===================== */

const walletRoutes = require('./routes/wallet.routes');
const paymentRoutes = require('./routes/payment.routes');

app.use('/wallet', walletRoutes);
app.use('/payment', paymentRoutes);

/* =====================
   UI
===================== */

app.get('/', (req, res) => {
    res.render('overlay', {
        userWalletId: process.env.TEST_USER_WALLET_ID,
        treasuryWalletId: process.env.TEST_TREASURY_WALLET_ID,
        razorpayKey: process.env.RAZORPAY_KEY_ID
    });
});

/* =====================
   ERROR HANDLER
===================== */

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
