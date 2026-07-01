import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/auth/validation";
import { generateToken, generateExpiry, sendConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { errors: { email: ["An account with this email already exists"] } },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sub = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const emailConfirmationToken = generateToken();
    const emailConfirmationExpires = generateExpiry(24);

    await prisma.user.create({
      data: {
        email,
        sub,
        passwordHash,
        emailConfirmationToken,
        emailConfirmationExpires,
      },
    });

    await sendConfirmationEmail(email, emailConfirmationToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
