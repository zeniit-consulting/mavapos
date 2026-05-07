import {
  BadgePercent,
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AuthUser,
  Expense,
  Ingredient,
  MenuLabel,
  Product,
  ProductRecipe,
  Promo,
  StaffMember,
} from "./types";

export const initialProducts: Product[] = [
  {
    id: 1,
    name: "Nasi Ayam Geprek",
    category: "FnB",
    price: 18000,
    stock: 18,
    tag: "Terlaris",
    image:
      "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "Es Kopi Susu",
    category: "FnB",
    price: 16000,
    stock: 24,
    tag: "Promo",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Mie Goreng Spesial",
    category: "FnB",
    price: 22000,
    stock: 11,
    tag: "Dapur",
    image:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "Roti Cokelat",
    category: "Retail",
    price: 8500,
    stock: 6,
    tag: "Stok tipis",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "Air Mineral 600ml",
    category: "Retail",
    price: 5000,
    stock: 42,
    tag: "Cepat",
    image:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "Snack Kentang",
    category: "Retail",
    price: 12000,
    stock: 15,
    tag: "Barcode",
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
  },
];

export const initialCategories = ["FnB", "Retail"];

export const initialIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Es batu",
    unit: "kg",
    stock: 14,
    minStock: 5,
    costPerUnit: 3500,
    usedFor: ["Es teh", "Es kopi susu"],
  },
  {
    id: 2,
    name: "Teh celup",
    unit: "box",
    stock: 9,
    minStock: 4,
    costPerUnit: 18500,
    usedFor: ["Es teh"],
  },
  {
    id: 3,
    name: "Gula cair",
    unit: "liter",
    stock: 7,
    minStock: 3,
    costPerUnit: 12000,
    usedFor: ["Es teh", "Es kopi susu"],
  },
  {
    id: 4,
    name: "Kopi blend house",
    unit: "kg",
    stock: 4,
    minStock: 2,
    costPerUnit: 145000,
    usedFor: ["Es kopi susu"],
  },
  {
    id: 5,
    name: "Susu fresh",
    unit: "liter",
    stock: 6,
    minStock: 2,
    costPerUnit: 21000,
    usedFor: ["Es kopi susu"],
  },
];

export const initialExpenses: Expense[] = [
  {
    id: 1,
    title: "Belanja bahan minuman",
    category: "Bahan baku",
    amount: 285000,
    date: "2026-05-06",
    paymentMethod: "Transfer",
    note: "Restock teh, gula, dan susu",
    status: "Tercatat",
  },
  {
    id: 2,
    title: "Pembelian gas dapur",
    category: "Operasional",
    amount: 95000,
    date: "2026-05-05",
    paymentMethod: "Kas outlet",
    note: "Untuk kebutuhan dapur harian",
    status: "Tercatat",
  },
  {
    id: 3,
    title: "Servis blender bar",
    category: "Peralatan",
    amount: 65000,
    date: "2026-05-03",
    paymentMethod: "Tunai",
    note: "Ganti karet seal",
    status: "Draft",
  },
];

export const initialRecipes: ProductRecipe[] = [
  {
    productId: 2,
    ingredientId: 1,
    qty: 0.15,
  },
  {
    productId: 2,
    ingredientId: 3,
    qty: 0.03,
  },
  {
    productId: 2,
    ingredientId: 4,
    qty: 0.025,
  },
  {
    productId: 2,
    ingredientId: 5,
    qty: 0.12,
  },
];

export const defaultProductImage = "/mava-logo.png";

export const promoSlides = [
  {
    title: "Diskon kopi sore",
    description: "Diskon Rp6.000 untuk Es Kopi Susu setiap pukul 15.00-18.00.",
    cta: "Berlaku hari ini",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Member loyalty",
    description: "Pelanggan mendapat 1 poin setiap belanja Rp10.000.",
    cta: "Paket Basic",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Bundle menu cepat",
    description: "Paket makan + minum untuk menaikkan rata-rata nilai transaksi.",
    cta: "Siap dicoba",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  },
];

export const initialPromos: Promo[] = [
  {
    id: 1,
    name: "Diskon kopi sore",
    code: "DISKONKOPISORE",
    type: "Diskon nominal",
    target: "Es Kopi Susu",
    value: "Rp6.000",
    period: "15.00-18.00",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Member loyalty",
    code: "MEMBERLOYALTY",
    type: "Loyalty poin",
    target: "Semua produk",
    value: "1 poin / Rp10.000",
    period: "Setiap hari",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Bundle menu cepat",
    code: "BUNDLECEPAT",
    type: "Bundle",
    target: "Makanan + Minuman",
    value: "Harga paket",
    period: "Draft kampanye",
    status: "Draft",
  },
];

export const initialStaffMembers: StaffMember[] = [
  {
    id: 1,
    name: "Ayu Lestari",
    role: "Kasir",
    phone: "0812-3456-7788",
    shift: "Pagi",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Rafi Pratama",
    role: "Kasir",
    phone: "0812-8899-1100",
    shift: "Sore",
    status: "Aktif",
  },
];

export const saasPlans = [
  {
    name: "Core",
    price: "Rp169.000",
    status: "Aktif",
    description: "Paket kasir ringan untuk outlet yang baru mulai digital.",
    features: [
      "Hingga 30 produk",
      "Transaksi unlimited",
      "Laporan harian & bulanan",
      "Struk digital via WhatsApp",
      "Hingga 2 staf kasir",
    ],
  },
  {
    name: "Basic",
    price: "Rp349.000",
    status: "Upgrade",
    description: "Untuk outlet yang butuh laporan margin dan loyalty member.",
    features: [
      "Laporan HPP & profit margin",
      "Export PDF",
      "Member & loyalty poin",
      "Struk digital tanpa branding Mava",
      "Campaign promo lebih lengkap",
    ],
  },
];

export const menu = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Kasir", icon: ShoppingCart },
  { label: "Laporan", icon: BarChart3 },
  { label: "Produk & Stok", icon: Boxes },
  { label: "Bahan", icon: Package },
  { label: "Pengeluaran", icon: ReceiptText },
  { label: "Promo", icon: BadgePercent },
  { label: "Staf", icon: Users },
  { label: "Pengaturan", icon: Settings },
] satisfies { label: MenuLabel; icon: LucideIcon }[];

export const menuRoutes: Record<MenuLabel, string> = {
  Dashboard: "/dashboard",
  Kasir: "/kasir",
  Laporan: "/laporan",
  "Produk & Stok": "/produk",
  Bahan: "/bahan",
  Pengeluaran: "/pengeluaran",
  Promo: "/promo",
  Staf: "/staf",
  Pengaturan: "/pengaturan",
};

export const demoUsers = [
  {
    email: "owner@mavapos.id",
    password: "mava12345",
    user: {
      name: "Ayu Owner",
      email: "owner@mavapos.id",
      role: "Owner",
      outlet: "Outlet Mava Demo",
    },
  },
  {
    email: "kasir@mavapos.id",
    password: "mava12345",
    user: {
      name: "Ayu Kasir",
      email: "kasir@mavapos.id",
      role: "Kasir",
      outlet: "Outlet Mava Demo",
    },
  },
] satisfies { email: string; password: string; user: AuthUser }[];
