const express = require('express');
const router = express.Router();
const { writeToBuffer } = require('../services/buffer.service');
const {
    getWalletBalance,
    spend,
    topup,
    bonus
} = require('../services/wallet.service');

/**
 * GET /wallet/:walletId/balance
 */
router.get('/:walletId/balance', async (req, res) => {
    try {
        const { walletId } = req.params;
        const balance = await getWalletBalance(walletId);

        res.json({
            walletId,
            balance
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

/**
 * POST /wallet/spend
 * Body:
 * {
 *   userWalletId,
 *   treasuryWalletId,
 *   amount
 * }
 * 
 */router.post('/spend', async (req, res) => {
    try {
        const result = await spend(req.body);
        res.json(result);
    } catch (err) {
        if (process.env.ENABLE_BUFFER_MODE === 'true') {
            writeToBuffer({
                action: 'SPEND',
                transactionId: Date.now().toString(),
                ...req.body
            });

            return res.status(202).json({ status: 'BUFFERED' });
        }

        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /wallet/bonus
 */
router.post('/bonus', async (req, res) => {
    try {
        const { userWalletId, treasuryWalletId, amount } = req.body;

        const result = await bonus({
            userWalletId,
            treasuryWalletId,
            amount
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /wallet/topup
 * Used internally after Razorpay confirmation
 */
router.post('/topup', async (req, res) => {
    try {
        const { userWalletId, treasuryWalletId, amount, transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ error: 'transactionId required' });
        }

        const result = await topup({
            userWalletId,
            treasuryWalletId,
            amount,
            transactionId
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
