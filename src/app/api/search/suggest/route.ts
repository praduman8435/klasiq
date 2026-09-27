import { NextResponse } from "next/server";
import { z } from "zod";
import { getSearchSuggestions } from "@/server/queries/search";

const querySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ categories: [], schools: [], products: [] }, { status: 400 });
  }
  return NextResponse.json(await getSearchSuggestions(parsed.data.q));
}
