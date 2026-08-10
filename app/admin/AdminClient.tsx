'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string | null;
  payments: {
    id: string;
    method: string;
    amount: number;
    requestedPlan: string | null;
    reference: string | null;
    screenshotUrl: string | null;
    createdAt: Date;
  }[];
}

interface AdminClientProps {
  pendingUsers: User[];
}

export default function AdminClient({ pendingUsers: initialPending }: AdminClientProps) {
  const [pendingUsers, setPendingUsers] = useState(initialPending);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleVerify = async (userId: string, paymentId: string) => {
    setProcessing(userId);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentId }),
      });

      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
        alert('✅ User verified and activated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Verification failed');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No pending verifications. All users are verified.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingUsers.map((user) => (
        <Card key={user.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {user.name || user.email}
              <span className="text-sm font-normal text-gray-500 ml-4">
                {user.email}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.payments.map((payment) => (
              <div key={payment.id} className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <span className="ml-2 font-medium">{payment.method}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className="ml-2 font-medium">
                      {payment.method === 'MPESA' ? `KES ${payment.amount}` : `$${payment.amount} USDT`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Plan:</span>
                    <span className="ml-2 font-medium text-blue-400">{payment.requestedPlan || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reference:</span>
                    <span className="ml-2 font-mono text-sm">{payment.reference || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Submitted: {formatDate(payment.createdAt)}
                </div>

                {payment.screenshotUrl && (
                  <div>
                    <a
                      href={payment.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Screenshot
                    </a>
                  </div>
                )}

                <Button
                  onClick={() => handleVerify(user.id, payment.id)}
                  disabled={processing === user.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing === user.id ? 'Processing...' : '✅ Verify & Activate'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
