"use client";

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type ContactTopic = 'Support' | 'Orders' | 'Partnerships' | 'Press';

export default function ContactPage() {
  const { toast } = useToast();
  const [topic, setTopic] = useState<ContactTopic>('Support');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!message.trim()) return false;
    return true;
  }, [name, email, message]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to send message');
      
      toast('success', "Message sent — we'll get back to you soon.");
      setName('');
      setEmail('');
      setMessage('');
      setTopic('Support');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <section className="py-16 bg-[rgba(66,157,254,0.06)] border-b border-[rgba(255,255,255,0.35)]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl leading-[0.95] text-text-primary">
              Let’s talk
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Questions about orders, artisans, or partnerships? Send a message and we’ll respond.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card variant="elevated" className="lg:col-span-2">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">Topic</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(['Support', 'Orders', 'Partnerships', 'Press'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={
                          "px-3 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 " +
                          (topic === t
                            ? "bg-[#429DFE] text-white shadow-sm border border-[rgba(15,23,42,0.10)]"
                            : "bg-[rgba(255,255,255,0.55)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(15,23,42,0.12)] text-text-primary hover:bg-[rgba(255,255,255,0.75)]")
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full resize-none bg-[rgba(255,255,255,0.50)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(15,23,42,0.12)] rounded-2xl px-4 py-3 text-base text-text-primary placeholder:text-text-secondary transition-all duration-150 ease-out focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                    placeholder="Tell us what you need..."
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-text-secondary">
                    Selected topic: <span className="text-text-primary">{topic}</span>
                  </div>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!canSubmit || isSubmitting}>
                    Send message
                  </Button>
                </div>
              </form>
            </Card>

            <Card variant="elevated">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">Support</h2>

              <div className="mt-8 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Email</div>
                  <div className="mt-1 text-text-secondary">support@tibebstore.com</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">Hours</div>
                  <div className="mt-1 text-text-secondary">Mon–Fri, 9am–6pm EAT</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">Location</div>
                  <div className="mt-1 text-text-secondary">Addis Ababa, Ethiopia</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
