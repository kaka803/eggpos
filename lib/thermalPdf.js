import { jsPDF } from "jspdf";

/**
 * Generates an authentic 80mm roll Thermal Receipt PDF directly using native vector commands.
 * Completely immune to browser CSS/Tailwind color parsing bugs (e.g. lab/oklch errors).
 */
export function downloadThermalReceiptPDF(receipt, EGGS_PER_PETI = 360) {
  if (!receipt) return;

  const grossEggs =
    receipt.grossEggs || Number(receipt.petis) * EGGS_PER_PETI + (Number(receipt.looseEggs) || 0);
  const brokenEggs = Number(receipt.brokenEggs) || 0;
  const netEggs = receipt.netEggs || grossEggs - brokenEggs;

  // Calculate dynamic roll height based on items
  let baseHeight = 155;
  if (receipt.looseEggs > 0) baseHeight += 12;
  if (brokenEggs > 0) baseHeight += 12;
  if (Number(receipt.previousBalance) > 0) baseHeight += 16;
  if (Array.isArray(receipt.previousOrdersUdhaar) && receipt.previousOrdersUdhaar.length > 0) {
    baseHeight += receipt.previousOrdersUdhaar.length * 4 + 8;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, baseHeight],
  });

  const pageWidth = 80;
  const left = 5;
  const right = 75;
  const center = 40;
  let y = 8;

  // Set crisp monospace font
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text("AL-BARKAT EGG WHOLESALE", center, y, { align: "center" });

  y += 4.5;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("CENTRAL GODAM & SUPPLY", center, y, { align: "center" });

  y += 4;
  doc.text("Main Poultry Market | Tel: 0300-1234567", center, y, { align: "center" });

  y += 4;
  doc.text("==========================================", center, y, { align: "center" });

  // Metadata block
  y += 4.5;
  doc.setFont("courier", "bold");
  doc.text(`INVOICE #: ${receipt.id}`, left, y);
  doc.setFont("courier", "normal");
  doc.text(`${receipt.date || ""} ${receipt.time || ""}`, right, y, { align: "right" });

  y += 4;
  doc.text(`SALESMAN: ${receipt.salesmanName || "Field Driver"}`, left, y);

  y += 4;
  doc.setFont("courier", "bold");
  doc.text(`SHOP: ${receipt.shopName || "Cash Customer"}`, left, y);

  y += 4;
  doc.setFont("courier", "normal");
  doc.text(`CUSTOMER: ${receipt.shopkeeperName || "-"}`, left, y);
  doc.text(`PH: ${receipt.phone || "-"}`, right, y, { align: "right" });

  if (receipt.area) {
    y += 4;
    doc.text(`AREA: ${receipt.area}`, left, y);
  }

  y += 3.5;
  doc.text("------------------------------------------", center, y, { align: "center" });

  // Table Column Header
  y += 4;
  doc.setFont("courier", "bold");
  doc.text("QTY", left, y);
  doc.text("ITEM / DESCRIPTION", left + 10, y);
  doc.text("AMOUNT (Rs)", right, y, { align: "right" });

  y += 3.5;
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });

  // Line 1: Petis
  y += 4.5;
  const petiRate = Number(receipt.ratePerPeti) || 0;
  const petisGrossAmt = (Number(receipt.petis) || 0) * petiRate;
  doc.setFont("courier", "bold");
  doc.text(`${receipt.petis || 0}`, left, y);
  doc.text(`Boxes (${(Number(receipt.petis) * EGGS_PER_PETI).toLocaleString()} Eggs)`, left + 10, y);
  doc.text(petisGrossAmt.toLocaleString(), right, y, { align: "right" });

  y += 3.5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text(`@ Rs. ${petiRate.toLocaleString()} / Peti (360 eggs)`, left + 10, y);
  doc.setFontSize(8);

  // Line 2: Trays (if any - 1 Tray = 30 Eggs)
  const traysNum = Number(receipt.trays) || (receipt.looseEggs ? Math.floor(Number(receipt.looseEggs) / 30) : 0);
  const looseNum = Number(receipt.looseEggs) || traysNum * 30;
  if (traysNum > 0 || looseNum > 0) {
    y += 4.5;
    const trayRate = petiRate > 0 ? Math.round(petiRate / 12) : 0;
    const traysAmt = Math.round(traysNum * trayRate);
    doc.setFont("courier", "bold");
    doc.text(`${traysNum}`, left, y);
    doc.text(`Trays (${traysNum * 30} Eggs)`, left + 10, y);
    doc.text(traysAmt.toLocaleString(), right, y, { align: "right" });

    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(`@ Rs. ${trayRate.toLocaleString()} / tray (30 eggs)`, left + 10, y);
    doc.setFontSize(8);
  }

  // Line 3: Broken Eggs Record
  if (brokenEggs > 0) {
    y += 4.5;
    const dedAmt = Number(receipt.brokenDeduction) || 0;
    doc.setFont("courier", "bold");
    doc.text(`${brokenEggs}`, left, y);
    doc.text("BROKEN EGGS (WAREHOUSE RECORD)", left + 10, y);
    doc.text(dedAmt > 0 ? `-${dedAmt.toLocaleString()}` : "RECORDED", right, y, { align: "right" });

    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(dedAmt > 0 ? "Breakage deduction credited" : "Returned to warehouse pool", left + 10, y);
    doc.setFontSize(8);
  }

  y += 3.5;
  doc.text("------------------------------------------", center, y, { align: "center" });

  // Calculation Breakdown
  y += 4;
  doc.text("GROSS EGGS:", left, y);
  doc.text(`${grossEggs.toLocaleString()} PCS`, right, y, { align: "right" });

  if (brokenEggs > 0) {
    y += 3.5;
    doc.text("DAMAGED / BROKEN:", left, y);
    doc.text(`-${brokenEggs.toLocaleString()} PCS`, right, y, { align: "right" });
  }

  y += 3.5;
  doc.setFont("courier", "bold");
  doc.text("NET BILLABLE EGGS:", left, y);
  doc.text(`${netEggs.toLocaleString()} PCS`, right, y, { align: "right" });

  y += 3.5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text("CALCULATION UNIT: 1 PETI = 360 EGGS", left, y);
  doc.setFontSize(8);

  y += 3.5;
  doc.text("==========================================", center, y, { align: "center" });

  // Totals Section
  y += 5;
  const currentSale = Number(
    receipt.currentSaleAmount ||
    (Number(receipt.totalAmount) - (Number(receipt.previousBalance) || 0))
  );
  const prevBal = Number(receipt.previousBalance) || 0;
  const grandTotal = Number(
    receipt.grandTotal || (prevBal > 0 ? currentSale + prevBal : receipt.totalAmount)
  );

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.text("CURRENT SALE BILL:", left, y);
  doc.text(`Rs. ${currentSale.toLocaleString()}`, right, y, { align: "right" });

  if (prevBal > 0) {
    y += 4.5;
    doc.text("PREVIOUS UDHAAR:", left, y);
    doc.text(`+ Rs. ${prevBal.toLocaleString()}`, right, y, { align: "right" });

    y += 4.5;
    doc.setFontSize(9.5);
    doc.text("KUL BILL (TOTAL PAYABLE):", left, y);
    doc.text(`Rs. ${grandTotal.toLocaleString()}`, right, y, { align: "right" });
    doc.setFontSize(8.5);
  }

  y += 4.5;
  doc.text("CASH RECEIVED (WASOOL):", left, y);
  doc.text(`Rs. ${Number(receipt.paidAmount).toLocaleString()}`, right, y, { align: "right" });

  y += 4.5;
  doc.text("NET REMAINING UDHAAR:", left, y);
  doc.text(`Rs. ${Number(receipt.remainingBalance).toLocaleString()}`, right, y, { align: "right" });

  if (Array.isArray(receipt.previousOrdersUdhaar) && receipt.previousOrdersUdhaar.length > 0) {
    y += 3.5;
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text("Pending Invoices Included:", left, y);
    receipt.previousOrdersUdhaar.forEach((p) => {
      y += 3.5;
      doc.text(`• #${p.invoiceNo} (${p.date}): Rs. ${Number(p.remainingBalance).toLocaleString()}`, left, y);
    });
    doc.setFontSize(8.5);
  }

  y += 4;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });

  // Footer
  y += 4;
  doc.setFont("courier", "bold");
  doc.text(`STATUS: ${receipt.paymentStatus || "Completed"} (${receipt.paymentMode || "Cash"})`, center, y, {
    align: "center",
  });

  y += 4.5;
  doc.setFont("courier", "normal");
  doc.text("*** THANK YOU FOR YOUR BUSINESS ***", center, y, { align: "center" });

  y += 3.5;
  doc.setFontSize(7.5);
  doc.text("Tijarat Me Barkat Ki Dua", center, y, { align: "center" });

  y += 3.5;
  doc.text(`SYSTEM BY ANDAGODAM POS • ${receipt.id}`, center, y, { align: "center" });

  // Trigger immediate browser file download
  doc.save(`thermal_receipt_${receipt.id || "INV"}.pdf`);
}

