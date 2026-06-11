export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
};

export type ReceiptData = {
  outletName: string;
  outletAddress?: string;
  invoiceNo: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  promoName?: string;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  cashChange?: number;
  completedAt: string;
};

// ─── ESC/POS helpers ──────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;

function esc(...bytes: number[]) {
  return Uint8Array.from(bytes);
}

function text(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str + "\n");
}

function line(ch = "=", len = 40): Uint8Array {
  return text(ch.repeat(len));
}

function padBetween(left: string, right: string, width = 40): string {
  const dots = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(dots) + right;
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── ESC/POS receipt builder ──────────────────────────────────────

export function buildEscPosReceipt(data: ReceiptData): Uint8Array {
  const chunks: Uint8Array[] = [];

  // Initialize printer
  chunks.push(esc(ESC, 0x40)); // ESC @

  // Center align
  chunks.push(esc(ESC, 0x61, 0x01)); // ESC a 1

  // Header
  chunks.push(esc(GS, 0x21, 0x11)); // Double height, double width
  chunks.push(text(data.outletName));
  chunks.push(esc(GS, 0x21, 0x00)); // Reset size

  if (data.outletAddress) {
    chunks.push(text(data.outletAddress));
  }
  chunks.push(line("-", 40));
  chunks.push(text(""));
  chunks.push(esc(ESC, 0x61, 0x00)); // Left align

  // Info
  chunks.push(text(`No    : ${data.invoiceNo}`));
  chunks.push(text(`Kasir : ${data.cashierName}`));
  chunks.push(text(`Tgl   : ${data.completedAt}`));
  chunks.push(line("-", 40));

  // Items header
  chunks.push(esc(ESC, 0x61, 0x00));
  chunks.push(text("Nama                      Qty    Harga"));
  chunks.push(line("-", 40));

  // Items
  for (const item of data.items) {
    const nameRow =
      item.name.length > 22 ? item.name.slice(0, 20) + ".." : item.name;
    const qtyStr = String(item.qty).padStart(4);
    const priceStr = formatIDR(item.total).padStart(10);
    chunks.push(text(`${nameRow.padEnd(24)}${qtyStr}${priceStr}`));
  }

  chunks.push(line("-", 40));

  // Totals
  chunks.push(text(padBetween("Subtotal", formatIDR(data.subtotal))));

  if (data.discount > 0) {
    const promoLabel = data.promoName
      ? `Diskon (${data.promoName})`
      : "Diskon";
    chunks.push(text(padBetween(promoLabel, `-${formatIDR(data.discount)}`)));
  }

  chunks.push(esc(ESC, 0x61, 0x01)); // Center
  chunks.push(esc(GS, 0x21, 0x11)); // Double height
  chunks.push(text(`Total ${formatIDR(data.total)}`));
  chunks.push(esc(GS, 0x21, 0x00)); // Reset

  chunks.push(esc(ESC, 0x61, 0x00)); // Left
  chunks.push(text(`Bayar : ${data.paymentMethod}`));

  if (data.paymentMethod === "Tunai" && data.cashReceived !== undefined) {
    chunks.push(text(`Tunai : ${formatIDR(data.cashReceived)}`));
    if (data.cashChange !== undefined && data.cashChange > 0) {
      chunks.push(text(`Kembali : ${formatIDR(data.cashChange)}`));
    }
  }

  chunks.push(line("=", 40));

  // Footer
  chunks.push(esc(ESC, 0x61, 0x01));
  chunks.push(text("Terima kasih sudah berbelanja"));
  chunks.push(text("~ mavapos.id ~"));
  chunks.push(text(""));
  chunks.push(text(""));

  // Cut paper
  chunks.push(esc(GS, 0x56, 0x00)); // GS V 0

  // Combine all chunks
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// ─── Bluetooth printing ───────────────────────────────────────────

const SPP_SERVICE = "00001101-0000-1000-8000-00805f9b34fb";
const DEFAULT_PRINTER_STORAGE_KEY = "mavapos.defaultBluetoothPrinter";
const DEFAULT_LOCAL_PRINTER_STORAGE_KEY = "mavapos.defaultLocalThermalPrinter";

type StoredBluetoothPrinter = {
  id: string;
  name: string;
};

type BluetoothApi = {
  requestDevice(options: {
    acceptAllDevices: boolean;
    optionalServices: string[];
  }): Promise<BluetoothDeviceLike>;
  getDevices?: () => Promise<BluetoothDeviceLike[]>;
};

type BluetoothDeviceLike = {
  id: string;
  name?: string;
  gatt?: {
    connect(): Promise<BluetoothGattServerLike>;
    disconnect(): void;
  };
};

type BluetoothGattServerLike = {
  getPrimaryService(uuid: string): Promise<BluetoothServiceLike>;
};

type BluetoothServiceLike = {
  getCharacteristic(uuid: string): Promise<BluetoothCharacteristicLike>;
  getCharacteristics(): Promise<BluetoothCharacteristicLike[]>;
};

type BluetoothCharacteristicLike = {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
};

function getBluetoothApi(): BluetoothApi | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { bluetooth?: BluetoothApi }).bluetooth ?? null;
}

