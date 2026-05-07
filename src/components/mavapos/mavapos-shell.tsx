"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Sparkles,
  X,
  Edit3,
  HomeIcon,
  LogOut,
  Minus,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  UserPlus,
  UserRound,
  Utensils,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { mapSupabaseUser } from "./auth";
import { LoginLogo, MavaLogo, SplashScreen } from "./brand";
import {
  defaultProductImage,
  demoUsers,
  initialExpenses,
  initialCategories,
  initialIngredients,
  initialProducts,
  initialPromos,
  initialRecipes,
  initialStaffMembers,
  menu,
  menuRoutes,
  promoSlides,
  saasPlans,
} from "./data";
import { formatCurrency } from "./format";
import type {
  AuthMode,
  AuthUser,
  CartItem,
  CategoryForm,
  Expense,
  ExpenseForm,
  Ingredient,
  IngredientForm,
  EntityId,
  LoginForm,
  MenuLabel,
  NewPasswordForm,
  PaymentMethod,
  Product,
  ProductForm,
  ProductRecipe,
  Promo,
  PromoForm,
  RegisterForm,
  StockMovement,
  StockMovementType,
  StaffForm,
  StaffMember,
} from "./types";

function normalizePromoCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function isDefaultProductImage(image: string) {
  return !image || image === defaultProductImage;
}

function formatStockTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNextLocalId(items: { id: EntityId }[]) {
  const numericIds = items
    .map((item) => (typeof item.id === "number" ? item.id : Number(item.id)))
    .filter((id) => Number.isFinite(id));

  return Math.max(0, ...numericIds) + 1;
}

function toId(value: EntityId) {
  return String(value);
}

type OutletContext = {
  outletId: string;
  profileId: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number | string;
  tag: string | null;
  image_url: string | null;
  categories?: { name: string } | { name: string }[] | null;
};

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  stock: number | string;
  min_stock: number | string;
  cost_per_unit: number;
};

type ProductRecipeRow = {
  product_id: string;
  ingredient_id: string;
  qty: number | string;
};

type PromoRow = {
  id: string;
  name: string;
  code: string;
  type: string;
  target: string;
  value: string;
  period: string;
  status: Promo["status"];
};

type StaffRow = {
  id: string;
  name: string;
  role: StaffMember["role"];
  phone: string;
  shift: StaffMember["shift"];
  status: StaffMember["status"];
};

type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: Expense["paymentMethod"];
  note: string | null;
  status: Expense["status"];
};

type StockMovementRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  type: StockMovementType;
  qty_change: number | string;
  previous_stock: number | string;
  next_stock: number | string;
  note: string | null;
  created_at: string;
};

type TransactionRecord = {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: "Selesai" | "Void" | "Refund";
  completedAt: string;
};

type TransactionRow = {
  id: string;
  invoice_no: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  status: TransactionRecord["status"];
  completed_at: string;
};

type TransactionItemRecord = {
  id: string;
  transactionId: string;
  productId: EntityId | null;
  productName: string;
  categoryName: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

type TransactionItemRow = {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  unit_price: number;
  qty: number | string;
  line_total: number;
};

function mapProduct(row: ProductRow): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

  return {
    id: row.id,
    name: row.name,
    category: category?.name ?? "Tanpa kategori",
    price: row.price,
    stock: Number(row.stock),
    tag: row.tag ?? "Reguler",
    image: row.image_url ?? defaultProductImage,
  };
}

function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    stock: Number(row.stock),
    minStock: Number(row.min_stock),
    costPerUnit: row.cost_per_unit,
    usedFor: [],
  };
}

function mapRecipe(row: ProductRecipeRow): ProductRecipe {
  return {
    productId: row.product_id,
    ingredientId: row.ingredient_id,
    qty: Number(row.qty),
  };
}

function mapPromo(row: PromoRow): Promo {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    target: row.target,
    value: row.value,
    period: row.period,
    status: row.status,
  };
}

function mapStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    shift: row.shift,
    status: row.status,
  };
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: row.amount,
    date: row.expense_date,
    paymentMethod: row.payment_method,
    note: row.note ?? "",
    status: row.status,
  };
}

function mapStockMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id ?? "",
    productName: row.product_name,
    category: row.category_name ?? "",
    type: row.type,
    qtyChange: Number(row.qty_change),
    previousStock: Number(row.previous_stock),
    nextStock: Number(row.next_stock),
    note: row.note ?? "",
    createdAt: formatStockTimestamp(new Date(row.created_at)),
  };
}

function mapTransaction(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    paymentMethod: row.payment_method,
    status: row.status,
    completedAt: row.completed_at,
  };
}

function mapTransactionItem(row: TransactionItemRow): TransactionItemRecord {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    productId: row.product_id,
    productName: row.product_name,
    categoryName: row.category_name ?? "Tanpa kategori",
    unitPrice: row.unit_price,
    qty: Number(row.qty),
    lineTotal: row.line_total,
  };
}

function getStoredInventory() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedInventory = window.localStorage.getItem("mavapos.inventory");

  if (!storedInventory) {
    return null;
  }

  try {
    return JSON.parse(storedInventory) as {
      products?: Product[];
      categories?: string[];
      stockMovements?: StockMovement[];
    };
  } catch {
    window.localStorage.removeItem("mavapos.inventory");
    return null;
  }
}

function getStoredOperations() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedOperations = window.localStorage.getItem("mavapos.operations");

  if (!storedOperations) {
    return null;
  }

  try {
    return JSON.parse(storedOperations) as {
      ingredients?: Ingredient[];
      expenses?: Expense[];
      recipes?: ProductRecipe[];
    };
  } catch {
    window.localStorage.removeItem("mavapos.operations");
    return null;
  }
}

function isTransactionDiscountPromo(promo: Promo) {
  return promo.type.toLowerCase().includes("diskon") || promo.value.includes("%") || /rp/i.test(promo.value);
}

function getPromoDiscount(promo: Promo | undefined, subtotal: number) {
  if (!promo || subtotal <= 0) {
    return 0;
  }

  if (!isTransactionDiscountPromo(promo)) {
    return 0;
  }

  if (promo.value.includes("%")) {
    const percent = Number(promo.value.replace(/[^0-9]/g, ""));
    return Math.min(subtotal, Math.round((subtotal * percent) / 100));
  }

  const nominal = Number(promo.value.replace(/[^0-9]/g, ""));
  return Math.min(subtotal, Number.isFinite(nominal) ? nominal : 0);
}

function getMenuLabelFromPathname(pathname: string): MenuLabel | null {
  const matchedEntry = Object.entries(menuRoutes).find(([, route]) => route === pathname);
  return matchedEntry ? (matchedEntry[0] as MenuLabel) : null;
}

