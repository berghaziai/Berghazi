import React, { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactPage: React.FC = () => {
  const { t, siteSettings, userProfile } = useApp();
  const [name, setName] = useState(userProfile?.displayName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userProfile) {
      setName((prev) => prev || userProfile.displayName || '');
      setEmail((prev) => prev || userProfile.email || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed.');
      setStatusMsg(t.contact.sentSuccess);
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <header className="space-y-2 border-b border-[#E5E4DF] pb-6">
        <h1 className="text-3xl font-semibold text-[#16222E]">{t.contact.title}</h1>
        <p className="text-sm text-[#475569]">{t.contact.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16222E]">
            <Mail className="w-4 h-4 text-[#C68B1C]" />
            <span>Direct Administration</span>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            Inquiries submitted here are delivered directly to the Main Administrator Inbox inside the Berghazi Dashboard.
          </p>
          <div className="pt-2 border-t border-[#E5E4DF] text-xs font-mono text-[#1D3A5F]">
            {siteSettings.contactEmail || 'berghazi9@gmail.com'}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="md:col-span-8 bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                {t.contact.name}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                {t.contact.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">
              {t.contact.subject}
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">
              {t.contact.message}
            </label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
          </div>

          {statusMsg && <div className="text-xs font-medium text-[#1B6B50]">{statusMsg}</div>}
          {errorMsg && <div className="text-xs font-medium text-[#9A3412]">{errorMsg}</div>}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.contact.send}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
