import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Compass,
  Download,
  Eye,
  FileImage,
  FileText,
  Layers,
  Lock,
  Printer,
  Shield,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { DocumentTemplateRecord, DocumentTemplateType, TransactionRecord } from '../types';
import { AmazighGeometricFrieze, YazEmblem } from '../components/AmazighArtwork';

interface DocumentsPageProps {
  activeTab: DocumentTemplateType;
  onTabChange: (tab: DocumentTemplateType) => void;
}

const PALETTES = [
  { id: 'atlas', label: 'Atlas Indigo & Saffron', primary: '#1D3A5F', accent: '#C68B1C', text: '#16222E' },
  { id: 'cedar', label: 'Cedar Emerald & Gold', primary: '#1B6B50', accent: '#B47B16', text: '#14261F' },
  { id: 'limestone', label: 'Charcoal & Bronze', primary: '#292524', accent: '#9A3412', text: '#1C1917' },
  { id: 'royal', label: 'Majorelle & Sand', primary: '#1E40AF', accent: '#D97706', text: '#0F172A' },
];

const BACKGROUNDS = [
  { id: 'white', label: 'Pure White', bg: '#FFFFFF' },
  { id: 'alabaster', label: 'Alabaster Paper', bg: '#FAFAF8' },
  { id: 'ivory', label: 'Warm Parchment', bg: '#F7F4EE' },
  { id: 'slate', label: 'Cool Mist', bg: '#F4F7FA' },
];

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ activeTab, onTabChange }) => {
  const {
    t,
    templates,
    userProfile,
    firebaseUser,
    isMainAdmin,
    hasPermission,
    navigate,
    signInWithGoogle,
    trackDownload,
  } = useApp();

  // Selection State
  const [pathway, setPathway] = useState(1);
  const [level, setLevel] = useState('level_1');
  const [week, setWeek] = useState(1);
  const [part, setPart] = useState(1);

  // Teacher Metadata State
  const [teacherName, setTeacherName] = useState(userProfile?.displayName || '');
  const [schoolName, setSchoolName] = useState(userProfile?.schoolName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [academicYear, setAcademicYear] = useState(userProfile?.academicYear || '2026-2027');
  const [extraInfo, setExtraInfo] = useState('');

  // Design Customization State
  const [paletteId, setPaletteId] = useState('atlas');
  const [bgId, setBgId] = useState('white');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'tifinagh' | 'arabic'>('sans');
  const [patternStyle, setPatternStyle] = useState<'frieze' | 'yaz' | 'minimal'>('frieze');
  const [layoutMode, setLayoutMode] = useState<'portrait' | 'landscape'>('portrait');
  const [borderStyle, setBorderStyle] = useState<'double' | 'hairline' | 'accent'>('double');
  const [headerStyle, setHeaderStyle] = useState<'formal' | 'compact'>('formal');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userTransactions, setUserTransactions] = useState<TransactionRecord[]>([]);
  const [purchaseNotice, setPurchaseNotice] = useState('');

  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      setTeacherName((prev) => prev || userProfile.displayName || '');
      setSchoolName((prev) => prev || userProfile.schoolName || '');
      setInstitution((prev) => prev || userProfile.institution || '');
      setAcademicYear((prev) => prev || userProfile.academicYear || '2026-2027');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!firebaseUser) {
      setUserTransactions([]);
      return;
    }
    const q = query(
      collection(db, 'transactions'),
      where('userUid', '==', firebaseUser.uid),
      where('status', '==', 'completed')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUserTransactions(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TransactionRecord, 'id'>) }))
        );
      },
      () => {}
    );
    return () => unsub();
  }, [firebaseUser]);

  const canManageDocs = isMainAdmin || hasPermission('manageDocuments');
  const activePalette = PALETTES.find((p) => p.id === paletteId) || PALETTES[0];
  const activeBg = BACKGROUNDS.find((b) => b.id === bgId) || BACKGROUNDS[0];

  // Retrieve matching admin-uploaded template
  const matchedTemplate: DocumentTemplateRecord | undefined = templates.find((tpl) => {
    if (!tpl.isPublished && !canManageDocs) return false;
    if (tpl.docType !== activeTab || tpl.pathway !== pathway) return false;
    if (activeTab === 'annual_distribution') return true;
    if (activeTab === 'periodic_distribution') return tpl.level === level;
    return tpl.level === level && tpl.week === week && tpl.part === part;
  });

  const canUseTemplate = (tpl?: DocumentTemplateRecord): boolean => {
    if (!tpl) return false;
    if (canManageDocs) return true;
    if (tpl.accessTier === 'public_free') return true;
    if (!firebaseUser) return false;
    if (tpl.accessTier === 'registered_free') return true;
    if (tpl.accessTier === 'premium_only') {
      return (
        userProfile?.subscriptionTier === 'premium' ||
        userProfile?.subscriptionTier === 'institutional'
      );
    }
    if (tpl.accessTier === 'paid_single') {
      return userTransactions.some((tx) => tx.itemType === 'document' && tx.itemId === tpl.id);
    }
    return false;
  };

  const handleRequestPaidTemplate = async (tpl: DocumentTemplateRecord) => {
    if (!firebaseUser || !userProfile) {
      await signInWithGoogle();
      return;
    }
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'transactions', txId), {
        userUid: firebaseUser.uid,
        userEmail: userProfile.email,
        itemType: 'document',
        itemId: tpl.id,
        itemTitle: tpl.title.slice(0, 240),
        amount: tpl.price || 0,
        currency: tpl.currency || 'MAD',
        provider: 'manual',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setPurchaseNotice(`Access request ${txId} recorded (${tpl.price || 0} ${tpl.currency || 'MAD'}). Track status in your Account.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `transactions/${txId}`);
    }
  };

  const recordExport = async (tpl: DocumentTemplateRecord) => {
    await trackDownload(tpl.id, tpl.title, 'document');
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'documents', tpl.id), {
          downloadCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking
      }
    }
  };

  const handleExportPng = async () => {
    if (!sheetRef.current || !matchedTemplate) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: activeBg.bg,
      });
      const link = document.createElement('a');
      link.download = `berghazi_${matchedTemplate.docType}_p${pathway}.png`;
      link.href = dataUrl;
      link.click();
      await recordExport(matchedTemplate);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!sheetRef.current || !matchedTemplate) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(sheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: activeBg.bg,
      });
      const isLandscape = layoutMode === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'PNG', 6, 6, pageW - 12, pageH - 12);
      pdf.save(`berghazi_${matchedTemplate.docType}_p${pathway}.pdf`);
      await recordExport(matchedTemplate);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (matchedTemplate) {
      await recordExport(matchedTemplate);
    }
    window.print();
  };

  const fontClass =
    fontStyle === 'serif'
      ? 'font-display'
      : fontStyle === 'tifinagh'
      ? 'font-tifinagh'
      : fontStyle === 'arabic'
      ? 'font-[var(--font-arabic)]'
      : '';

  const isImageTemplate =
    matchedTemplate && ['png', 'jpg', 'svg'].includes(matchedTemplate.templateFormat);

  const SheetCanvas = ({ inModal = false }: { inModal?: boolean }) => {
    if (!matchedTemplate) return null;
    return (
      <div
        ref={inModal ? undefined : sheetRef}
        style={{
          backgroundColor: activeBg.bg,
          color: activePalette.text,
          borderColor: activePalette.primary,
        }}
        className={`print-only-sheet mx-auto rounded-lg transition-all ${fontClass} ${
          layoutMode === 'landscape' ? 'max-w-4xl aspect-[1.41/1]' : 'max-w-2xl min-h-[680px]'
        } ${
          borderStyle === 'double'
            ? 'border-4 border-double p-6 sm:p-8'
            : borderStyle === 'accent'
            ? 'border-2 p-6 sm:p-8'
            : 'border p-6 sm:p-8'
        }`}
      >
        {/* Decorative Pattern Top */}
        {patternStyle === 'frieze' && <AmazighGeometricFrieze className="mb-4" />}

        {/* Personalized Header */}
        <div
          style={{ borderBottomColor: activePalette.accent }}
          className={`pb-4 mb-5 border-b-2 ${
            headerStyle === 'formal'
              ? 'flex flex-col sm:flex-row sm:items-start justify-between gap-4'
              : 'flex items-center justify-between gap-4'
          }`}
        >
          <div className="space-y-1 text-xs">
            <div className="font-bold text-sm" style={{ color: activePalette.primary }}>
              {institution || 'Ministry / Educational Directorate'}
            </div>
            <div>
              <span className="font-semibold">{t.documents.schoolName}:</span>{' '}
              <span>{schoolName || '—'}</span>
            </div>
            <div>
              <span className="font-semibold">{t.documents.teacherName}:</span>{' '}
              <span>{teacherName || '—'}</span>
            </div>
            {extraInfo && (
              <div>
                <span className="font-semibold">{t.documents.extraInfo}:</span>{' '}
                <span>{extraInfo}</span>
              </div>
            )}
          </div>

          <div className="text-end space-y-1 text-xs shrink-0">
            <div className="inline-flex items-center gap-1.5 font-bold" style={{ color: activePalette.primary }}>
              {patternStyle === 'yaz' && <YazEmblem className="w-5 h-5" />}
              <span>{t.brand}</span>
            </div>
            <div className="tabular-nums">
              {t.documents.academicYear}: {academicYear}
            </div>
            <div className="font-medium" style={{ color: activePalette.accent }}>
              {t.lessons.pathwayLabel} {pathway}
              {activeTab !== 'annual_distribution' ? ` · ${level.replace('level_', 'L')}` : ''}
              {activeTab === 'mind_map' ? ` · W${week} · P${part}` : ''}
            </div>
          </div>
        </div>

        {/* Original Admin-Uploaded Template Title & Unaltered Content */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold" style={{ color: activePalette.primary }}>
              {matchedTemplate.title}
            </h3>
            {matchedTemplate.description && (
              <p className="text-xs opacity-80">{matchedTemplate.description}</p>
            )}
          </div>

          <div
            style={{ borderColor: `${activePalette.primary}33` }}
            className="border rounded-lg bg-white/80 p-3 flex items-center justify-center min-h-[340px]"
          >
            {isImageTemplate ? (
              <img
                src={matchedTemplate.templateFileUrl}
                alt={matchedTemplate.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[440px] object-contain mx-auto"
              />
            ) : matchedTemplate.templateFormat === 'pdf' ? (
              <iframe
                src={matchedTemplate.templateFileUrl}
                title={matchedTemplate.title}
                className="w-full h-[380px] rounded border-0"
              />
            ) : (
              <div className="text-center space-y-2 py-10">
                <FileText className="w-10 h-10 mx-auto" style={{ color: activePalette.primary }} />
                <div className="text-sm font-semibold">{matchedTemplate.templateFileName}</div>
                <div className="text-xs opacity-70">
                  Official {matchedTemplate.templateFormat.toUpperCase()} Template
                </div>
                <a
                  href={matchedTemplate.templateFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: activePalette.primary }}
                >
                  Download Original File
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Personalized Footer */}
        <div
          style={{ borderTopColor: `${activePalette.primary}33` }}
          className="mt-6 pt-3 border-t flex items-center justify-between text-[11px] opacity-80"
        >
          <span>
            {teacherName || 'Educator'} · {schoolName || 'Berghazi Platform'}
          </span>
          <span className="font-tifinagh">ⴱⵔⵖⴰⵣⵉ · ⵣ</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="space-y-2 border-b border-[#E5E4DF] pb-6 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-[#16222E]">{t.documents.title}</h1>
            <p className="text-sm text-[#475569] max-w-3xl">{t.documents.subtitle}</p>
          </div>
          {canManageDocs && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Upload Templates in Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Document Category Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-[#E5E4DF] rounded-xl no-print">
        {(
          [
            { id: 'mind_map', label: t.documents.tabs.mindMap, icon: Compass },
            { id: 'annual_distribution', label: t.documents.tabs.annual, icon: Layers },
            { id: 'periodic_distribution', label: t.documents.tabs.periodic, icon: FileText },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#1D3A5F] text-white'
                  : 'text-[#475569] hover:bg-[#F4F3EF] hover:text-[#16222E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Configuration Column */}
        <div className="lg:col-span-5 space-y-6 no-print">
          {/* Educational Selection */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#16222E] border-b border-[#E5E4DF] pb-2">
              {t.documents.selectionTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  {t.lessons.pathwayLabel}
                </label>
                <select
                  value={pathway}
                  onChange={(e) => setPathway(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6].map((p) => (
                    <option key={p} value={p}>
                      {t.lessons.pathwayLabel} {p}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab !== 'annual_distribution' && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    {t.lessons.selectLevel}
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    {t.lessons.levels.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'mind_map' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      {t.lessons.week}
                    </label>
                    <select
                      value={week}
                      onChange={(e) => setWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6].map((w) => (
                        <option key={w} value={w}>
                          {t.lessons.week} {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      {t.lessons.part}
                    </label>
                    <select
                      value={part}
                      onChange={(e) => setPart(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2].map((pt) => (
                        <option key={pt} value={pt}>
                          {t.lessons.part} {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Teacher Info Form */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-[#16222E] border-b border-[#E5E4DF] pb-2">
              {t.documents.teacherInfo}
            </h2>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder={t.documents.teacherName}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder={t.documents.schoolName}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={t.documents.institution}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder={t.documents.academicYear}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              />
            </div>
            <input
              type="text"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              placeholder={t.documents.extraInfo}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
          </div>

          {/* Customization Controls */}
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#16222E] border-b border-[#E5E4DF] pb-2">
              {t.documents.customizationTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.palette}
                </label>
                <select
                  value={paletteId}
                  onChange={(e) => setPaletteId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  {PALETTES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.background}
                </label>
                <select
                  value={bgId}
                  onChange={(e) => setBgId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  {BACKGROUNDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.typography}
                </label>
                <select
                  value={fontStyle}
                  onChange={(e) =>
                    setFontStyle(e.target.value as 'sans' | 'serif' | 'tifinagh' | 'arabic')
                  }
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="sans">Plus Jakarta Sans</option>
                  <option value="serif">Fraunces Editorial</option>
                  <option value="tifinagh">Noto Sans Tifinagh</option>
                  <option value="arabic">Cairo Arabic</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.pattern}
                </label>
                <select
                  value={patternStyle}
                  onChange={(e) =>
                    setPatternStyle(e.target.value as 'frieze' | 'yaz' | 'minimal')
                  }
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="frieze">Amazigh Geometric Frieze</option>
                  <option value="yaz">Yaz Emblem (ⵣ)</option>
                  <option value="minimal">Clean Minimal</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.layout}
                </label>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="portrait">A4 Portrait</option>
                  <option value="landscape">A4 Landscape</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#475569] mb-1">
                  {t.documents.borderStyle}
                </label>
                <select
                  value={borderStyle}
                  onChange={(e) =>
                    setBorderStyle(e.target.value as 'double' | 'hairline' | 'accent')
                  }
                  className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                >
                  <option value="double">Double Heritage Frame</option>
                  <option value="accent">Solid Accent Frame</option>
                  <option value="hairline">Minimal Hairline</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E4DF] text-xs text-[#475569] flex items-center justify-between">
              <span>{t.documents.headerFooter}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setHeaderStyle('formal')}
                  className={`px-2.5 py-1 rounded border ${
                    headerStyle === 'formal'
                      ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                      : 'border-[#E5E4DF]'
                  }`}
                >
                  Formal
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderStyle('compact')}
                  className={`px-2.5 py-1 rounded border ${
                    headerStyle === 'compact'
                      ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                      : 'border-[#E5E4DF]'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Export Canvas */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#F4F3EF] border border-[#E5E4DF] rounded-xl p-4 text-xs text-[#475569] no-print">
            {t.documents.templateNotice}
          </div>

          {!matchedTemplate ? (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#F4F3EF] border border-[#E5E4DF] flex items-center justify-center mx-auto text-[#64748B]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-[#16222E]">
                  {t.documents.noTemplateTitle}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {t.documents.noTemplateBody}
                </p>
              </div>
            </div>
          ) : !canUseTemplate(matchedTemplate) ? (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-10 text-center space-y-4">
              <Lock className="w-8 h-8 text-[#C68B1C] mx-auto" />
              <h3 className="text-lg font-semibold text-[#16222E]">{matchedTemplate.title}</h3>
              <p className="text-sm text-[#475569]">
                {!firebaseUser
                  ? t.lessons.lockedRegister
                  : matchedTemplate.accessTier === 'paid_single'
                  ? `${t.lessons.lockedPaid} (${matchedTemplate.price || 0} ${matchedTemplate.currency || 'MAD'})`
                  : t.lessons.lockedPremium}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!firebaseUser) {
                    signInWithGoogle();
                  } else if (matchedTemplate.accessTier === 'paid_single') {
                    handleRequestPaidTemplate(matchedTemplate);
                  } else {
                    navigate('account');
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
              >
                {!firebaseUser
                  ? t.auth.signIn
                  : matchedTemplate.accessTier === 'paid_single'
                  ? 'Request Access'
                  : t.account.upgradePlan}
              </button>
              {purchaseNotice && (
                <div className="text-xs font-medium text-[#1B6B50]">{purchaseNotice}</div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Export Action Bar */}
              <div className="bg-white border border-[#E5E4DF] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 no-print">
                <span className="text-xs font-semibold text-[#16222E] truncate max-w-xs">
                  {matchedTemplate.title}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.documents.preview}</span>
                  </button>
                  {activeTab === 'mind_map' && (
                    <button
                      type="button"
                      disabled={exporting}
                      onClick={handleExportPng}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8] disabled:opacity-50"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>{t.documents.downloadPng}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={handleExportPdf}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.documents.downloadPdf}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#16222E] bg-[#C68B1C] rounded-lg hover:bg-[#E5AD44]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.documents.printDoc}</span>
                  </button>
                  <a
                    href={
                      matchedTemplate.templateFileUrl.includes('/api/files/')
                        ? `${matchedTemplate.templateFileUrl}?download=1`
                        : matchedTemplate.templateFileUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordExport(matchedTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Original File</span>
                  </a>
                </div>
              </div>

              <SheetCanvas />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewOpen && matchedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 no-print">
          <div className="bg-[#FAFAF8] rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-[#E5E4DF] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#16222E]">
                {t.documents.preview} · {matchedTemplate.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F4F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <SheetCanvas inModal />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
