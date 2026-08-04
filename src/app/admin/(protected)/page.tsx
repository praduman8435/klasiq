import Link from "next/link";
import { Boxes, Plus, School as SchoolIcon, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { formatPaise } from "@/lib/money";
import { getDashboardStats } from "@/server/queries/admin/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs attention right now.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Orders</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pending" value={stats.pendingCount} href="/admin/orders?status=PENDING" />
          <StatCard label="Confirmed" value={stats.confirmedCount} href="/admin/orders?status=CONFIRMED" />
          <StatCard
            label="Ready for Pickup"
            value={stats.readyForPickupCount}
            href="/admin/orders?status=READY_FOR_PICKUP"
          />
          <StatCard
            label="Out for Delivery"
            value={stats.outForDeliveryCount}
            href="/admin/orders?status=OUT_FOR_DELIVERY"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Today</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Orders Today" value={stats.ordersToday} />
          <StatCard label="Today's Order Value" value={formatPaise(stats.todaysOrderValueInPaise)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Inventory</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Low Stock"
            value={stats.lowStockCount}
            href="/admin/inventory?stock=LOW_STOCK"
            tone="warning"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStockCount}
            href="/admin/inventory?stock=OUT_OF_STOCK"
            tone="danger"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Shortcuts</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button render={<Link href="/admin/products/new" />} nativeButton={false} variant="outline" className="h-auto flex-col gap-2 py-4">
            <Plus className="size-5" aria-hidden />
            Add Product
          </Button>
          <Button render={<Link href="/admin/schools/new" />} nativeButton={false} variant="outline" className="h-auto flex-col gap-2 py-4">
            <SchoolIcon className="size-5" aria-hidden />
            Add School
          </Button>
          <Button render={<Link href="/admin/inventory" />} nativeButton={false} variant="outline" className="h-auto flex-col gap-2 py-4">
            <Boxes className="size-5" aria-hidden />
            Update Stock
          </Button>
          <Button render={<Link href="/admin/orders" />} nativeButton={false} variant="outline" className="h-auto flex-col gap-2 py-4">
            <ClipboardList className="size-5" aria-hidden />
            View Orders
          </Button>
        </div>
      </section>
    </div>
  );
}
