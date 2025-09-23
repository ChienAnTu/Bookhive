// @ts-nocheck
'use client';
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

function centsFromDollars(d: string | number) {
  if (d === '' || d === null || d === undefined) return 0;
  const v = Number(d);
  if (Number.isNaN(v)) return 0;
  return Math.round(v * 100);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 mb-4 shadow-sm bg-white">
      <div className="font-semibold text-lg mb-2">{title}</div>
      {children}
    </div>
  );
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
}

function TesterInner({ publishableKey }: { publishableKey: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const [baseUrl, setBaseUrl] = useState(apiBase());
  const [userId, setUserId] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const [currency, setCurrency] = useState('aud');

  // amounts (as dollars)
  const [depositD, setDepositD] = useState('25.00');
  const [shippingD, setShippingD] = useState('3.00');
  const [serviceFeeD, setServiceFeeD] = useState('2.00');
  const [explicitAmountD, setExplicitAmountD] = useState('');

  // allow using an existing PI (paste id + client_secret)
  const [useExistingPI, setUseExistingPI] = useState(false);
  const [existingPI, setExistingPI] = useState('');
  const [existingCS, setExistingCS] = useState('');

  // current PI
  const [pi, setPi] = useState<{ id: string; client_secret: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [orders, setOrders] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ t: string; m: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const log = (m: any) =>
    setLogs((xs) => [
      { t: new Date().toLocaleTimeString(), m: typeof m === 'string' ? m : JSON.stringify(m, null, 2) },
      ...xs,
    ]);

  const resetState = () => {
    setPi(null);
    setStatus(null);
    setOrders([]);
    setLogs([]);
  };

  const handleInitiate = async () => {
    try {
      setBusy(true);
      setOrders([]);
      if (useExistingPI) {
        if (!existingPI || !existingCS) {
          alert('Paste existing payment_id and client_secret.');
          return;
        }
        setPi({ id: existingPI.trim(), client_secret: existingCS.trim() });
        setStatus('requires_confirmation');
        log(['useExisting', { payment_id: existingPI }]);
        return;
      }

      const body: any = {
        user_id: userId,
        currency,
        checkout_id: checkoutId,
      };
      if (explicitAmountD) {
        body.amount = centsFromDollars(explicitAmountD);
        body.deposit = 0;
        body.shipping_fee = 0;
        body.service_fee = 0;
      } else {
        body.deposit = centsFromDollars(depositD);
        body.shipping_fee = centsFromDollars(shippingD);
        body.service_fee = centsFromDollars(serviceFeeD);
      }

      const { data } = await axios.post(`${baseUrl}/payment_gateway/payment/initiate`, body);
      setPi({ id: data.payment_id, client_secret: data.client_secret });
      setStatus(data.status);
      log(['initiate', data]);
    } catch (e: any) {
      log(['initiate.error', e.response?.data || e.message]);
      alert('Initiate failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleStripeConfirm = async () => {
    if (!stripe || !elements || !pi?.client_secret) {
      alert('Stripe not ready or no client_secret. Initiate first.');
      return;
    }
    try {
      setBusy(true);
      const card = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(pi.client_secret, {
        payment_method: { card },
      });
      if (error) {
        log(['stripe.confirm.error', error.message]);
        alert(error.message);
        return;
      }
      setStatus(paymentIntent?.status || null);
      log(['stripe.confirm', paymentIntent]);
    } catch (e: any) {
      log(['stripe.confirm.catch', e.message]);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleBackendConfirm = async () => {
    if (!pi?.id) {
      alert('No payment_id. Initiate first.');
      return;
    }
    try {
      setBusy(true);
      const { data } = await axios.post(`${baseUrl}/payment_gateway/payment/confirm`, {
        payment_id: pi.id,
        checkout_id: checkoutId, // 可留空字串，由後端用 metadata 回填
        user_id: userId,
      });
      setOrders(data.orders_created || []);
      log(['backend.confirm', data]);
    } catch (e: any) {
      log(['backend.confirm.error', e.response?.data || e.message]);
      alert('Confirm failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleSyncDB = async () => {
    if (!pi?.id) {
      alert('No payment_id');
      return;
    }
    try {
      setBusy(true);
      const { data } = await axios.post(`${baseUrl}/payment_gateway/payment/status/sync/${pi.id}`);
      setStatus(data.db_status || data.stripe_status || null);
      log(['status.sync', data]);
    } catch (e: any) {
      log(['status.sync.error', e.response?.data || e.message]);
      alert('Sync failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setBusy(false);
    }
  };

  const minAmt =
    explicitAmountD ? centsFromDollars(explicitAmountD) : centsFromDollars(depositD) + centsFromDollars(shippingD) + centsFromDollars(serviceFeeD);
  const canPay = publishableKey && stripe && elements && pi?.client_secret && minAmt >= 50;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 text-slate-800">
      <h1 className="text-2xl font-bold">Stripe Payment Tester</h1>

      <Section title="1) Backend & Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Backend Base URL</span>
            <input className="border rounded-xl p-2" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Currency</span>
            <input className="border rounded-xl p-2" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">user_id (buyer/borrower)</span>
            <input className="border rounded-xl p-2" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">checkout_id</span>
            <input className="border rounded-xl p-2" value={checkoutId} onChange={(e) => setCheckoutId(e.target.value)} placeholder="CHK-... (optional)" />
          </label>
        </div>
      </Section>

      <Section title="2) Use existing PaymentIntent?">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useExistingPI} onChange={(e) => { setUseExistingPI(e.target.checked); resetState(); }} />
          I already have a payment_id & client_secret
        </label>
        {useExistingPI && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">payment_id</span>
              <input className="border rounded-xl p-2 font-mono" value={existingPI} onChange={(e) => setExistingPI(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">client_secret</span>
              <input className="border rounded-xl p-2 font-mono" value={existingCS} onChange={(e) => setExistingCS(e.target.value)} />
            </label>
          </div>
        )}
      </Section>

      {!useExistingPI && (
        <Section title="3) Amounts (AUD)">
          <div className="text-sm opacity-80 mb-2">Either set explicit total, or leave empty and use the split amounts. Minimum total is $0.50.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Explicit total (AUD)</span>
              <input className="border rounded-xl p-2" value={explicitAmountD} onChange={(e) => setExplicitAmountD(e.target.value)} placeholder="e.g. 10.00" />
            </label>
            <div className="text-center text-sm opacity-60">— or —</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Deposit (AUD)</span>
              <input className="border rounded-xl p-2" value={depositD} onChange={(e) => setDepositD(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Shipping (AUD)</span>
              <input className="border rounded-xl p-2" value={shippingD} onChange={(e) => setShippingD(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Service Fee (AUD)</span>
              <input className="border rounded-xl p-2" value={serviceFeeD} onChange={(e) => setServiceFeeD(e.target.value)} />
            </label>
          </div>
          <div className="mt-2 text-sm">
            Total (computed): <span className="font-mono">{( (explicitAmountD ? centsFromDollars(explicitAmountD) : centsFromDollars(depositD) + centsFromDollars(shippingD) + centsFromDollars(serviceFeeD)) / 100).toFixed(2)} AUD</span>
          </div>
        </Section>
      )}

      <Section title="4) Initiate / Confirm">
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 rounded-2xl bg-black text-white disabled:opacity-50" onClick={handleInitiate} disabled={busy || !userId}>
            {useExistingPI ? 'Load Existing PI' : 'Create PaymentIntent'}
          </button>
          <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white disabled:opacity-50" onClick={handleStripeConfirm} disabled={busy || !publishableKey || !stripe || !elements || !pi?.client_secret}>
            Confirm with Card
          </button>
          <button className="px-4 py-2 rounded-2xl bg-emerald-600 text-white disabled:opacity-50" onClick={handleBackendConfirm} disabled={busy || !pi?.id}>
            Backend Confirm (Create Orders)
          </button>
          <button className="px-4 py-2 rounded-2xl bg-slate-700 text-white disabled:opacity-50" onClick={handleSyncDB} disabled={busy || !pi?.id}>
            Sync DB Status
          </button>
        </div>
        <div className="mt-3">
          <div className="text-sm mb-1">Card</div>
          <div className="border rounded-xl p-3">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <b>payment_id</b>
            <div className="font-mono break-all">{pi?.id || '—'}</div>
          </div>
          <div>
            <b>status</b>
            <div className="font-mono">{status || '—'}</div>
          </div>
          <div>
            <b>orders_created</b>
            <div className="font-mono break-all">{orders.join(', ') || '—'}</div>
          </div>
        </div>
      </Section>

      <Section title="Logs">
        {logs.length === 0 ? <div className="text-sm opacity-60">No logs yet.</div> : logs.map((l, i) => (
          <div key={i} className="text-xs bg-slate-50 border rounded-xl p-2">
            <div className="opacity-50">{l.t}</div>
            <pre className="whitespace-pre-wrap break-words">{l.m}</pre>
          </div>
        ))}
      </Section>
    </div>
  );
}

export default function PaymentTester() {
  const [pkInput, setPkInput] = useState(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  const stripePromise = useMemo(() => (pkInput ? loadStripe(pkInput) : null), [pkInput]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto p-6 pb-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Stripe Publishable Key (pk_test_...)</span>
          <input className="border rounded-2xl p-2" value={pkInput} onChange={(e) => setPkInput(e.target.value)} placeholder="pk_test_..." />
        </label>
      </div>
      {stripePromise ? (
        <Elements stripe={stripePromise} options={{ locale: 'en' }}>
          <TesterInner publishableKey={pkInput} />
        </Elements>
      ) : (
        <div className="max-w-3xl mx-auto p-6 text-sm opacity-70">Enter your Stripe publishable key to begin.</div>
      )}
    </div>
  );
}
