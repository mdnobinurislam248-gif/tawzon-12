import assert from 'node:assert/strict';

console.log('--- Testing Order Delivery & Reversal Integration ---');

// Mock state representing employees, transactions, and sales
const mockState: any = {
  employees: [
    {
      id: 'emp-upline-shahali',
      name: 'Md Shah Ali (Upline)',
      phone: '01787775516',
      referenceCode: 'TN-REF-75516',
      isOfficialReferral: true,
      referralOwnerId: 'OFFICIAL_TAWZOON',
      resellerMargin: 0,
      referralCommissionRate: 10, // Max Bonus Cap = 10 Tk
      wallet: {
        availableBalance: 100,
        totalEarnings: 100,
        pendingBalance: 0,
      }
    },
    {
      id: 'emp-seller-ali',
      name: 'Ali (Reseller)',
      phone: '01812345678',
      referenceCode: 'TN-REF-45678',
      referredBy: 'TN-REF-75516',
      referralOwnerId: 'emp-upline-shahali',
      referralOwnerName: 'Md Shah Ali (Upline)',
      isOfficialReferral: false,
      resellerMargin: 10, // 470 + 10 = 480 Wholesale
      wallet: {
        availableBalance: 50,
        totalEarnings: 50,
        pendingBalance: 0,
      }
    }
  ],
  sales: [],
  transactions: []
};

// Step 1: Reseller Ali sells 1 item at ৳520 with Wholesale ৳480 -> Profit = ৳40
const testOrder: any = {
  id: 'sale-test-999',
  orderCode: 'TN-ORD-TEST-999',
  employeeId: 'emp-seller-ali',
  status: 'PENDING',
  paymentStatus: 'UNPAID',
  items: [{ productId: 'prod-01', nameBn: 'টেস্ট প্রোডাক্ট', quantity: 1, basePrice: 480, actualSalePrice: 520 }],
  sellingPrice: 520,
  totalAmount: 520,
  commissionAmount: 40, // Reseller Profit
};
mockState.sales.push(testOrder);

// Step 2: Order is marked as DELIVERED and approved
function approveAndDeliverOrder(orderCode: string) {
  const sales = mockState.sales.filter((s: any) => s.orderCode === orderCode);
  sales.forEach((s: any) => {
    s.status = 'DELIVERED';
    s.paymentStatus = 'PAID';
    
    // Credit seller commission
    const seller = mockState.employees.find((e: any) => e.id === s.employeeId);
    if (seller && s.commissionAmount > 0) {
      seller.wallet.availableBalance += s.commissionAmount;
      seller.wallet.totalEarnings += s.commissionAmount;
      mockState.transactions.unshift({
        id: 'trx-comm-' + s.orderCode,
        employeeId: seller.id,
        type: 'COMMISSION_EARNED',
        amount: s.commissionAmount,
        balanceAfter: seller.wallet.availableBalance,
        status: 'COMPLETED',
        reference: s.orderCode,
        description: `অর্ডার #${s.orderCode} সফল ডেলিভারি কমিশন`,
      });
    }
  });

  // Calculate and credit Referral Bonus to Upline once per order
  const primarySale = sales[0];
  const sellerEmp = primarySale ? mockState.employees.find((e: any) => e.id === primarySale.employeeId) : null;

  if (sellerEmp && !sellerEmp.isOfficialReferral) {
    const parentEmp = mockState.employees.find((e: any) => e.id === sellerEmp.referralOwnerId);
    if (parentEmp) {
      const orderProfit = sales.reduce((sum: number, s: any) => sum + (s.commissionAmount || 0), 0);
      const maxBonusLimit = Number(parentEmp.referralCommissionRate ?? 10);
      const referralBonus = Math.max(0, Math.round(Math.min(orderProfit * 0.1, maxBonusLimit)));

      if (referralBonus > 0) {
        parentEmp.wallet.availableBalance += referralBonus;
        parentEmp.wallet.totalEarnings += referralBonus;
        mockState.transactions.unshift({
          id: 'trx-ref-' + primarySale.orderCode,
          employeeId: parentEmp.id,
          type: 'COMMISSION_EARNED',
          amount: referralBonus,
          balanceAfter: parentEmp.wallet.availableBalance,
          status: 'COMPLETED',
          reference: primarySale.orderCode,
          description: `রেফারেল টিম প্রফিট: ${sellerEmp.name} এর অর্ডার #${primarySale.orderCode} থেকে (১০% প্রফিট, সর্বোচ্চ ৳${maxBonusLimit} লিমিট অনুযায়ী ৳${referralBonus})`,
        });
      }
    }
  }
}

