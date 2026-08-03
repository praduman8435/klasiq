import Link from "next/link";
import type { Metadata } from "next";
import {
  Footprints,
  MapPin,
  RefreshCw,
  Shirt,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { SchoolSearch } from "@/components/site/school-search";
import { STORE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  description:
    "Search your child's school and get the right uniform, size and essentials without running around the market.",
};

const ESSENTIAL_CATEGORIES = [
  {
    slug: "uniforms",
    label: "Uniforms",
    description: "Shirts, pants, skirts & more",
    icon: Shirt,
  },
  {
    slug: "shoes",
    label: "Shoes",
    description: "School-approved footwear",
    icon: Footprints,
  },
  {
    slug: "socks",
    label: "Socks",
    description: "Everyday pairs, all sizes",
    icon: Store,
  },
  {
    slug: "school-bags",
    label: "School Bags",
    description: "Backpacks & trolley bags",
    icon: Truck,
  },
] as const;

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Trusted local retailer",
    description: "Family-run and serving this community for 30 years.",
  },
  {
    icon: RefreshCw,
    title: "Easy size exchange",
    description: "Growing kids happen — bring it back and we'll sort it out.",
  },
  {
    icon: Store,
    title: "Store pickup",
    description: "Order ahead and collect at your convenience.",
  },
  {
    icon: Truck,
    title: "Local delivery",
    description: "Delivered nearby without the trip to the market.",
  },
  {
    icon: MapPin,
    title: "School-approved uniforms",
    description: "The right fit for your child's exact school and class.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="border-b bg-gradient-to-b from-secondary/50 to-background px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {STORE_TAGLINE}
          </h1>
          <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Find your school and get the right uniform, size and essentials
            without running around the market.
          </p>

          <SchoolSearch size="hero" className="max-w-xl" />

          <p className="text-sm text-muted-foreground">
            Scanned a QR code at your school? You&apos;ll land straight on
            your school&apos;s page — no search needed.
          </p>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">
            Or shop essentials
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Not sure your school is listed yet? These work for anyone.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ESSENTIAL_CATEGORIES.map(({ slug, label, description, icon: Icon }) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="font-heading text-base font-semibold">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/30 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">
            Why parents choose us
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 text-center sm:px-6">
        <p className="font-heading text-xl text-muted-foreground">
          Serving local families for 30 years.
        </p>
      </section>
    </div>
  );
}
