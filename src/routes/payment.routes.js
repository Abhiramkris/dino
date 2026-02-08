const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const razorpay = require('../config/razorpay');
const { topup } = require('../services/wallet.service');

/**
 * POST /payment/create-order
 * Creates Razorpay order
 */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, userWalletId, treasuryWalletId } = req.body;

        // 1️⃣ Validate
        const rupees = Number(amount);
        if (!rupees || rupees <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // 2️⃣ Convert ONCE (₹ → paise)
        const paise = rupees * 100;

        // 3️⃣ Create order
        const order = await razorpay.orders.create({
            amount: paise,           // ← THIS is the only place paise is used
            currency: 'INR',
            receipt: `dinogems_${Date.now()}`,
            notes: {
                rupees: String(rupees),
                userWalletId,
                treasuryWalletId
            }
        });

        // 🔍 DEBUG LOG (TEMPORARY)
        console.log('ORDER CREATED:', {
            rupees,
            paise,
            razorpayAmount: order.amount
        });

        res.json(order);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});



/**
 * POST /payment/verify
 * Body:
 * {
 *   paymentId,
 *   userWalletId,
 *   treasuryWalletId,
 *   amount
 * }
 */
router.post('/verify', async (req, res) => {
    try {
        const { paymentId, userWalletId, treasuryWalletId, amount } = req.body;

        if (!paymentId || !amount) {
            return res.status(400).json({ error: 'Missing paymentId or amount' });
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(paymentId);

        // 1️⃣ Verify payment status
        if (payment.status !== 'captured') {
            return res.status(400).json({
                error: 'Payment not captured',
                status: payment.status
            });
        }

        // 2️⃣ Verify amount (paise → rupees)
        const paidAmount = payment.amount / 100;
        if (paidAmount !== Number(amount)) {
            return res.status(400).json({ error: 'Amount mismatch' });
        }

        // 3️⃣ Credit wallet (idempotent)
        await topup({
            userWalletId,
            treasuryWalletId,
            amount: Number(amount),          // rupees
            transactionId: payment.id        // VERY IMPORTANT
        });

        res.json({ status: 'SUCCESS' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
