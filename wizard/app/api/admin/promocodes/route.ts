import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { normalizeCode } from "@/lib/promocode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const promocodes = await prisma.promocode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ promocodes });
}

interface CreateBody {
  code?: string;
  description?: string;
  durationDays?: number;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? "");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Code must be at least 3 characters." }, { status: 400 });
  }

  const durationDays = Number(body.durationDays);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    return NextResponse.json({ error: "Duration must be between 1 and 3650 days." }, { status: 400 });
  }

  let maxRedemptions: number | null = null;
  if (body.maxRedemptions !== null && body.maxRedemptions !== undefined && `${body.maxRedemptions}` !== "") {
    const n = Number(body.maxRedemptions);
    if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json({ error: "Max redemptions must be a positive whole number." }, { status: 400 });
    }
    maxRedemptions = n;
  }

  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
    }
    expiresAt = d;
  }

  const exists = await prisma.promocode.findUnique({ where: { code } });
  if (exists) return NextResponse.json({ error: "A promo code with that name already exists." }, { status: 409 });

  const promocode = await prisma.promocode.create({
    data: {
      code,
      description: body.description?.trim() || null,
      durationDays,
      maxRedemptions,
      expiresAt,
    },
  });
  return NextResponse.json({ promocode }, { status: 201 });
}
