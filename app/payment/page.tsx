import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import PaymentClient from './PaymentClient';

interface PageProps {
  searchParams: {
    plan?: string;
  };
}

export default async function PaymentPage({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/');
  }

  if (user.status === 'ACTIVE') {
    redirect('/dashboard');
  }

  const plan = searchParams.plan || 'pro';
  
  const planDetails = {
    pro: {
      name: 'Pro',
      price: '$30',
      period: '/ ½ month',
      amount: 2500,
      usdAmount: 30,
      credits: 100,
      key: 'pro',
    },
    gold: {
      name: 'Gold',
      price: '$99.99',
      period: '/ month',
      amount: 12000,
      usdAmount: 99.99,
      credits: 500,
      key: 'gold',
    },
    platinum: {
      name: 'Platinum',
      price: '$299.99',
      period: '/ month',
      amount: 35000,
      usdAmount: 299.99,
      credits: 2000,
      key: 'platinum',
    },
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.pro;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <PaymentClient 
        userEmail={user.email} 
        selectedPlan={{
          name: selectedPlan.name,
          price: selectedPlan.price,
          period: selectedPlan.period,
          amount: selectedPlan.amount,
          usdAmount: selectedPlan.usdAmount,
          credits: selectedPlan.credits,
          key: selectedPlan.key,
        }}
      />
    </div>
  );
}
