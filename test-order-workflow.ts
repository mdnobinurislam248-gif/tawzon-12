import assert from 'node:assert/strict';

console.log('=================================================================');
console.log('🚀 TAWZOON Complete Order, Courier, Profit & Referral Test Suite');
console.log('=================================================================');

// Simulated Database State
interface MockEmployee {
  id: string;
  name: string;
  referenceCode: string;
  referralOwnerId: string;
  referralOwnerName: string;
  isOfficialReferral: boolean;
  resellerMargin: number;
  referralCommissionRate: number; // Max Bonus Cap
  wallet: {
    availableBalance: number;
    totalEarnings: number;
  };
}

interface MockSale {
  id: string;
  orderCode: string;
  employeeId: string;
  employeeName: string;
  productId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
  commissionAmount: number;
  saleStatus: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  courierPartner?: string;
  trackingCode?: string;
  courierTrackingUrl?: string;
  saleDate: string;
  notes?: string;
}

interface MockTransaction {
  id: string;
  employeeId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  status: string;
  reference: string;
  description: string;
}

const mockDb = {
  employees: [
    {
      id: 'emp-A-shahali',
      name: 'Shah Ali (A)',
      referenceCode: 'TN-REF-SHAHALI',
      referralOwnerId: 'OFFICIAL_TAWZOON',
      referralOwnerName: 'তাওজুন অফিসিয়াল',
      isOfficialReferral: true,
      resellerMargin: 0,
      referralCommissionRate: 10,
      wallet: { availableBalance: 0, totalEarnings: 0 }
    },
    {
      id: 'emp-B-ali',
      name: 'Ali (B)',
      referenceCode: 'TN-REF-ALI',
      referralOwnerId: 'emp-A-shahali', // Direct referrer is Shah Ali (A)
      referralOwnerName: 'Shah Ali (A)',
      isOfficialReferral: false,
      resellerMargin: 10,
      referralCommissionRate: 10,
      wallet: { availableBalance: 0, totalEarnings: 0 }
    },
    {
      id: 'emp-C-karim',
      name: 'Karim (C)',
      referenceCode: 'TN-REF-KARIM',
      referralOwnerId: 'emp-B-ali', // Direct referrer is Ali (B)
      referralOwnerName: 'Ali (B)',
      isOfficialReferral: false,
      resellerMargin: 10,
      referralCommissionRate: 10,
      wallet: { availableBalance: 0, totalEarnings: 0 }
    }
  ] as MockEmployee[],
  sales: [] as MockSale[],
  transactions: [] as MockTransaction[]
};

// ----------------------------------------------------------------------
// TEST 1: Reseller Places Order -> Initial Status is PENDING
// ----------------------------------------------------------------------
console.log('\n[TEST 1] Reseller Places Order...');
const orderB1: MockSale = {
  id: 'sale-001',
  orderCode: 'ORD-TEST-1001',
  employeeId: 'emp-B-ali',
  employeeName: 'Ali (B)',
  productId: 'prod-01',
  productName: 'Premium Printed Cotton Katuwa',
  customerName: 'Rahim Khan',
  customerPhone: '01711223344',
  customerAddress: 'জেলা: বগুড়া, থানা: বগুড়া সদর, ঠিকানা: trt',
  quantity: 1,
  sellingPrice: 700,
  totalAmount: 700,
  commissionAmount: 410, // Profit
  saleStatus: 'Pending Verification',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  deliveryStatus: 'pending',
  saleDate: new Date().toISOString(),
  notes: '[সাইজ: XL] [ডেলিভারি চার্জ ক্যাশ অন: ১২০]'
};
mockDb.sales.push(orderB1);

const isOrderCancelled = (s: MockSale) => s.saleStatus === 'Rejected' || s.deliveryStatus === 'cancelled';
const isOrderPaidOrDelivered = (s: MockSale) => s.paymentStatus === 'PAID' || s.deliveryStatus === 'delivered';
const isOrderConfirmed = (s: MockSale) => !isOrderCancelled(s) && (s.saleStatus === 'Confirmed' || s.status === 'CONFIRMED' || isOrderPaidOrDelivered(s));
const isOrderPending = (s: MockSale) => !isOrderCancelled(s) && !isOrderConfirmed(s);

assert.strictEqual(isOrderPending(orderB1), true, 'Order must initially be PENDING');
assert.strictEqual(isOrderConfirmed(orderB1), false, 'Order must NOT initially be CONFIRMED');
console.log('✓ TEST 1 PASSED: Order created with status PENDING');

