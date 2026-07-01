import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { emailConfirmationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired confirmation link" }, { status: 400 });
    }

    if (user.emailConfirmationExpires && user.emailConfirmationExpires < new Date()) {
      return NextResponse.json({ error: "Confirmation link has expired" }, { status: 400 });
    }

    if (user.emailConfirmed) {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailConfirmationToken: null,
        emailConfirmationExpires: null,
      },
    });

    await sendWelcomeEmail(user.email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[confirm-email]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
