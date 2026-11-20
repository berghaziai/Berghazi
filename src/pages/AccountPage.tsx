import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  CreditCard,
  LogOut,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { LanguageCode, SubscriptionPlan, TransactionRecord } from '../types';

export const AccountPage: React.FC = () => {
  const {
    t,
    setLanguage,
    firebaseUser,
    userProfile,
    isMainAdmin,
    isAssistantAdmin,
    signInWithGoogle,
    logout,
    refreshProfile,
    bookmarks,
    plans,
    monetizationSettings,
    navigate,
  } = useApp();

  const [tab, setTab] = useState<'profile' | 'bookmarks' | 'membership' | 'transactions'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [checkoutNotice, setCheckoutNotice] = useState('');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setSchoolName(userProfile.schoolName || '');
      setInstitution(userProfile.institution || '');
      setAcademicYear(userProfile.academicYear || '2026-2027');
      setCity(userProfile.city || '');
      setBio(userProfile.bio || '');
      setPreferredLanguage(userProfile.preferredLanguage || 'en');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!firebaseUser) {
      setTransactions([]);
      return;
    }
    const q = query(collection(db, 'transactions'), where('userUid', '==', firebaseUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTransactions(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TransactionRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
    );
    return () => unsub();
  }, [firebaseUser]);

  if (!firebaseUser || !userProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-10 text-center space-y-5">
          <UserIcon className="w-10 h-10 text-[#1D3A5F] mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#16222E]">{t.account.title}</h1>
            <p className="text-sm text-[#475569]">{t.home.membershipDesc}</p>
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-6 py-3 text-sm font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
          >
            {t.auth.signIn}
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    const safeName = (displayName.trim() || userProfile.displayName).slice(0, 120);
    const safeSchool = schoolName.trim().slice(0, 160);
    const safeInstitution = institution.trim().slice(0, 160);
    const safeYear = academicYear.trim().slice(0, 32);
    const safeCity = city.trim().slice(0, 100);
    const safeBio = bio.trim().slice(0, 1000);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: safeName,
        schoolName: safeSchool,
        institution: safeInstitution,
        academicYear: safeYear,
        city: safeCity,
        bio: safeBio,
        preferredLanguage,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'public_profiles', firebaseUser.uid), {
        displayName: safeName,
        institution: safeInstitution,
        bio: safeBio,
        updatedAt: serverTimestamp(),
      });
      setLanguage(preferredLanguage);
      await refreshProfile();
      setSavedNotice(t.account.savedSuccess);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanRequest = async (plan: SubscriptionPlan) => {
    setCheckoutNotice('');
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const provider =
      monetizationSettings.paymentsEnabled && monetizationSettings.activeGateway !== 'none'
        ? monetizationSettings.activeGateway
        : 'manual';
    try {
      await setDoc(doc(db, 'transactions', txId), {
        userUid: firebaseUser.uid,
        userEmail: userProfile.email,
        itemType: 'subscription',
        itemId: plan.id,
        itemTitle: plan.name,
        amount: plan.price,
        currency: plan.currency,
        provider,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setCheckoutNotice(
        `Order ${txId} recorded (${plan.price} ${plan.currency}). ${
          provider === 'manual'
            ? 'Pending payment verification by administration.'
            : `Initiated via ${provider.toUpperCase()}.`
        }`
      );
      setTab('transactions');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `transactions/${txId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="bg-white border border-[#E5E4DF] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C68B1C]">
            <span>{t.auth.roleLabels[userProfile.role]}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#475569]">{userProfile.email}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#16222E]">{userProfile.displayName}</h1>
          {userProfile.isSuspended && (
            <div className="text-xs font-semibold text-[#9A3412]">{t.auth.suspendedNotice}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(isMainAdmin || isAssistantAdmin) && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.nav.admin}</span>
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#475569] border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.auth.signOut}</span>
          </button>
        </div>
      </header>

      {/* Account Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-white border border-[#E5E4DF] rounded-xl">
        {(
          [
            { id: 'profile', label: t.account.profileTab },
            { id: 'bookmarks', label: `${t.account.bookmarksTab} (${bookmarks.length})` },
            { id: 'membership', label: t.account.membershipTab },
            { id: 'transactions', label: `${t.account.transactionsTab} (${transactions.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-[#1D3A5F] text-white'
                : 'text-[#475569] hover:bg-[#F4F3EF] hover:text-[#16222E]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4 max-w-3xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                {t.documents.schoolName}
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                {t.documents.institution}
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                {t.documents.academicYear}
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              >
                <option value="zgh">ⵜⴰⵎⴰⵣⵉⵖⵜ</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Academic Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
          </div>

          {savedNotice && <div className="text-xs font-medium text-[#1B6B50]">{savedNotice}</div>}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
          >
            {t.account.saveProfile}
          </button>
        </form>
      )}

      {tab === 'bookmarks' && (
        <div className="bg-white border border-[#E5E4DF] rounded-xl divide-y divide-[#E5E4DF]">
          {bookmarks.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#475569] space-y-2">
              <Bookmark className="w-6 h-6 mx-auto text-[#64748B]" />
              <p>No saved resources yet.</p>
            </div>
          ) : (
            bookmarks.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#64748B]">{b.itemType}</div>
                  <div className="text-sm font-semibold text-[#16222E]">{b.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        b.itemType === 'lesson'
                          ? 'lessons'
                          : b.itemType === 'document'
                          ? 'documents'
                          : 'research'
                      )
                    }
                    className="px-3 py-1.5 text-xs font-medium border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8]"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDoc(doc(db, 'bookmarks', b.id))}
                    className="p-1.5 text-[#9A3412] hover:bg-[#FAFAF8] rounded-lg"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'membership' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B]">{t.account.activePlan}</div>
              <div className="text-xl font-semibold text-[#16222E] capitalize">
                {userProfile.subscriptionTier}
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-[#1B6B50]" />
          </div>

          {checkoutNotice && (
            <div className="bg-[#F4F3EF] border border-[#C68B1C] rounded-xl p-4 text-xs font-medium text-[#16222E]">
              {checkoutNotice}
            </div>
          )}

          {plans.length === 0 ? (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center text-sm text-[#475569]">
              No premium membership plans have been published by the Main Administrator yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white border border-[#E5E4DF] rounded-xl p-6 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#16222E]">{plan.name}</h3>
                    <div className="text-2xl font-bold text-[#1D3A5F] tabular-nums">
                      {plan.price} {plan.currency}{' '}
                      <span className="text-xs font-normal text-[#64748B]">
                        / {plan.billingCycle}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-[#475569]">{plan.description}</p>
                    )}
                    <ul className="space-y-1.5 text-xs text-[#475569] pt-2 border-t border-[#E5E4DF]">
                      {plan.features.map((f, idx) => (
                        <li key={idx}>· {f}</li>
                      ))}
                      <li>· Storage: {plan.storageLimitMb} MB</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanRequest(plan)}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
                  >
                    {t.account.upgradePlan}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#475569] space-y-2">
              <CreditCard className="w-6 h-6 mx-auto text-[#64748B]" />
              <p>No payment transactions recorded.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-start">
              <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                <tr>
                  <th className="py-3 px-4 text-start">Item</th>
                  <th className="py-3 px-4 text-start">Provider</th>
                  <th className="py-3 px-4 text-end">Amount</th>
                  <th className="py-3 px-4 text-start">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF]">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 px-4 font-medium text-[#16222E]">{tx.itemTitle}</td>
                    <td className="py-3 px-4 uppercase">{tx.provider}</td>
                    <td className="py-3 px-4 text-end tabular-nums">
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