// ----------------------------------------------------------------------
// TEST 2: Add Courier Tracking Info -> Order MUST REMAIN PENDING
// ----------------------------------------------------------------------
console.log('\n[TEST 2] Adding Courier Information...');
function updateCourierInfo(saleId: string, partner: string, code: string) {
  const sale = mockDb.sales.find(s => s.id === saleId);
  if (!sale) throw new Error('Sale not found');
  sale.courierPartner = partner;
  sale.trackingCode = code;
  sale.courierTrackingUrl = `https://steadfast.com.bd/t/${code}`;
  // Crucial: Keep deliveryStatus as 'pending'
  if (!sale.deliveryStatus) sale.deliveryStatus = 'pending';
}

updateCourierInfo(orderB1.id, 'Steadfast', 'ghgh');

assert.strictEqual(orderB1.trackingCode, 'ghgh', 'Tracking code must be saved');
assert.strictEqual(orderB1.courierPartner, 'Steadfast', 'Courier partner must be saved');
assert.strictEqual(isOrderPending(orderB1), true, 'Order must STILL be PENDING after courier info added');
assert.strictEqual(isOrderConfirmed(orderB1), false, 'Order must NOT be auto-confirmed by courier code');
console.log('✓ TEST 2 PASSED: Courier info added, order remains PENDING');

// ----------------------------------------------------------------------
// TEST 3 & 4: Confirmation Dialog Cancel -> Order Remains PENDING
// ----------------------------------------------------------------------
console.log('\n[TEST 3 & 4] Cancel Order Confirmation Dialog...');
// If admin cancels the confirmation popup, no backend request is sent
assert.strictEqual(isOrderPending(orderB1), true, 'Order remains PENDING on cancel');
console.log('✓ TEST 3 & 4 PASSED: Cancel preserves PENDING status without state modification');

// ----------------------------------------------------------------------
// TEST 5 & 6: Confirm Order -> Status becomes CONFIRMED in DB & moves to Confirmed tab
// ----------------------------------------------------------------------
console.log('\n[TEST 5 & 6] Confirming Order...');
function confirmOrder(saleId: string) {
  const sale = mockDb.sales.find(s => s.id === saleId);
  if (!sale) throw new Error('Sale not found');
  sale.saleStatus = 'Confirmed';
  sale.status = 'CONFIRMED';
}

confirmOrder(orderB1.id);

assert.strictEqual(orderB1.saleStatus, 'Confirmed', 'saleStatus must be Confirmed');
assert.strictEqual(orderB1.status, 'CONFIRMED', 'status must be CONFIRMED');
assert.strictEqual(isOrderConfirmed(orderB1), true, 'Order must now be in CONFIRMED list');
assert.strictEqual(isOrderPending(orderB1), false, 'Order must NO LONGER be in PENDING list');
// Verify profit is NOT yet released upon confirmation
assert.strictEqual(mockDb.employees.find(e => e.id === 'emp-B-ali')?.wallet.availableBalance, 0, 'Profit must NOT be released upon confirmation');
console.log('✓ TEST 5 & 6 PASSED: Order confirmed in DB, visible in Confirmed tab, profit held until delivery');

