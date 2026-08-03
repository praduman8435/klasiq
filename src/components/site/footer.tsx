import Link from "next/link";
import { NAV_CATEGORIES } from "@/server/queries/categories";

export function SiteFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-lg font-semibold">{storeName}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Serving local families for 30 years — school uniforms, shoes,
              bags and everyday essentials.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Shop</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {NAV_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/${category.slug}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Find your school
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Scan the QR code at your school, or{" "}
              <Link href="/" className="underline underline-offset-2">
                search for it here
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mt-8 border-t pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {storeName}. All product names, sizes
          and prices shown for demo schools are illustrative.
        </p>
      </div>
    </footer>
  );
}
