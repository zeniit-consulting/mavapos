"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  HomeIcon,
  Minus,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  tag: string;
  image: string;
};

type CartItem = Product & {
  qty: number;
};

type ProductForm = Omit<Product, "id">;

type CategoryForm = {
  name: string;
};

type Promo = {
  id: number;
  name: string;
  type: string;
  target: string;
  value: string;
  period: string;
  status: "Aktif" | "Draft";
};

type PromoForm = Omit<Promo, "id">;

type StaffMember = {
  id: number;
  name: string;
  role: "Kasir";
  phone: string;
  shift: "Pagi" | "Sore";
  status: "Aktif" | "Nonaktif";
};

type StaffForm = Omit<StaffMember, "id">;

type PaymentMethod = "Tunai" | "QRIS";

type AuthRole = "Owner" | "Kasir";

type AuthUser = {
  name: string;
  email: string;
  role: AuthRole;
  outlet: string;
};

type LoginForm = {
  email: string;
  password: string;
};

type AuthMode = "login" | "register" | "forgot" | "update-password";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  outlet: string;
  businessType: "FnB" | "Retail";
  whatsapp: string;
};

type NewPasswordForm = {
  password: string;
  confirmPassword: string;
};

export type MenuLabel = "Kasir" | "Laporan" | "Produk & Stok" | "Promo" | "Staf" | "Paket SaaS" | "Pengaturan";

const initialProducts: Product[] = [
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

const initialCategories = ["FnB", "Retail"];

const defaultProductImage =
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=600&q=80";

const promoSlides = [
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

const initialPromos: Promo[] = [
  {
    id: 1,
    name: "Diskon kopi sore",
    type: "Diskon nominal",
    target: "Es Kopi Susu",
    value: "Rp6.000",
    period: "15.00-18.00",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Member loyalty",
    type: "Loyalty poin",
    target: "Semua produk",
    value: "1 poin / Rp10.000",
    period: "Setiap hari",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Bundle menu cepat",
    type: "Bundle",
    target: "Makanan + Minuman",
    value: "Harga paket",
    period: "Draft kampanye",
    status: "Draft",
  },
];

const initialStaffMembers: StaffMember[] = [
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

const saasPlans = [
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

const menu = [
  { label: "Kasir", icon: ShoppingCart },
  { label: "Laporan", icon: BarChart3 },
  { label: "Produk & Stok", icon: Boxes },
  { label: "Promo", icon: BadgePercent },
  { label: "Staf", icon: Users },
  { label: "Paket SaaS", icon: Sparkles },
  { label: "Pengaturan", icon: Settings },
] satisfies { label: MenuLabel; icon: typeof ShoppingCart }[];

const menuRoutes: Record<MenuLabel, string> = {
  Kasir: "/kasir",
  Laporan: "/laporan",
  "Produk & Stok": "/produk",
  Promo: "/promo",
  Staf: "/staf",
  "Paket SaaS": "/paket",
  Pengaturan: "/pengaturan",
};

const demoUsers = [
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

function mapSupabaseUser(user: {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    role?: string;
    outlet?: string;
  };
}): AuthUser {
  const role = user.user_metadata?.role === "Kasir" ? "Kasir" : "Owner";
  const email = user.email ?? "";

  return {
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split("@")[0] ?? "User",
    email,
    role,
    outlet: user.user_metadata?.outlet ?? "Outlet Mava Demo",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function MavaLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/2.png"
      alt="MAVA"
      width={120}
      height={48}
      className={`block object-contain ${className}`}
      draggable={false}
    />
  );
}

function LoginLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/3.png"
      alt="MAVA"
      width={160}
      height={64}
      className={`block object-contain ${className}`}
      priority
      draggable={false}
    />
  );
}

function SplashScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0369a1] px-8">
      <LoginLogo className="h-auto w-[min(68vw,360px)]" />
    </main>
  );
}

