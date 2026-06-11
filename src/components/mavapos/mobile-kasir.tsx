"use client";

import Image from "next/image";
import {
  Bluetooth,
  Check,
  ChevronRight,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultProductImage,
  initialCategories,
  initialProducts,
  initialPromos,
} from "./data";
import { formatCurrency } from "./format";
import { LoginLogo } from "./brand";
import type { CartItem, EntityId, PaymentMethod, Product } from "./types";
import {
  getDefaultBluetoothPrinterName,
  printReceipt,
  selectDefaultBluetoothPrinter,
  type ReceiptData,
} from "@/lib/thermal-print";

function toId(value: EntityId) {
  return String(value);
}

export default function MobileKasir() {
  const [products] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromoId, setAppliedPromoId] = useState<EntityId | null>(null);
  const [productQuery, setProductQuery] = useState("");

  const [paymentStep, setPaymentStep] = useState<"form" | "success">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [cashReceived, setCashReceived] = useState(50000);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [defaultPrinterName, setDefaultPrinterName] = useState<string | null>(null);

  const nextInvoiceRef = useRef(1);
  const lastReceiptRef = useRef<ReceiptData | null>(null);

  useEffect(() => {
    window.setTimeout(() => {
      setDefaultPrinterName(getDefaultBluetoothPrinterName());
    }, 0);
  }, []);

  const promos = useMemo(() => initialPromos.filter((p) => p.status === "Aktif"), []);

  const filteredProducts = useMemo(
    () =>
      products
        .filter((p) => category === "Semua" || p.category === category)
        .filter((p) => !productQuery || p.name.toLowerCase().includes(productQuery.toLowerCase())),
    [products, category, productQuery],
  );

  const appliedPromo = useMemo(
    () => promos.find((p) => toId(p.id) === toId(appliedPromoId ?? "")),
    [promos, appliedPromoId],
  );

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "Diskon nominal") {
      const match = appliedPromo.value.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
  }, [appliedPromo]);

  const total = subtotal - discount;
  const cashChange = Math.max(cashReceived - total, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(product: Product) {
    if (product.stock <= 0) return;
    setCart((items) => {
      const existing = items.find((i) => toId(i.id) === toId(product.id));
      if (existing) {
        if (existing.qty >= product.stock) return items;
        return items.map((i) =>
          toId(i.id) === toId(product.id) ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...items, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: EntityId, delta: number) {
    setCart((items) =>
      items
        .map((i) => (toId(i.id) === toId(id) ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }

  function removeItem(id: EntityId) {
    setCart((items) => items.filter((i) => toId(i.id) !== toId(id)));
  }

  function applyPromo() {
    const code = promoCode.replace(/[^a-z0-9]/gi, "").toUpperCase();
    const matched = promos.find((p) => p.code === code);
    if (!matched) {
      setPromoError("Kode promo tidak valid");
      return;
    }
    setAppliedPromoId(matched.id);
    setPromoError("");
  }

  function removePromo() {
    setAppliedPromoId(null);
    setPromoCode("");
  }

  async function handlePayment() {
    if (paymentLoading) return;
    setPaymentLoading(true);

    const no = `MV-${nextInvoiceRef.current}`;
    nextInvoiceRef.current += 1;
    setInvoiceNo(no);

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 800));

    const now = new Date();
    lastReceiptRef.current = {
      outletName: "Outlet Mava",
      invoiceNo: no,
      cashierName: "Kasir",
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        total: i.price * i.qty,
      })),
      subtotal,
      discount,
      promoName: appliedPromo?.name,
      total,
      paymentMethod,
      cashReceived: paymentMethod === "Tunai" ? cashReceived : undefined,
      cashChange: paymentMethod === "Tunai" ? cashChange : undefined,
      completedAt: now.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setPaymentStep("success");
    setPaymentLoading(false);
  }

  function resetTransaction() {
    setCart([]);
    removePromo();
    setPaymentStep("form");
    setShowCart(false);
    setCashReceived(50000);
    setPaymentMethod("Tunai");
  }

  async function printStruk() {
    if (!lastReceiptRef.current) return;
    await printReceipt(lastReceiptRef.current);
    setDefaultPrinterName(getDefaultBluetoothPrinterName());
  }

  async function saveDefaultPrinter() {
    const printerName = await selectDefaultBluetoothPrinter();
    if (printerName) {
      setDefaultPrinterName(printerName);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#f4f6f3]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-[#dde3da] bg-white px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <LoginLogo className="h-auto w-28" />
          <span className="flex items-center gap-1.5 rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-semibold text-[#075985]">
            <ShoppingCart size={14} />
            {cartCount > 0 ? `${cartCount} items` : "Kasir"}
          </span>
        </div>
        {/* Search */}
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]"
            size={18}
          />
          <input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-[15px] outline-none focus:border-[#0369a1]"
            placeholder="Cari produk..."
          />
        </div>
        {/* Categories */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["Semua", ...categories] as const).map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[14px] font-semibold whitespace-nowrap transition ${
                category === item
                  ? "bg-[#0369a1] text-white"
                  : "border border-[#d7dfd4] bg-white text-[#4d5953]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      {/* ── Product Grid ── */}
      <section className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => toId(i.id) === toId(product.id));
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 active:scale-[0.97] transition"
              >
                <div className="relative aspect-[4/3] w-full bg-[#f0f5f8]">
                  {!product.image || product.image === defaultProductImage ? (
                    <div className="flex h-full items-center justify-center">
                      <Image
                        src={defaultProductImage}
                        alt=""
                        width={100}
                        height={30}
                        className="opacity-60"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 480px) 50vw, 33vw"
                    />
                  )}
                  <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#4d5953] shadow-xs">
                    Stok {product.stock}
                  </span>
                  {inCart && (
                    <span className="absolute left-2 bottom-2 flex size-6 items-center justify-center rounded-full bg-[#0369a1] text-xs font-bold text-white shadow-sm">
                      {inCart.qty}
                    </span>
                  )}
                </div>
                <div className="flex flex-col px-3 py-2.5 text-left">
                  <span className="truncate text-[14px] font-semibold text-[#1f2623]">
                    {product.name}
                  </span>
                  <span className="mt-0.5 text-[15px] font-bold text-[#0369a1]">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Floating Cart Button ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#dde3da] bg-white px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="flex items-center gap-2 text-left">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#e0f2fe] text-[#075985]">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#69756f]">
                  {cartCount} item
                </p>
                <p className="text-[15px] font-bold text-[#1f2623]">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="ml-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0369a1] text-[15px] font-bold text-white shadow-sm active:bg-[#075985] transition"
            >
              Buka Keranjang
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── Cart Bottom Sheet ── */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col bg-black/40" onClick={() => setShowCart(false)}>
          <div
            className="mt-auto flex max-h-[85dvh] flex-col rounded-t-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-[#dde3da] px-5 py-4">
              <div>
                <p className="text-xs font-medium text-[#69756f]">Pesanan</p>
                <h2 className="text-lg font-semibold text-[#1f2623]">
                  Keranjang ({cartCount})
                </h2>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="flex size-9 items-center justify-center rounded-full bg-[#f4f6f3]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="grid gap-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-[#dde3da] px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#1f2623]">
                        {item.name}
                      </p>
                      <p className="text-[13px] text-[#69756f]">
                        {formatCurrency(item.price)} / item
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#d7dfd4] bg-white active:bg-[#f4f6f3]"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-7 text-center text-[15px] font-bold">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#d7dfd4] bg-white active:bg-[#f4f6f3]"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-[#b5bfb9] active:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo + Total */}
            <div className="border-t border-[#dde3da] px-5 py-4">
              {/* Promo */}
              <div className="mb-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#e0f2fe] px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#075985]">
                        {appliedPromo.name}
                      </p>
                      <p className="text-[13px] font-bold text-[#075985]">
                        -{formatCurrency(discount)}
                      </p>
                    </div>
                    <button
                      onClick={removePromo}
                      className="flex size-7 items-center justify-center rounded-lg bg-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError("");
                      }}
                      className="h-10 flex-1 rounded-xl border border-[#d7dfd4] bg-[#fbfcfa] px-3 text-[14px] outline-none focus:border-[#0369a1]"
                      placeholder="Kode promo"
                    />
                    <button
                      onClick={applyPromo}
                      className="h-10 rounded-xl border border-[#0369a1] px-4 text-[13px] font-semibold text-[#0369a1] active:bg-[#e0f2fe]"
                    >
                      Pakai
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="mt-1 text-xs font-medium text-destructive">{promoError}</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#69756f]">Total</span>
                <span className="text-2xl font-bold text-[#1f2623]">{formatCurrency(total)}</span>
              </div>

              <button
                onClick={() => {
                  setShowCart(false);
                  setPaymentStep("form");
                  setPaymentMethod("Tunai");
                  setCashReceived(Math.max(total, 50000));
                  setInvoiceNo("");
                }}
                disabled={total <= 0}
                className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#0369a1] text-[15px] font-bold text-white shadow-sm active:bg-[#075985] transition disabled:opacity-50"
              >
                <CreditCard size={20} />
                Lanjut Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {paymentStep && !showCart && invoiceNo === "" && total > 0 && (
        <div className="fixed inset-0 z-30 flex flex-col bg-black/40">
          <div
            className="mt-auto flex max-h-[90dvh] flex-col rounded-t-2xl bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#dde3da] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#1f2623]">Pembayaran</h2>
              <button
                onClick={() => {
                  setPaymentStep("form");
                  setInvoiceNo("");
                }}
                className="flex size-9 items-center justify-center rounded-full bg-[#f4f6f3]"
              >
                <X size={18} />
              </button>
            </div>

            {paymentStep === "success" ? (
              <>
                <div className="px-5 py-6">
                  <div className="rounded-xl border border-[#dde3da] bg-[#f0f9ff] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0369a1] text-white">
                        <Check size={24} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#1f2623]">
                          Transaksi {invoiceNo} selesai
                        </p>
                        <p className="mt-0.5 text-[14px] text-[#69756f]">
                          Dibayar dengan {paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#dde3da] p-4">
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#69756f]">Total bayar</span>
                      <strong className="text-[#1f2623]">{formatCurrency(total)}</strong>
                    </div>
                    {paymentMethod === "Tunai" && (
                      <>
                        <div className="mt-2 flex justify-between text-[14px]">
                          <span className="text-[#69756f]">Tunai</span>
                          <strong className="text-[#1f2623]">{formatCurrency(cashReceived)}</strong>
                        </div>
                        <div className="mt-2 flex justify-between text-[14px]">
                          <span className="text-[#69756f]">Kembali</span>
                          <strong className="text-[#0369a1]">{formatCurrency(cashChange)}</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#dde3da] px-5 py-4">
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#dde3da] bg-[#fbfcfa] px-3 py-2 text-xs text-[#4d5953]">
                    <Bluetooth size={15} className="text-[#0369a1]" />
                    <span className="min-w-0 flex-1 truncate">
                      {defaultPrinterName
                        ? `Printer default: ${defaultPrinterName}`
                        : "Belum ada printer default"}
                    </span>
                    <button
                      onClick={saveDefaultPrinter}
                      className="shrink-0 font-bold text-[#0369a1]"
                    >
                      Simpan
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={printStruk}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#0369a1] text-[14px] font-bold text-[#0369a1] active:bg-[#e0f2fe]"
                    >
                      Cetak Struk
                    </button>
                    <button
                      onClick={resetTransaction}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#0369a1] text-[14px] font-bold text-white active:bg-[#075985]"
                    >
                      Transaksi Baru
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Payment form */}
                <div className="overflow-y-auto px-5 py-4">
                  {/* Total */}
                  <div className="rounded-xl border border-[#dde3da] bg-[#fbfcfa] p-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>
                    {discount > 0 && (
                      <div className="mt-2 flex justify-between text-sm text-[#0369a1]">
                        <span>Diskon</span>
                        <strong>-{formatCurrency(discount)}</strong>
                      </div>
                    )}
                    <div className="mt-3 border-t border-[#dde3da] pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <strong className="text-xl">{formatCurrency(total)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#69756f]">
                      Metode bayar
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["Tunai", "QRIS"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-[14px] font-bold ${
                            paymentMethod === m
                              ? "border-[#0369a1] bg-[#e0f2fe] text-[#075985]"
                              : "border-[#d7dfd4] text-[#4d5953]"
                          }`}
                        >
                          <CreditCard size={18} />
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash input */}
                  {paymentMethod === "Tunai" && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#69756f]">
                        Uang diterima
                      </p>
                      <input
                        type="number"
                        min={0}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="mt-2 h-13 w-full rounded-xl border border-[#d7dfd4] bg-[#fbfcfa] px-4 text-xl font-bold text-center outline-none focus:border-[#0369a1]"
                      />
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {[total, 50000, 100000].map((v) => (
                          <button
                            key={v}
                            onClick={() => setCashReceived(v)}
                            className="h-10 rounded-xl border border-[#d7dfd4] text-[13px] font-semibold text-[#4d5953] active:bg-[#f4f6f3]"
                          >
                            {formatCurrency(v)}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl bg-[#fbfcfa] p-3">
                        <div className="flex justify-between text-[14px]">
                          <span>Kembalian</span>
                          <strong
                            className={
                              cashReceived >= total
                                ? "text-[#0369a1]"
                                : "text-destructive"
                            }
                          >
                            {cashReceived >= total
                              ? formatCurrency(cashChange)
                              : `Kurang ${formatCurrency(total - cashReceived)}`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "QRIS" && (
                    <div className="mt-4 rounded-xl border border-[#dde3da] bg-[#fbfcfa] p-5 text-center">
                      <CreditCard size={32} className="mx-auto text-[#0369a1]" />
                      <p className="mt-2 text-[14px] font-semibold text-[#1f2623]">
                        QRIS siap ditampilkan
                      </p>
                      <p className="mt-1 text-[13px] text-[#69756f]">
                        Pembayaran otomatis terdeteksi
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="border-t border-[#dde3da] px-5 py-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPaymentStep("form");
                        setInvoiceNo("");
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#d7dfd4] text-[14px] font-bold text-[#4d5953] active:bg-[#f4f6f3]"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={paymentMethod === "Tunai" && cashReceived < total}
                      className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#0369a1] text-[14px] font-bold text-white shadow-sm active:bg-[#075985] transition disabled:opacity-50"
                    >
                      {paymentLoading ? (
                        "Memproses..."
                      ) : (
                        <>
                          Konfirmasi
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
