import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateToken, generateExpiry, sendConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Return success even if user not found to avoid enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (user.emailConfirmed) {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    const emailConfirmationToken = generateToken();
    const emailConfirmationExpires = generateExpiry(24);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmationToken, emailConfirmationExpires },
    });

    await sendConfirmationEmail(user.email, emailConfirmationToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-confirmation]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
