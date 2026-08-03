import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface PatchBody {
  active?: boolean;
  description?: string;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (body.maxRedemptions !== undefined) {
    if (body.maxRedemptions === null) {
      data.maxRedemptions = null;
    } else {
      const n = Number(body.maxRedemptions);
      if (!Number.isInteger(n) || n < 1) {
        return NextResponse.json({ error: "Max redemptions must be a positive whole number." }, { status: 400 });
      }
      data.maxRedemptions = n;
    }
  }
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null) {
      data.expiresAt = null;
    } else {
      const d = new Date(body.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
      }
      data.expiresAt = d;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const promocode = await prisma.promocode.update({ where: { id: params.id }, data });
    return NextResponse.json({ promocode });
  } catch {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.promocode.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }
}
