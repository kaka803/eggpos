import { jsPDF } from "jspdf";

/**
 * Builds an authentic 80mm roll Thermal Receipt jsPDF document.
 * Matches real-world thermal POS paper slips 1:1 with pure monochrome typography.
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

  // Calculate dynamic roll height
  let baseHeight = 175;
  if (receipt.looseEggs > 0) baseHeight += 10;
  if (brokenEggs > 0) baseHeight += 10;
  if (Number(receipt.previousBalance) > 0) baseHeight += 14;
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

  const left = 5;
  const right = 75;
  const center = 40;
  let y = 8;

  // ================= 1. GODAM WAREHOUSE HEADER (LEFT ALIGNED) =================
  doc.setFont("courier", "bold");
  doc.setFontSize(10.5);
  const nameLines = doc.splitTextToSize(godamName, 70);
  nameLines.forEach((line) => {
    doc.text(line, left, y);
    y += 4.2;
  });

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  if (fullAddress) {
    const addrLines = doc.splitTextToSize(`LOCATION :${fullAddress}`, 70);
    addrLines.forEach((line) => {
      doc.text(line, left, y);
      y += 3.8;
    });
  }
  if (godamPhone) {
    doc.text(`TEL      :${godamPhone}`, left, y);
    y += 3.8;
  }

  // ================= 2. BILL INFO & CASHIER =================
  y += 2;
  doc.text(`DATE     : ${receipt.date || ""} ${receipt.time || ""}`, left, y);
  y += 3.8;
  doc.text(`INVOICE  : #${receipt.id || receipt.invoiceNo || "-"}`, left, y);
  y += 3.8;
  doc.text(`CASHIER  : ${receipt.salesmanName || "Salesman"}`, left, y);
  y += 3.8;

  // ================= 3. SHOP & CUSTOMER INFO =================
  y += 2;
  doc.setFont("courier", "bold");
  const shopNameText = (receipt.shopName || "CASH CUSTOMER").toUpperCase();
  const shopLines = doc.splitTextToSize(`SHOP     : ${shopNameText}`, 70);
  shopLines.forEach((line) => {
    doc.text(line, left, y);
    y += 4;
  });

  doc.setFont("courier", "normal");
  doc.text(`CUSTOMER : ${receipt.shopkeeperName || "-"}`, left, y);
  y += 3.8;
  doc.text(`PHONE    : ${receipt.phone || "-"}`, left, y);
  y += 3.8;
  if (receipt.area) {
    doc.text(`LOCATION : ${receipt.area}`, left, y);
    y += 3.8;
  }

  y += 1;
  doc.setFont("courier", "bold");
  doc.text("==========================================", center, y, { align: "center" });

  // ================= 4. TABLE HEADER =================
  y += 4;
  doc.text("ITEM                 QTY    PRICE    TOTAL", left, y);
  y += 2.8;
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });

  // Line 1: Petis
  y += 4.5;
  const petiRate = Number(receipt.ratePerPeti) || 0;
  const petisGrossAmt = (Number(receipt.petis) || 0) * petiRate;
  doc.setFont("courier", "bold");
  doc.text(`PETIS (${(Number(receipt.petis) * EGGS_PER_PETI).toLocaleString()} EGGS)`, left, y);
  y += 3.8;
  doc.setFont("courier", "normal");
  doc.text(`                      ${String(receipt.petis || 0).padStart(3)}  ${petiRate.toFixed(2).padStart(7)}  ${petisGrossAmt.toFixed(2).padStart(8)}`, left, y);

  // Line 2: Loose Eggs
  const looseNum = Number(receipt.looseEggs) || 0;
  if (looseNum > 0) {
    y += 4.2;
    const singleEggRate = petiRate > 0 ? petiRate / EGGS_PER_PETI : Number(receipt.ratePerEgg) || 0;
    const looseAmt = Math.round(looseNum * singleEggRate);
    doc.setFont("courier", "bold");
    doc.text("LOOSE EGGS", left, y);
    y += 3.8;
    doc.setFont("courier", "normal");
    doc.text(`                      ${String(looseNum).padStart(3)}  ${singleEggRate.toFixed(2).padStart(7)}  ${looseAmt.toFixed(2).padStart(8)}`, left, y);
  }

  // Line 3: Broken Eggs Deduction
  if (brokenEggs > 0) {
    y += 4.2;
    const dedAmt = Number(receipt.brokenDeduction) || 0;
    doc.setFont("courier", "bold");
    doc.text("LESS TOOTE (DAMAGE)", left, y);
    y += 3.8;
    doc.setFont("courier", "normal");
    doc.text(`                     -${String(brokenEggs).padStart(3)}        -  ${(-dedAmt).toFixed(2).padStart(8)}`, left, y);
  }

  y += 3.5;
  doc.text("------------------------------------------", center, y, { align: "center" });

  // ================= 5. EGG SUMMARY =================
  y += 4;
  doc.text(`Gross:${grossEggs.toLocaleString()}${brokenEggs > 0 ? ` Damaged:-${brokenEggs}` : ""}`, left, y);
  doc.setFont("courier", "bold");
  doc.text(`Net:${netEggs.toLocaleString()} Eggs`, right, y, { align: "right" });

  y += 2.8;
  doc.setFont("courier", "normal");
  doc.text("------------------------------------------", center, y, { align: "center" });

  // ================= 6. SUB TOTALS & TOTALS =================
  y += 4.5;
  const currentSale = Number(
    receipt.currentSaleAmount ||
    (Number(receipt.totalAmount) - (Number(receipt.previousBalance) || 0))
  );
  const prevBal = Number(receipt.previousBalance) || 0;
  const grandTotal = Number(
    receipt.grandTotal || (prevBal > 0 ? currentSale + prevBal : receipt.totalAmount)
  );

  doc.text("Sub Total:", left + 20, y);
  doc.setFont("courier", "bold");
  doc.text(`${currentSale.toFixed(2).padStart(12)}`, right, y, { align: "right" });

  if (prevBal > 0) {
    y += 4.2;
    doc.setFont("courier", "normal");
    doc.text("Previous Udhaar:", left + 20, y);
    doc.setFont("courier", "bold");
    doc.text(`+${prevBal.toFixed(2).padStart(11)}`, right, y, { align: "right" });
  }

  y += 3.2;
  doc.setFont("courier", "bold");
  doc.text("==========================================", center, y, { align: "center" });

  y += 4.5;
  doc.text("Bill Total:", left + 20, y);
  doc.text(`${grandTotal.toFixed(2).padStart(12)}`, right, y, { align: "right" });

  y += 4.2;
  doc.text("Cash Wasool:", left + 20, y);
  doc.text(`${Number(receipt.paidAmount || 0).toFixed(2).padStart(12)}`, right, y, { align: "right" });

  y += 4.2;
  doc.text("Balance:", left + 20, y);
  doc.text(`${Number(receipt.remainingBalance || 0).toFixed(2).padStart(12)}`, right, y, { align: "right" });

  y += 3.2;
  doc.text("==========================================", center, y, { align: "center" });

  // ================= 7. FOOTER =================
  y += 5;
  doc.text("THANK YOU", center, y, { align: "center" });

  y += 3.8;
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.text("Tijarat Me Barkat Ki Dua", center, y, { align: "center" });

  y += 3.2;
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.text("==========================================", center, y, { align: "center" });

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