type ToastVariant = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  label: string;
  onPageChange: (page: number) => void;
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] grid w-[min(360px,calc(100vw-32px))] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border bg-white p-3 shadow-lg ${
            toast.variant === "success"
              ? "border-[#b9e2c5]"
              : toast.variant === "error"
                ? "border-[#f1b6b6]"
                : "border-[#bfdbfe]"
          }`}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${
                toast.variant === "success"
                  ? "bg-[#dcfce7] text-[#166534]"
                  : toast.variant === "error"
                    ? "bg-[#fee2e2] text-[#b42318]"
                    : "bg-[#e0f2fe] text-[#075985]"
              }`}
            >
              {toast.variant === "error" ? <X size={14} /> : <Check size={14} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1f2623]">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs leading-5 text-[#69756f]">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="flex size-6 !min-h-0 shrink-0 items-center justify-center rounded-md text-[#69756f] hover:bg-[#f3f6f1]"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  label,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[#dde3da] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[#69756f]">
        {label} · halaman {currentPage} dari {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Sebelumnya
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex size-8 items-center justify-center rounded-lg border text-sm font-semibold ${
                page === currentPage
                  ? "border-[#0369a1] bg-[#e0f2fe] text-[#075985]"
                  : "border-[#d7dfd4] bg-white text-[#4d5953]"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Berikutnya
        </Button>
      </div>
    </div>
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
  const [outletContext, setOutletContext] = useState<OutletContext | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
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
  const [products, setProducts] = useState<Product[]>(
    () => getStoredInventory()?.products ?? initialProducts,
  );
  const [categories, setCategories] = useState(
    () => getStoredInventory()?.categories ?? initialCategories,
  );
  const [categoryIdByName, setCategoryIdByName] = useState<Record<string, string>>({});
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    () => getStoredOperations()?.ingredients ?? initialIngredients,
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    () => getStoredOperations()?.expenses ?? initialExpenses,
  );
  const [recipes, setRecipes] = useState<ProductRecipe[]>(
    () => getStoredOperations()?.recipes ?? initialRecipes,
  );
  const [promos, setPromos] = useState<Promo[]>(initialPromos);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionItems, setTransactionItems] = useState<TransactionItemRecord[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuLabel>(initialMenu);
  const [stockView, setStockView] = useState<"products" | "movements" | "opname">("products");
  const [cart, setCart] = useState<CartItem[]>([
    { ...initialProducts[0], qty: 1 },
    { ...initialProducts[1], qty: 2 },
  ]);
  const [category, setCategory] = useState("Semua");
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoId, setAppliedPromoId] = useState<EntityId | null>(null);
  const [promoCodeError, setPromoCodeError] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [expenseQuery, setExpenseQuery] = useState("");
  const [ingredientPage, setIngredientPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [productModal, setProductModal] = useState<"create" | "edit" | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [ingredientModal, setIngredientModal] = useState<"create" | "edit" | null>(null);
  const [promoModal, setPromoModal] = useState<"create" | "edit" | null>(null);
  const [staffModal, setStaffModal] = useState<"create" | "edit" | null>(null);
  const [expenseModal, setExpenseModal] = useState<"create" | "edit" | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [cashReceived, setCashReceived] = useState(50000);
  const [paymentStep, setPaymentStep] = useState<"form" | "success">("form");
  const [editingProductId, setEditingProductId] = useState<EntityId | null>(null);
  const [editingIngredientId, setEditingIngredientId] = useState<EntityId | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<EntityId | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<EntityId | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<EntityId | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteIngredient, setDeleteIngredient] = useState<Ingredient | null>(null);
  const [deletePromo, setDeletePromo] = useState<Promo | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastIdRef = useRef(0);
  const nextInvoiceNoRef = useRef(1049);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(
    () => getStoredInventory()?.stockMovements ?? [],
  );
  const nextStockMovementIdRef = useRef(getNextLocalId(stockMovements) - 1);
  const [stockAdjustmentForm, setStockAdjustmentForm] = useState<{
    productId: string;
    type: Exclude<StockMovementType, "Penjualan" | "Stok opname">;
    qty: number;
    note: string;
  }>({
    productId: "",
    type: "Stok masuk",
    qty: 0,
    note: "",
  });
  const [opnameInputs, setOpnameInputs] = useState<
    Record<string, { actualStock: string; note: string }>
  >({});
  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    category: "FnB",
    price: 0,
    stock: 0,
    tag: "",
    image: defaultProductImage,
  });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "" });
  const [ingredientForm, setIngredientForm] = useState<IngredientForm>({
    name: "",
    unit: "kg",
    stock: 0,
    minStock: 0,
    costPerUnit: 0,
    usedFor: "",
  });
  const [promoForm, setPromoForm] = useState<PromoForm>({
    name: "",
    code: "",
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
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    title: "",
    category: "Operasional",
    amount: 0,
    date: "2026-05-07",
    paymentMethod: "Kas outlet",
    note: "",
    status: "Tercatat",
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
  const filteredIngredients = ingredients.filter((ingredient) => {
    const query = ingredientQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [ingredient.name, ingredient.unit].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
  const filteredExpenses = expenses.filter((expense) => {
    const query = expenseQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [expense.title, expense.category, expense.paymentMethod, expense.note].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
  const lowStockCount = products.filter((product) => product.stock <= 10).length;
  const lowIngredientCount = ingredients.filter((ingredient) => ingredient.stock <= ingredient.minStock).length;
  const activePromos = promos.filter((promo) => promo.status === "Aktif");
  const transactionPromos = activePromos.filter(isTransactionDiscountPromo);
  const activePromoCount = promos.filter((promo) => promo.status === "Aktif").length;
  const activeStaffCount = staffMembers.filter((staff) => staff.status === "Aktif").length;
  const currentPromoIndex =
    activePromos.length > 0 ? Math.min(promoIndex, activePromos.length - 1) : 0;
  const currentPromo = activePromos[currentPromoIndex];
  const currentPromoImage = promoSlides[currentPromoIndex % promoSlides.length].image;
  const appliedPromo = activePromos.find((promo) => toId(promo.id) === toId(appliedPromoId ?? ""));
  const promoCodeHint = transactionPromos[0]?.code || "DISKONKOPISORE";
  const currentPlan = saasPlans.find((plan) => plan.status === "Aktif")?.name ?? "Core";
  const hasBasicAccess = currentPlan !== "Core";
  const ingredientUsageMap = ingredients.reduce<Record<string, string[]>>((accumulator, ingredient) => {
    accumulator[toId(ingredient.id)] = recipes
      .filter((recipe) => toId(recipe.ingredientId) === toId(ingredient.id))
      .map((recipe) => products.find((product) => toId(product.id) === toId(recipe.productId))?.name)
      .filter((name): name is string => Boolean(name));
    return accumulator;
  }, {});

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.qty, 0),
    [cart],
  );
  const discount = getPromoDiscount(appliedPromo, subtotal);
  const total = subtotal - discount;
  const cashChange = Math.max(cashReceived - total, 0);
  const isPaymentReady = total > 0 && (paymentMethod === "QRIS" || cashReceived >= total);
  const canManageOutlet = authUser?.role === "Owner";
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayLabelFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    weekday: "short",
  });
  const todayKey = dateFormatter.format(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateFormatter.format(yesterday);
  const completedTransactions = transactions.filter((transaction) => transaction.status === "Selesai");
  const todayTransactions = completedTransactions.filter(
    (transaction) => dateFormatter.format(new Date(transaction.completedAt)) === todayKey,
  );
  const yesterdayTransactions = completedTransactions.filter(
    (transaction) => dateFormatter.format(new Date(transaction.completedAt)) === yesterdayKey,
  );
  const todayTransactionIds = new Set(todayTransactions.map((transaction) => transaction.id));
  const todayTransactionItems = transactionItems.filter((item) =>
    todayTransactionIds.has(item.transactionId),
  );
  const todaySalesTotal = todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const yesterdaySalesTotal = yesterdayTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const todayItemsSold = todayTransactionItems.reduce((sum, item) => sum + item.qty, 0);
  const averageTransaction = todayTransactions.length > 0
    ? Math.round(todaySalesTotal / todayTransactions.length)
    : 0;
  const todayExpensesTotal = expenses
    .filter((expense) => expense.status === "Tercatat" && expense.date === todayKey)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const todayNetProfit = todaySalesTotal - todayExpensesTotal;
  const profitPercent = todaySalesTotal > 0
    ? Math.max(0, Math.min(100, Math.round((todayNetProfit / todaySalesTotal) * 100)))
    : 0;
  const discountPercent = todaySalesTotal + todayTransactions.reduce((sum, item) => sum + item.discount, 0) > 0
    ? Math.round(
        (todayTransactions.reduce((sum, item) => sum + item.discount, 0) /
          (todaySalesTotal + todayTransactions.reduce((sum, item) => sum + item.discount, 0))) *
          100,
      )
    : 0;
  const fnBItemsSold = todayTransactionItems
    .filter((item) => item.categoryName === "FnB")
    .reduce((sum, item) => sum + item.qty, 0);
  const fnBShare = todayItemsSold > 0 ? Math.round((fnBItemsSold / todayItemsSold) * 100) : 0;
  const salesGrowth = yesterdaySalesTotal > 0
    ? Math.round(((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100)
    : todaySalesTotal > 0
      ? 100
      : 0;
  const salesChart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = dateFormatter.format(date);
    const amount = completedTransactions
      .filter((transaction) => dateFormatter.format(new Date(transaction.completedAt)) === dateKey)
      .reduce((sum, transaction) => sum + transaction.total, 0);

    return {
      day: dayLabelFormatter.format(date),
      amount,
    };
  });
  const maxSalesAmount = Math.max(1, ...salesChart.map((item) => item.amount));
  const paymentSummary = (["Tunai", "QRIS"] as const).map((method) => {
    const methodTransactions = todayTransactions.filter((transaction) => transaction.paymentMethod === method);

    return {
      label: method,
      value: formatCurrency(methodTransactions.reduce((sum, transaction) => sum + transaction.total, 0)),
      note: `${methodTransactions.length} transaksi`,
    };
  });
  const promoUsageSummary = {
    label: "Promo digunakan",
    value: formatCurrency(todayTransactions.reduce((sum, transaction) => sum + transaction.discount, 0)),
    note: `${todayTransactions.filter((transaction) => transaction.discount > 0).length} transaksi`,
  };
  const bestSellingProducts = Object.values(
    todayTransactionItems.reduce<Record<string, { name: string; category: string; qty: number }>>(
      (accumulator, item) => {
        const key = toId(item.productId ?? item.productName);
        accumulator[key] ??= {
          name: item.productName,
          category: item.categoryName,
          qty: 0,
        };
        accumulator[key].qty += item.qty;
        return accumulator;
      },
      {},
    ),
  )
    .sort((first, second) => second.qty - first.qty)
    .slice(0, 4);
  const dashboardStats = [
    {
      label: "Penjualan hari ini",
      value: formatCurrency(todaySalesTotal),
      note: yesterdaySalesTotal > 0 ? `${salesGrowth >= 0 ? "Naik" : "Turun"} ${Math.abs(salesGrowth)}% dari kemarin` : "Belum ada pembanding kemarin",
    },
    {
      label: "Transaksi hari ini",
      value: `${todayTransactions.length} transaksi`,
      note: `${formatCurrency(averageTransaction)} rata-rata per transaksi`,
    },
    {
      label: "Produk terjual",
      value: `${todayItemsSold} item`,
      note: todayItemsSold > 0 ? `FnB menyumbang ${fnBShare}% volume` : "Belum ada produk terjual hari ini",
    },
    {
      label: "SKU aktif",
      value: `${products.filter((product) => product.stock > 0).length} produk`,
      note: `${lowStockCount} produk butuh restock`,
    },
  ];
  const ingredientPageCount = Math.max(1, Math.ceil(filteredIngredients.length / 5));
  const expensePageCount = Math.max(1, Math.ceil(filteredExpenses.length / 5));
  const currentIngredientPage = Math.min(ingredientPage, ingredientPageCount);
  const currentExpensePage = Math.min(expensePage, expensePageCount);
  const paginatedIngredients = filteredIngredients.slice(
    (currentIngredientPage - 1) * 5,
    currentIngredientPage * 5,
  );
  const paginatedExpenses = filteredExpenses.slice(
    (currentExpensePage - 1) * 5,
    currentExpensePage * 5,
  );
  const accessibleMenu = canManageOutlet
    ? menu.filter((item) => hasBasicAccess || item.label !== "Bahan")
    : menu.filter((item) => item.label === "Dashboard" || item.label === "Kasir");
  const isSupabaseSynced = authSource === "supabase" && Boolean(outletContext);

  const dismissToast = useCallback(function dismissToast(id: number) {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(function showToast(variant: ToastVariant, title: string, description?: string) {
    const id = nextToastIdRef.current + 1;
    nextToastIdRef.current = id;

    setToasts((items) => [...items.slice(-3), { id, title, description, variant }]);
    window.setTimeout(() => dismissToast(id), 3600);
  }, [dismissToast]);

  const loadSupabaseData = useCallback(async function loadSupabaseData(userId: string) {
    setDataLoading(true);

    const { data: initialProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, outlet_id")
      .eq("id", userId)
      .single();
    let profile = initialProfile;

    if (profileError || !profile?.outlet_id) {
      const { data: ensuredProfile, error: ensureError } = await supabase
        .rpc("ensure_current_user_profile");

      const ensuredOutletProfile = Array.isArray(ensuredProfile)
        ? (ensuredProfile[0] as { profile_id?: string; outlet_id?: string } | undefined)
        : (ensuredProfile as { profile_id?: string; outlet_id?: string } | null);

      if (ensureError || !ensuredOutletProfile?.outlet_id) {
        setDataLoading(false);
        console.error("MAVA Supabase outlet sync failed");
        console.error("profileError", profileError);
        console.error("ensureError", ensureError);
        console.error("ensuredProfile", ensuredProfile);
        showToast(
          "error",
          "Data outlet belum siap",
          ensureError?.message?.includes("ensure_current_user_profile")
            ? "Jalankan migration Supabase terbaru: 202605070002_profile_outlet_fallback.sql."
            : ensureError?.message ?? profileError?.message ?? "Profile Supabase belum memiliki outlet.",
        );
        return;
      }

      profile = {
        id: ensuredOutletProfile.profile_id,
        outlet_id: ensuredOutletProfile.outlet_id,
      };
    }

    const nextOutletContext = {
      outletId: profile.outlet_id as string,
      profileId: profile.id as string,
    };

    setOutletContext(nextOutletContext);

    const [
      categoriesResult,
      productsResult,
      ingredientsResult,
      recipesResult,
      promosResult,
      staffResult,
      expensesResult,
      transactionsResult,
      transactionItemsResult,
      stockMovementsResult,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("created_at", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, price, stock, tag, image_url, categories(name)")
        .eq("outlet_id", nextOutletContext.outletId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("ingredients")
        .select("id, name, unit, stock, min_stock, cost_per_unit")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("created_at", { ascending: true }),
      supabase.from("product_recipes").select("product_id, ingredient_id, qty"),
      supabase
        .from("promos")
        .select("id, name, code, type, target, value, period, status")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("created_at", { ascending: true }),
      supabase
        .from("staff_members")
        .select("id, name, role, phone, shift, status")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("created_at", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, title, category, amount, expense_date, payment_method, note, status")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("expense_date", { ascending: false }),
      supabase
        .from("transactions")
        .select("id, invoice_no, subtotal, discount, total, payment_method, status, completed_at")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("completed_at", { ascending: false }),
      supabase
        .from("transaction_items")
        .select("id, transaction_id, product_id, product_name, category_name, unit_price, qty, line_total"),
      supabase
        .from("stock_movements")
        .select("id, product_id, product_name, category_name, type, qty_change, previous_stock, next_stock, note, created_at")
        .eq("outlet_id", nextOutletContext.outletId)
        .order("created_at", { ascending: false }),
    ]);

    const firstError = [
      categoriesResult.error,
      productsResult.error,
      ingredientsResult.error,
      recipesResult.error,
      promosResult.error,
      staffResult.error,
      expensesResult.error,
      transactionsResult.error,
      transactionItemsResult.error,
      stockMovementsResult.error,
    ].find(Boolean);

    if (firstError) {
      setDataLoading(false);
      showToast("error", "Sinkronisasi gagal", firstError.message);
      return;
    }

    const categoryRows = (categoriesResult.data ?? []) as CategoryRow[];
    const nextCategoryIdByName = categoryRows.reduce<Record<string, string>>((accumulator, item) => {
      accumulator[item.name] = item.id;
      return accumulator;
    }, {});

    const nextRecipes = ((recipesResult.data ?? []) as ProductRecipeRow[]).map(mapRecipe);

    setCategoryIdByName(nextCategoryIdByName);
    setCategories(categoryRows.map((item) => item.name));
    setProducts(((productsResult.data ?? []) as ProductRow[]).map(mapProduct));
    setIngredients(((ingredientsResult.data ?? []) as IngredientRow[]).map(mapIngredient));
    setRecipes(nextRecipes);
    setPromos(((promosResult.data ?? []) as PromoRow[]).map(mapPromo));
    setStaffMembers(((staffResult.data ?? []) as StaffRow[]).map(mapStaff));
    setExpenses(((expensesResult.data ?? []) as ExpenseRow[]).map(mapExpense));
    setTransactions(((transactionsResult.data ?? []) as TransactionRow[]).map(mapTransaction));
    setTransactionItems(((transactionItemsResult.data ?? []) as TransactionItemRow[]).map(mapTransactionItem));
    setStockMovements(((stockMovementsResult.data ?? []) as StockMovementRow[]).map(mapStockMovement));
    setCart([]);
    setDataLoading(false);
  }, [showToast, supabase]);

  async function persistStockMovement(
    product: Product,
    type: StockMovementType,
    qtyChange: number,
    previousStock: number,
    nextStock: number,
    note: string,
    transactionId?: string,
  ) {
    if (!isSupabaseSynced || !outletContext || typeof product.id !== "string") {
      return null;
    }

    const { data, error } = await supabase
      .from("stock_movements")
      .insert({
        outlet_id: outletContext.outletId,
        product_id: product.id,
        transaction_id: transactionId ?? null,
        product_name: product.name,
        category_name: product.category,
        type,
        qty_change: qtyChange,
        previous_stock: previousStock,
        next_stock: nextStock,
        note,
        created_by: outletContext.profileId,
      })
      .select("id, product_id, product_name, category_name, type, qty_change, previous_stock, next_stock, note, created_at")
      .single();

    if (error) {
      showToast("error", "Mutasi stok gagal sinkron", error.message);
      return null;
    }

    return data ? mapStockMovement(data as StockMovementRow) : null;
  }

  function logStockMovement(
    product: Product,
    type: StockMovementType,
    qtyChange: number,
    previousStock: number,
    nextStock: number,
    note: string,
  ) {
    if (isSupabaseSynced) {
      void persistStockMovement(product, type, qtyChange, previousStock, nextStock, note).then(
        (movement) => {
          if (movement) {
            setStockMovements((items) => [movement, ...items]);
          }
        },
      );
      return;
    }

    const id = nextStockMovementIdRef.current + 1;
    nextStockMovementIdRef.current = id;

    setStockMovements((items) => [
      {
        id,
        productId: product.id,
        productName: product.name,
        category: product.category,
        type,
        qtyChange,
        previousStock,
        nextStock,
        note,
        createdAt: formatStockTimestamp(),
      },
      ...items,
    ]);
  }

  async function applyStockChange(
    productId: EntityId,
    qtyChange: number,
    type: StockMovementType,
    note: string,
    options: { transactionId?: string; skipPersistMovement?: boolean } = {},
  ) {
    const currentProduct = products.find((product) => toId(product.id) === toId(productId));

    if (!currentProduct) {
      return false;
    }

    const nextStock = currentProduct.stock + qtyChange;

    if (nextStock < 0) {
      return false;
    }

    if (isSupabaseSynced && typeof productId === "string") {
      const { error } = await supabase
        .from("products")
        .update({ stock: nextStock })
        .eq("id", productId);

      if (error) {
        showToast("error", "Stok gagal disimpan", error.message);
        return false;
      }
    }

    setProducts((items) =>
      items.map((item) => (toId(item.id) === toId(productId) ? { ...item, stock: nextStock } : item)),
    );
    setCart((items) =>
      items.map((item) => (toId(item.id) === toId(productId) ? { ...item, stock: nextStock } : item)),
    );
    if (isSupabaseSynced && !options.skipPersistMovement) {
      const movement = await persistStockMovement(
        currentProduct,
        type,
        qtyChange,
        currentProduct.stock,
        nextStock,
        note,
        options.transactionId,
      );

      if (movement) {
        setStockMovements((items) => [movement, ...items]);
      }
    } else if (!isSupabaseSynced) {
      logStockMovement(currentProduct, type, qtyChange, currentProduct.stock, nextStock, note);
    }
    return true;
  }

  function getRecipeRequirementsForCart(items: CartItem[]) {
    const requirements = new Map<EntityId, number>();

    items.forEach((item) => {
      recipes
        .filter((recipe) => toId(recipe.productId) === toId(item.id))
        .forEach((recipe) => {
          requirements.set(
            recipe.ingredientId,
            (requirements.get(recipe.ingredientId) ?? 0) + recipe.qty * item.qty,
          );
        });
    });

    return requirements;
  }

  function getInsufficientIngredientForCart(items: CartItem[]) {
    const requirements = getRecipeRequirementsForCart(items);

    for (const [ingredientId, qtyNeeded] of requirements.entries()) {
      const ingredient = ingredients.find((item) => toId(item.id) === toId(ingredientId));

      if (!ingredient || ingredient.stock < qtyNeeded) {
        return {
          ingredient,
          qtyNeeded,
        };
      }
    }

    return null;
  }

  useEffect(() => {
    if (!authReady || authSource === "supabase") {
      return;
    }

    window.localStorage.setItem(
      "mavapos.inventory",
      JSON.stringify({
        products,
        categories,
        stockMovements,
      }),
    );
  }, [authReady, authSource, products, categories, stockMovements]);

  useEffect(() => {
    if (!authReady || authSource === "supabase") {
      return;
    }

    window.localStorage.setItem(
      "mavapos.operations",
      JSON.stringify({
        ingredients,
        expenses,
        recipes,
      }),
    );
  }, [authReady, authSource, ingredients, expenses, recipes]);

  useEffect(() => {
    if (!authReady || authUser || !showSplash) {
      return;
    }

    const timer = window.setTimeout(() => setShowSplash(false), 1100);
    return () => window.clearTimeout(timer);
  }, [authReady, authUser, showSplash]);

  useEffect(() => {
    const syncMenuFromLocation = () => {
      const nextMenu = getMenuLabelFromPathname(window.location.pathname);

      if (nextMenu) {
        if (nextMenu === "Bahan" && !hasBasicAccess) {
          setActiveMenu("Pengaturan");
          window.history.replaceState({}, "", menuRoutes.Pengaturan);
          return;
        }
        setActiveMenu(nextMenu);
      }
    };

    syncMenuFromLocation();
    window.addEventListener("popstate", syncMenuFromLocation);

    return () => window.removeEventListener("popstate", syncMenuFromLocation);
  }, [hasBasicAccess]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session?.user) {
        setAuthUser(mapSupabaseUser(data.session.user));
        setAuthSource("supabase");
        setShowSplash(false);
        void loadSupabaseData(data.session.user.id);
      } else {
        const storedSession = window.localStorage.getItem("mavapos.session");

        if (storedSession) {
          try {
            setAuthUser(JSON.parse(storedSession) as AuthUser);
            setAuthSource("demo");
            setShowSplash(false);
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
	        setShowSplash(false);
	        void loadSupabaseData(session.user.id);
        window.localStorage.removeItem("mavapos.session");
      } else if (authSource === "supabase") {
        setAuthUser(null);
        setOutletContext(null);
        setAuthSource(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authSource, loadSupabaseData, supabase]);

  useEffect(() => {
    if (activeMenu !== "Kasir" || activePromos.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setPromoIndex((index) => (index + 1) % activePromos.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [activeMenu, activePromos.length]);

  function changeMenu(menuLabel: MenuLabel) {
    if (!canManageOutlet && menuLabel !== "Kasir" && menuLabel !== "Dashboard") {
      return;
    }

    if (menuLabel === "Bahan" && !hasBasicAccess) {
      showToast("info", "Fitur Basic", "Kelola bahan hanya tersedia untuk paket Basic.");
      setActiveMenu("Pengaturan");
      window.history.pushState({}, "", menuRoutes.Pengaturan);
      return;
    }

    if (menuLabel === activeMenu) {
      return;
    }

    setIsPageLoading(true);
    setActiveMenu(menuLabel);
    window.history.pushState({}, "", menuRoutes[menuLabel]);
    window.setTimeout(() => setIsPageLoading(false), 520);
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      showToast("error", "Stok habis", `${product.name} tidak bisa ditambahkan karena stok kosong.`);
      return;
    }

    const currentItem = cart.find((item) => toId(item.id) === toId(product.id));
    const projectedItems = currentItem
      ? cart.map((item) => (toId(item.id) === toId(product.id) ? { ...item, qty: item.qty + 1 } : item))
      : [...cart, { ...product, qty: 1 }];
    const insufficientIngredient = getInsufficientIngredientForCart(projectedItems);

    if (insufficientIngredient) {
      showToast(
        "error",
        "Bahan tidak cukup",
        `${insufficientIngredient.ingredient?.name ?? "Bahan resep"} tidak cukup untuk meracik ${product.name}.`,
      );
      return;
    }

    setCart((items) => {
      const existing = items.find((item) => toId(item.id) === toId(product.id));

      if (existing) {
        if (existing.qty >= product.stock) {
          showToast("error", "Stok tidak cukup", `Maksimal ${product.stock} item untuk ${product.name}.`);
          return items;
        }

        return items.map((item) =>
          toId(item.id) === toId(product.id) ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [...items, { ...product, qty: 1 }];
    });
    showToast("success", "Produk ditambahkan", `${product.name} masuk ke keranjang.`);
  }

  function updateQty(id: EntityId, change: number) {
    setCart((items) => {
      const currentItem = items.find((item) => toId(item.id) === toId(id));

      if (!currentItem) {
        return items;
      }

      const latestProduct = products.find((product) => toId(product.id) === toId(id));
      const nextQty = currentItem.qty + change;

      if (change > 0) {
        const projectedItems = items.map((item) =>
          toId(item.id) === toId(id) ? { ...item, qty: nextQty } : item,
        );
        const insufficientIngredient = getInsufficientIngredientForCart(projectedItems);

        if (insufficientIngredient) {
          showToast(
            "error",
            "Bahan tidak cukup",
            `${insufficientIngredient.ingredient?.name ?? "Bahan resep"} tidak cukup untuk menambah porsi.`,
          );
          return items;
        }
      }

      if (change > 0 && latestProduct && nextQty > latestProduct.stock) {
        showToast("error", "Stok tidak cukup", `Stok ${latestProduct.name} tersisa ${latestProduct.stock}.`);
        return items;
      }

      return items
        .map((item) => (toId(item.id) === toId(id) ? { ...item, qty: nextQty } : item))
        .filter((item) => item.qty > 0);
    });
  }

  function applyPromoCode() {
    const code = normalizePromoCode(promoCodeInput);
    const matchedPromo = transactionPromos.find((promo) => promo.code === code);

    if (!matchedPromo) {
      setAppliedPromoId(null);
      setPromoCodeError("Kode promo tidak ditemukan.");
      showToast("error", "Kode promo gagal", "Kode tidak aktif atau tidak cocok dengan promo outlet.");
      return;
    }

    setAppliedPromoId(matchedPromo.id);
    setPromoCodeInput(code);
    setPromoCodeError("");
    showToast("success", "Promo diterapkan", `${matchedPromo.name} memotong total transaksi.`);
  }

  function removeAppliedPromo({ silent = false }: { silent?: boolean } = {}) {
    setAppliedPromoId(null);
    setPromoCodeInput("");
    setPromoCodeError("");
    if (!silent) {
      showToast("info", "Promo dihapus", "Total transaksi dikembalikan tanpa promo.");
    }
  }

  function openPaymentModal() {
    if (cart.length === 0) {
      showToast("error", "Keranjang kosong", "Tambahkan produk sebelum membuka pembayaran.");
      return;
    }

    setPaymentStep("form");
    setCashReceived((value) => Math.max(value, total));
    setPaymentModal(true);
    showToast("info", "Pembayaran dibuka", "Periksa metode bayar sebelum konfirmasi transaksi.");
  }

  async function confirmPayment() {
    if (!isPaymentReady) {
      showToast("error", "Pembayaran belum siap", "Pastikan total sudah benar dan uang diterima mencukupi.");
      return;
    }

    const insufficientItem = cart.find((item) => {
      const latestProduct = products.find((product) => toId(product.id) === toId(item.id));
      return !latestProduct || latestProduct.stock < item.qty;
    });

    if (insufficientItem) {
      showToast(
        "error",
        "Stok berubah",
        `${insufficientItem.name} tidak cukup untuk menyelesaikan transaksi.`,
      );
      return;
    }

    const insufficientIngredient = getInsufficientIngredientForCart(cart);

    if (insufficientIngredient) {
      showToast(
        "error",
        "Bahan resep tidak cukup",
        `${insufficientIngredient.ingredient?.name ?? "Bahan"} tidak cukup untuk menyelesaikan transaksi ini.`,
      );
      return;
    }

    const invoiceNo = `MV-${nextInvoiceNoRef.current}`;
    nextInvoiceNoRef.current += 1;
    let transactionId: string | undefined;

    if (isSupabaseSynced && outletContext) {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          outlet_id: outletContext.outletId,
          invoice_no: invoiceNo,
          cashier_id: outletContext.profileId,
          promo_id: typeof appliedPromo?.id === "string" ? appliedPromo.id : null,
          subtotal,
          discount,
          total,
          payment_method: paymentMethod,
          cash_received: paymentMethod === "Tunai" ? cashReceived : null,
          cash_change: paymentMethod === "Tunai" ? cashChange : null,
          status: "Selesai",
        })
        .select("id, invoice_no, subtotal, discount, total, payment_method, status, completed_at")
        .single();

      if (transactionError || !transaction?.id) {
        showToast("error", "Transaksi gagal disimpan", transactionError?.message ?? "ID transaksi tidak tersedia.");
        return;
      }

      const savedTransaction = mapTransaction(transaction as TransactionRow);
      transactionId = savedTransaction.id;

      const transactionItems = cart.map((item) => ({
        transaction_id: transactionId,
        product_id: typeof item.id === "string" ? item.id : null,
        product_name: item.name,
        category_name: item.category,
        unit_price: item.price,
        qty: item.qty,
        line_total: item.price * item.qty,
      }));

      const { data: savedItems, error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems)
        .select("id, transaction_id, product_id, product_name, category_name, unit_price, qty, line_total");

      if (itemsError) {
        showToast("error", "Item transaksi gagal disimpan", itemsError.message);
        return;
      }

      setTransactions((items) => [savedTransaction, ...items]);
      setTransactionItems((items) => [
        ...items,
        ...((savedItems ?? []) as TransactionItemRow[]).map(mapTransactionItem),
      ]);
    } else {
      const localTransaction: TransactionRecord = {
        id: invoiceNo,
        invoiceNo,
        subtotal,
        discount,
        total,
        paymentMethod,
        status: "Selesai",
        completedAt: new Date().toISOString(),
      };

      setTransactions((items) => [localTransaction, ...items]);
      setTransactionItems((items) => [
        ...items,
        ...cart.map((item, index) => ({
          id: `${invoiceNo}-${index}`,
          transactionId: invoiceNo,
          productId: item.id,
          productName: item.name,
          categoryName: item.category,
          unitPrice: item.price,
          qty: item.qty,
          lineTotal: item.price * item.qty,
        })),
      ]);
    }

    for (const item of cart) {
      const success = await applyStockChange(
        item.id,
        item.qty * -1,
        "Penjualan",
        `Transaksi kasir #${invoiceNo}`,
        { transactionId },
      );

      if (!success) {
        return;
      }
    }

    for (const [ingredientId, qtyNeeded] of getRecipeRequirementsForCart(cart).entries()) {
      const ingredient = ingredients.find((item) => toId(item.id) === toId(ingredientId));

      if (!ingredient) {
        continue;
      }

      const nextStock = Number((ingredient.stock - qtyNeeded).toFixed(3));

      if (isSupabaseSynced && typeof ingredient.id === "string" && outletContext) {
        const { error } = await supabase
          .from("ingredients")
          .update({ stock: nextStock })
          .eq("id", ingredient.id);

        if (error) {
          showToast("error", "Stok bahan gagal disimpan", error.message);
          return;
        }

        const { error: movementError } = await supabase.from("ingredient_movements").insert({
          outlet_id: outletContext.outletId,
          ingredient_id: ingredient.id,
          transaction_id: transactionId ?? null,
          ingredient_name: ingredient.name,
          qty_change: qtyNeeded * -1,
          previous_stock: ingredient.stock,
          next_stock: nextStock,
          note: `Transaksi kasir #${invoiceNo}`,
        });

        if (movementError) {
          showToast("error", "Mutasi bahan gagal disimpan", movementError.message);
          return;
        }
      }

      setIngredients((items) =>
        items.map((item) =>
          toId(item.id) === toId(ingredientId)
            ? { ...item, stock: nextStock }
            : item,
        ),
      );
    }

    setPaymentStep("success");
    showToast("success", "Pembayaran berhasil", "Transaksi selesai dan struk siap dikirim.");
  }

  function finishPayment() {
    setCart([]);
    removeAppliedPromo({ silent: true });
    setPaymentModal(false);
    setPaymentStep("form");
    showToast("success", "Transaksi baru", "Keranjang dikosongkan untuk transaksi berikutnya.");
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

  async function saveProduct() {
    const normalizedForm = {
      ...productForm,
      name: productForm.name.trim(),
      tag: productForm.tag.trim() || "Reguler",
      image: productForm.image || defaultProductImage,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };

    if (!normalizedForm.name || normalizedForm.price < 0 || normalizedForm.stock < 0) {
      showToast("error", "Produk gagal disimpan", "Nama produk wajib diisi, harga dan stok tidak boleh negatif.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      let categoryId = categoryIdByName[normalizedForm.category] ?? null;

      if (!categoryId) {
        const { data: existingCategory, error: categoryLookupError } = await supabase
          .from("categories")
          .select("id, name")
          .eq("outlet_id", outletContext.outletId)
          .eq("name", normalizedForm.category)
          .maybeSingle();

        if (categoryLookupError) {
          showToast("error", "Kategori gagal dibaca", categoryLookupError.message);
          return;
        }

        if (existingCategory?.id) {
          categoryId = existingCategory.id as string;
          setCategoryIdByName((items) => ({
            ...items,
            [normalizedForm.category]: existingCategory.id as string,
          }));
        } else {
          const { data: createdCategory, error: categoryCreateError } = await supabase
            .from("categories")
            .insert({
              outlet_id: outletContext.outletId,
              name: normalizedForm.category,
            })
            .select("id, name")
            .single();

          if (categoryCreateError) {
            showToast("error", "Kategori gagal dibuat", categoryCreateError.message);
            return;
          }

          categoryId = createdCategory.id as string;
          setCategoryIdByName((items) => ({
            ...items,
            [normalizedForm.category]: createdCategory.id as string,
          }));
          setCategories((items) =>
            items.some((item) => item.toLowerCase() === normalizedForm.category.toLowerCase())
              ? items
              : [...items, normalizedForm.category],
          );
        }
      }

      if (productModal === "edit" && editingProductId && typeof editingProductId === "string") {
        const { data, error } = await supabase
          .from("products")
          .update({
            category_id: categoryId,
            name: normalizedForm.name,
            price: normalizedForm.price,
            stock: normalizedForm.stock,
            tag: normalizedForm.tag,
            image_url: normalizedForm.image,
          })
          .eq("id", editingProductId)
          .select("id, name, price, stock, tag, image_url, categories(name)")
          .single();

        if (error) {
          showToast("error", "Produk gagal disimpan", error.message);
          return;
        }

        const nextProduct = {
          ...mapProduct(data as ProductRow),
          category: normalizedForm.category,
        };
        setProducts((items) =>
          items.map((item) => (toId(item.id) === toId(editingProductId) ? nextProduct : item)),
        );
        setCart((items) =>
          items.map((item) =>
            toId(item.id) === toId(editingProductId) ? { ...item, ...nextProduct } : item,
          ),
        );
        showToast("success", "Produk diperbarui", `${nextProduct.name} berhasil disimpan.`);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            outlet_id: outletContext.outletId,
            category_id: categoryId,
            name: normalizedForm.name,
            price: normalizedForm.price,
            stock: normalizedForm.stock,
            tag: normalizedForm.tag,
            image_url: normalizedForm.image,
          })
          .select("id, name, price, stock, tag, image_url, categories(name)")
          .single();

        if (error) {
          showToast("error", "Produk gagal ditambahkan", error.message);
          return;
        }

        const nextProduct = {
          ...mapProduct(data as ProductRow),
          category: normalizedForm.category,
        };
        setProducts((items) => [...items, nextProduct]);
        showToast("success", "Produk ditambahkan", `${nextProduct.name} tersedia di kasir.`);
      }

      closeProductModal();
      return;
    }

    if (productModal === "edit" && editingProductId) {
      const existingProduct = products.find((item) => toId(item.id) === toId(editingProductId));

      setProducts((items) =>
        items.map((item) =>
          toId(item.id) === toId(editingProductId) ? { ...item, ...normalizedForm } : item,
        ),
      );
      setCart((items) =>
        items.map((item) =>
          toId(item.id) === toId(editingProductId) ? { ...item, ...normalizedForm } : item,
        ),
      );
      if (existingProduct && existingProduct.stock !== normalizedForm.stock) {
        logStockMovement(
          existingProduct,
          "Penyesuaian",
          normalizedForm.stock - existingProduct.stock,
          existingProduct.stock,
          normalizedForm.stock,
          "Perubahan stok dari form produk",
        );
      }
      showToast("success", "Produk diperbarui", `${normalizedForm.name} berhasil disimpan.`);
    } else {
      setProducts((items) => [
        ...items,
        {
          id: getNextLocalId(items),
          ...normalizedForm,
        },
      ]);
      showToast("success", "Produk ditambahkan", `${normalizedForm.name} tersedia di kasir.`);
    }

    closeProductModal();
  }

  async function confirmDeleteProduct() {
    if (!deleteProduct) {
      return;
    }

    if (isSupabaseSynced && typeof deleteProduct.id === "string") {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", deleteProduct.id);

      if (error) {
        showToast("error", "Produk gagal dihapus", error.message);
        return;
      }
    }

    setProducts((items) => items.filter((item) => toId(item.id) !== toId(deleteProduct.id)));
    setCart((items) => items.filter((item) => toId(item.id) !== toId(deleteProduct.id)));
    showToast("success", "Produk dihapus", `${deleteProduct.name} dihapus dari data produk.`);
    setDeleteProduct(null);
  }

  function openCreatePromo() {
    setPromoForm({
      name: "",
      code: "",
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
      code: promo.code,
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

  async function savePromo() {
    const normalizedForm = {
      ...promoForm,
      name: promoForm.name.trim(),
      code: normalizePromoCode(promoForm.code || promoForm.name),
      target: promoForm.target.trim(),
      value: promoForm.value.trim(),
      period: promoForm.period.trim(),
    };

    if (!normalizedForm.name || !normalizedForm.code || !normalizedForm.target || !normalizedForm.value) {
      showToast("error", "Promo gagal disimpan", "Nama, kode, target, dan nilai promo wajib diisi.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      if (promoModal === "edit" && editingPromoId && typeof editingPromoId === "string") {
        const { data, error } = await supabase
          .from("promos")
          .update(normalizedForm)
          .eq("id", editingPromoId)
          .select("id, name, code, type, target, value, period, status")
          .single();

        if (error) {
          showToast("error", "Promo gagal disimpan", error.message);
          return;
        }

        const nextPromo = mapPromo(data as PromoRow);
        setPromos((items) =>
          items.map((item) => (toId(item.id) === toId(editingPromoId) ? nextPromo : item)),
        );
        showToast("success", "Promo diperbarui", `${nextPromo.name} berhasil disimpan.`);
      } else {
        const { data, error } = await supabase
          .from("promos")
          .insert({
            outlet_id: outletContext.outletId,
            ...normalizedForm,
          })
          .select("id, name, code, type, target, value, period, status")
          .single();

        if (error) {
          showToast("error", "Promo gagal ditambahkan", error.message);
          return;
        }

        const nextPromo = mapPromo(data as PromoRow);
        setPromos((items) => [...items, nextPromo]);
        showToast("success", "Promo ditambahkan", `${nextPromo.name} aktif sesuai status yang dipilih.`);
      }

      closePromoModal();
      return;
    }

    if (promoModal === "edit" && editingPromoId) {
      setPromos((items) =>
        items.map((item) => (toId(item.id) === toId(editingPromoId) ? { ...item, ...normalizedForm } : item)),
      );
      showToast("success", "Promo diperbarui", `${normalizedForm.name} berhasil disimpan.`);
    } else {
      setPromos((items) => [
        ...items,
        {
          id: getNextLocalId(items),
          ...normalizedForm,
        },
      ]);
      showToast("success", "Promo ditambahkan", `${normalizedForm.name} aktif sesuai status yang dipilih.`);
    }

    closePromoModal();
  }

  async function confirmDeletePromo() {
    if (!deletePromo) {
      return;
    }

    if (isSupabaseSynced && typeof deletePromo.id === "string") {
      const { error } = await supabase.from("promos").delete().eq("id", deletePromo.id);

      if (error) {
        showToast("error", "Promo gagal dihapus", error.message);
        return;
      }
    }

    setPromos((items) => items.filter((item) => toId(item.id) !== toId(deletePromo.id)));
    if (toId(deletePromo.id) === toId(appliedPromoId ?? "")) {
      removeAppliedPromo({ silent: true });
    }
    showToast("success", "Promo dihapus", `${deletePromo.name} dihapus dari campaign.`);
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

  async function saveStaff() {
    const normalizedForm = {
      ...staffForm,
      name: staffForm.name.trim(),
      phone: staffForm.phone.trim(),
    };

    if (!normalizedForm.name || !normalizedForm.phone) {
      showToast("error", "Staf gagal disimpan", "Nama staf dan nomor WhatsApp wajib diisi.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      if (staffModal === "edit" && editingStaffId && typeof editingStaffId === "string") {
        const { data, error } = await supabase
          .from("staff_members")
          .update(normalizedForm)
          .eq("id", editingStaffId)
          .select("id, name, role, phone, shift, status")
          .single();

        if (error) {
          showToast("error", "Staf gagal disimpan", error.message);
          return;
        }

        const nextStaff = mapStaff(data as StaffRow);
        setStaffMembers((items) =>
          items.map((item) => (toId(item.id) === toId(editingStaffId) ? nextStaff : item)),
        );
        showToast("success", "Staf diperbarui", `${nextStaff.name} berhasil disimpan.`);
      } else if (staffMembers.length < 2) {
        const { data, error } = await supabase
          .from("staff_members")
          .insert({
            outlet_id: outletContext.outletId,
            ...normalizedForm,
          })
          .select("id, name, role, phone, shift, status")
          .single();

        if (error) {
          showToast("error", "Staf gagal ditambahkan", error.message);
          return;
        }

        const nextStaff = mapStaff(data as StaffRow);
        setStaffMembers((items) => [...items, nextStaff]);
        showToast("success", "Staf ditambahkan", `${nextStaff.name} dapat mengakses kasir.`);
      } else {
        showToast("error", "Slot staf penuh", "Paket Core membatasi maksimal 2 staf kasir.");
        return;
      }

      closeStaffModal();
      return;
    }

    if (staffModal === "edit" && editingStaffId) {
      setStaffMembers((items) =>
        items.map((item) => (toId(item.id) === toId(editingStaffId) ? { ...item, ...normalizedForm } : item)),
      );
      showToast("success", "Staf diperbarui", `${normalizedForm.name} berhasil disimpan.`);
    } else if (staffMembers.length < 2) {
      setStaffMembers((items) => [
        ...items,
        {
          id: getNextLocalId(items),
          ...normalizedForm,
        },
      ]);
      showToast("success", "Staf ditambahkan", `${normalizedForm.name} dapat mengakses kasir.`);
    } else {
      showToast("error", "Slot staf penuh", "Paket Core membatasi maksimal 2 staf kasir.");
      return;
    }

    closeStaffModal();
  }

  async function confirmDeleteStaff() {
    if (!deleteStaff) {
      return;
    }

    if (isSupabaseSynced && typeof deleteStaff.id === "string") {
      const { error } = await supabase.from("staff_members").delete().eq("id", deleteStaff.id);

      if (error) {
        showToast("error", "Staf gagal dihapus", error.message);
        return;
      }
    }

    setStaffMembers((items) => items.filter((item) => toId(item.id) !== toId(deleteStaff.id)));
    showToast("success", "Staf dihapus", `${deleteStaff.name} kehilangan akses kasir.`);
    setDeleteStaff(null);
  }

  async function saveCategory() {
    const name = categoryForm.name.trim();

    if (!name || categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
      showToast("error", "Kategori gagal ditambahkan", "Nama kategori kosong atau sudah tersedia.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          outlet_id: outletContext.outletId,
          name,
        })
        .select("id, name")
        .single();

      if (error) {
        showToast("error", "Kategori gagal ditambahkan", error.message);
        return;
      }

      const row = data as CategoryRow;
      setCategoryIdByName((items) => ({ ...items, [row.name]: row.id }));
      setCategories((items) => [...items, row.name]);
    } else {
      setCategories((items) => [...items, name]);
    }

    setCategoryForm({ name: "" });
    setCategoryModal(false);
    showToast("success", "Kategori ditambahkan", `${name} tersedia di filter kasir dan form produk.`);
  }

  async function deleteCategory(name: string) {
    const isInUse = products.some((product) => product.category === name);

    if (isInUse) {
      showToast(
        "error",
        "Kategori tidak bisa dihapus",
        "Masih ada produk yang memakai kategori ini.",
      );
      return;
    }

    if (isSupabaseSynced) {
      const categoryId = categoryIdByName[name];

      if (categoryId) {
        const { error } = await supabase.from("categories").delete().eq("id", categoryId);

        if (error) {
          showToast("error", "Kategori gagal dihapus", error.message);
          return;
        }
      }
    }

    setCategories((items) => items.filter((item) => item !== name));
    setCategoryIdByName((items) => {
      const nextItems = { ...items };
      delete nextItems[name];
      return nextItems;
    });
    if (category === name) {
      setCategory("Semua");
    }
    if (productForm.category === name) {
      setProductForm((form) => ({ ...form, category: initialCategories[0] ?? "FnB" }));
    }
    showToast("success", "Kategori dihapus", `${name} dihapus dari daftar kategori.`);
  }

  function openCreateIngredient() {
    setIngredientForm({
      name: "",
      unit: "kg",
      stock: 0,
      minStock: 0,
      costPerUnit: 0,
      usedFor: "",
    });
    setEditingIngredientId(null);
    setIngredientModal("create");
  }

  function openEditIngredient(ingredient: Ingredient) {
    setIngredientForm({
      name: ingredient.name,
      unit: ingredient.unit,
      stock: ingredient.stock,
      minStock: ingredient.minStock,
      costPerUnit: ingredient.costPerUnit,
      usedFor: ingredient.usedFor.join(", "),
    });
    setEditingIngredientId(ingredient.id);
    setIngredientModal("edit");
  }

  function closeIngredientModal() {
    setIngredientModal(null);
    setEditingIngredientId(null);
  }

  async function saveIngredient() {
    const normalizedForm = {
      ...ingredientForm,
      name: ingredientForm.name.trim(),
      unit: ingredientForm.unit.trim(),
      stock: Number(ingredientForm.stock),
      minStock: Number(ingredientForm.minStock),
      costPerUnit: Number(ingredientForm.costPerUnit),
      usedFor: ingredientForm.usedFor
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (!normalizedForm.name || !normalizedForm.unit || normalizedForm.stock < 0 || normalizedForm.minStock < 0) {
      showToast("error", "Bahan gagal disimpan", "Nama, unit, stok, dan minimum stok harus valid.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      const dbPayload = {
        name: normalizedForm.name,
        unit: normalizedForm.unit,
        stock: normalizedForm.stock,
        min_stock: normalizedForm.minStock,
        cost_per_unit: normalizedForm.costPerUnit,
      };

      if (ingredientModal === "edit" && editingIngredientId && typeof editingIngredientId === "string") {
        const { data, error } = await supabase
          .from("ingredients")
          .update(dbPayload)
          .eq("id", editingIngredientId)
          .select("id, name, unit, stock, min_stock, cost_per_unit")
          .single();

        if (error) {
          showToast("error", "Bahan gagal disimpan", error.message);
          return;
        }

        const nextIngredient = mapIngredient(data as IngredientRow);
        setIngredients((items) =>
          items.map((item) => (toId(item.id) === toId(editingIngredientId) ? nextIngredient : item)),
        );
        showToast("success", "Bahan diperbarui", `${nextIngredient.name} berhasil disimpan.`);
      } else {
        const { data, error } = await supabase
          .from("ingredients")
          .insert({
            outlet_id: outletContext.outletId,
            ...dbPayload,
          })
          .select("id, name, unit, stock, min_stock, cost_per_unit")
          .single();

        if (error) {
          showToast("error", "Bahan gagal ditambahkan", error.message);
          return;
        }

        const nextIngredient = mapIngredient(data as IngredientRow);
        setIngredients((items) => [...items, nextIngredient]);
        showToast("success", "Bahan ditambahkan", `${nextIngredient.name} siap dipakai dalam racikan menu.`);
      }

      closeIngredientModal();
      return;
    }

    if (ingredientModal === "edit" && editingIngredientId) {
      setIngredients((items) =>
        items.map((item) =>
          toId(item.id) === toId(editingIngredientId) ? { id: editingIngredientId, ...normalizedForm } : item,
        ),
      );
      showToast("success", "Bahan diperbarui", `${normalizedForm.name} berhasil disimpan.`);
    } else {
      setIngredients((items) => [
        ...items,
        {
          id: getNextLocalId(items),
          ...normalizedForm,
        },
      ]);
      showToast("success", "Bahan ditambahkan", `${normalizedForm.name} siap dipakai dalam racikan menu.`);
    }

    closeIngredientModal();
  }

  async function confirmDeleteIngredient() {
    if (!deleteIngredient) {
      return;
    }

    if (isSupabaseSynced && typeof deleteIngredient.id === "string") {
      const { error } = await supabase.from("ingredients").delete().eq("id", deleteIngredient.id);

      if (error) {
        showToast("error", "Bahan gagal dihapus", error.message);
        return;
      }
    }

    setIngredients((items) => items.filter((item) => toId(item.id) !== toId(deleteIngredient.id)));
    showToast("success", "Bahan dihapus", `${deleteIngredient.name} dihapus dari daftar bahan.`);
    setDeleteIngredient(null);
  }

  function openCreateExpense() {
    setExpenseForm({
      title: "",
      category: "Operasional",
      amount: 0,
      date: "2026-05-07",
      paymentMethod: "Kas outlet",
      note: "",
      status: "Tercatat",
    });
    setEditingExpenseId(null);
    setExpenseModal("create");
  }

  function openEditExpense(expense: Expense) {
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      note: expense.note,
      status: expense.status,
    });
    setEditingExpenseId(expense.id);
    setExpenseModal("edit");
  }

  function closeExpenseModal() {
    setExpenseModal(null);
    setEditingExpenseId(null);
  }

  async function saveExpense() {
    const normalizedForm = {
      ...expenseForm,
      title: expenseForm.title.trim(),
      category: expenseForm.category.trim(),
      amount: Number(expenseForm.amount),
      note: expenseForm.note.trim(),
    };

    if (!normalizedForm.title || !normalizedForm.category || normalizedForm.amount <= 0 || !normalizedForm.date) {
      showToast("error", "Pengeluaran gagal disimpan", "Judul, kategori, tanggal, dan nominal harus valid.");
      return;
    }

    if (isSupabaseSynced && outletContext) {
      const dbPayload = {
        title: normalizedForm.title,
        category: normalizedForm.category,
        amount: normalizedForm.amount,
        expense_date: normalizedForm.date,
        payment_method: normalizedForm.paymentMethod,
        note: normalizedForm.note,
        status: normalizedForm.status,
        created_by: outletContext.profileId,
      };

      if (expenseModal === "edit" && editingExpenseId && typeof editingExpenseId === "string") {
        const { data, error } = await supabase
          .from("expenses")
          .update(dbPayload)
          .eq("id", editingExpenseId)
          .select("id, title, category, amount, expense_date, payment_method, note, status")
          .single();

        if (error) {
          showToast("error", "Pengeluaran gagal disimpan", error.message);
          return;
        }

        const nextExpense = mapExpense(data as ExpenseRow);
        setExpenses((items) =>
          items.map((item) => (toId(item.id) === toId(editingExpenseId) ? nextExpense : item)),
        );
        showToast("success", "Pengeluaran diperbarui", `${nextExpense.title} berhasil disimpan.`);
      } else {
        const { data, error } = await supabase
          .from("expenses")
          .insert({
            outlet_id: outletContext.outletId,
            ...dbPayload,
          })
          .select("id, title, category, amount, expense_date, payment_method, note, status")
          .single();

        if (error) {
          showToast("error", "Pengeluaran gagal ditambahkan", error.message);
          return;
        }

        const nextExpense = mapExpense(data as ExpenseRow);
        setExpenses((items) => [nextExpense, ...items]);
        showToast("success", "Pengeluaran ditambahkan", `${nextExpense.title} berhasil dicatat.`);
      }

      closeExpenseModal();
      return;
    }

    if (expenseModal === "edit" && editingExpenseId) {
      setExpenses((items) =>
        items.map((item) =>
          toId(item.id) === toId(editingExpenseId) ? { id: editingExpenseId, ...normalizedForm } : item,
        ),
      );
      showToast("success", "Pengeluaran diperbarui", `${normalizedForm.title} berhasil disimpan.`);
    } else {
      setExpenses((items) => [
        ...items,
        {
          id: getNextLocalId(items),
          ...normalizedForm,
        },
      ]);
      showToast("success", "Pengeluaran ditambahkan", `${normalizedForm.title} berhasil dicatat.`);
    }

    closeExpenseModal();
  }

  async function confirmDeleteExpense() {
    if (!deleteExpense) {
      return;
    }

    if (isSupabaseSynced && typeof deleteExpense.id === "string") {
      const { error } = await supabase.from("expenses").delete().eq("id", deleteExpense.id);

      if (error) {
        showToast("error", "Pengeluaran gagal dihapus", error.message);
        return;
      }
    }

    setExpenses((items) => items.filter((item) => toId(item.id) !== toId(deleteExpense.id)));
    showToast("success", "Pengeluaran dihapus", `${deleteExpense.title} dihapus dari catatan pengeluaran.`);
    setDeleteExpense(null);
  }

  async function saveStockAdjustment() {
    const qty = Number(stockAdjustmentForm.qty);
    const productId = stockAdjustmentForm.productId;
    const selectedProduct = products.find((product) => toId(product.id) === toId(productId));
    const normalizedNote = stockAdjustmentForm.note.trim();

    if (!selectedProduct || qty <= 0) {
      showToast("error", "Mutasi stok gagal", "Pilih produk dan isi jumlah stok yang valid.");
      return;
    }

    const qtyChange = stockAdjustmentForm.type === "Stok masuk" ? qty : qty * -1;
    const success = await applyStockChange(
      productId,
      qtyChange,
      stockAdjustmentForm.type,
      normalizedNote || `Mutasi ${stockAdjustmentForm.type.toLowerCase()}`,
    );

    if (!success) {
      showToast("error", "Mutasi stok gagal", "Jumlah penyesuaian melebihi stok yang tersedia.");
      return;
    }

    setStockAdjustmentForm({
      productId: "",
      type: "Stok masuk",
      qty: 0,
      note: "",
    });
    showToast(
      "success",
      "Mutasi stok disimpan",
      `${selectedProduct.name} berhasil dicatat sebagai ${stockAdjustmentForm.type.toLowerCase()}.`,
    );
  }

  async function saveStockOpname() {
    const changedRows = products
      .map((product) => {
        const row = opnameInputs[String(product.id)];
        const actualStock = Number(row?.actualStock);

        if (!row || row.actualStock === "" || Number.isNaN(actualStock) || actualStock === product.stock) {
          return null;
        }

        return {
          product,
          actualStock,
          note: row.note.trim(),
          diff: actualStock - product.stock,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (changedRows.length === 0) {
      showToast("info", "Tidak ada perubahan opname", "Stok fisik sama dengan stok sistem.");
      return;
    }

    for (const { product, note, diff } of changedRows) {
      const success = await applyStockChange(
        product.id,
        diff,
        "Stok opname",
        note || "Penyesuaian dari stok opname",
      );

      if (!success) {
        return;
      }
    }

    setOpnameInputs({});
    showToast("success", "Stok opname disimpan", `${changedRows.length} produk berhasil disesuaikan.`);
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
	      setShowSplash(false);
      void loadSupabaseData(data.user.id);
	      setActiveMenu("Dashboard");
	      window.localStorage.removeItem("mavapos.session");
	      setAuthSubmitting(false);
	      showToast("success", "Login berhasil", `Selamat datang, ${user.name}.`);
	      router.push("/dashboard");
	      return;
	    }

    const matchedUser = demoUsers.find(
      (item) =>
        item.email === normalizedEmail &&
        item.password === loginForm.password,
    );

	    if (!matchedUser) {
	      const message = error?.message ?? "Email atau password tidak sesuai.";
	      setAuthError(message);
	      setAuthSubmitting(false);
	      showToast("error", "Login gagal", message);
	      return;
	    }
	
	    setAuthUser(matchedUser.user);
	    setAuthSource("demo");
	    setOutletContext(null);
	    setShowSplash(false);
	    setActiveMenu("Dashboard");
	    setAuthError("");
	    window.localStorage.setItem("mavapos.session", JSON.stringify(matchedUser.user));
	    setAuthSubmitting(false);
	    showToast("success", "Login berhasil", `Selamat datang, ${matchedUser.user.name}.`);
	    router.push("/dashboard");
	  }
	
	  async function register(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    const normalizedEmail = registerForm.email.trim().toLowerCase();
	
	    if (registerForm.password.length < 8) {
	      const message = "Password minimal 8 karakter.";
	      setAuthError(message);
	      setAuthSubmitting(false);
	      showToast("error", "Registrasi gagal", message);
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
	      showToast("error", "Registrasi gagal", error.message);
	      return;
	    }
	
	    if (data.session?.user) {
	      setAuthUser(mapSupabaseUser(data.session.user));
	      setAuthSource("supabase");
	      setShowSplash(false);
	      void loadSupabaseData(data.session.user.id);
	      setActiveMenu("Dashboard");
	      window.localStorage.removeItem("mavapos.session");
	      showToast("success", "Registrasi berhasil", "Akun owner berhasil dibuat.");
	      router.push("/dashboard");
	    } else {
	      setAuthMode("login");
	      setLoginForm((form) => ({ ...form, email: normalizedEmail, password: "" }));
	      setAuthNotice("Registrasi berhasil. Cek email untuk verifikasi sebelum masuk.");
	      showToast("success", "Registrasi berhasil", "Cek email untuk verifikasi sebelum masuk.");
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
	      showToast("error", "Reset password gagal", error.message);
	    } else {
	      setAuthNotice("Link reset password sudah dikirim jika email terdaftar.");
	      setAuthMode("login");
	      setLoginForm((form) => ({ ...form, email, password: "" }));
	      setForgotEmail("");
	      showToast("success", "Link reset dikirim", "Cek email untuk melanjutkan pemulihan akun.");
	    }
	
	    setAuthSubmitting(false);
	  }
	
	  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
	    event.preventDefault();
	    setAuthError("");
	    setAuthNotice("");
	    setAuthSubmitting(true);
	
	    if (newPasswordForm.password.length < 8) {
	      const message = "Password baru minimal 8 karakter.";
	      setAuthError(message);
	      setAuthSubmitting(false);
	      showToast("error", "Password gagal diperbarui", message);
	      return;
	    }
	
	    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
	      const message = "Konfirmasi password belum sama.";
	      setAuthError(message);
	      setAuthSubmitting(false);
	      showToast("error", "Password gagal diperbarui", message);
	      return;
	    }
	
	    const { error } = await supabase.auth.updateUser({
	      password: newPasswordForm.password,
	    });
	
	    if (error) {
	      setAuthError(error.message);
	      showToast("error", "Password gagal diperbarui", error.message);
	    } else {
	      setAuthMode("login");
	      setNewPasswordForm({ password: "", confirmPassword: "" });
	      setAuthNotice("Password berhasil diperbarui. Silakan masuk kembali.");
	      await supabase.auth.signOut();
	      showToast("success", "Password diperbarui", "Silakan masuk kembali dengan password baru.");
	    }
	
	    setAuthSubmitting(false);
	  }

	  async function logout() {
	    if (authSource === "supabase") {
	      await supabase.auth.signOut();
	    }

    setAuthUser(null);
    setOutletContext(null);
    setAuthSource(null);
	    setShowSplash(true);
	    setActiveMenu("Dashboard");
	    window.localStorage.removeItem("mavapos.session");
	    showToast("success", "Logout berhasil", "Sesi pengguna sudah ditutup.");
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
	
	  if (!authReady) {
    return null;
  }

	  if (!authUser) {
    if (showSplash) {
      return <SplashScreen />;
    }

	    return (
	      <main className="auth-scope min-h-screen bg-[#f7faf8] text-foreground">
	        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
	        <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_460px]">
		          <section className="hidden flex-col justify-between bg-[#0369a1] p-10 text-white lg:flex">
		            <div>
		              <LoginLogo className="h-auto w-36" />
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
		                  <LoginLogo className="h-auto w-40" />
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
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
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
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 !text-[14px] font-medium transition ${
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
              <Button className="mt-4 w-full !text-[14px]" variant="outline" onClick={logout}>
                <LogOut data-icon="inline-start" />
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
                    {stockView === "products" ? (
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
                    ) : stockView === "movements" ? (
                      <button
                        onClick={saveStockAdjustment}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
                      >
                        <Plus size={17} />
                        Simpan mutasi
                      </button>
                    ) : (
                      <button
                        onClick={saveStockOpname}
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
                      >
                        <Check size={17} />
                        Simpan opname
                      </button>
                    )}
	                  </>
	                ) : activeMenu === "Bahan" ? (
	                  <button
	                    onClick={openCreateIngredient}
	                    className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
	                  >
	                    <Plus size={17} />
	                    Tambah bahan
	                  </button>
	                ) : activeMenu === "Pengeluaran" ? (
	                  <button
	                    onClick={openCreateExpense}
	                    className="flex h-10 items-center gap-2 rounded-lg bg-[#0369a1] px-4 text-sm font-semibold text-white"
	                  >
	                    <Plus size={17} />
	                    Tambah pengeluaran
	                  </button>
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
                    <button
                      onClick={() => changeMenu("Dashboard")}
                      className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                    >
                      <ReceiptText size={17} />
                      Dashboard
                    </button>
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
                      className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 !text-[14px] font-semibold"
                    >
                      Keluar
                    </button>
                  </>
                ) : null}
	              </div>
            </header>

            {dataLoading && authSource === "supabase" && (
              <div className="mt-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#075985]">
                Menyinkronkan data outlet dari Supabase...
              </div>
            )}

            {activeMenu === "Dashboard" ? (
              <>
                <section className="mt-6 grid gap-3 xl:grid-cols-4">
                  {dashboardStats.map((item) => (
                    <article key={item.label} className="rounded-lg border border-[#dde3da] bg-white p-4">
                      <p className="text-sm font-medium text-[#69756f]">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                      <p className="mt-1 text-xs font-medium text-[#0369a1]">{item.note}</p>
                    </article>
                  ))}
                </section>

                <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <article className="rounded-lg border border-[#dde3da] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">Chart penjualan mingguan</h2>
                        <p className="mt-1 text-sm text-[#69756f]">
                          Tren omzet harian outlet selama 7 hari terakhir.
                        </p>
                      </div>
                      <Badge variant="outline">7 hari</Badge>
                    </div>
                    <div className="mt-5 rounded-lg border border-[#eef2ee] bg-[#fbfcfa] p-3">
                      <div className="grid h-[220px] grid-cols-[34px_minmax(0,1fr)] gap-3">
                        <div className="flex h-full flex-col justify-between pb-6 text-[10px] font-medium text-[#8a968f]">
                          <span>1.5M</span>
                          <span>1.0M</span>
                          <span>0.5M</span>
                          <span>0</span>
                        </div>
                        <div className="grid h-full grid-cols-7 gap-2">
                          {salesChart.map((item) => (
                            <div key={item.day} className="grid h-full grid-rows-[1fr_auto] gap-2">
                              <div className="relative flex items-end rounded-xl bg-[linear-gradient(to_top,#e8efe9_1px,transparent_1px)] bg-[length:100%_25%] px-1 pb-1">
                                <div
                                  className="w-full rounded-[14px] bg-[#0369a1] transition-all"
                                  style={{ height: `${Math.max(10, (item.amount / maxSalesAmount) * 100)}%` }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold text-[#1f2623]">{item.day}</p>
                                <p className="mt-1 text-[10px] text-[#69756f]">
                                  {formatCurrency(item.amount).replace("Rp", "Rp ")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

	                  {[
	                    {
	                      label: "Persentase profit",
	                      value: profitPercent,
	                      note: `${formatCurrency(todayNetProfit)} estimasi setelah pengeluaran hari ini.`,
	                    },
	                    {
	                      label: "Persentase margin",
	                      value: discountPercent,
	                      note: `${formatCurrency(todayTransactions.reduce((sum, transaction) => sum + transaction.discount, 0))} diskon tercatat hari ini.`,
	                    },
	                  ].map((item) => (
                    <article key={item.label} className="rounded-lg border border-[#dde3da] bg-white p-4">
                      <h2 className="font-semibold">{item.label}</h2>
                      <div className="mt-6 flex items-center justify-center">
                        <div
                          className="grid size-40 place-items-center rounded-full"
                          style={{
                            background: `conic-gradient(#0369a1 ${item.value}%, #e5ebe3 ${item.value}% 100%)`,
                          }}
                        >
                          <div className="grid size-28 place-items-center rounded-full bg-white text-center">
                            <span className="text-3xl font-semibold tracking-tight">{item.value}%</span>
                            <span className="text-xs text-[#69756f]">bulan ini</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-6 text-sm leading-6 text-[#69756f]">{item.note}</p>
                    </article>
                  ))}
                </section>
              </>
            ) : activeMenu === "Produk & Stok" ? (
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
                  <div className="flex flex-col gap-3 border-b border-[#dde3da] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="font-semibold">Kelola stok outlet</h2>
                        <p className="mt-1 text-sm text-[#69756f]">
                          Pisahkan kerja produk, mutasi stok, dan stok opname supaya operasional lebih jelas.
                        </p>
                      </div>
                      {stockView === "products" && (
                        <div className="relative md:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]" size={18} />
                          <input
                            value={productQuery}
                            onChange={(event) => setProductQuery(event.target.value)}
                            className="h-10 w-full rounded-lg border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-sm outline-none focus:border-[#0369a1]"
                            placeholder="Cari produk atau kategori"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["products", "Daftar produk"],
                        ["movements", "Mutasi stok"],
                        ["opname", "Stok opname"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setStockView(value as "products" | "movements" | "opname")}
                          className={`h-10 rounded-lg px-4 text-sm font-semibold ${
                            stockView === value
                              ? "bg-[#0369a1] text-white"
                              : "border border-[#d7dfd4] bg-white text-[#4d5953]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {stockView === "products" ? (
                    <>
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
                    </>
                  ) : stockView === "movements" ? (
                    <div className="grid gap-4 p-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                      <div className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-4">
                        <h3 className="font-semibold">Input mutasi stok</h3>
                        <p className="mt-1 text-sm text-[#69756f]">
                          Gunakan untuk restock masuk atau penyesuaian manual.
                        </p>
                        <div className="mt-4 grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="stock-product">Produk</Label>
                            <select
                              id="stock-product"
                              value={stockAdjustmentForm.productId}
                              onChange={(event) =>
                                setStockAdjustmentForm((form) => ({ ...form, productId: event.target.value }))
                              }
                              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <option value="">Pilih produk</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} · stok {product.stock}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="stock-type">Tipe mutasi</Label>
                            <select
                              id="stock-type"
                              value={stockAdjustmentForm.type}
                              onChange={(event) =>
                                setStockAdjustmentForm((form) => ({
                                  ...form,
                                  type: event.target.value as "Stok masuk" | "Penyesuaian",
                                }))
                              }
                              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <option>Stok masuk</option>
                              <option>Penyesuaian</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="stock-qty">Jumlah</Label>
                            <Input
                              id="stock-qty"
                              type="number"
                              min={0}
                              value={stockAdjustmentForm.qty}
                              onChange={(event) =>
                                setStockAdjustmentForm((form) => ({
                                  ...form,
                                  qty: Number(event.target.value),
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="stock-note">Catatan</Label>
                            <Input
                              id="stock-note"
                              value={stockAdjustmentForm.note}
                              onChange={(event) =>
                                setStockAdjustmentForm((form) => ({ ...form, note: event.target.value }))
                              }
                              placeholder="Contoh: Restock supplier atau koreksi rak"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#dde3da] bg-white">
                        <div className="border-b border-[#dde3da] p-4">
                          <h3 className="font-semibold">Riwayat mutasi stok</h3>
                          <p className="mt-1 text-sm text-[#69756f]">
                            Setiap penjualan, restock, penyesuaian, dan opname akan tercatat di sini.
                          </p>
                        </div>
                        <div className="grid gap-3 p-4">
                          {stockMovements.length === 0 ? (
                            <div className="rounded-lg bg-[#fbfcfa] p-4 text-sm text-[#69756f]">
                              Belum ada mutasi stok tercatat.
                            </div>
                          ) : (
                            stockMovements.map((movement) => (
                              <article
                                key={movement.id}
                                className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{movement.productName}</p>
                                    <p className="mt-0.5 text-xs text-[#69756f]">
                                      {movement.type} · {movement.createdAt}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={movement.qtyChange > 0 ? "default" : "secondary"}
                                  >
                                    {movement.qtyChange > 0 ? "+" : ""}
                                    {movement.qtyChange}
                                  </Badge>
                                </div>
                                <div className="mt-3 grid gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-[#69756f]">Stok</span>
                                    <strong>
                                      {movement.previousStock} ke {movement.nextStock}
                                    </strong>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-[#69756f]">Catatan</span>
                                    <span className="text-right">{movement.note}</span>
                                  </div>
                                </div>
                              </article>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="rounded-lg border border-[#dde3da] bg-white">
                        <div className="border-b border-[#dde3da] p-4">
                          <h3 className="font-semibold">Stok opname</h3>
                          <p className="mt-1 text-sm text-[#69756f]">
                            Bandingkan stok sistem dengan stok fisik, lalu simpan penyesuaian per produk.
                          </p>
                        </div>
                        <div className="grid gap-3 p-4 md:hidden">
                          {products.map((product) => {
                            const opnameRow = opnameInputs[String(product.id)] ?? {
                              actualStock: String(product.stock),
                              note: "",
                            };
                            const diff = Number(opnameRow.actualStock || product.stock) - product.stock;

                            return (
                              <article key={product.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="mt-0.5 text-xs text-[#69756f]">{product.category}</p>
                                  </div>
                                  <Badge variant={diff === 0 ? "outline" : diff > 0 ? "default" : "secondary"}>
                                    {diff > 0 ? "+" : ""}
                                    {diff}
                                  </Badge>
                                </div>
                                <div className="mt-3 grid gap-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#69756f]">Stok sistem</span>
                                    <strong>{product.stock}</strong>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor={`opname-actual-${product.id}`}>Stok fisik</Label>
                                    <Input
                                      id={`opname-actual-${product.id}`}
                                      type="number"
                                      value={opnameRow.actualStock}
                                      onChange={(event) =>
                                        setOpnameInputs((items) => ({
                                          ...items,
                                          [product.id]: {
                                            ...opnameRow,
                                            actualStock: event.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor={`opname-note-${product.id}`}>Catatan</Label>
                                    <Input
                                      id={`opname-note-${product.id}`}
                                      value={opnameRow.note}
                                      onChange={(event) =>
                                        setOpnameInputs((items) => ({
                                          ...items,
                                          [product.id]: {
                                            ...opnameRow,
                                            note: event.target.value,
                                          },
                                        }))
                                      }
                                      placeholder="Contoh: Selisih hitung rak"
                                    />
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                        <div className="hidden md:block">
                          <Table className="min-w-[860px]">
                            <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
                              <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Stok sistem</TableHead>
                                <TableHead>Stok fisik</TableHead>
                                <TableHead>Selisih</TableHead>
                                <TableHead>Catatan</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {products.map((product) => {
                                const opnameRow = opnameInputs[String(product.id)] ?? {
                                  actualStock: String(product.stock),
                                  note: "",
                                };
                                const diff = Number(opnameRow.actualStock || product.stock) - product.stock;

                                return (
                                  <TableRow key={product.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-xs text-[#69756f]">{product.category}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={opnameRow.actualStock}
                                        onChange={(event) =>
                                          setOpnameInputs((items) => ({
                                            ...items,
                                            [product.id]: {
                                              ...opnameRow,
                                              actualStock: event.target.value,
                                            },
                                          }))
                                        }
                                        className="h-9 min-h-9"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={diff === 0 ? "outline" : diff > 0 ? "default" : "secondary"}>
                                        {diff > 0 ? "+" : ""}
                                        {diff}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={opnameRow.note}
                                        onChange={(event) =>
                                          setOpnameInputs((items) => ({
                                            ...items,
                                            [product.id]: {
                                              ...opnameRow,
                                              note: event.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Catatan selisih"
                                        className="h-9 min-h-9"
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
	                </section>
	              </>
	            ) : activeMenu === "Bahan" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Total bahan", `${ingredients.length}`, "Bahan aktif untuk racikan menu"],
	                    ["Bahan menipis", `${lowIngredientCount}`, "Perlu restock segera"],
	                    [
	                      "Dipakai di menu",
	                      `${ingredients.filter((item) => (ingredientUsageMap[toId(item.id)] ?? []).length > 0).length}`,
	                      "Sudah terhubung ke resep produk",
	                    ],
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
	                      <h2 className="font-semibold">Data bahan utama</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Kelola bahan baku yang dipakai untuk meracik menu seperti es teh, kopi, dan minuman lainnya.
	                      </p>
	                    </div>
	                    <div className="relative md:w-72">
	                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]" size={18} />
	                      <input
	                        value={ingredientQuery}
	                        onChange={(event) => {
	                          setIngredientQuery(event.target.value);
	                          setIngredientPage(1);
	                        }}
	                        className="h-10 w-full rounded-lg border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-sm outline-none focus:border-[#0369a1]"
	                        placeholder="Cari bahan, unit, atau menu"
	                      />
	                    </div>
	                  </div>

	                  <div className="grid gap-3 p-4 md:hidden">
	                    {paginatedIngredients.map((ingredient) => (
	                      <article key={ingredient.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
	                        <div className="flex items-start justify-between gap-3">
	                          <div>
	                            <p className="font-semibold">{ingredient.name}</p>
	                            <p className="mt-0.5 text-xs text-[#69756f]">
	                              {ingredient.stock} {ingredient.unit} · min {ingredient.minStock} {ingredient.unit}
	                            </p>
	                          </div>
	                          <Badge
	                            variant={ingredient.stock <= ingredient.minStock ? "secondary" : "outline"}
	                          >
	                            {formatCurrency(ingredient.costPerUnit)}
	                          </Badge>
	                        </div>
	                        <p className="mt-3 text-sm text-[#69756f]">
	                          Dipakai di: {(ingredientUsageMap[toId(ingredient.id)] ?? []).join(", ") || "Belum dipakai di menu"}
	                        </p>
	                        <div className="mt-3 flex justify-end gap-2">
	                          <Button variant="outline" size="sm" onClick={() => openEditIngredient(ingredient)}>
	                            <Edit3 data-icon="inline-start" />
	                            Edit
	                          </Button>
	                          <Button variant="destructive" size="sm" onClick={() => setDeleteIngredient(ingredient)}>
	                            <Trash2 data-icon="inline-start" />
	                            Hapus
	                          </Button>
	                        </div>
	                      </article>
	                    ))}
	                  </div>

	                  <div className="hidden md:block">
	                    <Table className="min-w-[820px]">
	                      <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
	                        <TableRow>
	                          <TableHead>Bahan</TableHead>
	                          <TableHead>Stok</TableHead>
	                          <TableHead>Minimum</TableHead>
	                          <TableHead>Biaya / unit</TableHead>
	                          <TableHead>Dipakai di menu</TableHead>
	                          <TableHead className="text-right">Aksi</TableHead>
	                        </TableRow>
	                      </TableHeader>
	                      <TableBody>
	                        {paginatedIngredients.map((ingredient) => (
	                          <TableRow key={ingredient.id}>
	                            <TableCell>
	                              <div>
	                                <p className="font-semibold">{ingredient.name}</p>
	                                <p className="text-xs text-[#69756f]">ID #{ingredient.id}</p>
	                              </div>
	                            </TableCell>
	                            <TableCell>
	                              <Badge
	                                variant={ingredient.stock <= ingredient.minStock ? "secondary" : "outline"}
	                              >
	                                {ingredient.stock} {ingredient.unit}
	                              </Badge>
	                            </TableCell>
	                            <TableCell>{ingredient.minStock} {ingredient.unit}</TableCell>
	                            <TableCell className="font-semibold text-primary">
	                              {formatCurrency(ingredient.costPerUnit)}
	                            </TableCell>
	                            <TableCell className="max-w-[280px] whitespace-normal text-[#69756f]">
	                              {(ingredientUsageMap[toId(ingredient.id)] ?? []).join(", ") || "Belum dipakai di menu"}
	                            </TableCell>
	                            <TableCell>
	                              <div className="flex justify-end gap-2">
	                                <Button
	                                  variant="outline"
	                                  size="icon-lg"
	                                  onClick={() => openEditIngredient(ingredient)}
	                                  aria-label={`Edit ${ingredient.name}`}
	                                >
	                                  <Edit3 size={16} />
	                                </Button>
	                                <Button
	                                  variant="destructive"
	                                  size="icon-lg"
	                                  onClick={() => setDeleteIngredient(ingredient)}
	                                  aria-label={`Hapus ${ingredient.name}`}
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

	                  <TablePagination
	                    currentPage={currentIngredientPage}
	                    totalPages={ingredientPageCount}
	                    totalItems={filteredIngredients.length}
	                    label={`${filteredIngredients.length} bahan`}
	                    onPageChange={setIngredientPage}
	                  />
	                </section>
	              </>
	            ) : activeMenu === "Pengeluaran" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    [
	                      "Total pengeluaran",
	                      formatCurrency(expenses.reduce((sum, item) => sum + item.amount, 0)),
	                      "Akumulasi seluruh catatan pengeluaran",
	                    ],
	                    [
	                      "Tercatat bulan ini",
	                      `${expenses.filter((item) => item.status === "Tercatat").length}`,
	                      "Pengeluaran siap masuk laporan",
	                    ],
	                    [
	                      "Draft biaya",
	                      `${expenses.filter((item) => item.status === "Draft").length}`,
	                      "Masih menunggu finalisasi",
	                    ],
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
	                      <h2 className="font-semibold">Catatan pengeluaran outlet</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Rekam biaya operasional, bahan baku, servis alat, dan pengeluaran harian lainnya.
	                      </p>
	                    </div>
	                    <div className="relative md:w-72">
	                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a968f]" size={18} />
	                      <input
	                        value={expenseQuery}
	                        onChange={(event) => {
	                          setExpenseQuery(event.target.value);
	                          setExpensePage(1);
	                        }}
	                        className="h-10 w-full rounded-lg border border-[#d7dfd4] bg-[#fbfcfa] pl-10 pr-3 text-sm outline-none focus:border-[#0369a1]"
	                        placeholder="Cari judul, kategori, atau metode"
	                      />
	                    </div>
	                  </div>

	                  <div className="grid gap-3 p-4 md:hidden">
	                    {paginatedExpenses.map((expense) => (
	                      <article key={expense.id} className="rounded-lg border border-[#dde3da] bg-[#fbfcfa] p-3">
	                        <div className="flex items-start justify-between gap-3">
	                          <div>
	                            <p className="font-semibold">{expense.title}</p>
	                            <p className="mt-0.5 text-xs text-[#69756f]">
	                              {expense.category} · {expense.date}
	                            </p>
	                          </div>
	                          <Badge variant={expense.status === "Tercatat" ? "default" : "secondary"}>
	                            {expense.status}
	                          </Badge>
	                        </div>
	                        <div className="mt-3 grid gap-2 text-sm">
	                          <div className="flex justify-between">
	                            <span className="text-[#69756f]">Nominal</span>
	                            <strong>{formatCurrency(expense.amount)}</strong>
	                          </div>
	                          <div className="flex justify-between">
	                            <span className="text-[#69756f]">Metode</span>
	                            <strong>{expense.paymentMethod}</strong>
	                          </div>
	                        </div>
	                        <p className="mt-3 text-sm text-[#69756f]">{expense.note || "Tanpa catatan"}</p>
	                        <div className="mt-3 flex justify-end gap-2">
	                          <Button variant="outline" size="sm" onClick={() => openEditExpense(expense)}>
	                            <Edit3 data-icon="inline-start" />
	                            Edit
	                          </Button>
	                          <Button variant="destructive" size="sm" onClick={() => setDeleteExpense(expense)}>
	                            <Trash2 data-icon="inline-start" />
	                            Hapus
	                          </Button>
	                        </div>
	                      </article>
	                    ))}
	                  </div>

	                  <div className="hidden md:block">
	                    <Table className="min-w-[860px]">
	                      <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
	                        <TableRow>
	                          <TableHead>Tanggal</TableHead>
	                          <TableHead>Pengeluaran</TableHead>
	                          <TableHead>Kategori</TableHead>
	                          <TableHead>Metode</TableHead>
	                          <TableHead>Nominal</TableHead>
	                          <TableHead>Status</TableHead>
	                          <TableHead className="text-right">Aksi</TableHead>
	                        </TableRow>
	                      </TableHeader>
	                      <TableBody>
	                        {paginatedExpenses.map((expense) => (
	                          <TableRow key={expense.id}>
	                            <TableCell>{expense.date}</TableCell>
	                            <TableCell>
	                              <div>
	                                <p className="font-semibold">{expense.title}</p>
	                                <p className="text-xs text-[#69756f]">{expense.note || "Tanpa catatan"}</p>
	                              </div>
	                            </TableCell>
	                            <TableCell>{expense.category}</TableCell>
	                            <TableCell>{expense.paymentMethod}</TableCell>
	                            <TableCell className="font-semibold text-primary">
	                              {formatCurrency(expense.amount)}
	                            </TableCell>
	                            <TableCell>
	                              <Badge variant={expense.status === "Tercatat" ? "default" : "secondary"}>
	                                {expense.status}
	                              </Badge>
	                            </TableCell>
	                            <TableCell>
	                              <div className="flex justify-end gap-2">
	                                <Button
	                                  variant="outline"
	                                  size="icon-lg"
	                                  onClick={() => openEditExpense(expense)}
	                                  aria-label={`Edit ${expense.title}`}
	                                >
	                                  <Edit3 size={16} />
	                                </Button>
	                                <Button
	                                  variant="destructive"
	                                  size="icon-lg"
	                                  onClick={() => setDeleteExpense(expense)}
	                                  aria-label={`Hapus ${expense.title}`}
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

	                  <TablePagination
	                    currentPage={currentExpensePage}
	                    totalPages={expensePageCount}
	                    totalItems={filteredExpenses.length}
	                    label={`${filteredExpenses.length} pengeluaran`}
	                    onPageChange={setExpensePage}
	                  />
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
	                            <p className="mt-1 text-[11px] font-semibold tracking-wide text-[#075985]">
	                              {promo.code}
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
	                          <TableHead>Kode</TableHead>
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
	                            <TableCell className="font-semibold text-[#075985]">{promo.code}</TableCell>
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
	            ) : activeMenu === "Laporan" ? (
	              <>
	                <section className="mt-6 grid gap-3 md:grid-cols-3">
	                  {[
	                    ["Penjualan hari ini", formatCurrency(todaySalesTotal), `${todayTransactions.length} transaksi selesai`],
	                    ["Rata-rata transaksi", formatCurrency(averageTransaction), yesterdaySalesTotal > 0 ? `${salesGrowth >= 0 ? "Naik" : "Turun"} ${Math.abs(salesGrowth)}% dari kemarin` : "Belum ada pembanding kemarin"],
	                    ["Produk terjual", `${todayItemsSold} item`, todayItemsSold > 0 ? `FnB menyumbang ${fnBShare}%` : "Belum ada produk terjual hari ini"],
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
	                      <h2 className="font-semibold">Ringkasan penjualan</h2>
	                      <p className="mt-1 text-sm text-[#69756f]">
	                        Pantau omzet, transaksi, dan performa kategori outlet.
	                      </p>
	                    </div>
		                    <div className="grid gap-3 p-4">
		                      {[...paymentSummary, promoUsageSummary].map(({ label, value, note }) => (
		                        <div
		                          key={label}
	                          className="flex items-center justify-between rounded-lg bg-[#fbfcfa] p-3"
	                        >
	                          <div>
	                            <p className="font-semibold">{label}</p>
	                            <p className="mt-1 text-xs text-[#69756f]">{note}</p>
	                          </div>
	                          <strong className="text-[#0369a1]">{value}</strong>
	                        </div>
	                      ))}
	                    </div>
	                  </div>

		                  <aside className="rounded-lg border border-[#dde3da] bg-white p-4">
		                    <h2 className="font-semibold">Produk terlaris</h2>
		                    <div className="mt-4 grid gap-3">
		                      {(bestSellingProducts.length > 0 ? bestSellingProducts : products.slice(0, 4).map((product) => ({
		                        name: product.name,
		                        category: product.category,
		                        qty: 0,
		                      }))).map((product, index) => (
		                        <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-3">
		                          <div className="min-w-0">
		                            <p className="truncate text-sm font-semibold">{product.name}</p>
		                            <p className="mt-0.5 text-xs text-[#69756f]">
		                              {product.category}
		                            </p>
		                          </div>
		                          <Badge variant={index === 0 ? "default" : "outline"}>
		                            {product.qty} terjual
		                          </Badge>
		                        </div>
	                      ))}
	                    </div>
	                  </aside>
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
	                      <Button
	                        className="w-fit"
	                        onClick={() =>
	                          showToast(
	                            "success",
	                            "Profil outlet disimpan",
	                            "Pengaturan outlet berhasil diperbarui.",
	                          )
	                        }
	                      >
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
	                      <Button
	                        className="mt-6 w-full"
	                        variant={plan.status === "Aktif" ? "outline" : "default"}
	                        onClick={() =>
	                          showToast(
	                            plan.status === "Aktif" ? "info" : "success",
	                            plan.status === "Aktif" ? "Paket sudah aktif" : "Permintaan upgrade diterima",
	                            plan.status === "Aktif"
	                              ? "Outlet sudah menggunakan paket Core."
	                              : "Tim MAVA akan memproses upgrade paket Basic.",
	                          )
	                        }
	                      >
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
	            ) : (
              <>
	                {hasBasicAccess && (
	                  <section
	                    className="mt-6 overflow-hidden rounded-lg border border-[#dde3da] bg-white"
	                    aria-label="Carousel promo aktif"
	                  >
	                    <div
	                      className="relative min-h-56 bg-cover bg-center transition-all duration-500"
	                      style={{
	                        backgroundImage: `linear-gradient(90deg, rgba(3, 105, 161, 0.92), rgba(3, 105, 161, 0.5), rgba(3, 105, 161, 0.12)), url(${currentPromoImage})`,
	                      }}
	                    >
	                      <div className="flex min-h-56 flex-col justify-between p-5 text-white">
	                        <div>
	                          <div className="flex flex-wrap items-center justify-between gap-3">
	                            <p className="text-sm font-semibold opacity-90">Promo aktif</p>
	                            {canManageOutlet && (
	                              <div className="flex gap-2">
	                                <button
	                                  onClick={openCreatePromo}
	                                  className="flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold text-[#075985]"
	                                >
	                                  <Plus size={14} />
	                                  Tambah
	                                </button>
	                                {currentPromo && (
	                                  <button
	                                    onClick={() => setDeletePromo(currentPromo)}
	                                    className="flex h-8 items-center gap-1.5 rounded-md bg-white/15 px-2.5 text-xs font-semibold text-white ring-1 ring-white/35"
	                                  >
	                                    <Trash2 size={14} />
	                                    Hapus
	                                  </button>
	                                )}
	                              </div>
	                            )}
	                          </div>
	                          <div className="max-w-2xl">
	                            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
	                              {currentPromo?.name ?? "Belum ada promo aktif"}
	                            </h2>
	                            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90">
	                              {currentPromo
	                                ? `${currentPromo.type} untuk ${currentPromo.target} senilai ${currentPromo.value}. Berlaku ${currentPromo.period}.`
	                                : "Tambahkan promo agar tampil di carousel kasir dan bisa dipilih sebagai campaign outlet."}
	                            </p>
	                          </div>
	                        </div>
	                        <div className="mt-8 flex items-center justify-between gap-3">
	                          <Badge className="bg-white text-[#075985] hover:bg-white">
	                            {currentPromo?.status ?? "Kosong"}
	                          </Badge>
	                          {activePromos.length > 1 && (
	                          <div className="flex items-center gap-1.5">
	                            {activePromos.map((promo, index) => (
	                              <button
	                                key={promo.id}
	                                onClick={() => setPromoIndex(index)}
	                                className={`!h-1.5 !min-h-0 rounded-full transition-all ${
	                                  currentPromoIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
	                                }`}
	                                aria-label={`Lihat promo ${index + 1}`}
	                              />
	                            ))}
	                          </div>
	                          )}
	                        </div>
	                      </div>
	                    </div>
	                  </section>
	                )}

                <section className={`${hasBasicAccess ? "mt-6" : "mt-3"} rounded-lg border border-[#dde3da] bg-white p-4`}>
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
	                        {isDefaultProductImage(product.image) ? (
	                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#d7ecfb_0%,#f8fbfd_55%,#e0f2fe_100%)]">
	                            <div className="flex h-full items-center justify-center px-4">
	                              <Image
	                                src={defaultProductImage}
	                                alt=""
	                                width={160}
	                                height={48}
	                                className="h-10 w-auto opacity-90"
	                                draggable={false}
	                              />
	                            </div>
	                          </div>
	                        ) : (
	                          <div
	                            className="absolute inset-0 bg-cover bg-center"
	                            style={{ backgroundImage: `url(${product.image})` }}
	                          />
	                        )}
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
	                <form
	                  className="mt-3 grid gap-2"
	                  onSubmit={(event) => {
	                    event.preventDefault();
	                    applyPromoCode();
	                  }}
	                >
	                  <label
	                    htmlFor="cart-promo-code"
	                    className="text-xs font-semibold uppercase tracking-wide text-[#69756f]"
	                  >
	                    Kode promo
	                  </label>
	                  <div className="flex gap-2">
	                    <Input
	                      id="cart-promo-code"
	                      value={promoCodeInput}
	                      onChange={(event) => {
	                        setPromoCodeInput(event.target.value);
	                        setPromoCodeError("");
	                      }}
	                      placeholder={promoCodeHint}
	                      className="h-9 min-h-9 bg-white"
	                    />
	                    <Button
	                      type="submit"
	                      variant="outline"
	                      className="h-9 min-h-9 shrink-0 px-3"
	                      disabled={cart.length === 0}
	                    >
	                      Apply
	                    </Button>
	                  </div>
	                  {promoCodeError && (
	                    <p className="text-xs font-medium text-destructive">{promoCodeError}</p>
	                  )}
	                </form>
	                {discount > 0 && (
	                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#e0f2fe] px-3 py-2 text-sm text-[#075985]">
	                    <div className="min-w-0">
	                      <span className="block truncate font-semibold">
	                        {appliedPromo?.name ?? "Promo"}
	                      </span>
	                      <strong className="block">-{formatCurrency(discount)}</strong>
	                    </div>
	                    <button
	                      type="button"
	                      onClick={() => removeAppliedPromo()}
	                      className="flex size-7 !min-h-0 shrink-0 items-center justify-center rounded-md bg-white text-[#075985]"
	                      aria-label="Hapus promo transaksi"
	                    >
	                      <X size={14} />
	                    </button>
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
	                    <span>{appliedPromo?.name ?? "Promo"}</span>
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
                    {[total, 50000, 100000].map((value, index) => (
                      <Button
                        key={`${index}-${value}`}
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

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nama kategori</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ name: event.target.value })}
                placeholder="Contoh: Minuman"
              />
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium">Daftar kategori</p>
              <div className="grid gap-2">
                {categories.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-[#dde3da] bg-[#fbfcfa] px-3 py-2"
                  >
                    <span className="text-sm font-medium">{item}</span>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => deleteCategory(item)}
                      aria-label={`Hapus kategori ${item}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
        open={ingredientModal !== null}
        onOpenChange={(open) => {
          if (!open) closeIngredientModal();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {ingredientModal === "create" ? "Tambah bahan" : "Edit bahan"}
            </DialogTitle>
            <DialogDescription>
              Catat bahan baku utama yang digunakan untuk meracik menu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ingredient-name">Nama bahan</Label>
              <Input
                id="ingredient-name"
                value={ingredientForm.name}
                onChange={(event) =>
                  setIngredientForm((form) => ({ ...form, name: event.target.value }))
                }
                placeholder="Contoh: Es batu"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ingredient-unit">Satuan</Label>
                <Input
                  id="ingredient-unit"
                  value={ingredientForm.unit}
                  onChange={(event) =>
                    setIngredientForm((form) => ({ ...form, unit: event.target.value }))
                  }
                  placeholder="Contoh: kg, liter, box"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ingredient-cost">Biaya per unit</Label>
                <Input
                  id="ingredient-cost"
                  type="number"
                  min={0}
                  value={ingredientForm.costPerUnit}
                  onChange={(event) =>
                    setIngredientForm((form) => ({
                      ...form,
                      costPerUnit: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ingredient-stock">Stok sekarang</Label>
                <Input
                  id="ingredient-stock"
                  type="number"
                  min={0}
                  value={ingredientForm.stock}
                  onChange={(event) =>
                    setIngredientForm((form) => ({
                      ...form,
                      stock: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ingredient-min-stock">Minimum stok</Label>
                <Input
                  id="ingredient-min-stock"
                  type="number"
                  min={0}
                  value={ingredientForm.minStock}
                  onChange={(event) =>
                    setIngredientForm((form) => ({
                      ...form,
                      minStock: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ingredient-used-for">Dipakai di menu</Label>
              <Input
                id="ingredient-used-for"
                value={ingredientForm.usedFor}
                onChange={(event) =>
                  setIngredientForm((form) => ({ ...form, usedFor: event.target.value }))
                }
                placeholder="Contoh: Es teh, Es kopi susu"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeIngredientModal}>
              Batal
            </Button>
            <Button onClick={saveIngredient}>
              {ingredientModal === "create" ? "Simpan bahan" : "Simpan perubahan"}
            </Button>
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
              <Label htmlFor="promo-code">Kode promo</Label>
              <Input
                id="promo-code"
                value={promoForm.code}
                onChange={(event) =>
                  setPromoForm((form) => ({ ...form, code: normalizePromoCode(event.target.value) }))
                }
                placeholder="Contoh: DISKONKOPISORE"
              />
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
        open={expenseModal !== null}
        onOpenChange={(open) => {
          if (!open) closeExpenseModal();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {expenseModal === "create" ? "Tambah pengeluaran" : "Edit pengeluaran"}
            </DialogTitle>
            <DialogDescription>
              Simpan pengeluaran operasional agar laporan outlet lebih rapi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expense-title">Judul pengeluaran</Label>
              <Input
                id="expense-title"
                value={expenseForm.title}
                onChange={(event) =>
                  setExpenseForm((form) => ({ ...form, title: event.target.value }))
                }
                placeholder="Contoh: Belanja bahan minuman"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expense-category">Kategori</Label>
                <Input
                  id="expense-category"
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((form) => ({ ...form, category: event.target.value }))
                  }
                  placeholder="Contoh: Operasional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-date">Tanggal</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(event) =>
                    setExpenseForm((form) => ({ ...form, date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expense-amount">Nominal</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min={0}
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((form) => ({ ...form, amount: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-method">Metode bayar</Label>
                <select
                  id="expense-method"
                  value={expenseForm.paymentMethod}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      paymentMethod: event.target.value as Expense["paymentMethod"],
                    }))
                  }
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Kas outlet</option>
                  <option>Tunai</option>
                  <option>Transfer</option>
                  <option>QRIS</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expense-status">Status</Label>
                <select
                  id="expense-status"
                  value={expenseForm.status}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      status: event.target.value as Expense["status"],
                    }))
                  }
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>Tercatat</option>
                  <option>Draft</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-note">Catatan</Label>
                <Input
                  id="expense-note"
                  value={expenseForm.note}
                  onChange={(event) =>
                    setExpenseForm((form) => ({ ...form, note: event.target.value }))
                  }
                  placeholder="Contoh: Restock supplier mingguan"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeExpenseModal}>
              Batal
            </Button>
            <Button onClick={saveExpense}>
              {expenseModal === "create" ? "Simpan pengeluaran" : "Simpan perubahan"}
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

      <AlertDialog open={Boolean(deleteIngredient)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Package />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus bahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Bahan <strong>{deleteIngredient?.name}</strong> akan dihapus dari daftar bahan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteIngredient(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteIngredient}
            >
              Hapus bahan
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

      <AlertDialog open={Boolean(deleteExpense)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ReceiptText />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan <strong>{deleteExpense?.title}</strong> akan dihapus dari daftar pengeluaran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteExpense(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteExpense}
            >
              Hapus pengeluaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
