import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Package, BarChart3, Plus, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { OrderFormDialog } from "@/components/OrderFormDialog";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              <Wallet className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight">KSHO</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Kalkulatori i Shpenzimeve Online
              </span>
            </span>
          </Link>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Order</span>
          </Button>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {children}
      </main>

      <OrderFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
