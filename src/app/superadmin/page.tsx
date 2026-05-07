import { ShieldCheck, Store, Users, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OutletRow = {
  id: string;
  name: string;
  business_type: "FnB" | "Retail";
  whatsapp: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  outlet_id: string | null;
  name: string;
  email: string;
  role: "Owner" | "Kasir";
  status: "Aktif" | "Nonaktif";
  created_at: string;
};

type PlanRow = {
  id: string;
  name: string;
  monthly_price: number;
};

type SubscriptionRow = {
  outlet_id: string;
  plan_id: string;
  status: "Aktif" | "Trial" | "Past due" | "Batal";
  current_period_ends_at: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isSuperadmin(email: string | undefined) {
  const allowedEmails = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
}

function getPaymentLabel(status: SubscriptionRow["status"] | undefined) {
  if (status === "Aktif") {
    return "Sudah bayar";
  }

  if (status === "Trial") {
    return "Free trial";
  }

  if (status === "Past due") {
    return "Belum bayar";
  }

  return "Tidak aktif";
}

function getPaymentVariant(status: SubscriptionRow["status"] | undefined) {
  if (status === "Aktif") {
    return "default" as const;
  }

  if (status === "Trial") {
    return "outline" as const;
  }

  return "secondary" as const;
}

export default async function SuperadminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  if (!isSuperadmin(user.email)) {
    return (
      <main className="min-h-screen bg-[#f7faf8] px-5 py-8 text-foreground">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#dde3da] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Akses superadmin dibatasi</h1>
              <p className="mt-1 text-sm text-[#69756f]">
                Tambahkan email akun ini ke env `SUPERADMIN_EMAILS` untuk membuka halaman ini.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const admin = createAdminClient();
  const [outletsResult, profilesResult, plansResult, subscriptionsResult] =
    await Promise.all([
      admin
        .from("outlets")
        .select("id, name, business_type, whatsapp, created_at")
        .order("created_at", { ascending: false }),
      admin
        .from("profiles")
        .select("id, outlet_id, name, email, role, status, created_at")
        .order("created_at", { ascending: false }),
      admin.from("plans").select("id, name, monthly_price"),
      admin
        .from("outlet_subscriptions")
        .select("outlet_id, plan_id, status, current_period_ends_at"),
    ]);

  const firstError = [
    outletsResult.error,
    profilesResult.error,
    plansResult.error,
    subscriptionsResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(firstError.message);
  }

  const outlets = (outletsResult.data ?? []) as OutletRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const plans = (plansResult.data ?? []) as PlanRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const profilesByOutlet = profiles.reduce<Record<string, ProfileRow[]>>(
    (accumulator, profile) => {
      if (!profile.outlet_id) {
        return accumulator;
      }

      accumulator[profile.outlet_id] ??= [];
      accumulator[profile.outlet_id].push(profile);
      return accumulator;
    },
    {},
  );
  const planById = plans.reduce<Record<string, PlanRow>>((accumulator, plan) => {
    accumulator[plan.id] = plan;
    return accumulator;
  }, {});
  const subscriptionByOutlet = subscriptions.reduce<Record<string, SubscriptionRow>>(
    (accumulator, subscription) => {
      accumulator[subscription.outlet_id] = subscription;
      return accumulator;
    },
    {},
  );
  const paidCount = subscriptions.filter((item) => item.status === "Aktif").length;
  const unpaidCount = subscriptions.filter((item) => item.status === "Past due").length;
  const trialCount = subscriptions.filter((item) => item.status === "Trial").length;
  const monthlyRecurringRevenue = subscriptions
    .filter((item) => item.status === "Aktif")
    .reduce((sum, subscription) => sum + (planById[subscription.plan_id]?.monthly_price ?? 0), 0);
  const stats = [
    {
      label: "Total pengguna",
      value: profiles.length,
      note: `${profiles.filter((profile) => profile.role === "Owner").length} owner, ${profiles.filter((profile) => profile.role === "Kasir").length} kasir`,
      icon: Users,
    },
    {
      label: "Total outlet",
      value: outlets.length,
      note: `${outlets.filter((outlet) => outlet.business_type === "FnB").length} FnB, ${outlets.filter((outlet) => outlet.business_type === "Retail").length} Retail`,
      icon: Store,
    },
    {
      label: "Sudah bayar",
      value: paidCount,
      note: `${unpaidCount} belum bayar, ${trialCount} trial`,
      icon: ShieldCheck,
    },
    {
      label: "MRR aktif",
      value: formatCurrency(monthlyRecurringRevenue),
      note: "Dihitung dari subscription Aktif",
      icon: WalletCards,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69756f]">MAVA POS</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Superadmin
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69756f]">
              Pantau pengguna, plan, dan status pembayaran seluruh outlet.
            </p>
          </div>
          <Badge variant="outline">Login sebagai {user.email}</Badge>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="rounded-lg bg-white">
              <CardHeader className="grid-cols-[1fr_auto]">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{item.value}</CardTitle>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#075985]">
                  <item.icon size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-[#0369a1]">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-[#dde3da] bg-white">
          <div className="border-b border-[#dde3da] p-4">
            <h2 className="font-semibold">Outlet dan subscription</h2>
            <p className="mt-1 text-sm text-[#69756f]">
              Status bayar diambil dari `outlet_subscriptions.status`.
            </p>
          </div>
          <Table className="min-w-[980px]">
            <TableHeader className="bg-muted/50 text-xs uppercase tracking-wide">
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Tagihan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outlets.map((outlet) => {
                const outletProfiles = profilesByOutlet[outlet.id] ?? [];
                const owner = outletProfiles.find((profile) => profile.role === "Owner");
                const subscription = subscriptionByOutlet[outlet.id];
                const plan = subscription ? planById[subscription.plan_id] : null;

                return (
                  <TableRow key={outlet.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{outlet.name}</p>
                        <p className="text-xs text-[#69756f]">
                          {outlet.business_type} · {outlet.whatsapp ?? "Tanpa WA"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{owner?.name ?? "-"}</p>
                        <p className="text-xs text-[#69756f]">{owner?.email ?? "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{outletProfiles.length} user</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan?.name ?? "Belum ada"}</p>
                        <p className="text-xs text-[#69756f]">
                          {plan ? formatCurrency(plan.monthly_price) : "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentVariant(subscription?.status)}>
                        {getPaymentLabel(subscription?.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{formatDate(subscription?.current_period_ends_at ?? null)}</p>
                        {subscription?.status === "Trial" && (
                          <p className="mt-0.5 text-xs text-[#69756f]">Akhir trial</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(outlet.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  );
}
