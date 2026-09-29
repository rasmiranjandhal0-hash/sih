// Checkout & Split-Payment Calculation Engine

/**
 * Calculate the platform commission and seller payout for an order
 * @param {Array<Object>} orderItems - Array of order items with variantId, quantity, and unitPrice (or we can fetch variant details)
 * @param {String} sellerId - The seller ID
 * @param {Object} prisma - Prisma client instance (to fetch seller and variant details)
 * @returns {Promise<Object>} Breakdown of amounts
 */
const calculateSplitPayment = async (orderItems, sellerId, prisma) => {
  // Fetch seller profile to get commission rate override
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: sellerId }, // Assuming sellerId is the userId in SellerProfile
    select: { commissionRateOverride: true, id: true },
  });

  // Platform default commission rate (can be configurable per category, but we'll use a default or from settings)
  const PLATFORM_DEFAULT_COMMISSION_RATE = 0.10; // 10% default

  // Determine the commission rate for this seller
  const commissionRate = seller?.commissionRateOverride ?? PLATFORM_DEFAULT_COMMISSION_RATE;

  // Calculate total amount from order items
  let totalAmount = 0;
  for (const item of orderItems) {
    // We assume item has quantity and unitPrice (price at time of purchase)
    totalAmount += item.quantity * item.unitPrice;
  }

  // Calculate platform commission and seller payout
  const platformCommission = totalAmount * commissionRate;
  const sellerPayout = totalAmount - platformCommission;

  return {
    totalAmount,
    platformCommission,
    sellerPayout,
    commissionRateApplied: commissionRate,
    sellerId: seller?.id,
  };
};

/**
 * Calculate commission for a single product variant (for display or validation)
 * @param {Float} price - Price of the variant
 * @param {Int} quantity - Quantity purchased
 * @param {Float} commissionRate - Commission rate (e.g., 0.1 for 10%)
 * @returns {Object} Commission breakdown for the line item
 */
const calculateLineItemCommission = (price, quantity, commissionRate) => {
  const lineTotal = price * quantity;
  const commission = lineTotal * commissionRate;
  const sellerAmount = lineTotal - commission;

  return {
    lineTotal,
    commission,
    sellerAmount,
    commissionRate,
  };
};

module.exports = {
  calculateSplitPayment,
  calculateLineItemCommission,
};