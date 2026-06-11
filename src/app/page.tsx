"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Check,
  Copy,
  Plus,
  Minus,
  ShoppingCart,
  BarChart3,
  Boxes,
  Package,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Receipt,
  QrCode,
  Trash2,
  Printer,
  BadgePercent,
  Laptop
} from "lucide-react";
import { initialProducts, demoUsers } from "@/components/mavapos/data";
import { formatCurrency } from "@/components/mavapos/format";
import { Product, EntityId } from "@/components/mavapos/types";

// Features detailed list
const featuresList = [
  {
    id: "kasir",
    title: "Kasir Digital",
    icon: ShoppingCart,
    badge: "Kecepatan Tinggi",
    desc: "Antarmuka kasir cepat dengan pencarian produk, kategori, dan riwayat transaksi real-time.",
    highlights: ["Mendukung barcode scanner", "Struk digital via WhatsApp & Email", "Mendukung printer thermal bluetooth/USB"],
  },
  {
    id: "stok",
    title: "Manajemen Stok",
    icon: Boxes,
    badge: "Otomatis & Akurat",
    desc: "Pantau stok produk dan bahan baku secara langsung. Dapatkan notifikasi saat stok menipis.",
    highlights: ["Notifikasi stok menipis", "Riwayat mutasi stok lengkap", "Kalkulasi HPP otomatis"],
  },
  {
    id: "bahan",
    title: "Manajemen Bahan",
    icon: Package,
    badge: "Efisiensi FnB",
    desc: "Catat resep detail dan kalkulasi kebutuhan bahan baku dari setiap produk yang terjual secara otomatis.",
    highlights: ["Daftar resep per produk", "Potong stok bahan per transaksi", "Kalkulasi margin profit riil"],
  },
  {
    id: "laporan",
    title: "Laporan Otomatis",
    icon: BarChart3,
    badge: "Analitis Pintar",
    desc: "Laporan harian, bulanan, laba rugi, HPP, serta produk terlaris disajikan otomatis tanpa hitung manual.",
    highlights: ["Grafik penjualan interaktif", "Laporan laba kotor & bersih", "Export data ke Excel/PDF"],
  },
];

