import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  }).then((res) => res.json());

  const userEmail = clerkUser.email_addresses[0]?.email_address || '';
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!adminEmails.includes(userEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId: targetUserId, paymentId } = await req.json();

  if (!targetUserId || !paymentId) {
    return NextResponse.json(
      { error: 'Missing userId or paymentId' },
      { status: 400 }
    );
  }

  try {
    const payment = await prisma.paymentProof.findUnique({
      where: { id: paymentId },
      select: { requestedPlan: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const planCredits: Record<string, number> = {
      PRO: 100,
      GOLD: 500,
      PLATINUM: 2000,
    };

    const credits = planCredits[payment.requestedPlan || 'PRO'] || 50;
    const planName = payment.requestedPlan || 'PRO';

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await prisma.$transaction([
      prisma.paymentProof.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedBy: userEmail,
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          status: 'ACTIVE',
          credits: credits,
          plan: planName,
          planExpiry: expiryDate,
        },
      }),
    ]);

    return NextResponse.json({ 
      message: `User verified successfully with ${planName} plan!`,
      plan: planName,
      credits: credits,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
