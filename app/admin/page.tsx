import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  }).then((res) => res.json());

  const userEmail = clerkUser.email_addresses[0]?.email_address || '';
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!adminEmails.includes(userEmail)) {
    redirect('/dashboard');
  }

  const pendingUsers = await prisma.user.findMany({
    where: {
      status: 'PENDING_VERIFICATION',
    },
    include: {
      payments: {
        where: {
          status: 'SUBMITTED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">PipnexAi Algo - Admin Panel</h1>
          <form action="/api/auth/sign-out" method="POST">
            <Button variant="ghost" size="sm">Sign Out</Button>
          </form>
        </div>

        <AdminClient pendingUsers={pendingUsers} />
      </div>
    </div>
  );
}