export default function LandingPage() {
  // Simulator State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "QRIS" | "Transfer">("Tunai");
  const [cashAmount, setCashAmount] = useState<number>(50000);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"select" | "qris" | "success">("select");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  
  // Interactive Feature Hub State
  const [activeFeatureTab, setActiveFeatureTab] = useState<string>("kasir");

  // Pricing State
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Auto close copied status after 2 seconds
  useEffect(() => {
    if (copiedText) {
      const timer = setTimeout(() => setCopiedText(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedText]);

  // Copy credentials function
  const handleCopyCredentials = (email: string, pass: string, role: string) => {
    const textToCopy = `Email: ${email}\nPassword: ${pass}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedText(role);
    }).catch(() => {
      // Fallback
      setCopiedText(role);
    });
  };

  // Simulator helper functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: EntityId, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1); // PB1 10%
  const grandTotal = subtotal + tax;
  const changeAmount = Math.max(0, cashAmount - grandTotal);

  const handleProcessPayment = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    if (paymentMethod === "QRIS") {
      setPaymentStep("qris");
      setTimeout(() => {
        setPaymentStep("success");
        setReceiptNumber("MAVA-20260610-" + Math.floor(1000 + Math.random() * 9000));
        setIsProcessing(false);
      }, 2500);
    } else {
      setTimeout(() => {
        setPaymentStep("success");
        setReceiptNumber("MAVA-20260610-" + Math.floor(1000 + Math.random() * 9000));
        setIsProcessing(false);
      }, 1000);
    }
  };

  const resetSimulator = () => {
    setCart([]);
    setPaymentStep("select");
    setCashAmount(50000);
    setShowReceipt(false);
    setReceiptNumber("");
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <main className="relative min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-[#0369a1]/20 selection:text-[#0369a1] overflow-x-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] aspect-square rounded-full bg-gradient-to-tr from-[#0369a1]/10 to-indigo-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] aspect-square rounded-full bg-gradient-to-bl from-teal-500/5 to-[#0369a1]/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[10%] w-[40%] aspect-square rounded-full bg-[#0369a1]/5 blur-[120px] pointer-events-none -z-10" />

      {/* Top Banner Alert */}
      <div className="bg-gradient-to-r from-[#0369a1] to-[#0d9488] text-white text-xs md:text-sm font-medium py-2.5 px-4 text-center flex items-center justify-center gap-2 relative z-50">
        <Sparkles className="size-4 animate-pulse text-amber-300" />
        <span>Kini tersedia aplikasi MAVAPOS Mobile untuk Android & iOS!</span>
        <Link href="#fitur" className="underline hover:text-amber-200 transition-colors ml-1 font-semibold">Pelajari &rarr;</Link>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-md transition-all">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
            <Image
              src="/2.png"
              alt="MAVA Logo"
              width={96}
              height={39}
              className="block object-contain"
              draggable={false}
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#simulator" className="text-[14px] font-medium text-slate-600 hover:text-[#0369a1] transition-colors">Simulator Kasir</Link>
            <Link href="#fitur" className="text-[14px] font-medium text-slate-600 hover:text-[#0369a1] transition-colors">Fitur Utama</Link>
            <Link href="#harga" className="text-[14px] font-medium text-slate-600 hover:text-[#0369a1] transition-colors">Harga Paket</Link>
            <Link href="#faq" className="text-[14px] font-medium text-slate-600 hover:text-[#0369a1] transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-[14px] font-semibold text-slate-600 hover:text-[#0369a1] hover:bg-slate-50 transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#0369a1] px-4.5 py-2 text-[14px] font-semibold text-white shadow-md shadow-[#0369a1]/25 hover:shadow-lg hover:shadow-[#0369a1]/30 hover:bg-[#075985] active:translate-y-px transition-all"
            >
              Coba Gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-6">
            
            {/* Promo Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-4 py-1.5 text-xs font-semibold text-[#0369a1] backdrop-blur-sm shadow-sm animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping" />
              <span>Aplikasi Kasir Cloud Modern untuk UMKM Indonesia</span>
            </div>

            {/* Main Title */}
            <h1 className="text-[clamp(2.25rem,6vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-slate-900">
              Kelola usaha FnB & Retail <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0369a1] to-sky-500">
                jauh lebih mudah & cepat
              </span>
            </h1>

            {/* Subtext */}
            <p className="max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-slate-600">
              Mulai catat transaksi penjualan, pantau stok bahan baku resep, kelola shift kasir, dan pantau laba rugi outlet Anda kapan saja secara real-time. Bisa dicoba gratis tanpa kartu kredit!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-[#0369a1] px-8 text-[15px] font-bold text-white shadow-lg shadow-[#0369a1]/30 hover:shadow-xl hover:shadow-[#0369a1]/40 hover:bg-[#075985] hover:scale-[1.02] active:translate-y-px transition-all"
              >
                Mulai Uji Coba Gratis
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                href="#simulator"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white/70 backdrop-blur-sm px-8 text-[15px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.02] active:translate-y-px transition-all"
              >
                Coba Simulator Kasir
              </Link>
            </div>

            {/* Credentials copy cards */}
            <div className="mt-8 w-full max-w-xl bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm text-left">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Laptop className="size-3.5 text-[#0369a1]" />
                Akun Demo Uji Coba Langsung (Klik Untuk Salin):
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {demoUsers.map((item) => (
                  <button
                    key={item.user.role}
                    type="button"
                    onClick={() => handleCopyCredentials(item.email, item.password, item.user.role)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#0369a1] bg-white hover:bg-slate-50 text-left transition-all group relative cursor-pointer"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${item.user.role === 'Owner' ? 'bg-[#0369a1]' : 'bg-teal-500'}`} />
                        Role: {item.user.role}
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 mt-1 select-all">{item.email}</p>
                      <p className="font-mono text-[11px] text-slate-400">Sandi: {item.password}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-[#0369a1]/10 transition-colors">
                      {copiedText === item.user.role ? (
                        <span className="text-[11px] font-bold text-[#0369a1]">Tersalin!</span>
                      ) : (
                        <Copy className="size-4 text-slate-400 group-hover:text-[#0369a1] transition-colors" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="py-16 md:py-24 border-y border-slate-200/60 bg-gradient-to-b from-white via-slate-50/50 to-white relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#0369a1] uppercase tracking-widest bg-sky-50 border border-sky-100 rounded-full px-3 py-1">Eksplorasi Langsung</span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-slate-900 tracking-tight mt-3">
              Simulator Mesin Kasir MAVAPOS
            </h2>
            <p className="text-[15px] text-slate-600 mt-2">
              Cobalah antarmuka kasir kami secara langsung di bawah ini. Tambahkan produk ke keranjang belanja, tentukan metode bayar, dan cetak struk pembayarannya.
            </p>
          </div>

          {/* POS Simulator Device Container */}
          <div className="mx-auto max-w-5xl rounded-2xl border-4 border-slate-800 bg-slate-950 p-2 md:p-3 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 via-[#0369a1] to-teal-500" />
            
            {/* iPad Style Inner Bezel */}
            <div className="rounded-lg bg-slate-900 text-slate-100 overflow-hidden flex flex-col md:grid md:grid-cols-12 min-h-[580px] md:h-[620px]">
              
              {/* Left Column: Product Selection Grid (7 Cols) */}
              <div className="md:col-span-7 p-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800">
                      <ShoppingCart className="size-4 text-[#0369a1]" />
                    </div>
                    <span className="font-bold text-[14px]">Daftar Menu Mava Cafe</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Kasir Aktif: Ayu
                  </span>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1 max-h-[350px] md:max-h-none">
                  {initialProducts.map((p) => {
                    const isInCart = cart.find(item => item.product.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className={`flex flex-col text-left rounded-xl overflow-hidden bg-slate-800 border transition-all cursor-pointer select-none group relative ${
                          isInCart 
                            ? 'border-[#0369a1] ring-1 ring-[#0369a1]' 
                            : 'border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/80'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] w-full bg-slate-700">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {p.tag && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-[#0369a1] text-white font-extrabold text-[9px] px-1.5 py-0.5 tracking-wider uppercase">
                              {p.tag}
                            </span>
                          )}
                          {isInCart && (
                            <div className="absolute right-1.5 top-1.5 bg-[#0369a1] text-white rounded-full size-5 flex items-center justify-center text-[11px] font-bold shadow-md">
                              {isInCart.quantity}
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="p-2.5 flex flex-col gap-0.5">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{p.category}</span>
                          <span className="text-[12px] font-semibold text-slate-100 truncate line-clamp-1 group-hover:text-white">{p.name}</span>
                          <span className="text-[13px] font-bold text-[#0369a1] mt-1">{formatCurrency(p.price)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Virtual Receipt & Cart (5 Cols) */}
              <div className="md:col-span-5 p-4 flex flex-col h-full bg-slate-900/60 overflow-hidden relative">
                
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-[14px]">
                    <Receipt className="size-4 text-[#0369a1]" />
                    Struk Transaksi
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Cart Item List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[200px] md:max-h-none">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-8">
                      <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                        <ShoppingCart className="size-6 text-slate-600" />
                      </div>
                      <p className="text-xs font-medium">Belum ada item terpilih.</p>
                      <p className="text-[11px] text-slate-600 mt-1 max-w-[180px]">Klik item produk di sebelah kiri untuk menambah pesanan.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-[12px] font-semibold text-slate-200 truncate">{item.product.name}</h4>
                          <span className="text-[11px] text-[#0369a1] font-medium">{formatCurrency(item.product.price)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="size-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-95 cursor-pointer"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="size-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-95 cursor-pointer"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Calculation & Payment controls */}
                <div className="pt-3 border-t border-slate-800 mt-auto bg-slate-900 space-y-3">
                  
                  {/* Bill Details */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-200">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak Restoran (PB1 10%)</span>
                      <span className="font-medium text-slate-200">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-100 pt-1 border-t border-slate-800/80">
                      <span className="text-white">Total Tagihan</span>
                      <span className="text-[#0369a1]">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment selector */}
                  {cart.length > 0 && paymentStep === "select" && (
                    <div className="space-y-2 bg-slate-800/30 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cara Bayar:</label>
                        <div className="flex gap-1">
                          {(["Tunai", "QRIS", "Transfer"] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                                paymentMethod === method
                                  ? "bg-[#0369a1] text-white"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMethod === "Tunai" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">Uang Tunai:</span>
                          <input
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono flex-1 focus:outline-none focus:border-[#0369a1]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {cart.length > 0 && paymentStep === "select" && (
                    <button
                      onClick={handleProcessPayment}
                      disabled={isProcessing}
                      className="w-full h-10 bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#0369a1]/20 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="size-4" />
                          Bayar & Simpan Transaksi
                        </>
                      )}
                    </button>
                  )}

                  {/* QRIS Overlay Simulator */}
                  {paymentStep === "qris" && (
                    <div className="bg-slate-950/95 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <QrCode className="size-3.5" />
                        Menunggu Scan QRIS
                      </span>
                      {/* Mock QRIS code SVG */}
                      <div className="bg-white p-2.5 rounded-lg">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="black">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner Squares */}
                          <rect x="5" y="5" width="25" height="25" fill="black" />
                          <rect x="10" y="10" width="15" height="15" fill="white" />
                          <rect x="13" y="13" width="9" height="9" fill="black" />
                          
                          <rect x="70" y="5" width="25" height="25" fill="black" />
                          <rect x="75" y="10" width="15" height="15" fill="white" />
                          <rect x="78" y="13" width="9" height="9" fill="black" />
                          
                          <rect x="5" y="70" width="25" height="25" fill="black" />
                          <rect x="10" y="75" width="15" height="15" fill="white" />
                          <rect x="13" y="78" width="9" height="9" fill="black" />
                          
                          {/* Random noise bits */}
                          <rect x="40" y="10" width="10" height="10" fill="black" />
                          <rect x="55" y="20" width="5" height="20" fill="black" />
                          <rect x="40" y="40" width="20" height="20" fill="black" />
                          <rect x="70" y="45" width="15" height="10" fill="black" />
                          <rect x="80" y="70" width="15" height="15" fill="black" />
                          <rect x="45" y="75" width="15" height="10" fill="black" />
                          <rect x="35" y="65" width="10" height="15" fill="black" />
                          <center className="font-bold text-[8px] text-slate-800">QRIS MAVA</center>
                        </svg>
                      </div>
                      <p className="text-[11px] text-slate-400">Pindai kode QR untuk melakukan pembayaran sebesar <strong className="text-white">{formatCurrency(grandTotal)}</strong></p>
                      <div className="flex items-center gap-1.5 text-xs text-[#0369a1]">
                        <div className="size-2.5 border border-[#0369a1] border-t-transparent rounded-full animate-spin" />
                        <span>Simulasi pembayaran otomatis...</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Success Overlay */}
                  {paymentStep === "success" && (
                    <div className="bg-slate-950/95 p-4 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center text-center space-y-4 animate-scale-up">
                      <div className="size-11 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Check className="size-6" strokeWidth={3} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">Pembayaran Sukses!</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Metode: {paymentMethod} • Total: {formatCurrency(grandTotal)}</p>
                        {paymentMethod === "Tunai" && (
                          <p className="text-[11px] text-emerald-400 font-semibold mt-1">Kembalian: {formatCurrency(changeAmount)}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => setShowReceipt(true)}
                          className="flex-1 h-9 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="size-3.5 text-[#0369a1]" />
                          Lihat Struk
                        </button>
                        <button
                          onClick={resetSimulator}
                          className="flex-1 h-9 bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        >
                          Transaksi Baru
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Struk Print Modal Simulation */}
                {showReceipt && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 z-10 animate-fade-in">
                    <div className="bg-white text-slate-900 p-5 rounded-lg shadow-xl w-full max-w-sm font-mono text-xs max-h-[90%] overflow-y-auto relative">
                      
                      {/* Receipt Header */}
                      <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                        <h3 className="font-bold text-sm">CAFE MAVA DEMO</h3>
                        <p className="text-[10px] text-slate-500">Kawasan Megamas Blok B2, Manado</p>
                        <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
                      </div>

                      {/* Receipt Meta */}
                      <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
                          <span>Kasir: Ayu (Owner)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No: {receiptNumber || "MAVA-20260610-0000"}</span>
                          <span>Metode: {paymentMethod}</span>
                        </div>
                      </div>

                      {/* Receipt Items */}
                      <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                        {cart.map((item) => (
                          <div key={item.product.id} className="space-y-0.5 text-[11px]">
                            <div className="flex justify-between font-bold">
                              <span>{item.product.name}</span>
                              <span>{formatCurrency(item.product.price * item.quantity)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {item.quantity} x {formatCurrency(item.product.price)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Receipt Totals */}
                      <div className="py-2.5 text-right space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Pajak Restoran (10%):</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm border-t border-dashed border-slate-300 pt-1.5">
                          <span>Total Bayar:</span>
                          <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        {paymentMethod === "Tunai" && (
                          <>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Bayar (Tunai):</span>
                              <span>{formatCurrency(cashAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                              <span>Kembali:</span>
                              <span>{formatCurrency(changeAmount)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Receipt Footer */}
                      <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
                        <p className="font-bold text-[10px]">Terima Kasih</p>
                        <p className="text-[9px] text-slate-400">Powered by mavapos.id</p>
                      </div>

                      {/* Close button */}
                      <button
                        onClick={() => setShowReceipt(false)}
                        className="mt-4 w-full py-2 bg-slate-900 text-white rounded text-xs font-bold font-sans hover:bg-slate-800 cursor-pointer"
                      >
                        Tutup Struk
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Hub Section */}
      <section id="fitur" className="py-16 md:py-24 bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#0369a1] uppercase tracking-widest bg-sky-50 border border-sky-100 rounded-full px-3 py-1">Semua Fitur</span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-slate-900 tracking-tight mt-3">
              Semua Fitur Untuk Digitalkan Outlet Anda
            </h2>
            <p className="text-[15px] text-slate-600 mt-2">
              Didesain khusus untuk mempermudah bisnis kuliner, cafe, depot, laundry, barbershop, hingga retail kelontong.
            </p>
          </div>

          {/* Interactive Feature Hub Layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Tab Selectors (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {featuresList.map((feat) => {
                const IconComponent = feat.icon;
                const isActive = activeFeatureTab === feat.id;
                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveFeatureTab(feat.id)}
                    className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                      isActive
                        ? "bg-white border-[#0369a1] shadow-lg shadow-[#0369a1]/5 scale-[1.02]"
                        : "bg-white/50 border-slate-200/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                      isActive ? "bg-[#0369a1] text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      <IconComponent className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0369a1] border border-sky-200">
                            {feat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 mt-1.5 leading-relaxed">{feat.desc}</p>
                      
                      {/* Show detail highlights if active */}
                      {isActive && (
                        <ul className="mt-3.5 space-y-1.5 animate-fade-in">
                          {feat.highlights.map((high) => (
                            <li key={high} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                              <Check className="size-3 text-[#0369a1]" strokeWidth={3} />
                              {high}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Simulated Feature Screen (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xl min-h-[380px] flex flex-col justify-between transition-all relative overflow-hidden">
              
              {/* Decorative Browser header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-rose-400" />
                  <div className="size-2.5 rounded-full bg-amber-400" />
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400 font-mono ml-2">mavapos.id/dashboard/{activeFeatureTab}</span>
                </div>
                <span className="text-[10px] font-bold text-[#0369a1] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">Live Preview</span>
              </div>

              {/* Dynamic Feature Mock Content */}
              <div className="flex-1 flex flex-col justify-center">
                
                {/* 1. Kasir Tab Mock */}
                {activeFeatureTab === "kasir" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-sky-100 flex items-center justify-center text-[#0369a1]">
                          <ShoppingCart className="size-5" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Transaksi Terakhir</span>
                          <span className="text-xs font-bold text-slate-800">TRX #08892 (Selesai)</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+Rp54.000</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Pilihan Pembayaran Lengkap:</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">Tunai</div>
                        <div className="p-2 rounded bg-white border border-[#0369a1] text-[#0369a1] flex items-center justify-center gap-1">
                          <QrCode className="size-3" /> QRIS
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">Gopay</div>
                        <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">OVO</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Stok Tab Mock */}
                {activeFeatureTab === "stok" && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                      <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <div>
                        <strong>Peringatan Stok Menipis!</strong>
                        <p className="text-[11px] text-amber-700 mt-0.5">3 item produk/bahan baku telah menyentuh batas minimum stok.</p>
                      </div>
                    </div>
                    
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-3 bg-slate-50 p-2.5 font-bold border-b border-slate-100 text-slate-600">
                        <span>Nama Item</span>
                        <span>Stok Sisa</span>
                        <span>Status</span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 border-b border-slate-100/50 items-center">
                        <span className="font-semibold text-slate-800">Roti Cokelat</span>
                        <span className="font-mono text-slate-600">6 pcs</span>
                        <span><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">Minimum (5)</span></span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 border-b border-slate-100/50 items-center">
                        <span className="font-semibold text-slate-800">Susu Fresh</span>
                        <span className="font-mono text-rose-600 font-bold">1.2 Liter</span>
                        <span><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">Kritis (2.0)</span></span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 items-center">
                        <span className="font-semibold text-slate-800">Kopi Blend House</span>
                        <span className="font-mono text-slate-600">4.0 Kg</span>
                        <span><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Aman (2.0)</span></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Bahan Tab Mock */}
                {activeFeatureTab === "bahan" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Simulasi Resep Menu: Es Kopi Susu</h4>
                      <p className="text-[11px] text-slate-500 mb-3">Setiap kali 1 Es Kopi Susu terjual, sistem otomatis memotong stok bahan baku berikut:</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200/60">
                          <span className="font-medium text-slate-700">1. Susu Fresh</span>
                          <span className="font-mono font-bold text-rose-600">-120 ml</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200/60">
                          <span className="font-medium text-slate-700">2. Kopi Blend House</span>
                          <span className="font-mono font-bold text-slate-600">-25 gram</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200/60">
                          <span className="font-medium text-slate-700">3. Gula Cair</span>
                          <span className="font-mono font-bold text-slate-600">-30 ml</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs p-3 bg-sky-50/80 rounded-xl border border-sky-100">
                      <div className="text-slate-600">Harga Jual: <strong className="text-slate-800">Rp16.000</strong></div>
                      <div className="text-slate-600">Total HPP Bahan: <strong className="text-slate-800">Rp6.500</strong></div>
                      <div className="text-[#0369a1] font-bold">Margin Keuntungan: +146%</div>
                    </div>
                  </div>
                )}

                {/* 4. Laporan Tab Mock */}
                {activeFeatureTab === "laporan" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Omset Hari Ini</span>
                        <span className="text-sm font-extrabold text-[#0369a1]">Rp1.240.000</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Laba Kotor</span>
                        <span className="text-sm font-extrabold text-teal-600">Rp780.000</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Transaksi</span>
                        <span className="text-sm font-extrabold text-slate-700">42 Struk</span>
                      </div>
                    </div>

                    {/* SVG mini chart mockup */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                        <span>Grafik Penjualan 7 Hari Terakhir</span>
                        <span className="text-[10px] text-slate-400 font-medium">Minggu Ini</span>
                      </div>
                      <div className="h-28 w-full flex items-end justify-between pt-4 pb-2 px-3 bg-white rounded-lg border border-slate-100">
                        {[40, 65, 50, 85, 70, 95, 110].map((height, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 w-7">
                            <div 
                              className="w-4 bg-gradient-to-t from-[#0369a1] to-sky-400 rounded-t-sm transition-all hover:opacity-85"
                              style={{ height: `${height}px` }}
                            />
                            <span className="text-[8px] font-bold text-slate-400">H-{6-i}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Explanatory text under preview */}
              <div className="text-[11px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-3 flex items-center justify-center gap-1">
                <Sparkles className="size-3 text-amber-500" />
                Semua data tersinkronisasi otomatis ke cloud server Supabase secara real-time.
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-16 md:py-24 border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#0369a1] uppercase tracking-widest bg-sky-50 border border-sky-100 rounded-full px-3 py-1">Biaya Langganan</span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-slate-900 tracking-tight mt-3">
              Paket Harga Langganan Fleksibel
            </h2>
            <p className="text-[15px] text-slate-600 mt-2">
              Tidak ada biaya tersembunyi. Mulai gratis 30 hari, ganti paket atau batalkan langganan kapan saja.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-[#0369a1] font-bold" : "text-slate-500"}`}>Bulanan</span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-12 h-6.5 bg-slate-200 rounded-full p-0.5 relative transition-colors cursor-pointer"
              >
                <div className={`size-5.5 rounded-full bg-[#0369a1] shadow-sm transform transition-transform ${billingCycle === "yearly" ? "translate-x-5.5" : "translate-x-0"}`} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${billingCycle === "yearly" ? "text-[#0369a1] font-bold" : "text-slate-500"}`}>Tahunan</span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  Hemat 20%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing cards grid */}
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2 mt-8">
            
            {/* Plan 1: Core */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 relative group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[16px] font-bold text-slate-900">Mava Core</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">Trial Tersedia</span>
                </div>
                <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">Cocok untuk pedagang kaki lima, warung kecil, laundry, dan outlet baru digital.</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === "monthly" ? "Rp169.000" : "Rp135.000"}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/ outlet / bulan</span>
                  {billingCycle === "yearly" && (
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Ditagih Rp1.620.000 secara tahunan</p>
                  )}
                </div>

                <hr className="border-slate-100 my-4" />

                <ul className="space-y-3 mb-6">
                  {[
                    "Hingga 30 Daftar Produk",
                    "Hingga 2 Staf Kasir",
                    "Catat Transaksi Penjualan Unlimited",
                    "Struk Digital (Kirim via WhatsApp)",
                    "Laporan Harian & Bulanan Dasar"
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                      <Check className="size-4 text-[#0369a1] shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className="w-full h-10.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-700 flex items-center justify-center transition-all mt-4 cursor-pointer"
              >
                Coba Gratis 30 Hari
              </Link>
            </div>

            {/* Plan 2: Basic (Recommended) */}
            <div className="bg-white rounded-2xl border-2 border-[#0369a1] p-6 flex flex-col justify-between shadow-xl shadow-[#0369a1]/5 relative group overflow-hidden scale-[1.01]">
              <span className="absolute top-0 right-0 rounded-bl-xl bg-[#0369a1] text-white font-extrabold text-[9px] px-3 py-1.5 uppercase tracking-wider">
                Terpopuler
              </span>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[16px] font-bold text-slate-900">Mava Basic</h3>
                </div>
                <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">Dirancang untuk Cafe, Depot FnB, Restoran, Toko Kelontong, & Retail berkembang.</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === "monthly" ? "Rp349.000" : "Rp279.000"}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/ outlet / bulan</span>
                  {billingCycle === "yearly" && (
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Ditagih Rp3.348.000 secara tahunan</p>
                  )}
                </div>

                <hr className="border-slate-100 my-4" />

                <ul className="space-y-3 mb-6">
                  {[
                    "Semua fitur Mava Core",
                    "Unlimited Daftar Produk",
                    "Unlimited Staf Kasir",
                    "Laporan HPP (Harga Pokok Penjualan)",
                    "Manajemen Resep & Bahan Baku",
                    "Promo Kampanye & Diskon Member",
                    "Loyalty Point & Riwayat Pelanggan",
                    "Hapus Label Branding Mava di Struk"
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                      <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className={feat === "Manajemen Resep & Bahan Baku" || feat === "Laporan HPP (Harga Pokok Penjualan)" ? "font-semibold text-slate-800" : ""}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className="w-full h-10.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-[13px] font-bold text-white flex items-center justify-center shadow-lg shadow-[#0369a1]/25 hover:shadow-xl hover:shadow-[#0369a1]/30 transition-all mt-4 cursor-pointer"
              >
                Mulai Trial Gratis Basic
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#0369a1] uppercase tracking-widest bg-sky-50 border border-sky-100 rounded-full px-3 py-1">Pertanyaan Umum</span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-slate-900 tracking-tight mt-3">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-[15px] text-slate-600 mt-2">
              Punya pertanyaan seputar Mavapos? Temukan jawabannya di bawah ini.
            </p>
          </div>

          {/* Accordion Questions */}
          <div className="space-y-3">
            {[
              {
                q: "Apakah ada masa percobaan gratis?",
                a: "Ya! Anda dapat menggunakan seluruh fitur Mavapos secara gratis selama 30 hari pertama tanpa perlu memasukkan informasi kartu kredit atau detail pembayaran apa pun. Cukup daftar dan mulai."
              },
              {
                q: "Apakah data transaksi saya aman di cloud?",
                a: "Sangat aman. Semua data Anda dienkripsi secara otomatis dan disimpan di cloud server profesional yang didukung oleh Supabase Database. Cadangan (backup) berkala dilakukan untuk memastikan data penjualan Anda tidak hilang."
              },
              {
                q: "Dapatkah saya menggunakan printer struk bluetooth?",
                a: "Tentu saja. Mavapos mendukung berbagai jenis printer thermal bluetooth/USB ukuran 58mm maupun 80mm pada perangkat Android, iOS, maupun laptop/komputer."
              },
              {
                q: "Apakah Mavapos bisa digunakan secara offline?",
                a: "Mavapos dirancang berbasis cloud agar data antar staf, stok gudang, dan laporan laba rugi owner selalu ter-sinkronisasi real-time. Namun, antarmuka kasir mobile dilengkapi dengan penyimpanan cache agar transaksi tetap dapat berlangsung saat sinyal internet putus sesaat."
              },
              {
                q: "Bagaimana cara melakukan upgrade atau downgrade paket?",
                a: "Anda dapat dengan mudah menaikkan (upgrade), menurunkan (downgrade), atau membatalkan paket langganan Anda kapan saja langsung melalui menu Pengaturan Billing di dashboard Mavapos Anda."
              }
            ].map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i} className="rounded-xl border border-slate-200 overflow-hidden transition-all bg-[#fafbfc]/50 hover:bg-slate-50/50">
                  <button
                    onClick={() => toggleFaq(i)}
                    type="button"
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-[14px] text-slate-800 focus:outline-none cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-4 text-[#0369a1] shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`size-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-48 opacity-100 border-t border-slate-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <p className="p-4 text-xs md:text-sm text-slate-500 leading-relaxed bg-white">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CTA Conversion Block */}
      <section className="py-16 bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0369a1] to-[#075985] px-6 py-12 text-center text-white sm:px-12 shadow-xl shadow-[#0369a1]/10">
            
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />
            
            <div className="relative max-w-2xl mx-auto flex flex-col items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-200">
                <BadgePercent className="size-4" />
                Mulai Digitalisasi Sekarang
              </span>
              <h2 className="text-[26px] md:text-[34px] font-extrabold tracking-tight">
                Siap Tingkatkan Efisiensi Bisnis Anda?
              </h2>
              <p className="text-[14px] md:text-[15px] text-sky-100 max-w-lg leading-relaxed">
                Setup toko dalam 5 menit. Dapatkan free trial 30 hari akses penuh, tanpa biaya pembatalan.
              </p>
              
              <Link
                href="/login"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-7 text-[14px] font-extrabold text-[#0369a1] shadow-lg shadow-black/5 hover:bg-sky-50 active:translate-y-px transition-all hover:scale-[1.02] cursor-pointer"
              >
                Coba Gratis 30 Hari
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          
          <div className="flex flex-col sm:items-start items-center gap-3">
            <Image
              src="/2.png"
              alt="MAVA Logo"
              width={80}
              height={32}
              className="block object-contain opacity-75"
              draggable={false}
            />
            <p className="text-[12px] text-slate-400">
              Aplikasi Kasir Cloud Modern & Manajemen Bahan Baku Terintegrasi.
            </p>
          </div>

          <div className="flex flex-col sm:items-end items-center gap-2">
            <div className="flex gap-4 text-xs font-semibold text-slate-500">
              <Link href="#simulator" className="hover:text-[#0369a1] transition-colors">Simulator</Link>
              <span className="text-slate-200">•</span>
              <Link href="#fitur" className="hover:text-[#0369a1] transition-colors">Fitur</Link>
              <span className="text-slate-200">•</span>
              <Link href="#harga" className="hover:text-[#0369a1] transition-colors">Harga</Link>
              <span className="text-slate-200">•</span>
              <Link href="/login" className="hover:text-[#0369a1] transition-colors">Dashboard</Link>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              &copy; {new Date().getFullYear()} mavapos.id. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </main>
  );
}
