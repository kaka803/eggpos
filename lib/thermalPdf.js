import { jsPDF } from "jspdf";

/**
 * Builds an authentic 80mm roll Thermal Receipt jsPDF document.
 * Handles dynamic godam settings (Name, Address, City, Phone) from settings / receipt / localStorage.
 */
export function buildThermalReceiptDoc(receipt, EGGS_PER_PETI = 360, godamSettings = null) {
  if (!receipt) return null;

  const grossEggs =
    receipt.grossEggs || Number(receipt.petis) * EGGS_PER_PETI + (Number(receipt.looseEggs) || 0);
  const brokenEggs = Number(receipt.brokenEggs) || 0;
  const netEggs = receipt.netEggs || grossEggs - brokenEggs;

  // Retrieve godam settings from param, receipt, or localStorage
  let savedSettings = null;
  if (typeof window !== "undefined" && !godamSettings) {
    try {
      const raw = localStorage.getItem("andagodam_settings");
      if (raw) savedSettings = JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }

  const cfg = godamSettings || savedSettings || {};
  const godamName = (cfg.godamName || receipt.godamName || "AL-BARKAT EGG WHOLESALE").toUpperCase();
  const godamAddress = cfg.godamAddress || receipt.godamAddress || "";
  const godamCity = cfg.godamCity || receipt.godamCity || "";
  const godamPhone = cfg.godamPhone || receipt.godamPhone || "";
  const fullAddress = [godamAddress, godamCity].filter(Boolean).join(", ");

  // Calculate dynamic roll height based on items and header lines
  let baseHeight = 168;
  if (receipt.looseEggs > 0) baseHeight += 12;
  if (brokenEggs > 0) baseHeight += 12;
  if (Number(receipt.previousBalance) > 0) baseHeight += 16;
  if (Array.isArray(receipt.previousOrdersUdhaar) && receipt.previousOrdersUdhaar.length > 0) {
    baseHeight += receipt.previousOrdersUdhaar.length * 4 + 8;
  }
  if (fullAddress) baseHeight += 8;
  if (godamPhone) baseHeight += 5;

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

  // Godam Header (dynamic from settings)
  doc.setFont("courier", "bold");
  doc.setFontSize(godamName.length > 28 ? 9 : godamName.length > 20 ? 10 : 11);
  const nameLines = doc.splitTextToSize(godamName, 70);
  nameLines.forEach((line) => {
    doc.text(line, center, y, { align: "center" });
    y += 4.2;
  });

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  if (fullAddress) {
    const addrLines = doc.splitTextToSize(fullAddress, 70);
    addrLines.forEach((line) => {
      doc.text(line, center, y, { align: "center" });
      y += 3.5;
    });
  } else {
    doc.text("CENTRAL GODAM & SUPPLY", center, y, { align: "center" });
    y += 3.5;
  }

  if (godamPhone) {
    doc.text(`Tel: ${godamPhone}`, center, y, { align: "center" });
    y += 3.5;
  }

  y += 1;
  doc.text("==========================================", center, y, { align: "center" });

  // Metadata block
  y += 4.5;
  doc.setFont("courier", "bold");
  doc.text(`INVOICE #: ${receipt.id || receipt.invoiceNo || "-"}`, left, y);
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
  doc.text(`@ Rs. ${petiRate.toLocaleString()} / Peti (${EGGS_PER_PETI} eggs)`, left + 10, y);
  doc.setFontSize(8);

  // Line 2: Loose Eggs
  const looseNum = Number(receipt.looseEggs) || 0;
  if (looseNum > 0) {
    y += 4.5;
    const singleEggRate = petiRate > 0 ? petiRate / EGGS_PER_PETI : Number(receipt.ratePerEgg) || 0;
    const looseAmt = Math.round(looseNum * singleEggRate);
    doc.setFont("courier", "bold");
    doc.text(`${looseNum}`, left, y);
    doc.text("Loose Eggs", left + 10, y);
    doc.text(looseAmt.toLocaleString(), right, y, { align: "right" });

    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(`@ Rs. ${singleEggRate.toFixed(2)} / egg`, left + 10, y);
    doc.setFontSize(8);
  }

  // Line 3: Broken Eggs Record
  if (brokenEggs > 0) {
    y += 4.5;
    const dedAmt = Number(receipt.brokenDeduction) || 0;
    doc.setFont("courier", "bold");
    doc.text(`-${brokenEggs}`, left, y);
    doc.text("LESS TOOTE ANDAY (DAMAGE)", left + 10, y);
    doc.text(dedAmt > 0 ? `-${dedAmt.toLocaleString()}` : "RECORDED", right, y, { align: "right" });

    y += 3.5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(dedAmt > 0 ? "Breakage deduction credited to shop" : "Returned to warehouse pool", left + 10, y);
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
  doc.text(`CALCULATION UNIT: 1 PETI = ${EGGS_PER_PETI} EGGS`, left, y);
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
  doc.text(`SYSTEM BY ANDAGODAM POS • ${receipt.id || receipt.invoiceNo || ""}`, center, y, { align: "center" });

  return doc;
}

/**
 * Generates and triggers download of an authentic 80mm roll Thermal Receipt PDF.
 */
export function downloadThermalReceiptPDF(receipt, EGGS_PER_PETI = 360, godamSettings = null) {
  const doc = buildThermalReceiptDoc(receipt, EGGS_PER_PETI, godamSettings);
  if (!doc) return;
  doc.save(`thermal_receipt_${receipt.id || receipt.invoiceNo || "INV"}.pdf`);
}

/**
 * Returns the thermal receipt as a PDF Blob (for sharing, e.g. WhatsApp via Web Share API).
 * Does NOT trigger a download.
 */
export function getThermalReceiptPDFBlob(receipt, EGGS_PER_PETI = 360, godamSettings = null) {
  const doc = buildThermalReceiptDoc(receipt, EGGS_PER_PETI, godamSettings);
  if (!doc) return null;
  return doc.output("blob");
}
