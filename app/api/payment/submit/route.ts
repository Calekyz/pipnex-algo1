import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const method = formData.get('method') as string;
  const reference = formData.get('reference') as string;
  const screenshot = formData.get('screenshot') as File | null;
  const plan = formData.get('plan') as string;
  const amount = parseInt(formData.get('amount') as string);

  if (!method || !reference || !screenshot || !plan || !amount) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Save screenshot (use Vercel Blob for production)
  try {
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${screenshot.name}`;
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, buffer);
    const screenshotUrl = `/uploads/${filename}`;

    // Create payment record with the requested plan
    await prisma.$transaction([
      prisma.paymentProof.create({
        data: {
          userId: user.id,
          method,
          amount,
          requestedPlan: plan.toUpperCase(),
          reference,
          screenshotUrl,
          status: 'SUBMITTED',
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { status: 'PENDING_VERIFICATION' },
      }),
    ]);

    return NextResponse.json({
      message: 'Payment submitted successfully. Awaiting verification.',
    });
  } catch (error) {
    console.error('Payment submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}