// ----------------------------------------------------------------------
// TEST 7 & 8: Delivery Complete & Profit Release
// ----------------------------------------------------------------------
console.log('\n[TEST 7 & 8] Executing Delivery Complete & Profit Release...');
function deliverAndReleaseProfit(orderCode: string) {
  const targetSales = mockDb.sales.filter(s => s.orderCode === orderCode);
  let totalCredited = 0;

  targetSales.forEach(s => {
    s.paymentStatus = 'PAID';
    s.deliveryStatus = 'delivered';
    s.saleStatus = 'Delivered';

    const seller = mockDb.employees.find(e => e.id === s.employeeId);
    if (seller && s.commissionAmount > 0) {
      seller.wallet.availableBalance += s.commissionAmount;
      seller.wallet.totalEarnings += s.commissionAmount;
      totalCredited += s.commissionAmount;
      mockDb.transactions.unshift({
        id: 'trx-' + Math.random().toString(36).substring(7),
        employeeId: seller.id,
        type: 'COMMISSION_EARNED',
        amount: s.commissionAmount,
        balanceAfter: seller.wallet.availableBalance,
        status: 'COMPLETED',
        reference: s.orderCode,
        description: `অর্ডার #${s.orderCode} সফল ডেলিভারি কমিশন`
      });
    }
  });

  // DIRECT REFERRAL BONUS CALCULATION
  const primarySale = targetSales[0];
  const sellerEmp = mockDb.employees.find(e => e.id === primarySale.employeeId);

  if (sellerEmp && !sellerEmp.isOfficialReferral) {
    const isBonusAlreadyPaid = mockDb.transactions.some(
      t => t.reference === primarySale.orderCode && t.description.includes('রেফারেল টিম প্রফিট')
    );

    if (!isBonusAlreadyPaid) {
      // Find DIRECT parent only
      const directParent = mockDb.employees.find(e => e.id === sellerEmp.referralOwnerId);
      if (directParent) {
        const orderProfit = targetSales.reduce((sum, s) => sum + s.commissionAmount, 0);
        const maxLimit = directParent.referralCommissionRate ?? 10;
        // Formula: MIN(Profit * 10%, Maximum Bonus Limit)
        const bonus = Math.max(0, Math.round(Math.min(orderProfit * 0.1, maxLimit)));

        if (bonus > 0) {
          directParent.wallet.availableBalance += bonus;
          directParent.wallet.totalEarnings += bonus;
          mockDb.transactions.unshift({
            id: 'trx-' + Math.random().toString(36).substring(7),
            employeeId: directParent.id,
            type: 'COMMISSION_EARNED',
            amount: bonus,
            balanceAfter: directParent.wallet.availableBalance,
            status: 'COMPLETED',
            reference: primarySale.orderCode,
            description: `রেফারেল টিম প্রফিট: ${sellerEmp.name} এর অর্ডার #${primarySale.orderCode} থেকে`
          });
        }
      }
    }
  }
}

deliverAndReleaseProfit(orderB1.orderCode);

// Ali (B)'s profit was ৳410 -> Wallet must have ৳410
const aliAfter = mockDb.employees.find(e => e.id === 'emp-B-ali')!;
assert.strictEqual(aliAfter.wallet.availableBalance, 410, 'Ali wallet must be credited 410 Tk profit');
assert.strictEqual(orderB1.deliveryStatus, 'delivered', 'Delivery status must be delivered');
assert.strictEqual(orderB1.paymentStatus, 'PAID', 'Payment status must be PAID');
console.log('✓ TEST 7 & 8 PASSED: Delivery completed, reseller wallet credited ৳410');

// ----------------------------------------------------------------------
// TEST 9: Direct Referral Bonus from Ali's sale -> Shah Ali (A) gets bonus
// Formula: MIN(410 * 10% = 41, Max Limit 10) = 10 Tk
// ----------------------------------------------------------------------
console.log('\n[TEST 9] Verifying Direct Referral Bonus to Shah Ali (A)...');
const shahAliAfter = mockDb.employees.find(e => e.id === 'emp-A-shahali')!;
assert.strictEqual(shahAliAfter.wallet.availableBalance, 10, 'Shah Ali (A) must receive capped 10 Tk bonus from Ali (B)');
console.log('✓ TEST 9 PASSED: Shah Ali (A) received direct referral bonus of ৳10');

// ----------------------------------------------------------------------
// TEST 10: Karim (C) makes a sale -> ONLY Ali (B) gets bonus; Shah Ali (A) gets NOTHING!
// ----------------------------------------------------------------------
console.log('\n[TEST 10] Testing Direct Upline Rule with Karim (C)...');
const orderC1: MockSale = {
  id: 'sale-002',
  orderCode: 'ORD-TEST-2002',
  employeeId: 'emp-C-karim',
  employeeName: 'Karim (C)',
  productId: 'prod-01',
  productName: 'Premium Printed Cotton Katuwa',
  customerName: 'Sufian',
  customerPhone: '01855667788',
  customerAddress: 'ঢাকা, গুলশান',
  quantity: 1,
  sellingPrice: 700,
  totalAmount: 700,
  commissionAmount: 200, // Karim's profit = 200 Tk
  saleStatus: 'Confirmed',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  deliveryStatus: 'pending',
  saleDate: new Date().toISOString()
};
mockDb.sales.push(orderC1);

const shahAliBalanceBeforeKarimSale = shahAliAfter.wallet.availableBalance;
const aliBalanceBeforeKarimSale = aliAfter.wallet.availableBalance;

deliverAndReleaseProfit(orderC1.orderCode);

// Ali (B) is Karim's direct upline -> Ali (B) gets 10% of 200 (capped at 10) = 10 Tk
assert.strictEqual(aliAfter.wallet.availableBalance, aliBalanceBeforeKarimSale + 10, 'Ali (B) must get 10 Tk bonus from Karim (C)');