export default function MavaposShell({
  initialMenu = "Kasir",
}: {
  initialMenu?: MenuLabel;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	  const [authSource, setAuthSource] = useState<"supabase" | "demo" | null>(null);
	  const [authMode, setAuthMode] = useState<AuthMode>("login");
	  const [loginForm, setLoginForm] = useState<LoginForm>({
	    email: "",
	    password: "",
	  });
	  const [registerForm, setRegisterForm] = useState<RegisterForm>({
	    name: "",
	    email: "",
	    password: "",
	    outlet: "",
	    businessType: "FnB",
	    whatsapp: "",
	  });
	  const [forgotEmail, setForgotEmail] = useState("");
	  const [newPasswordForm, setNewPasswordForm] = useState<NewPasswordForm>({
	    password: "",
	    confirmPassword: "",
	  });
	  const [authError, setAuthError] = useState("");
	  const [authNotice, setAuthNotice] = useState("");
	  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [promos, setPromos] = useState<Promo[]>(initialPromos);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [activeMenu, setActiveMenu] = useState<MenuLabel>(initialMenu);
  const [cart, setCart] = useState<CartItem[]>([
    { ...initialProducts[0], qty: 1 },
    { ...initialProducts[1], qty: 2 },
  ]);
  const [category, setCategory] = useState("Semua");
  const [promoIndex, setPromoIndex] = useState(0);
  const [productQuery, setProductQuery] = useState("");
  const [productModal, setProductModal] = useState<"create" | "edit" | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [promoModal, setPromoModal] = useState<"create" | "edit" | null>(null);
  const [staffModal, setStaffModal] = useState<"create" | "edit" | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [cashReceived, setCashReceived] = useState(50000);
  const [paymentStep, setPaymentStep] = useState<"form" | "success">("form");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deletePromo, setDeletePromo] = useState<Promo | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    category: "FnB",
    price: 0,
    stock: 0,
    tag: "",
    image: defaultProductImage,
  });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "" });
  const [promoForm, setPromoForm] = useState<PromoForm>({
    name: "",
    type: "Diskon nominal",
    target: "",
    value: "",
    period: "",
    status: "Aktif",
  });
  const [staffForm, setStaffForm] = useState<StaffForm>({
    name: "",
    role: "Kasir",
    phone: "",
    shift: "Pagi",
    status: "Aktif",
  });

  const filteredProducts = products.filter((product) => {
    return category === "Semua" || product.category === category;
  });
  const managedProducts = products.filter((product) => {
    const query = productQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [product.name, product.category, product.tag].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
  const lowStockCount = products.filter((product) => product.stock <= 10).length;
  const productUsage = Math.min((products.length / 30) * 100, 100);
  const activePromoCount = promos.filter((promo) => promo.status === "Aktif").length;
  const activeStaffCount = staffMembers.filter((staff) => staff.status === "Aktif").length;

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const discount = subtotal > 0 ? Math.min(6000, subtotal) : 0;
  const total = subtotal - discount;
  const cashChange = Math.max(cashReceived - total, 0);
  const isPaymentReady = total > 0 && (paymentMethod === "QRIS" || cashReceived >= total);
  const canManageOutlet = authUser?.role === "Owner";
  const accessibleMenu = canManageOutlet
    ? menu
    : menu.filter((item) => item.label === "Kasir");

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1100);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session?.user) {
        setAuthUser(mapSupabaseUser(data.session.user));
        setAuthSource("supabase");
      } else {
        const storedSession = window.localStorage.getItem("mavapos.session");

        if (storedSession) {
          try {
            setAuthUser(JSON.parse(storedSession) as AuthUser);
            setAuthSource("demo");
          } catch {
            window.localStorage.removeItem("mavapos.session");
          }
        }
      }

      setAuthReady(true);
    });

    const {
      data: { subscription },
	    } = supabase.auth.onAuthStateChange((event, session) => {
	      if (event === "PASSWORD_RECOVERY") {
	        setAuthMode("update-password");
	        setAuthError("");
	        setAuthNotice("Masukkan password baru untuk menyelesaikan pemulihan akun.");
	      }

	      if (session?.user) {
	        setAuthUser(mapSupabaseUser(session.user));
	        setAuthSource("supabase");
        window.localStorage.removeItem("mavapos.session");
      } else if (authSource === "supabase") {
        setAuthUser(null);
        setAuthSource(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authSource, supabase]);

  useEffect(() => {
    if (activeMenu !== "Kasir") {
      return;
    }

    const timer = window.setInterval(() => {
      setPromoIndex((index) => (index + 1) % promoSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [activeMenu]);

  function changeMenu(menuLabel: MenuLabel) {
    if (!canManageOutlet && menuLabel !== "Kasir") {
      return;
    }

    if (menuLabel === activeMenu) {
      return;
    }

    setIsPageLoading(true);
    setActiveMenu(menuLabel);
    window.setTimeout(() => setIsPageLoading(false), 520);
  }

  function addToCart(product: Product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);

      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [...items, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: number, change: number) {
    setCart((items) =>
      items
        .map((item) => (item.id === id ? { ...item, qty: item.qty + change } : item))
        .filter((item) => item.qty > 0),
    );
  }

  function openPaymentModal() {
    setPaymentStep("form");
    setCashReceived((value) => Math.max(value, total));
    setPaymentModal(true);
  }

  function confirmPayment() {
    if (!isPaymentReady) {
      return;
    }

    setPaymentStep("success");
  }

  function finishPayment() {
    setCart([]);
    setPaymentModal(false);
    setPaymentStep("form");
  }

  function openCreateProduct() {
    setProductForm({
      name: "",
      category: "FnB",
      price: 0,
      stock: 0,
      tag: "",
      image: defaultProductImage,
    });
    setEditingProductId(null);
    setProductModal("create");
  }

  function openEditProduct(product: Product) {
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      tag: product.tag,
      image: product.image,
    });
    setEditingProductId(product.id);
    setProductModal("edit");
  }

  function closeProductModal() {
    setProductModal(null);
    setEditingProductId(null);
  }

  function saveProduct() {
    const normalizedForm = {
      ...productForm,
      name: productForm.name.trim(),
      tag: productForm.tag.trim() || "Reguler",
      image: productForm.image || defaultProductImage,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };

    if (!normalizedForm.name || normalizedForm.price < 0 || normalizedForm.stock < 0) {
      return;
    }

    if (productModal === "edit" && editingProductId) {
      setProducts((items) =>
        items.map((item) =>
          item.id === editingProductId ? { ...item, ...normalizedForm } : item,
        ),
      );
      setCart((items) =>
        items.map((item) =>
          item.id === editingProductId ? { ...item, ...normalizedForm } : item,
        ),
      );
    } else {
      setProducts((items) => [
        ...items,
        {
          id: Math.max(0, ...items.map((item) => item.id)) + 1,
          ...normalizedForm,
        },
      ]);
    }

    closeProductModal();
  }

  function confirmDeleteProduct() {
    if (!deleteProduct) {
      return;
    }

    setProducts((items) => items.filter((item) => item.id !== deleteProduct.id));
    setCart((items) => items.filter((item) => item.id !== deleteProduct.id));
    setDeleteProduct(null);
  }

  function openCreatePromo() {
    setPromoForm({
      name: "",
      type: "Diskon nominal",
      target: "",
      value: "",
      period: "",
      status: "Aktif",
    });
    setEditingPromoId(null);
    setPromoModal("create");
  }

  function openEditPromo(promo: Promo) {
    setPromoForm({
      name: promo.name,
      type: promo.type,
      target: promo.target,
      value: promo.value,
      period: promo.period,
      status: promo.status,
    });
    setEditingPromoId(promo.id);
    setPromoModal("edit");
  }

  function closePromoModal() {
    setPromoModal(null);
    setEditingPromoId(null);
  }

  function savePromo() {
    const normalizedForm = {
      ...promoForm,
      name: promoForm.name.trim(),
      target: promoForm.target.trim(),
      value: promoForm.value.trim(),
      period: promoForm.period.trim(),
    };

    if (!normalizedForm.name || !normalizedForm.target || !normalizedForm.value) {
      return;
    }

    if (promoModal === "edit" && editingPromoId) {
      setPromos((items) =>
        items.map((item) => (item.id === editingPromoId ? { ...item, ...normalizedForm } : item)),
      );
    } else {
      setPromos((items) => [
        ...items,
        {
          id: Math.max(0, ...items.map((item) => item.id)) + 1,
          ...normalizedForm,
        },
      ]);
    }

    closePromoModal();
  }

  function confirmDeletePromo() {
    if (!deletePromo) {
      return;
    }

    setPromos((items) => items.filter((item) => item.id !== deletePromo.id));
    setDeletePromo(null);
  }

  function openCreateStaff() {
    setStaffForm({
      name: "",
      role: "Kasir",
      phone: "",
      shift: "Pagi",
      status: "Aktif",
    });
    setEditingStaffId(null);
    setStaffModal("create");
  }

  function openEditStaff(staff: StaffMember) {
    setStaffForm({
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      shift: staff.shift,
      status: staff.status,
    });
    setEditingStaffId(staff.id);
    setStaffModal("edit");
  }

  function closeStaffModal() {
    setStaffModal(null);
    setEditingStaffId(null);
  }

  function saveStaff() {
    const normalizedForm = {
      ...staffForm,
      name: staffForm.name.trim(),
      phone: staffForm.phone.trim(),
    };

    if (!normalizedForm.name || !normalizedForm.phone) {
      return;
    }

    if (staffModal === "edit" && editingStaffId) {
      setStaffMembers((items) =>
        items.map((item) => (item.id === editingStaffId ? { ...item, ...normalizedForm } : item)),
      );
    } else if (staffMembers.length < 2) {
      setStaffMembers((items) => [
        ...items,
        {
          id: Math.max(0, ...items.map((item) => item.id)) + 1,
          ...normalizedForm,
        },
      ]);
    }

    closeStaffModal();
  }

  function confirmDeleteStaff() {
    if (!deleteStaff) {
      return;
    }

    setStaffMembers((items) => items.filter((item) => item.id !== deleteStaff.id));
    setDeleteStaff(null);
  }

  function saveCategory() {
    const name = categoryForm.name.trim();

    if (!name || categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setCategories((items) => [...items, name]);
    setCategoryForm({ name: "" });
    setCategoryModal(false);
  }

	  async function login(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    const normalizedEmail = loginForm.email.trim().toLowerCase();
	
	    const { data, error } = await supabase.auth.signInWithPassword({
	      email: normalizedEmail,
      password: loginForm.password,
    });

    if (!error && data.user) {
      const user = mapSupabaseUser(data.user);
	      setAuthUser(user);
	      setAuthSource("supabase");
	      window.localStorage.removeItem("mavapos.session");
	      setAuthSubmitting(false);
	      return;
	    }

    const matchedUser = demoUsers.find(
      (item) =>
        item.email === normalizedEmail &&
        item.password === loginForm.password,
    );

	    if (!matchedUser) {
	      setAuthError(error?.message ?? "Email atau password tidak sesuai.");
	      setAuthSubmitting(false);
	      return;
	    }
	
	    setAuthUser(matchedUser.user);
	    setAuthSource("demo");
	    setAuthError("");
	    window.localStorage.setItem("mavapos.session", JSON.stringify(matchedUser.user));
	    setAuthSubmitting(false);
	  }
	
	  async function register(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    const normalizedEmail = registerForm.email.trim().toLowerCase();
	
	    if (registerForm.password.length < 8) {
	      setAuthError("Password minimal 8 karakter.");
	      setAuthSubmitting(false);
	      return;
	    }
	
	    const { data, error } = await supabase.auth.signUp({
	      email: normalizedEmail,
	      password: registerForm.password,
	      options: {
	        emailRedirectTo: window.location.origin,
	        data: {
	          full_name: registerForm.name.trim(),
	          role: "Owner",
	          outlet: registerForm.outlet.trim(),
	          business_type: registerForm.businessType,
	          whatsapp: registerForm.whatsapp.trim(),
	        },
	      },
	    });
	
	    if (error) {
	      setAuthError(error.message);
	      setAuthSubmitting(false);
	      return;
	    }
	
	    if (data.session?.user) {
	      setAuthUser(mapSupabaseUser(data.session.user));
	      setAuthSource("supabase");
	      window.localStorage.removeItem("mavapos.session");
	    } else {
	      setAuthMode("login");
	      setLoginForm((form) => ({ ...form, email: normalizedEmail, password: "" }));
	      setAuthNotice("Registrasi berhasil. Cek email untuk verifikasi sebelum masuk.");
	    }
	
	    setRegisterForm({
	      name: "",
	      email: "",
	      password: "",
	      outlet: "",
	      businessType: "FnB",
	      whatsapp: "",
	    });
	    setAuthSubmitting(false);
	  }
	
	  async function requestPasswordReset(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    const email = forgotEmail.trim().toLowerCase();
	    const { error } = await supabase.auth.resetPasswordForEmail(email, {
	      redirectTo: window.location.origin,
	    });
	
	    if (error) {
	      setAuthError(error.message);
	    } else {
	      setAuthNotice("Link reset password sudah dikirim jika email terdaftar.");
	      setAuthMode("login");
	      setLoginForm((form) => ({ ...form, email, password: "" }));
	      setForgotEmail("");
	    }
	
	    setAuthSubmitting(false);
	  }
	
	  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    if (newPasswordForm.password.length < 8) {
	      setAuthError("Password baru minimal 8 karakter.");
	      setAuthSubmitting(false);
	      return;
	    }
	
	    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
	      setAuthError("Konfirmasi password belum sama.");
	      setAuthSubmitting(false);
	      return;
	    }
	
	    const { error } = await supabase.auth.updateUser({
	      password: newPasswordForm.password,
	    });
	
	    if (error) {
	      setAuthError(error.message);
	    } else {
	      setAuthMode("login");
	      setNewPasswordForm({ password: "", confirmPassword: "" });
	      setAuthNotice("Password berhasil diperbarui. Silakan masuk kembali.");
	      await supabase.auth.signOut();
	    }
	
	    setAuthSubmitting(false);
	  }

	  async function logout() {
	    if (authSource === "supabase") {
	      await supabase.auth.signOut();
	    }

    setAuthUser(null);
    setAuthSource(null);
	    setActiveMenu("Kasir");
	    window.localStorage.removeItem("mavapos.session");
	  }
	
		  const authCopy = {
		    login: {
		      title: "Masuk ke dashboard",
		      description: "Kelola transaksi, stok, promo, dan laporan outlet dari satu tempat.",
		    },
		    register: {
		      title: "Buat akun MAVA",
		      description: "Daftarkan outlet kamu untuk mulai menggunakan kasir digital.",
		    },
		    forgot: {
		      title: "Reset password",
		      description: "Masukkan email akun kamu untuk menerima tautan pemulihan.",
		    },
		    "update-password": {
		      title: "Buat password baru",
		      description: "Gunakan password baru untuk mengamankan akses akun.",
		    },
		  }[authMode];
	
	  if (showSplash || !authReady) {
    return <SplashScreen />;
  }

	  if (!authUser) {
	    return (
	      <main className="auth-scope min-h-screen bg-[#f7faf8] text-foreground">
	        <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_460px]">
		          <section className="hidden flex-col justify-between bg-[#0369a1] p-10 text-white lg:flex">
		            <div>
		              <LoginLogo className="h-9 w-36" />
		            </div>
	            <div className="max-w-xl">
	              <Badge className="bg-white text-[#075985] hover:bg-white">POS UMKM FnB & Retail</Badge>
	              <h1 className="mt-5 text-4xl font-semibold tracking-tight">
	                Operasional outlet lebih rapi dari kasir sampai laporan.
	              </h1>
	              <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
	                MAVA membantu tim FnB dan retail memproses transaksi, memantau stok, mengatur promo, dan membaca performa outlet secara praktis.
	              </p>
	            </div>
	            <div className="grid grid-cols-3 gap-3 text-sm text-white/80">
	              <div>
	                <strong className="block text-lg text-white">Kasir</strong>
	                <span>Transaksi cepat</span>
	              </div>
	              <div>
	                <strong className="block text-lg text-white">Stok</strong>
	                <span>Produk terpantau</span>
	              </div>
	              <div>
	                <strong className="block text-lg text-white">Laporan</strong>
	                <span>Data siap baca</span>
	              </div>
	            </div>
	          </section>
	
		          <section className="flex items-center justify-center px-5 py-10">
		            <form
	              onSubmit={
	                authMode === "register"
	                  ? register
	                  : authMode === "forgot"
	                    ? requestPasswordReset
	                    : authMode === "update-password"
	                      ? updatePassword
	                      : login
		              }
		              className="w-full max-w-sm rounded-lg border border-[#dde3da] bg-white p-6 shadow-sm"
		            >
		              <div className="text-center">
		                <div className="flex justify-center">
		                  <LoginLogo className="h-10 w-40" />
		                </div>
		                <h1 className="mt-6 text-xl font-semibold">{authCopy.title}</h1>
		                <p className="mt-2 text-sm leading-5 text-[#69756f]">{authCopy.description}</p>
		              </div>
	
	              {authMode !== "update-password" && (
	                <div className="mt-5 grid grid-cols-2 rounded-lg bg-[#f1f5f9] p-1 text-sm font-medium">
	                  {(["login", "register"] as const).map((mode) => (
	                    <button
	                      key={mode}
	                      type="button"
	                      onClick={() => {
	                        setAuthMode(mode);
	                        setAuthError("");
	                        setAuthNotice("");
	                      }}
	                      className={`h-9 rounded-md transition ${
	                        authMode === mode ? "bg-white text-[#075985] shadow-sm" : "text-[#66716b]"
	                      }`}
	                    >
	                      {mode === "login" ? "Masuk" : "Daftar"}
	                    </button>
	                  ))}
	                </div>
	              )}
	
	              {authMode === "login" && (
	                <div className="mt-5 grid gap-4">
	                  <div className="grid gap-2">
	                    <Label htmlFor="login-email">Email</Label>
	                    <Input
	                      id="login-email"
	                      type="email"
	                      autoComplete="username"
	                      required
	                      value={loginForm.email}
	                      onChange={(event) =>
	                        setLoginForm((form) => ({
	                          ...form,
	                          email: event.target.value,
	                        }))
	                      }
	                    />
	                  </div>
	                  <div className="grid gap-2">
	                    <div className="flex items-center justify-between gap-3">
	                      <Label htmlFor="login-password">Password</Label>
	                      <button
	                        type="button"
	                        className="text-xs font-semibold text-[#0369a1]"
	                        onClick={() => {
	                          setAuthMode("forgot");
	                          setForgotEmail(loginForm.email);
	                          setAuthError("");
	                          setAuthNotice("");
	                        }}
	                      >
	                        Lupa password?
	                      </button>
	                    </div>
	                    <Input
	                      id="login-password"
	                      type="password"
	                      autoComplete="current-password"
	                      required
	                      value={loginForm.password}
	                      onChange={(event) =>
	                        setLoginForm((form) => ({
	                          ...form,
	                          password: event.target.value,
	                        }))
	                      }
	                    />
	                  </div>
	                </div>
	              )}
	
	              {authMode === "register" && (
	                <div className="mt-5 grid gap-4">
	                  <div className="grid gap-2">
	                    <Label htmlFor="register-name">Nama owner</Label>
	                    <Input
	                      id="register-name"
	                      autoComplete="name"
	                      required
	                      value={registerForm.name}
	                      onChange={(event) =>
	                        setRegisterForm((form) => ({ ...form, name: event.target.value }))
	                      }
	                    />
	                  </div>
	                  <div className="grid gap-2">
	                    <Label htmlFor="register-email">Email</Label>
	                    <Input
	                      id="register-email"
	                      type="email"
	                      autoComplete="email"
	                      required
	                      value={registerForm.email}
	                      onChange={(event) =>
	                        setRegisterForm((form) => ({ ...form, email: event.target.value }))
	                      }
	                    />
	                  </div>
	                  <div className="grid gap-2">
	                    <Label htmlFor="register-password">Password</Label>
	                    <Input
	                      id="register-password"
	                      type="password"
	                      autoComplete="new-password"
	                      required
	                      value={registerForm.password}
	                      onChange={(event) =>
	                        setRegisterForm((form) => ({ ...form, password: event.target.value }))
	                      }
	                    />
	                  </div>
	                  <div className="grid gap-2">
	                    <Label htmlFor="register-outlet">Nama outlet</Label>
	                    <Input
	                      id="register-outlet"
	                      required
	                      value={registerForm.outlet}
	                      onChange={(event) =>
	                        setRegisterForm((form) => ({ ...form, outlet: event.target.value }))
	                      }
	                    />
	                  </div>
	                  <div className="grid grid-cols-2 gap-3">
	                    <div className="grid gap-2">
	                      <Label htmlFor="register-type">Tipe bisnis</Label>
	                      <select
	                        id="register-type"
	                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
	                        value={registerForm.businessType}
	                        onChange={(event) =>
	                          setRegisterForm((form) => ({
	                            ...form,
	                            businessType: event.target.value as RegisterForm["businessType"],
	                          }))
	                        }
	                      >
	                        <option>FnB</option>
	                        <option>Retail</option>
	                      </select>
	                    </div>
	                    <div className="grid gap-2">
	                      <Label htmlFor="register-whatsapp">WhatsApp</Label>
	                      <Input
	                        id="register-whatsapp"
	                        inputMode="tel"
	                        required
	                        value={registerForm.whatsapp}
	                        onChange={(event) =>
	                          setRegisterForm((form) => ({ ...form, whatsapp: event.target.value }))
	                        }
	                      />
	                    </div>
	                  </div>
	                </div>
	              )}
	
	              {authMode === "forgot" && (
	                <div className="mt-5 grid gap-4">
	                  <div className="grid gap-2">
	                    <Label htmlFor="forgot-email">Email akun</Label>
	                    <Input
	                      id="forgot-email"
	                      type="email"
	                      autoComplete="email"
	                      required
	                      value={forgotEmail}
	                      onChange={(event) => setForgotEmail(event.target.value)}
	                    />
	                  </div>
	                  <Button
	                    type="button"
	                    variant="ghost"
	                    className="justify-start px-0 text-[#0369a1]"
	                    onClick={() => {
	                      setAuthMode("login");
	                      setAuthError("");
	                      setAuthNotice("");
	                    }}
	                  >
	                    Kembali ke masuk
	                  </Button>
	                </div>
	              )}
	
	              {authMode === "update-password" && (
	                <div className="mt-5 grid gap-4">
	                  <div className="grid gap-2">
	                    <Label htmlFor="new-password">Password baru</Label>
	                    <Input
	                      id="new-password"
	                      type="password"
	                      autoComplete="new-password"
	                      required
	                      value={newPasswordForm.password}
	                      onChange={(event) =>
	                        setNewPasswordForm((form) => ({ ...form, password: event.target.value }))
	                      }
	                    />
	                  </div>
	                  <div className="grid gap-2">
	                    <Label htmlFor="confirm-new-password">Konfirmasi password baru</Label>
	                    <Input
	                      id="confirm-new-password"
	                      type="password"
	                      autoComplete="new-password"
	                      required
	                      value={newPasswordForm.confirmPassword}
	                      onChange={(event) =>
	                        setNewPasswordForm((form) => ({
	                          ...form,
	                          confirmPassword: event.target.value,
	                        }))
	                      }
	                    />
	                  </div>
	                </div>
	              )}
	
	              {authError && (
	                <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
	                  {authError}
	                </p>
	              )}
	              {authNotice && (
	                <p className="mt-4 rounded-lg bg-[#e0f2fe] p-3 text-sm font-medium text-[#075985]">
	                  {authNotice}
	                </p>
	              )}
	
	              <Button className="mt-5 w-full" disabled={authSubmitting} size="lg" type="submit">
	                {authMode === "register" ? (
	                  <UserPlus data-icon="inline-start" />
	                ) : (
	                  <ShieldCheck data-icon="inline-start" />
	                )}
	                {authSubmitting
	                  ? "Memproses..."
	                  : authMode === "register"
	                    ? "Daftar"
	                    : authMode === "forgot"
	                      ? "Kirim link reset"
	                      : authMode === "update-password"
	                        ? "Simpan password"
	                        : "Masuk"}
	              </Button>
	
	            </form>
	          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className={`grid min-h-screen grid-cols-1 ${
          activeMenu === "Kasir" ? "" : "lg:grid-cols-[248px_minmax(0,1fr)]"
        }`}
      >
        {activeMenu !== "Kasir" && (
	        <aside className="border-b bg-sidebar px-4 py-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
	          <div className="flex h-full flex-col">
		            <div className="flex items-center px-2">
		              <MavaLogo className="h-7 w-24" />
	            </div>

            <nav className="mt-6 grid gap-1">
	              {accessibleMenu.map((item) => (
                <button
                  key={item.label}
                  onClick={() => changeMenu(item.label)}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                    activeMenu === item.label
                      ? "bg-[#e0f2fe] text-[#075985]"
                      : "text-[#66716b] hover:bg-[#f3f6f1] hover:text-[#1f2623]"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <section className="mt-6 rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-4 lg:mt-auto">
              <div className="mb-4 flex items-center gap-3 border-b border-[#dde3da] pb-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{authUser.name}</p>
                  <p className="text-xs text-[#69756f]">{authUser.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Paket Core</p>
                <span className="rounded-md bg-[#fff4db] px-2 py-1 text-xs font-semibold text-[#8a5b00]">
                  Aktif
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-[#69756f]">Rp169.000/bulan</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span className="text-[#69756f]">Produk</span>
                    <strong>{products.length} / 30</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#e5ebe3]">
                    <div
                      className="h-2 rounded-full bg-[#0369a1]"
                      style={{ width: `${productUsage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#69756f]">Staf kasir</span>
                  <strong>{staffMembers.length} / 2</strong>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={logout}>
                Keluar
              </Button>
            </section>
          </div>
        </aside>
        )}

	        <section
	          className={`grid min-h-screen grid-cols-1 ${
	            activeMenu === "Kasir" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""
	          } ${activeMenu === "Kasir" ? "cashier-scope" : ""}`}
	        >
		          <div className="px-5 py-5 md:px-8">
		            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		              <div className="flex items-center gap-3">
		                {activeMenu === "Kasir" && (
		                  <MavaLogo className="h-7 w-24" />
		                )}
		                <div>
		                  <p className="text-sm font-medium text-[#69756f]">{authUser.outlet}</p>
		                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
		                    {activeMenu}
		                  </h1>
		                </div>
		              </div>
	              <div className="flex flex-wrap items-center gap-2">
                {activeMenu === "Produk & Stok" ? (
                  <>
                    <button
                      onClick={() => setCategoryModal(true)}
                      className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                    >
                      <Boxes size={17} />
                      Tambah kategori
                    </button>
                    <button
                      onClick={openCreateProduct}
                      className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
                    >
                      <Plus size={17} />
                      Tambah produk
                    </button>
	                  </>
	                ) : activeMenu === "Promo" ? (
	                  <button
	                    onClick={openCreatePromo}
	                    className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
	                  >
	                    <Plus size={17} />
	                    Tambah promo
	                  </button>
	                ) : activeMenu === "Staf" ? (
	                  <button
	                    onClick={openCreateStaff}
	                    disabled={staffMembers.length >= 2}
	                    className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
	                  >
	                    <UserPlus size={17} />
	                    Tambah staf
	                  </button>
	            ) : activeMenu === "Kasir" ? (
                  <>
                    {canManageOutlet && (
                      <button
                        onClick={() => changeMenu("Produk & Stok")}
                        className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                      >
                        <Boxes size={17} />
                        Produk & Stok
                      </button>
                    )}
                    <button className="flex h-10 items-center gap-2 rounded-lg border border-[#d7dfd4] bg-white px-3 text-sm font-semibold">
                      <HomeIcon size={17} />
                      Dine In
                    </button>
                    <button className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white">
                      <ReceiptText size={17} />
                      Shift {authUser.name.split(" ")[0]}
                    </button>
                    <button
                      onClick={logout}
                      className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                    >
                      Keluar
                    </button>
                  </>
                ) : null}
	              </div>
            </header>

            {activeMenu === "Produk & Stok" ? (
              <>
                <section className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ["Total produk", `${products.length}`, "Batas Core 30 produk"],
                    ["Stok rendah", `${lowStockCount}`, "Stok <= 10 perlu dicek"],
                    ["Produk aktif", `${products.filter((product) => product.stock > 0).length}`, "Siap dijual di kasir"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-lg border border-[#dde3da] bg-white p-4">
                      <p className="text-sm font-medium text-[#69756f]">{label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{note}</p>
                    </div>
                  ))}
                </section>

                <section className="mt-6 rounded-lg border border-[#dde3da] bg-white">
                  <div className="flex flex-col gap-3 border-b border-[#dde3da] p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-semibold">Data produk dan stok</h2>
                      <p className="mt-1 text-sm text-[#69756f]">
                        Kelola harga, kategori, label, dan jumlah stok untuk layar kasir.
                      </p>
                    </div>
                    <div className="relative md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]" size={18} />
                      <input
                        value={productQuery}
                        onChange={(event) => setProductQuery(event.target.value)}
                        className="h-10 w-full rounded-lg border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-sm outline-none focus:border-[#0369a1]"
                        placeholder="Cari produk atau kategori"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 md:hidden">
                    {managedProducts.map((product) => (
                      <article key={product.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
                              {product.category === "FnB" ? <Utensils size={18} /> : <Package size={18} />}
                            </div>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="mt-0.5 text-xs text-[#69756f]">
                                {product.category} · {product.tag}
                              </p>
                            </div>
                          </div>
                          <Badge variant={product.stock <= 10 ? "secondary" : "outline"}>
                            {product.stock} stok
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <strong className="text-sm text-[#0369a1]">{formatCurrency(product.price)}</strong>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditProduct(product)}
                              className="flex h-9 items-center gap-2 rounded-lg border border-[#d7dfd4] px-3 text-sm font-semibold"
                            >
                              <Edit3 size={15} />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteProduct(product)}
                              className="flex h-9 items-center gap-2 rounded-lg border border-[#f1d1d1] px-3 text-sm font-semibold text-[#b42318]"
                            >
                              <Trash2 size={15} />
                              Hapus
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table className="min-w-[600px]">
                      <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Stok</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {managedProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
                                  {product.category === "FnB" ? <Utensils size={18} /> : <Package size={18} />}
                                </div>
                                <div>
                                  <p className="font-semibold">{product.name}</p>
                                  <p className="text-xs text-[#69756f]">ID #{product.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="font-semibold text-primary">
                              {formatCurrency(product.price)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={product.stock <= 10 ? "secondary" : "outline"}>
                                {product.stock} stok
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{product.tag}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon-lg"
                                  onClick={() => openEditProduct(product)}
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Edit3 size={16} />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon-lg"
                                  onClick={() => setDeleteProduct(product)}
                                  aria-label={`Hapus ${product.name}`}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
	                </section>
	              </>
	            ) : activeMenu === "Promo" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Promo aktif", `${activePromoCount}`, "Sedang tampil di kasir"],
	                    ["Draft promo", `${promos.length - activePromoCount}`, "Belum dipakai kasir"],
	                    ["Total campaign", `${promos.length}`, "Diskon, loyalty, dan bundle"],
	                  ].map(([label, value, note]) => (
	                    <div key={label} className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <p className="text-sm font-medium text-[#69756f]">{label}</p>
	                      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
	                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{note}</p>
	                    </div>
	                  ))}
	                </section>

	                <section className="mt-6 rounded-lg border border-[#dde3da] bg-white">
	                  <div className="flex flex-col gap-3 border-b border-[#dde3da] p-4 md:flex-row md:items-center md:justify-between">
	                    <div>
	                      <h2 className="font-semibold">Manajemen promo</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Atur promo kasir untuk diskon nominal, loyalty poin, dan bundle.
	                      </p>
	                    </div>
	                    <Badge variant="outline">{activePromoCount} aktif</Badge>
	                  </div>

	                  <div className="grid gap-3 p-4 md:hidden">
	                    {promos.map((promo) => (
	                      <article key={promo.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
	                        <div className="flex items-start justify-between gap-3">
	                          <div className="min-w-0">
	                            <p className="truncate font-semibold">{promo.name}</p>
	                            <p className="mt-0.5 text-xs text-[#69756f]">
	                              {promo.type} · {promo.target}
	                            </p>
	                          </div>
	                          <Badge variant={promo.status === "Aktif" ? "default" : "secondary"}>
	                            {promo.status}
	                          </Badge>
	                        </div>
	                        <div className="mt-3 grid gap-2 text-sm">
	                          <div className="flex justify-between">
	                            <span className="text-[#69756f]">Nilai</span>
	                            <strong>{promo.value}</strong>
	                          </div>
	                          <div className="flex justify-between">
	                            <span className="text-[#69756f]">Periode</span>
	                            <strong>{promo.period}</strong>
	                          </div>
	                        </div>
	                        <div className="mt-3 flex justify-end gap-2">
	                          <Button variant="outline" size="sm" onClick={() => openEditPromo(promo)}>
	                            <Edit3 data-icon="inline-start" />
	                            Edit
	                          </Button>
	                          <Button variant="destructive" size="sm" onClick={() => setDeletePromo(promo)}>
	                            <Trash2 data-icon="inline-start" />
	                            Hapus
	                          </Button>
	                        </div>
	                      </article>
	                    ))}
	                  </div>

	                  <div className="hidden md:block">
	                    <Table className="min-w-[700px]">
	                      <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
	                        <TableRow>
	                          <TableHead>Promo</TableHead>
	                          <TableHead>Tipe</TableHead>
	                          <TableHead>Target</TableHead>
	                          <TableHead>Nilai</TableHead>
	                          <TableHead>Periode</TableHead>
	                          <TableHead>Status</TableHead>
	                          <TableHead className="text-right">Aksi</TableHead>
	                        </TableRow>
	                      </TableHeader>
	                      <TableBody>
	                        {promos.map((promo) => (
	                          <TableRow key={promo.id}>
	                            <TableCell>
	                              <div className="flex items-center gap-3">
	                                <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
	                                  <BadgePercent size={18} />
	                                </div>
	                                <div>
	                                  <p className="font-semibold">{promo.name}</p>
	                                  <p className="text-xs text-[#69756f]">ID #{promo.id}</p>
	                                </div>
	                              </div>
	                            </TableCell>
	                            <TableCell>{promo.type}</TableCell>
	                            <TableCell>{promo.target}</TableCell>
	                            <TableCell className="font-semibold text-primary">{promo.value}</TableCell>
	                            <TableCell>{promo.period}</TableCell>
	                            <TableCell>
	                              <Badge variant={promo.status === "Aktif" ? "default" : "secondary"}>
	                                {promo.status}
	                              </Badge>
	                            </TableCell>
	                            <TableCell>
	                              <div className="flex justify-end gap-2">
	                                <Button
	                                  variant="outline"
	                                  size="icon-lg"
	                                  onClick={() => openEditPromo(promo)}
	                                  aria-label={`Edit ${promo.name}`}
	                                >
	                                  <Edit3 size={16} />
	                                </Button>
	                                <Button
	                                  variant="destructive"
	                                  size="icon-lg"
	                                  onClick={() => setDeletePromo(promo)}
	                                  aria-label={`Hapus ${promo.name}`}
	                                >
	                                  <Trash2 size={16} />
	                                </Button>
	                              </div>
	                            </TableCell>
	                          </TableRow>
	                        ))}
	                      </TableBody>
	                    </Table>
	                  </div>
	                </section>
	              </>
	            ) : activeMenu === "Staf" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Staf kasir", `${staffMembers.length} / 2`, "Limit paket Core"],
	                    ["Sedang aktif", `${activeStaffCount}`, "Bisa login ke kasir"],
	                    ["Slot tersedia", `${Math.max(0, 2 - staffMembers.length)}`, "Tambah staf kasir"],
	                  ].map(([label, value, note]) => (
	                    <div key={label} className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <p className="text-sm font-medium text-[#69756f]">{label}</p>
	                      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
	                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{note}</p>
	                    </div>
	                  ))}
	                </section>

	                <section className="mt-6 rounded-lg border border-[#dde3da] bg-white">
	                  <div className="flex flex-col gap-3 border-b border-[#dde3da] p-4 md:flex-row md:items-center md:justify-between">
	                    <div>
	                      <h2 className="font-semibold">Manajemen staf</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Paket Core membatasi akses hingga 2 staf kasir.
	                      </p>
	                    </div>
	                    <Badge variant={staffMembers.length >= 2 ? "secondary" : "outline"}>
	                      {staffMembers.length >= 2 ? "Slot penuh" : "Bisa tambah staf"}
	                    </Badge>
	                  </div>

	                  <div className="grid gap-3 p-4 md:hidden">
	                    {staffMembers.map((staff) => (
	                      <article key={staff.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
	                        <div className="flex items-start justify-between gap-3">
	                          <div className="flex items-start gap-3">
	                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
	                              <UserRound size={18} />
	                            </div>
	                            <div>
	                              <p className="font-semibold">{staff.name}</p>
	                              <p className="mt-0.5 text-xs text-[#69756f]">
	                                {staff.role} · Shift {staff.shift}
	                              </p>
	                            </div>
	                          </div>
	                          <Badge variant={staff.status === "Aktif" ? "default" : "secondary"}>
	                            {staff.status}
	                          </Badge>
	                        </div>
	                        <p className="mt-3 text-sm text-[#69756f]">{staff.phone}</p>
	                        <div className="mt-3 flex justify-end gap-2">
	                          <Button variant="outline" size="sm" onClick={() => openEditStaff(staff)}>
	                            <Edit3 data-icon="inline-start" />
	                            Edit
	                          </Button>
	                          <Button variant="destructive" size="sm" onClick={() => setDeleteStaff(staff)}>
	                            <Trash2 data-icon="inline-start" />
	                            Hapus
	                          </Button>
	                        </div>
	                      </article>
	                    ))}
	                  </div>

	                  <div className="hidden md:block">
	                    <Table className="min-w-[680px]">
	                      <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
	                        <TableRow>
	                          <TableHead>Staf</TableHead>
	                          <TableHead>Role</TableHead>
	                          <TableHead>Shift</TableHead>
	                          <TableHead>Kontak</TableHead>
	                          <TableHead>Status</TableHead>
	                          <TableHead className="text-right">Aksi</TableHead>
	                        </TableRow>
	                      </TableHeader>
	                      <TableBody>
	                        {staffMembers.map((staff) => (
	                          <TableRow key={staff.id}>
	                            <TableCell>
	                              <div className="flex items-center gap-3">
	                                <div className="flex size-9 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
	                                  <UserRound size={18} />
	                                </div>
	                                <div>
	                                  <p className="font-semibold">{staff.name}</p>
	                                  <p className="text-xs text-[#69756f]">ID #{staff.id}</p>
	                                </div>
	                              </div>
	                            </TableCell>
	                            <TableCell>{staff.role}</TableCell>
	                            <TableCell>
	                              <div className="flex items-center gap-2">
	                                <CalendarDays size={16} className="text-[#69756f]" />
	                                {staff.shift}
	                              </div>
	                            </TableCell>
	                            <TableCell>{staff.phone}</TableCell>
	                            <TableCell>
	                              <Badge variant={staff.status === "Aktif" ? "default" : "secondary"}>
	                                {staff.status}
	                              </Badge>
	                            </TableCell>
	                            <TableCell>
	                              <div className="flex justify-end gap-2">
	                                <Button
	                                  variant="outline"
	                                  size="icon-lg"
	                                  onClick={() => openEditStaff(staff)}
	                                  aria-label={`Edit ${staff.name}`}
	                                >
	                                  <Edit3 size={16} />
	                                </Button>
	                                <Button
	                                  variant="destructive"
	                                  size="icon-lg"
	                                  onClick={() => setDeleteStaff(staff)}
	                                  aria-label={`Hapus ${staff.name}`}
	                                >
	                                  <Trash2 size={16} />
	                                </Button>
	                              </div>
	                            </TableCell>
	                          </TableRow>
	                        ))}
	                      </TableBody>
	                    </Table>
	                  </div>
	                </section>
		              </>
	            ) : activeMenu === "Paket SaaS" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Paket aktif", "Core", "Rp169.000/bulan"],
	                    ["Limit produk", `${products.length} / 30`, "Untuk paket Core"],
	                    ["Limit staf", `${staffMembers.length} / 2`, "Kasir aktif outlet"],
	                  ].map(([label, value, note]) => (
	                    <div key={label} className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <p className="text-sm font-medium text-[#69756f]">{label}</p>
	                      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
	                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{note}</p>
	                    </div>
	                  ))}
	                </section>

	                <section className="mt-6 grid gap-4 lg:grid-cols-2">
	                  {saasPlans.map((plan) => (
	                    <article key={plan.name} className="rounded-lg border border-[#dde3da] bg-white p-5">
	                      <div className="flex items-start justify-between gap-3">
	                        <div>
	                          <div className="flex items-center gap-2">
	                            <h2 className="text-xl font-semibold">{plan.name}</h2>
	                            <Badge variant={plan.status === "Aktif" ? "default" : "outline"}>
	                              {plan.status}
	                            </Badge>
	                          </div>
	                          <p className="mt-2 text-sm leading-6 text-[#69756f]">{plan.description}</p>
	                        </div>
	                        <Sparkles className="text-[#0369a1]" size={22} />
	                      </div>
	                      <div className="mt-5">
	                        <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
	                        <span className="ml-1 text-sm font-medium text-[#69756f]">/bulan</span>
	                      </div>
	                      <div className="mt-5 grid gap-3">
	                        {plan.features.map((feature) => (
	                          <div key={feature} className="flex items-center gap-2 text-sm">
	                            <span className="flex size-5 items-center justify-center rounded-full bg-[#e0f2fe] text-[#075985]">
	                              <Check size={13} />
	                            </span>
	                            <span>{feature}</span>
	                          </div>
	                        ))}
	                      </div>
	                      <Button className="mt-6 w-full" variant={plan.status === "Aktif" ? "outline" : "default"}>
	                        {plan.status === "Aktif" ? "Paket sedang aktif" : "Upgrade ke Basic"}
	                      </Button>
	                    </article>
	                  ))}
	                </section>

	                <section className="mt-6 rounded-lg border border-[#dde3da] bg-white p-4">
	                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
	                    <div>
	                      <h2 className="font-semibold">Ringkasan tagihan</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Tagihan berikutnya untuk paket Core akan dibuat otomatis.
	                      </p>
	                    </div>
	                    <Badge variant="outline">Jatuh tempo 12 Mei 2026</Badge>
	                  </div>
	                  <div className="mt-4 grid gap-3 md:grid-cols-3">
	                    {[
	                      ["Subtotal", "Rp169.000"],
	                      ["PPN", "Rp18.590"],
	                      ["Total estimasi", "Rp187.590"],
	                    ].map(([label, value]) => (
	                      <div key={label} className="rounded-lg bg-[#fbfcfa] p-3">
	                        <p className="text-sm text-[#69756f]">{label}</p>
	                        <p className="mt-1 font-semibold">{value}</p>
	                      </div>
	                    ))}
	                  </div>
	                </section>
	              </>
	            ) : activeMenu === "Pengaturan" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Outlet", "Mava Demo", "FnB & Retail"],
	                    ["Struk digital", "WhatsApp", "Aktif untuk paket Core"],
	                    ["Pembayaran", "Tunai + QRIS", "Metode kasir"],
	                  ].map(([label, value, note]) => (
	                    <div key={label} className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <p className="text-sm font-medium text-[#69756f]">{label}</p>
	                      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
	                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{note}</p>
	                    </div>
	                  ))}
	                </section>

	                <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
	                  <div className="rounded-lg border border-[#dde3da] bg-white">
	                    <div className="border-b border-[#dde3da] p-4">
	                      <h2 className="font-semibold">Profil outlet</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Informasi ini dipakai di struk digital dan laporan.
	                      </p>
	                    </div>
	                    <div className="grid gap-4 p-4">
	                      <div className="grid gap-2">
	                        <Label htmlFor="setting-outlet">Nama outlet</Label>
	                        <Input id="setting-outlet" defaultValue="Mava Demo" />
	                      </div>
	                      <div className="grid gap-4 sm:grid-cols-2">
	                        <div className="grid gap-2">
	                          <Label htmlFor="setting-category">Jenis usaha</Label>
	                          <select
	                            id="setting-category"
	                            defaultValue="FnB & Retail"
	                            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
	                          >
	                            <option>FnB & Retail</option>
	                            <option>FnB</option>
	                            <option>Retail</option>
	                          </select>
	                        </div>
	                        <div className="grid gap-2">
	                          <Label htmlFor="setting-phone">Nomor WhatsApp outlet</Label>
	                          <Input id="setting-phone" defaultValue="0812-0000-1048" />
	                        </div>
	                      </div>
	                      <div className="grid gap-2">
	                        <Label htmlFor="setting-address">Alamat outlet</Label>
	                        <Input id="setting-address" defaultValue="Jl. Mawar No. 18, Makassar" />
	                      </div>
	                      <Button className="w-fit">
	                        <Store data-icon="inline-start" />
	                        Simpan profil outlet
	                      </Button>
	                    </div>
	                  </div>

	                  <aside className="grid gap-4">
	                    <div className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <div className="flex items-center justify-between">
	                        <div>
	                          <h2 className="font-semibold">Struk digital</h2>
	                          <p className="mt-1 text-sm text-[#69756f]">Kirim via WhatsApp</p>
	                        </div>
	                        <Badge>Aktif</Badge>
	                      </div>
	                      <div className="mt-4 grid gap-2">
	                        {["Tampilkan logo Mava", "Kirim otomatis setelah bayar", "Sertakan link member"].map((item) => (
	                          <label key={item} className="flex items-center gap-2 text-sm">
	                            <input type="checkbox" defaultChecked className="size-4 accent-[#0369a1]" />
	                            {item}
	                          </label>
	                        ))}
	                      </div>
	                    </div>

	                    <div className="rounded-lg border border-[#dde3da] bg-white p-4">
	                      <div className="flex items-center justify-between">
	                        <div>
	                          <h2 className="font-semibold">Metode bayar</h2>
	                          <p className="mt-1 text-sm text-[#69756f]">Tampil di kasir</p>
	                        </div>
	                        <CreditCard className="text-[#0369a1]" size={20} />
	                      </div>
	                      <div className="mt-4 grid gap-2">
	                        {["Tunai", "QRIS"].map((item) => (
	                          <label key={item} className="flex items-center gap-2 text-sm">
	                            <input type="checkbox" defaultChecked className="size-4 accent-[#0369a1]" />
	                            {item}
	                          </label>
	                        ))}
	                      </div>
	                    </div>
	                  </aside>
	                </section>
	              </>
	            ) : (
              <>
	                <section
	                  className="mt-6 overflow-hidden rounded-lg border border-[#dde3da] bg-white"
	                  aria-label="Carousel promo aktif"
	                >
	                  <div
	                    className="relative min-h-56 bg-cover bg-center transition-all duration-500"
	                    style={{
	                      backgroundImage: `linear-gradient(90deg, rgba(3, 105, 161, 0.92), rgba(3, 105, 161, 0.5), rgba(3, 105, 161, 0.12)), url(${promoSlides[promoIndex].image})`,
	                    }}
	                  >
	                    <div className="flex min-h-56 max-w-2xl flex-col justify-between p-5 text-white">
	                      <div>
	                        <p className="text-sm font-semibold opacity-90">Promo aktif</p>
	                        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
	                          {promoSlides[promoIndex].title}
	                        </h2>
	                        <p className="mt-3 max-w-xl text-sm leading-6 text-white/90">
	                          {promoSlides[promoIndex].description}
	                        </p>
	                      </div>
	                      <div className="mt-8 flex items-center justify-between gap-3">
	                        <Badge className="bg-white text-[#075985] hover:bg-white">
	                          {promoSlides[promoIndex].cta}
	                        </Badge>
	                        <div className="flex gap-2">
	                          {promoSlides.map((slide, index) => (
	                            <button
	                              key={slide.title}
	                              onClick={() => setPromoIndex(index)}
	                              className={`h-2.5 rounded-full transition-all ${
	                                promoIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/50"
	                              }`}
	                              aria-label={`Lihat promo ${index + 1}`}
	                            />
	                          ))}
	                        </div>
	                      </div>
	                    </div>
	                  </div>
	                </section>

                <section className="mt-6 rounded-lg border border-[#dde3da] bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative max-w-md flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]" size={18} />
                      <input
                        className="h-11 w-full rounded-lg border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-sm outline-none focus:border-[#0369a1]"
                        placeholder="Cari menu, produk, atau scan barcode"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["Semua", ...categories] as const).map((item) => (
                        <button
                          key={item}
                          onClick={() => setCategory(item)}
                          className={`h-10 rounded-lg px-4 text-sm font-semibold ${
                            category === item
                              ? "bg-[#0369a1] text-white"
                              : "border border-[#d7dfd4] bg-white text-[#4d5953]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

	                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
	                    {filteredProducts.map((product) => (
	                      <button
	                        key={product.id}
	                        onClick={() => addToCart(product)}
		                        className="relative h-[140px] min-h-[140px] overflow-hidden rounded-lg border border-[#dde3da] bg-[#fbfcfa] text-left transition hover:border-[#0369a1] hover:bg-[#f0f9ff]"
	                      >
	                        <div
	                          className="absolute inset-0 bg-cover bg-center"
	                          style={{ backgroundImage: `url(${product.image})` }}
	                        />
	                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
	                        <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-[#1f2623]">
	                          Stok {product.stock}
	                        </span>
	                        <p className="absolute bottom-10 left-3 right-3 truncate text-[0.9rem] font-semibold text-white">
	                          {product.name}
	                        </p>
	                        <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">
	                          {formatCurrency(product.price)}
	                        </p>
	                      </button>
	                    ))}
	                  </div>
                </section>

	              </>
	            )}
	          </div>

	          {activeMenu === "Kasir" && (
	          <aside className="flex flex-col border-t bg-card p-5 xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto xl:border-l xl:border-t-0">
	            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#69756f]">Pesanan #MV-1048</p>
                <h2 className="text-xl font-semibold">Keranjang</h2>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
                <ShoppingCart size={20} />
              </div>
            </div>

            <section className="mt-4 rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#69756f]">
                Customer
              </label>
              <div className="mt-2 flex gap-2">
                <select className="h-10 min-w-0 flex-1 rounded-lg border border-[#d7dfd4] bg-white px-3 text-sm font-semibold outline-none focus:border-[#0369a1]">
                  <option>Walk-in Customer</option>
                  <option>Budi Santoso</option>
                  <option>Sari Coffee Member</option>
                </select>
                <button className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#0369a1] bg-white px-3 text-sm font-semibold text-[#0369a1]">
                  <UserPlus size={17} />
                  Member
                </button>
              </div>
            </section>

	            <div className="mt-4 flex-1 overflow-y-auto pb-4">
	              <div className="grid gap-2">
	              {cart.map((item) => (
	                <div key={item.id} className="rounded-lg border border-[#dde3da] p-3">
	                  <div className="grid grid-cols-[1fr_auto] items-center gap-3">
	                    <div className="min-w-0">
	                      <p className="truncate text-sm font-semibold">{item.name}</p>
	                      <p className="mt-0.5 text-xs text-[#69756f]">
	                        {formatCurrency(item.price)} x {item.qty}
	                      </p>
	                    </div>
	                    <div className="flex items-center gap-1.5">
	                      <button
	                        onClick={() => updateQty(item.id, -1)}
	                        className="flex size-7 items-center justify-center rounded-lg border border-[#d7dfd4]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="flex size-7 items-center justify-center rounded-lg border border-[#d7dfd4]"
                      >
	                        <Plus size={14} />
	                      </button>
	                    </div>
	                  </div>
	                </div>
	              ))}
	              </div>
	            </div>
	
	            <div className="sticky bottom-0 -mx-5 mt-auto border-t border-[#dde3da] bg-card p-5">
	              <div className="rounded-lg bg-[#f6f7f4] p-4">
	                <div className="flex justify-between text-sm">
	                  <span>Subtotal</span>
	                  <strong>{formatCurrency(subtotal)}</strong>
	                </div>
	                {discount > 0 && (
	                  <div className="mt-3 flex justify-between text-sm text-[#0369a1]">
	                    <span>Promo kopi sore</span>
	                    <strong>-{formatCurrency(discount)}</strong>
	                  </div>
	                )}
	                <div className="mt-4 border-t border-[#dde3da] pt-4">
	                  <div className="flex justify-between">
	                    <span className="font-semibold">Total bayar</span>
	                    <strong className="text-2xl">{formatCurrency(total)}</strong>
	                  </div>
	                </div>
	              </div>

	              <button
	                onClick={openPaymentModal}
	                disabled={cart.length === 0}
	                className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#0369a1] text-base font-bold text-white shadow-sm transition hover:bg-[#075985] disabled:cursor-not-allowed disabled:opacity-50"
	              >
	                <CreditCard size={20} />
	                Bayar & Kirim Struk
	                <ChevronRight size={20} />
	              </button>
	            </div>
	          </aside>
          )}
        </section>
      </div>

      {isPageLoading && (
        <div className="fixed inset-x-0 bottom-0 z-50 h-1 bg-sky-100">
          <div
            key={activeMenu}
            className="h-full bg-[#0369a1] animate-[page-progress_520ms_ease-out_forwards]"
          />
        </div>
      )}

      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === "success" ? "Pembayaran berhasil" : "Pembayaran"}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === "success"
                ? "Struk digital siap dikirim ke WhatsApp customer."
                : "Periksa total, pilih metode bayar, lalu konfirmasi transaksi."}
            </DialogDescription>
          </DialogHeader>

          {paymentStep === "success" ? (
            <div className="grid gap-4">
              <div className="rounded-lg border border-[#dde3da] bg-[#f0f9ff] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#0369a1] text-white">
                    <Check size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Transaksi #MV-1049 selesai</p>
                    <p className="mt-1 text-sm text-[#69756f]">
                      Dibayar dengan {paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#dde3da] p-4">
                <div className="flex justify-between text-sm">
                  <span>Total bayar</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
                {paymentMethod === "Tunai" && (
                  <>
                    <div className="mt-3 flex justify-between text-sm">
                      <span>Uang diterima</span>
                      <strong>{formatCurrency(cashReceived)}</strong>
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-[#0369a1]">
                      <span>Kembalian</span>
                      <strong>{formatCurrency(cashChange)}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
	                {discount > 0 && (
	                  <div className="mt-3 flex justify-between text-sm text-[#0369a1]">
	                    <span>Promo kopi sore</span>
	                    <strong>-{formatCurrency(discount)}</strong>
	                  </div>
	                )}
                <div className="mt-4 border-t border-[#dde3da] pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total bayar</span>
                    <strong className="text-2xl">{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Metode pembayaran</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Tunai", "QRIS"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold ${
                        paymentMethod === method
                          ? "border-[#0369a1] bg-[#e0f2fe] text-[#075985]"
                          : "border-[#d7dfd4]"
                      }`}
                    >
                      <CreditCard size={17} />
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Tunai" ? (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="cash-received">Uang diterima</Label>
                    <Input
                      id="cash-received"
                      type="number"
                      min={0}
                      value={cashReceived}
                      onChange={(event) => setCashReceived(Number(event.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[total, 50000, 100000].map((value) => (
                      <Button
                        key={value}
                        variant="outline"
                        onClick={() => setCashReceived(value)}
                      >
                        {formatCurrency(value)}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-lg bg-[#fbfcfa] p-3">
                    <div className="flex justify-between text-sm">
                      <span>Kembalian</span>
                      <strong className={cashReceived >= total ? "text-[#0369a1]" : "text-destructive"}>
                        {cashReceived >= total
                          ? formatCurrency(cashChange)
                          : `Kurang ${formatCurrency(total - cashReceived)}`}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white text-[#0369a1]">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">QRIS siap ditampilkan</p>
                      <p className="mt-1 text-sm text-[#69756f]">
                        Kasir dapat lanjut setelah pembayaran QRIS berhasil.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {paymentStep === "success" ? (
              <Button onClick={finishPayment}>Transaksi baru</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPaymentModal(false)}>
                  Batal
                </Button>
                <Button onClick={confirmPayment} disabled={!isPaymentReady}>
                  Konfirmasi & kirim struk
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={productModal !== null}
        onOpenChange={(open) => {
          if (!open) closeProductModal();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {productModal === "create" ? "Tambah produk" : "Edit produk"}
            </DialogTitle>
            <DialogDescription>
              Data ini akan dipakai di kasir dan laporan stok.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Nama produk</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(event) =>
                  setProductForm((form) => ({ ...form, name: event.target.value }))
                }
                placeholder="Contoh: Es Kopi Susu"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product-category">Kategori</Label>
                <select
                  id="product-category"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((form) => ({
                      ...form,
                      category: event.target.value as Product["category"],
                    }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product-tag">Label</Label>
                <Input
                  id="product-tag"
                  value={productForm.tag}
                  onChange={(event) =>
                    setProductForm((form) => ({ ...form, tag: event.target.value }))
                  }
                  placeholder="Terlaris, Promo, Barcode"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product-price">Harga jual</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((form) => ({
                      ...form,
                      price: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product-stock">Stok saat ini</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm((form) => ({
                      ...form,
                      stock: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeProductModal}>
              Batal
            </Button>
            <Button onClick={saveProduct}>
              {productModal === "create" ? "Simpan produk" : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryModal} onOpenChange={setCategoryModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah kategori</DialogTitle>
            <DialogDescription>
              Kategori baru akan muncul di filter kasir dan form produk.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="category-name">Nama kategori</Label>
            <Input
              id="category-name"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ name: event.target.value })}
              placeholder="Contoh: Minuman"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryForm({ name: "" });
                setCategoryModal(false);
              }}
            >
              Batal
            </Button>
            <Button onClick={saveCategory}>Simpan kategori</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={promoModal !== null}
        onOpenChange={(open) => {
          if (!open) closePromoModal();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {promoModal === "create" ? "Tambah promo" : "Edit promo"}
            </DialogTitle>
            <DialogDescription>
              Promo aktif akan ditampilkan sebagai pilihan campaign kasir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="promo-name">Nama promo</Label>
              <Input
                id="promo-name"
                value={promoForm.name}
                onChange={(event) =>
                  setPromoForm((form) => ({ ...form, name: event.target.value }))
                }
                placeholder="Contoh: Diskon kopi sore"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="promo-type">Tipe promo</Label>
                <select
                  id="promo-type"
                  value={promoForm.type}
                  onChange={(event) =>
                    setPromoForm((form) => ({ ...form, type: event.target.value }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Diskon nominal</option>
                  <option>Diskon persen</option>
                  <option>Loyalty poin</option>
                  <option>Bundle</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="promo-status">Status</Label>
                <select
                  id="promo-status"
                  value={promoForm.status}
                  onChange={(event) =>
                    setPromoForm((form) => ({
                      ...form,
                      status: event.target.value as Promo["status"],
                    }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Aktif</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promo-target">Target promo</Label>
              <Input
                id="promo-target"
                value={promoForm.target}
                onChange={(event) =>
                  setPromoForm((form) => ({ ...form, target: event.target.value }))
                }
                placeholder="Contoh: Semua produk atau Es Kopi Susu"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="promo-value">Nilai promo</Label>
                <Input
                  id="promo-value"
                  value={promoForm.value}
                  onChange={(event) =>
                    setPromoForm((form) => ({ ...form, value: event.target.value }))
                  }
                  placeholder="Contoh: Rp6.000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="promo-period">Periode</Label>
                <Input
                  id="promo-period"
                  value={promoForm.period}
                  onChange={(event) =>
                    setPromoForm((form) => ({ ...form, period: event.target.value }))
                  }
                  placeholder="Contoh: 15.00-18.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePromoModal}>
              Batal
            </Button>
            <Button onClick={savePromo}>
              {promoModal === "create" ? "Simpan promo" : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={staffModal !== null}
        onOpenChange={(open) => {
          if (!open) closeStaffModal();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {staffModal === "create" ? "Tambah staf kasir" : "Edit staf kasir"}
            </DialogTitle>
            <DialogDescription>
              Paket Core membatasi akses hingga 2 staf kasir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="staff-name">Nama staf</Label>
              <Input
                id="staff-name"
                value={staffForm.name}
                onChange={(event) =>
                  setStaffForm((form) => ({ ...form, name: event.target.value }))
                }
                placeholder="Contoh: Ayu Lestari"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="staff-phone">Nomor WhatsApp</Label>
              <Input
                id="staff-phone"
                value={staffForm.phone}
                onChange={(event) =>
                  setStaffForm((form) => ({ ...form, phone: event.target.value }))
                }
                placeholder="Contoh: 0812-3456-7788"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="staff-role">Role</Label>
                <select
                  id="staff-role"
                  value={staffForm.role}
                  onChange={(event) =>
                    setStaffForm((form) => ({
                      ...form,
                      role: event.target.value as StaffMember["role"],
                    }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Kasir</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="staff-shift">Shift</Label>
                <select
                  id="staff-shift"
                  value={staffForm.shift}
                  onChange={(event) =>
                    setStaffForm((form) => ({
                      ...form,
                      shift: event.target.value as StaffMember["shift"],
                    }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Pagi</option>
                  <option>Sore</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="staff-status">Status</Label>
                <select
                  id="staff-status"
                  value={staffForm.status}
                  onChange={(event) =>
                    setStaffForm((form) => ({
                      ...form,
                      status: event.target.value as StaffMember["status"],
                    }))
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Aktif</option>
                  <option>Nonaktif</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeStaffModal}>
              Batal
            </Button>
            <Button onClick={saveStaff}>
              {staffModal === "create" ? "Simpan staf" : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteProduct)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <strong>{deleteProduct?.name}</strong> akan dihapus dari data produk dan
              otomatis dikeluarkan dari keranjang aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProduct(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteProduct}
            >
              Hapus produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletePromo)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <BadgePercent />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus promo?</AlertDialogTitle>
            <AlertDialogDescription>
              Promo <strong>{deletePromo?.name}</strong> akan dihapus dari daftar campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePromo(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeletePromo}
            >
              Hapus promo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteStaff)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldCheck />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus staf?</AlertDialogTitle>
            <AlertDialogDescription>
              Staf <strong>{deleteStaff?.name}</strong> akan kehilangan akses kasir outlet ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStaff(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteStaff}
            >
              Hapus staf
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
