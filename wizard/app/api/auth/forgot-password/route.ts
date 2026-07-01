import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { generateToken, generateExpiry, sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Return generic success to avoid account enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true });
    }

    const passwordResetToken = generateToken();
    const passwordResetExpires = generateExpiry(1);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpires },
    });

    await sendPasswordResetEmail(email, passwordResetToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