function getStoredDefaultPrinter(): StoredBluetoothPrinter | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DEFAULT_PRINTER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredBluetoothPrinter>;
    if (!parsed.id) return null;

    return {
      id: parsed.id,
      name: parsed.name || "Bluetooth printer",
    };
  } catch {
    return null;
  }
}

function saveDefaultPrinter(device: BluetoothDeviceLike) {
  if (typeof window === "undefined") return;

  const printer: StoredBluetoothPrinter = {
    id: device.id,
    name: device.name || "Bluetooth printer",
  };

  window.localStorage.setItem(DEFAULT_PRINTER_STORAGE_KEY, JSON.stringify(printer));
}

function getStoredLocalPrinterName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEFAULT_LOCAL_PRINTER_STORAGE_KEY);
}

function saveLocalPrinterName(printerName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEFAULT_LOCAL_PRINTER_STORAGE_KEY, printerName);
}

async function getLocalPrinters(): Promise<{
  printers: string[];
  defaultPrinter: string | null;
} | null> {
  try {
    const response = await fetch("/api/printers", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as {
      printers: string[];
      defaultPrinter: string | null;
    };
  } catch {
    return null;
  }
}

async function printViaLocalBridge(data: ReceiptData): Promise<boolean> {
  const printerName = getStoredLocalPrinterName();

  try {
    const response = await fetch("/api/print/thermal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt: data, printerName }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
        error?: string;
      } | null;
      console.warn("Local thermal print gagal:", payload?.detail ?? payload?.error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Local thermal print gagal:", error);
    return false;
  }
}

async function requestBluetoothPrinter(): Promise<BluetoothDeviceLike | null> {
  const bt = getBluetoothApi();
  if (!bt) {
    console.warn("Web Bluetooth tidak tersedia di browser ini.");
    return null;
  }

  return bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: [SPP_SERVICE],
  });
}

async function getSavedBluetoothPrinter(): Promise<BluetoothDeviceLike | null> {
  const bt = getBluetoothApi();
  const stored = getStoredDefaultPrinter();
  if (!bt || !bt.getDevices || !stored) return null;

  const devices = await bt.getDevices();
  return devices.find((device) => device.id === stored.id) ?? null;
}

async function writeReceiptToBluetoothDevice(
  device: BluetoothDeviceLike,
  data: ReceiptData
): Promise<void> {
  const gattServer = await device.gatt?.connect();
  if (!gattServer) throw new Error("Gagal connect ke printer");

  try {
    const service = await gattServer.getPrimaryService(SPP_SERVICE);

    // Try common TX characteristic UUIDs.
    const txUuids = [
      "00001101-0000-1000-8000-00805f9b34fb",
      "0000a003-0000-1000-8000-00805f9b34fb",
      "000018f0-0000-1000-8000-00805f9b34fb",
    ];

    let characteristic: BluetoothCharacteristicLike | null = null;
    for (const uuid of txUuids) {
      try {
        characteristic = await service.getCharacteristic(uuid);
        break;
      } catch {}
    }

    if (!characteristic) {
      const chars = await service.getCharacteristics();
      characteristic =
        chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) ?? null;
    }

    if (!characteristic) throw new Error("Tidak ditemukan karakteristik write");

    const receipt = buildEscPosReceipt(data);
    const maxChunk = 512;

    for (let i = 0; i < receipt.length; i += maxChunk) {
      const chunk = receipt.slice(i, i + maxChunk);
      await characteristic.writeValue(chunk);
    }
  } finally {
    device.gatt?.disconnect();
  }
}

export function getDefaultBluetoothPrinterName(): string | null {
  return getStoredLocalPrinterName() ?? getStoredDefaultPrinter()?.name ?? null;
}

export function forgetDefaultBluetoothPrinter() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEFAULT_LOCAL_PRINTER_STORAGE_KEY);
  window.localStorage.removeItem(DEFAULT_PRINTER_STORAGE_KEY);
}