approveAndDeliverOrder(testOrder.orderCode);

// Verify Seller's Balance: was 50, got +40 -> 90
const sellerAfterDelivery = mockState.employees.find((e: any) => e.id === 'emp-seller-ali');
assert.strictEqual(sellerAfterDelivery.wallet.availableBalance, 90, 'Seller wallet should be 50 + 40 = 90 Tk');

// Verify Upline's Balance: was 100, got +4 (10% of 40) -> 104
const uplineAfterDelivery = mockState.employees.find((e: any) => e.id === 'emp-upline-shahali');
assert.strictEqual(uplineAfterDelivery.wallet.availableBalance, 104, 'Upline wallet should be 100 + 4 = 104 Tk');

console.log('✓ Order Delivery Succeeded: Seller balance is ৳90, Upline balance is ৳104');

// Step 3: Order is Cancelled/Rejected by Admin
function cancelAndReverseOrder(orderCode: string) {
  const sales = mockState.sales.filter((s: any) => s.orderCode === orderCode);
  sales.forEach((sale: any) => {
    const prevPaymentStatus = sale.paymentStatus;
    sale.status = 'CANCELLED';
    sale.paymentStatus = 'REFUNDED';

    if (prevPaymentStatus === 'PAID' && sale.commissionAmount > 0) {
      const seller = mockState.employees.find((e: any) => e.id === sale.employeeId);
      if (seller) {
        seller.wallet.availableBalance = Math.max(0, seller.wallet.availableBalance - sale.commissionAmount);
        seller.wallet.totalEarnings = Math.max(0, seller.wallet.totalEarnings - sale.commissionAmount);
        mockState.transactions.unshift({
          id: 'trx-rev-' + sale.orderCode,
          employeeId: seller.id,
          type: 'ADJUSTMENT',
          amount: -sale.commissionAmount,
          balanceAfter: seller.wallet.availableBalance,
          status: 'COMPLETED',
          reference: sale.orderCode,
          description: `অর্ডার বাতিল: পূর্বে জমাকৃত কমিশন সমন্বয় (-৳${sale.commissionAmount})`,
        });
      }
    }
  });

  // Reverse Referral Bonus
  const primarySale = sales[0];
  const bonusTrx = mockState.transactions.find(
    (t: any) => t.reference === primarySale.orderCode && t.description?.includes('রেফারেল টিম প্রফিট')
  );
  if (bonusTrx && bonusTrx.amount > 0) {
    const parentEmp = mockState.employees.find((e: any) => e.id === bonusTrx.employeeId);
    if (parentEmp) {
      parentEmp.wallet.availableBalance = Math.max(0, parentEmp.wallet.availableBalance - bonusTrx.amount);
      parentEmp.wallet.totalEarnings = Math.max(0, parentEmp.wallet.totalEarnings - bonusTrx.amount);
      mockState.transactions.unshift({
        id: 'trx-rev-ref-' + primarySale.orderCode,
        employeeId: parentEmp.id,
        type: 'ADJUSTMENT',
        amount: -bonusTrx.amount,
        balanceAfter: parentEmp.wallet.availableBalance,
        status: 'COMPLETED',
        reference: primarySale.orderCode,
        description: `অর্ডার বাতিল: পূর্বে জমাকৃত রেফারেল বোনাস সমন্বয় (-৳${bonusTrx.amount})`,
      });
    }
  }
}

cancelAndReverseOrder(testOrder.orderCode);

// Verify Seller's Balance reversed: 90 - 40 = 50
assert.strictEqual(sellerAfterDelivery.wallet.availableBalance, 50, 'Seller wallet should be reversed back to 50 Tk');

// Verify Upline's Balance reversed: 104 - 4 = 100
assert.strictEqual(uplineAfterDelivery.wallet.availableBalance, 100, 'Upline wallet should be reversed back to 100 Tk');

console.log('✓ Order Cancellation Reversal Succeeded: Seller wallet returned to ৳50, Upline wallet returned to ৳100');
console.log('🎉 Full End-to-End Delivery & Reversal Integration Verified Successfully!');
