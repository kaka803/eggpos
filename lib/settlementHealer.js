import Order from "@/models/Order";

/**
 * Self-healing cleanup utility:
 * Ensures any order that was rolled forward into a new order or paid off
 * has remainingBalance set to 0, paymentStatus set to "Full Paid", and settledInOrder recorded.
 */
export async function healSettledOrders() {
  try {
    // 1. Orders where settledInOrder is explicitly recorded but remainingBalance is still > 0
    await Order.updateMany(
      {
        settledInOrder: { $exists: true, $ne: null, $nin: ["", false] },
        remainingBalance: { $gt: 0 },
      },
      {
        $set: {
          remainingBalance: 0,
          paymentStatus: "Full Paid",
        },
      }
    );

    // 2. Orders referenced in another order's previousOrdersUdhaar list
    const ordersWithPrev = await Order.find({
      "previousOrdersUdhaar.0": { $exists: true },
    })
      .select("invoiceNo previousOrdersUdhaar paidAmount grandTotal remainingBalance")
      .lean();

    for (const ord of ordersWithPrev) {
      const settledInvoices = (ord.previousOrdersUdhaar || [])
        .map((p) => p.invoiceNo)
        .filter((inv) => inv && inv !== "OPENING");

      if (settledInvoices.length > 0) {
        await Order.updateMany(
          { invoiceNo: { $in: settledInvoices } },
          {
            $set: {
              settledInOrder: ord.invoiceNo,
              remainingBalance: 0,
              paymentStatus: "Full Paid",
            },
          }
        );
      }
    }
  } catch (err) {
    console.warn("healSettledOrders error:", err);
  }
}
