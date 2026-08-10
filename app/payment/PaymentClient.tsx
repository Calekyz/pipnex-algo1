'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PaymentClientProps {
  userEmail: string;
  selectedPlan: {
    name: string;
    price: string;
    period: string;
    amount: number;
    usdAmount: number;
    credits: number;
    key: string;
  };
}

export default function PaymentClient({ userEmail, selectedPlan }: PaymentClientProps) {
  const router = useRouter();
  const [method, setMethod] = useState<'MPESA' | 'CRYPTO'>('MPESA');
  const [reference, setReference] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!reference || !screenshot) {
      setMessage({ type: 'error', text: 'Please provide both reference and screenshot.' });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('method', method);
    formData.append('reference', reference);
    formData.append('screenshot', screenshot);
    formData.append('plan', selectedPlan.key);
    formData.append('amount', String(method === 'MPESA' ? selectedPlan.amount : selectedPlan.usdAmount));

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Payment submitted! Your account is pending verification. You will be notified once approved.' });
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Submission failed. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg w-full bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-white">Activate Your Account</CardTitle>
        <p className="text-center text-gray-400 text-sm">
          Subscribe to <span className="text-blue-400 font-semibold">{selectedPlan.name}</span> {selectedPlan.price}{selectedPlan.period}
        </p>
        <p className="text-center text-gray-500 text-xs">
          You will receive <span className="text-green-400 font-bold">{selectedPlan.credits} credits</span> upon activation
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-md space-y-2">
            <p className="font-semibold text-blue-300">📌 Payment Instructions</p>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">🇰🇪 M-Pesa (Till)</p>
              <p className="text-sm text-gray-400">
                Pay to Till: <span className="font-mono font-bold text-lg text-white">3722030</span>
                <br />
                Amount: <span className="font-bold text-white">KES {selectedPlan.amount.toLocaleString()}</span>
                <br />
                <span className="text-xs text-gray-500">Reference: Your email or name</span>
              </p>
            </div>

            <div className="border-t border-blue-700/50 pt-2">
              <p className="text-sm font-medium text-gray-300">₿ Crypto (Binance Pay)</p>
              <p className="text-sm text-gray-400">
                Send USDT/BTC to ID: <span className="font-mono font-bold text-lg text-white">1067841957</span>
                <br />
                Amount: <span className="font-bold text-white">${selectedPlan.usdAmount} USDT</span>
                <br />
                <span className="text-xs text-gray-500">Reference: Your email or name</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  value="MPESA"
                  checked={method === 'MPESA'}
                  onChange={() => setMethod('MPESA')}
                />
                M-Pesa (Till 3722030)
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="radio"
                  value="CRYPTO"
                  checked={method === 'CRYPTO'}
                  onChange={() => setMethod('CRYPTO')}
                />
                Crypto (ID 1067841957)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {method === 'MPESA' ? 'M-Pesa Confirmation Code' : 'Transaction Hash / Reference'}
            </label>
            <Input
              type="text"
              placeholder={method === 'MPESA' ? 'e.g., QWERTY123' : 'e.g., 0xabc...'}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Upload Screenshot (Proof of Payment)
            </label>
            <input
              type="file"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a screenshot of the M-Pesa confirmation or Binance transaction.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} border ${message.type === 'success' ? 'border-green-500/50' : 'border-red-500/50'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Payment Proof'}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your account will be manually verified within 24 hours. You'll receive
            access immediately after verification.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