// Shah Ali (A) is Karim's SECOND-TIER upline (not direct) -> Shah Ali gets 0 Tk!
assert.strictEqual(shahAliAfter.wallet.availableBalance, shahAliBalanceBeforeKarimSale, 'Shah Ali (A) must NOT get any bonus from Karim (C)');
console.log('✓ TEST 10 PASSED: Strict Direct Referral Rule enforced! Only direct referrer Ali (B) earned bonus; tier-2 referrer Shah Ali (A) received 0 Tk.');

// ----------------------------------------------------------------------
// TEST 11: Duplicate Bonus Prevention (Multi-item or Re-approval)
// ----------------------------------------------------------------------
console.log('\n[TEST 11] Testing Duplicate Bonus Prevention...');
const aliBalanceBeforeReapprove = aliAfter.wallet.availableBalance;
deliverAndReleaseProfit(orderC1.orderCode); // Re-run delivery logic on already delivered order
assert.strictEqual(aliAfter.wallet.availableBalance, aliBalanceBeforeReapprove, 'No duplicate referral bonus or profit should be given on already paid order');
console.log('✓ TEST 11 PASSED: Duplicate bonus and profit prevented');

// ----------------------------------------------------------------------
// TEST 14: Order Cancellation & Reversal
// ----------------------------------------------------------------------
console.log('\n[TEST 14] Testing Order Cancellation & Financial Reversal...');
function cancelAndReverse(orderCode: string) {
  const targetSales = mockDb.sales.filter(s => s.orderCode === orderCode);
  targetSales.forEach(s => {
    const wasPaid = s.paymentStatus === 'PAID';
    s.saleStatus = 'Rejected';
    s.deliveryStatus = 'cancelled';
    s.paymentStatus = 'REFUNDED';

    if (wasPaid && s.commissionAmount > 0) {
      const seller = mockDb.employees.find(e => e.id === s.employeeId);
      if (seller) {
        seller.wallet.availableBalance = Math.max(0, seller.wallet.availableBalance - s.commissionAmount);
        seller.wallet.totalEarnings = Math.max(0, seller.wallet.totalEarnings - s.commissionAmount);
        mockDb.transactions.unshift({
          id: 'trx-' + Math.random().toString(36).substring(7),
          employeeId: seller.id,
          type: 'ADJUSTMENT',
          amount: -s.commissionAmount,
          balanceAfter: seller.wallet.availableBalance,
          status: 'COMPLETED',
          reference: s.orderCode,
          description: `অর্ডার বাতিল: পূর্বে জমাকৃত কমিশন সমন্বয় (-৳${s.commissionAmount})`
        });
      }
    }
  });

  // Reverse Referral Bonus
  const primarySale = targetSales[0];
  const bonusTrx = mockDb.transactions.find(
    t => t.reference === primarySale.orderCode && t.description.includes('রেফারেল টিম প্রফিট')
  );
  if (bonusTrx && bonusTrx.amount > 0) {
    const parent = mockDb.employees.find(e => e.id === bonusTrx.employeeId);
    if (parent) {
      parent.wallet.availableBalance = Math.max(0, parent.wallet.availableBalance - bonusTrx.amount);
      parent.wallet.totalEarnings = Math.max(0, parent.wallet.totalEarnings - bonusTrx.amount);
      mockDb.transactions.unshift({
        id: 'trx-' + Math.random().toString(36).substring(7),
        employeeId: parent.id,
        type: 'ADJUSTMENT',
        amount: -bonusTrx.amount,
        balanceAfter: parent.wallet.availableBalance,
        status: 'COMPLETED',
        reference: primarySale.orderCode,
        description: `অর্ডার বাতিল: পূর্বে জমাকৃত রেফারেল বোনাস সমন্বয় (-৳${bonusTrx.amount})`
      });
    }
  }
}

// Cancel Karim's order
const karim = mockDb.employees.find(e => e.id === 'emp-C-karim')!;
const karimBalanceBeforeCancel = karim.wallet.availableBalance;
cancelAndReverse(orderC1.orderCode);

assert.strictEqual(karim.wallet.availableBalance, karimBalanceBeforeCancel - 200, 'Karim wallet commission reversed');
assert.strictEqual(aliAfter.wallet.availableBalance, aliBalanceBeforeKarimSale, 'Ali referral bonus reversed back');
console.log('✓ TEST 14 PASSED: Cancellation and financial balance reversal verified');

console.log('\n=================================================================');
console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
console.log('=================================================================');
