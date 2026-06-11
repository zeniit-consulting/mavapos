export type EntityId = string | number;

export type Product = {
  id: EntityId;
  name: string;
  category: string;
  price: number;
  stock: number;
  costPrice: number;
  tag: string;
  image: string;
};

export type CartItem = Product & {
  qty: number;
};

export type ProductForm = Omit<Product, "id">;

export type CategoryForm = {
  name: string;
};

export type Ingredient = {
  id: EntityId;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  usedFor: string[];
};

export type IngredientForm = {
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  usedFor: string;
};

export type ProductRecipe = {
  productId: EntityId;
  ingredientId: EntityId;
  qty: number;
};

export type Promo = {
  id: EntityId;
  name: string;
  code: string;
  type: string;
  target: string;
  value: string;
  period: string;
  status: "Aktif" | "Draft";
};

export type PromoForm = Omit<Promo, "id">;

export type StaffMember = {
  id: EntityId;
  name: string;
  role: "Kasir";
  phone: string;
  shift: "Pagi" | "Sore";
  status: "Aktif" | "Nonaktif";
};

export type StaffForm = Omit<StaffMember, "id">;

export type PaymentMethod = "Tunai" | "QRIS";

export type Expense = {
  id: EntityId;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: "Tunai" | "Transfer" | "QRIS" | "Kas outlet";
  note: string;
  status: "Tercatat" | "Draft";
};

export type ExpenseForm = Omit<Expense, "id">;

export type StockMovementType =
  | "Penjualan"
  | "Stok masuk"
  | "Penyesuaian"
  | "Stok opname";

export type StockMovement = {
  id: EntityId;
  productId: EntityId;
  productName: string;
  category: string;
  type: StockMovementType;
  qtyChange: number;
  previousStock: number;
  nextStock: number;
  note: string;
  createdAt: string;
};

export type AuthRole = "Owner" | "Kasir";

export type AuthUser = {
  name: string;
  email: string;
  role: AuthRole;
  outlet: string;
};

export type LoginForm = {
  email: string;
  password: string;
};

export type AuthMode = "login" | "register" | "forgot" | "update-password";

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  outlet: string;
  businessType: "FnB" | "Retail";
  whatsapp: string;
};

export type NewPasswordForm = {
  password: string;
  confirmPassword: string;
};

export type MenuLabel =
  | "Dashboard"
  | "Kasir"
  | "Laporan"
  | "Produk & Stok"
  | "Bahan"
  | "Pengeluaran"
  | "Promo"
  | "Staf"
  | "Pengaturan";

export type Customer = {
  id: EntityId;
  name: string;
  phone: string;
  email: string;
  points: number;
};

export type CustomerForm = {
  name: string;
  phone: string;
  email: string;
};

export type IngredientMovement = {
  id: EntityId;
  ingredientId: EntityId;
  ingredientName: string;
  qtyChange: number;
  previousStock: number;
  nextStock: number;
  note: string;
  createdAt: string;
};

export type Supplier = {
  id: EntityId;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
};

export type SupplierForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type CashierShift = {
  id: EntityId;
  cashierId: EntityId;
  openedAt: string;
  closedAt: string | null;
  startingCash: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  status: "Buka" | "Tutup";
  note: string;
};

export type CashierShiftForm = {
  startingCash: number;
  actualCash?: number;
  note?: string;
};