/**
 * Returns the thermal receipt as a PDF Blob (for sharing, e.g. WhatsApp via Web Share API).
 * Does NOT trigger a download.
 */
export function getThermalReceiptPDFBlob(receipt, EGGS_PER_PETI = 360) {
  if (!receipt) return null;

  const grossEggs =
    receipt.grossEggs || Number(receipt.petis) * EGGS_PER_PETI + (Number(receipt.looseEggs) || 0);
  const brokenEggs = Number(receipt.brokenEggs) || 0;
  const netEggs = receipt.netEggs || grossEggs - brokenEggs;

  let baseHeight = 155;
  if (receipt.looseEggs > 0) baseHeight += 12;
  if (brokenEggs > 0) baseHeight += 12;
  if (Number(receipt.previousBalance) > 0) baseHeight += 16;
  if (Array.isArray(receipt.previousOrdersUdhaar) && receipt.previousOrdersUdhaar.length > 0) {
    baseHeight += receipt.previousOrdersUdhaar.length * 4 + 8;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, baseHeight],
  });

  const pageWidth = 80;
  const left = 5;
  const right = 75;
  const center = 40;
  let y = 8;

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text("AL-BARKAT EGG WHOLESALE", center, y, { align: "center" });
  y += 4.5;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("CENTRAL GODAM & SUPPLY", center, y, { align: "center" });
  y += 4;
  doc.text("Main Poultry Market | Tel: 0300-1234567", center, y, { align: "center" });
  y += 4;
  doc.text("==========================================", center, y, { align: "center" });
  y += 4.5;
  doc.setFont("courier", "bold");
  doc.text(`INVOICE #: ${receipt.id}`, left, y);
  doc.setFont("courier", "normal");
  doc.text(`${receipt.date || ""} ${receipt.time || ""}`, right, y, { align: "right" });
  y += 4;
  doc.text(`SALESMAN: ${receipt.salesmanName || "Field Driver"}`, left, y);
  y += 4;
  doc.setFont("courier", "bold");
  doc.text(`SHOP: ${receipt.shopName || "Cash Customer"}`, left, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.text(`CUSTOMER: ${receipt.shopkeeperName || "-"}`, left, y);
  doc.text(`PH: ${receipt.phone || "-"}`, right, y, { align: "right" });
  if (receipt.area) { y += 4; doc.text(`AREA: ${receipt.area}`, left, y); }
  y += 3.5;
  doc.text("------------------------------------------", center, y, { align: "center" });
  y += 4;
  doc.setFont("courier", "bold");
  doc.text("QTY", left, y);
  doc.text("ITEM / DESCRIPTION", left + 10, y);
  doc.text("AMOUNT (Rs)", right, y, { align: "right" });
  y += 3.5;
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });
  y += 4.5;
  const petiRate = Number(receipt.ratePerPeti) || 0;
  const petisGrossAmt = (Number(receipt.petis) || 0) * petiRate;
  doc.setFont("courier", "bold");
  doc.text(`${receipt.petis || 0}`, left, y);
  doc.text(`Boxes (${(Number(receipt.petis) * EGGS_PER_PETI).toLocaleString()} Eggs)`, left + 10, y);
  doc.text(petisGrossAmt.toLocaleString(), right, y, { align: "right" });
  y += 3.5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text(`@ Rs. ${petiRate.toLocaleString()} / Peti (360 eggs)`, left + 10, y);
  doc.setFontSize(8);
  if (Number(receipt.looseEggs) > 0) {
    y += 4.5;
    const singleEggRate = petiRate > 0 ? petiRate / EGGS_PER_PETI : 0;
    const looseAmt = Math.round(Number(receipt.looseEggs) * singleEggRate);
    doc.setFont("courier", "bold");
    doc.text(`${receipt.looseEggs}`, left, y);
    doc.text("Loose Eggs", left + 10, y);
    doc.text(looseAmt.toLocaleString(), right, y, { align: "right" });
    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(`@ Rs. ${singleEggRate.toFixed(2)} / egg`, left + 10, y);
    doc.setFontSize(8);
  }
  if (brokenEggs > 0) {
    y += 4.5;
    const dedAmt = Number(receipt.brokenDeduction) || 0;
    doc.setFont("courier", "bold");
    doc.text(`-${brokenEggs}`, left, y);
    doc.text("LESS TOOTE ANDAY (DAMAGE)", left + 10, y);
    doc.text(`-${dedAmt.toLocaleString()}`, right, y, { align: "right" });
    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text("Breakage deduction credited to shop", left + 10, y);
    doc.setFontSize(8);
  }
  y += 3.5;
  doc.text("------------------------------------------", center, y, { align: "center" });
  y += 4;
  doc.text("GROSS EGGS:", left, y);
  doc.text(`${grossEggs.toLocaleString()} PCS`, right, y, { align: "right" });
  if (brokenEggs > 0) {
    y += 3.5;
    doc.text("DAMAGED / BROKEN:", left, y);
    doc.text(`-${brokenEggs.toLocaleString()} PCS`, right, y, { align: "right" });
  }
  y += 3.5;
  doc.setFont("courier", "bold");
  doc.text("NET BILLABLE EGGS:", left, y);
  doc.text(`${netEggs.toLocaleString()} PCS`, right, y, { align: "right" });
  y += 3.5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text("CALCULATION UNIT: 1 PETI = 360 EGGS", left, y);
  doc.setFontSize(8);
  y += 3.5;
  doc.text("==========================================", center, y, { align: "center" });
  // Totals Section
  y += 5;
  const currentSale = Number(
    receipt.currentSaleAmount ||
    (Number(receipt.totalAmount) - (Number(receipt.previousBalance) || 0))
  );
  const prevBal = Number(receipt.previousBalance) || 0;
  const grandTotal = Number(
    receipt.grandTotal || (prevBal > 0 ? currentSale + prevBal : receipt.totalAmount)
  );

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.text("CURRENT SALE BILL:", left, y);
  doc.text(`Rs. ${currentSale.toLocaleString()}`, right, y, { align: "right" });

  if (prevBal > 0) {
    y += 4.5;
    doc.text("PREVIOUS UDHAAR:", left, y);
    doc.text(`+ Rs. ${prevBal.toLocaleString()}`, right, y, { align: "right" });

    y += 4.5;
    doc.setFontSize(9.5);
    doc.text("KUL BILL (TOTAL PAYABLE):", left, y);
    doc.text(`Rs. ${grandTotal.toLocaleString()}`, right, y, { align: "right" });
    doc.setFontSize(8.5);
  }

  y += 4.5;
  doc.text("CASH RECEIVED (WASOOL):", left, y);
  doc.text(`Rs. ${Number(receipt.paidAmount).toLocaleString()}`, right, y, { align: "right" });

  y += 4.5;
  doc.text("NET REMAINING UDHAAR:", left, y);
  doc.text(`Rs. ${Number(receipt.remainingBalance).toLocaleString()}`, right, y, { align: "right" });

  if (Array.isArray(receipt.previousOrdersUdhaar) && receipt.previousOrdersUdhaar.length > 0) {
    y += 3.5;
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text("Pending Invoices Included:", left, y);
    receipt.previousOrdersUdhaar.forEach((p) => {
      y += 3.5;
      doc.text(`• #${p.invoiceNo} (${p.date}): Rs. ${Number(p.remainingBalance).toLocaleString()}`, left, y);
    });
    doc.setFontSize(8.5);
  }
  y += 4;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });
  y += 4;
  doc.setFont("courier", "bold");
  doc.text(`STATUS: ${receipt.paymentStatus || "Completed"} (${receipt.paymentMode || "Cash"})`, center, y, { align: "center" });
  y += 4.5;
  doc.setFont("courier", "normal");
  doc.text("*** THANK YOU FOR YOUR BUSINESS ***", center, y, { align: "center" });
  y += 3.5;
  doc.setFontSize(7.5);
  doc.text("Tijarat Me Barkat Ki Dua", center, y, { align: "center" });
  y += 3.5;
  doc.text(`SYSTEM BY ANDAGODAM POS • ${receipt.id}`, center, y, { align: "center" });

  // Return as Blob for sharing (no download triggered)
  return doc.output("blob");
}
