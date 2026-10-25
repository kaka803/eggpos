/**
 * Shared Professional WhatsApp Invoice Message Template
 */
export function generateWhatsAppInvoiceMessage(order, origin = "") {
  const invoiceId = order.invoiceNo || order.id || "0001";
  const currentSale = Number(
    order.currentSaleAmount ||
    (Number(order.totalAmount) - (Number(order.previousBalance) || 0))
  );
  const prevBal = Number(order.previousBalance) || 0;
  const grandTotal = Number(
    order.grandTotal || (prevBal > 0 ? currentSale + prevBal : order.totalAmount)
  );
  const paid = Number(order.paidAmount) || 0;
  const remaining = Number(order.remainingBalance) || 0;
  const brokenCount = Number(order.brokenEggs) || 0;
  const totalEggs = Number(order.netEggs || order.totalEggs || 0);

  const receiptUrl = origin ? `${origin}/receipt/${invoiceId}` : "";

  let financialsBlock = `💰 *TODAY SALE BILL:* Rs. ${currentSale.toLocaleString()}\n`;
  if (prevBal > 0) {
    financialsBlock += `⏳ *PREVIOUS UDHAAR:* + Rs. ${prevBal.toLocaleString()}\n`;
    financialsBlock += `💵 *GRAND TOTAL (KUL BILL):* Rs. ${grandTotal.toLocaleString()}\n`;
  } else {
    financialsBlock += `💵 *TOTAL PAYABLE:* Rs. ${grandTotal.toLocaleString()}\n`;
  }
  financialsBlock += `✅ *CASH WASOOL (PAID):* Rs. ${paid.toLocaleString()}\n`;
  financialsBlock += `⚠️ *NET REMAINING (BAQAYA):* Rs. ${remaining.toLocaleString()}`;

  let brokenLine = "";
  if (brokenCount > 0) {
    brokenLine = `⚠️ *BROKEN EGGS:* -${brokenCount} Eggs (-Rs. ${Number(order.brokenDeduction || 0).toLocaleString()})\n`;
  }

  const message =
`*AL-BARKAT EGG WHOLESALE*
_Central Godam & Wholesale Poultry Supply_
────────────────────────
🧾 *INVOICE NO:* #${invoiceId}
📅 *DATE & TIME:* ${order.date || ""} | ${order.time || ""}

🏪 *DUKAN / SHOP:* ${order.shopName || "Customer Shop"}
👤 *CUSTOMER:* ${order.shopkeeperName || "Shopkeeper"}
📞 *PHONE:* ${order.phone || "-"}
🛵 *SALESMAN:* ${order.salesmanName || "Field Driver"}
────────────────────────
📦 *DELIVERED:* ${order.petis || 0} Petis (${totalEggs.toLocaleString()} Eggs)
${brokenLine}💵 *RATE PER PETI:* Rs. ${Number(order.ratePerPeti || 0).toLocaleString()}
────────────────────────
${financialsBlock}
────────────────────────
📥 *DOWNLOAD OFFICIAL PDF RECEIPT:*
👉 ${receiptUrl}
────────────────────────
_Tijarat Me Barkat Ki Dua • Thank You!_`;

  return message;
}

export function getWhatsAppPhoneUrl(phone, message) {
  const rawPhone = (phone || "").replace(/[^0-9]/g, "");
  const formattedPhone = rawPhone.startsWith("0")
    ? `92${rawPhone.slice(1)}`
    : rawPhone.startsWith("92")
    ? rawPhone
    : `92${rawPhone}`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
