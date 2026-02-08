const supabase = require('../src/config/supabase');
const razorpay = require('../src/config/razorpay');

describe('External Services Integration', () => {

  /* =========================
     SUPABASE INTEGRATION
  ========================= */
  describe('Supabase', () => {
    test('connects to Supabase and reads assets table', async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('code');
    });

    test('can insert and delete a test transaction row', async () => {
      const txId = `integration_test_tx_${Date.now()}`;

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          status: 'PENDING'
        });

      expect(insertError).toBeNull();

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txId);

      expect(deleteError).toBeNull();
    });
  });

  /* =========================
     RAZORPAY INTEGRATION
  ========================= */
  describe('Razorpay (Test Mode)', () => {
    test('creates a Razorpay test order successfully', async () => {
      const order = await razorpay.orders.create({
        amount: 100 * 100, // ₹100 in paise
        currency: 'INR',
        receipt: `test_receipt_${Date.now()}`
      });

      expect(order).toHaveProperty('id');
      expect(order.amount).toBe(10000);
      expect(order.currency).toBe('INR');
      expect(order.status).toBe('created');
    });
  });

});