export async function selectDefaultBluetoothPrinter(): Promise<string | null> {
  const localPrinters = await getLocalPrinters();
  if (localPrinters?.printers.length) {
    let printerName = localPrinters.defaultPrinter ?? localPrinters.printers[0];

    if (localPrinters.printers.length > 1) {
      const selected = window.prompt(
        `Ketik nama printer thermal:\n\n${localPrinters.printers.join("\n")}`,
        printerName,
      );
      if (!selected) return null;
      printerName = selected.trim();
    }

    if (!localPrinters.printers.includes(printerName)) {
      window.alert(`Printer "${printerName}" tidak ditemukan di macOS.`);
      return null;
    }

    saveLocalPrinterName(printerName);
    return printerName;
  }

  try {
    const device = await requestBluetoothPrinter();
    if (!device) return null;

    saveDefaultPrinter(device);
    return device.name || "Bluetooth printer";
  } catch (error) {
    console.warn("Gagal menyimpan printer Bluetooth:", error);
    return null;
  }
}

async function printViaBluetooth(data: ReceiptData): Promise<boolean> {
  try {
    let device = await getSavedBluetoothPrinter();

    if (!device) {
      device = await requestBluetoothPrinter();
      if (!device) return false;
      saveDefaultPrinter(device);
    }

    await writeReceiptToBluetoothDevice(device, data);
    return true;
  } catch (error) {
    console.warn("Bluetooth print gagal:", error);
    return false;
  }
}

// ─── Browser print fallback (CSS-styled receipt) ──────────────────

function printViaBrowser(data: ReceiptData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:2px 4px">${item.name}</td>
        <td style="padding:2px 4px;text-align:center">${item.qty}</td>
        <td style="padding:2px 4px;text-align:right">${formatIDR(item.price)}</td>
        <td style="padding:2px 4px;text-align:right">${formatIDR(item.total)}</td>
      </tr>`
    )
    .join("");

  const totalRow = `
    <tr><td colspan="3" style="padding:3px 4px;font-weight:600">Subtotal</td>
        <td style="padding:3px 4px;text-align:right;font-weight:600">${formatIDR(data.subtotal)}</td></tr>
    ${
      data.discount > 0
        ? `<tr><td colspan="3" style="padding:3px 4px;color:#0369a1">Diskon${data.promoName ? ` (${data.promoName})` : ""}</td>
            <td style="padding:3px 4px;text-align:right;color:#0369a1">-${formatIDR(data.discount)}</td></tr>`
        : ""
    }
    <tr><td colspan="3" style="padding:4px;font-size:16px;font-weight:700">Total</td>
        <td style="padding:4px;text-align:right;font-size:16px;font-weight:700">${formatIDR(data.total)}</td></tr>`;

  const paymentHtml =
    data.paymentMethod === "Tunai" && data.cashReceived !== undefined
      ? `
    <tr><td colspan="3" style="padding:2px 4px">Tunai</td>
        <td style="padding:2px 4px;text-align:right">${formatIDR(data.cashReceived)}</td></tr>
    ${
      data.cashChange && data.cashChange > 0
        ? `<tr><td colspan="3" style="padding:2px 4px">Kembali</td>
            <td style="padding:2px 4px;text-align:right">${formatIDR(data.cashChange)}</td></tr>`
        : ""
    }`
      : `<tr><td colspan="4" style="padding:2px 4px">Bayar: ${data.paymentMethod}</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Struk ${data.invoiceNo}</title>
<style>
  @page { margin:0; size:80mm auto; }
  body { font-family:'Courier New',monospace; font-size:12px; width:72mm; margin:0 auto; padding:2mm; color:#000; }
  table { width:100%; border-collapse:collapse; }
  td { font-size:11px; }
  .center { text-align:center; }
  .header { font-size:16px; font-weight:700; text-align:center; margin-bottom:2px; }
  .line { border-top:1px dashed #000; margin:4px 0; }
  .info { font-size:10px; margin:2px 0; }
  .footer { text-align:center; margin-top:6px; font-size:10px; }
</style></head>
<body>
  <div class="header">${data.outletName}</div>
  ${data.outletAddress ? `<div class="center info">${data.outletAddress}</div>` : ""}
  <div class="line"></div>
  <div class="info">No: ${data.invoiceNo} | ${data.cashierName}</div>
  <div class="info">${data.completedAt}</div>
  <div class="line"></div>
  <table><thead><tr><th style="text-align:left">Nama</th><th style="width:30px">Qty</th><th style="width:60px;text-align:right">Harga</th><th style="width:70px;text-align:right">Total</th></tr></thead>
  <tbody>${itemsHtml}</tbody></table>
  <div class="line"></div>
  <table><tbody>${totalRow}${paymentHtml}</tbody></table>
  <div class="line"></div>
  <div class="footer">Terima kasih<br>~ mavapos.id ~</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}

// ─── Main entry ───────────────────────────────────────────────────

export async function printReceipt(
  data: ReceiptData,
  preferBluetooth = true
): Promise<void> {
  const localPrinted = await printViaLocalBridge(data);
  if (localPrinted) return;

  if (preferBluetooth) {
    const ok = await printViaBluetooth(data);
    if (ok) return;
  }

  printViaBrowser(data);
}
