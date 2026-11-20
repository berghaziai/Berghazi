import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  RotateCcw,
  Shield,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
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
import { AdSlot } from '../components/AdSlot';
import { YazEmblem } from '../components/AmazighArtwork';
import { LessonRecord, TransactionRecord } from '../types';

interface LessonsPageProps {
  selectedPathway: number;
  onSelectPathway: (pathway: number) => void;
}

interface UnifiedOptionButtonProps {
  label: string;
  sublabel?: string;
  count?: number;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const UnifiedOptionButton: React.FC<UnifiedOptionButtonProps> = ({
  label,
  sublabel,
  count,
  selected,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-[#1D3A5F] ${
        disabled
          ? 'bg-[#FAFAF8] border-[#ECEBE6] text-[#94A3B8] opacity-55 cursor-not-allowed'
          : selected
          ? 'bg-[#1D3A5F] border-[#1D3A5F] text-white shadow-sm ring-2 ring-[#C68B1C]/35'
          : 'bg-[#F8F7F4] border-[#E5E4DF] text-[#16222E] hover:border-[#C68B1C] hover:bg-white'
      }`}
    >
      <span className="text-sm font-semibold font-tifinagh leading-snug">{label}</span>
      {sublabel && (
        <span
          className={`text-[11px] leading-tight truncate max-w-full ${
            selected ? 'text-[#E5AD44]' : 'text-[#64748B]'
          }`}
        >
          {sublabel}
        </span>
      )}
      {!disabled && typeof count === 'number' && count > 0 && (
        <span
          className={`text-[10px] font-mono-num ${
            selected ? 'text-slate-200' : 'text-[#C68B1C]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export const LessonsPage: React.FC<LessonsPageProps> = ({
  selectedPathway,
  onSelectPathway,
}) => {
  const {
    language,
    isRtl,
    t,
    lessons,
    pathways,
    firebaseUser,
    userProfile,
    isMainAdmin,
    hasPermission,
    bookmarks,
    navigate,
    signInWithGoogle,
    trackDownload,
  } = useApp();

  // Clean 4-step dependent selection hierarchy: Track (ⴰⵙⴰⴽⴰ) -> Stage (ⵜⵉⴽⵍⵉ) -> Week (ⵉⵎⴰⵍⴰⵙⵙ) -> Part (ⴰⴳⵣⵣⵓⵎ)
  const [selectedTrack, setSelectedTrack] = useState<number>(
    selectedPathway >= 1 && selectedPathway <= 6 ? selectedPathway : 1
  );
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<number | null>(null);

  const [viewerLesson, setViewerLesson] = useState<LessonRecord | null>(null);
  const [userTransactions, setUserTransactions] = useState<TransactionRecord[]>([]);
  const [purchaseNotice, setPurchaseNotice] = useState('');

  // Sync external navigation from HomePage pathways
  useEffect(() => {
    if (selectedPathway >= 1 && selectedPathway <= 6 && selectedPathway !== selectedTrack) {
      setSelectedTrack(selectedPathway);
      setSelectedStage(null);
      setSelectedWeek(null);
      setSelectedPart(null);
    }
  }, [selectedPathway]);

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

  const canManageLessons = isMainAdmin || hasPermission('manageLessons');
  const visibleLessons = useMemo(
    () => lessons.filter((l) => l.isPublished || canManageLessons),
    [lessons, canManageLessons]
  );

  const getTrackSubtitle = (num: number) => {
    const pw = pathways.find((item) => item.number === num);
    if (!pw) return undefined;
    const title = language === 'zgh' ? pw.titleZgh : language === 'ar' ? pw.titleAr : pw.titleEn;
    if (
      title === `ⴰⴱⵔⵉⴷ ${num}` ||
      title === `ⴰⵙⴰⴽⴰ ${num}` ||
      title === `Pathway ${num}` ||
      title === `المسار التعليمي ${num}`
    ) {
      return undefined;
    }
    return title;
  };

  // Dependent selection handlers (reset downstream selections automatically)
  const handleSelectTrack = (trackNum: number) => {
    setSelectedTrack(trackNum);
    onSelectPathway(trackNum);
    setSelectedStage(null);
    setSelectedWeek(null);
    setSelectedPart(null);
    setPurchaseNotice('');
  };

  const handleSelectStage = (stageNum: number) => {
    setSelectedStage(stageNum);
    setSelectedWeek(null);
    setSelectedPart(null);
    setPurchaseNotice('');
  };

  const handleSelectWeek = (weekNum: number) => {
    setSelectedWeek(weekNum);
    setSelectedPart(null);
    setPurchaseNotice('');
  };

  const handleSelectPart = (partNum: number) => {
    setSelectedPart(partNum);
    setPurchaseNotice('');
  };

  const handleReset = () => {
    setSelectedStage(null);
    setSelectedWeek(null);
    setSelectedPart(null);
    setPurchaseNotice('');
  };

  const matchingLessons = useMemo(() => {
    if (selectedStage === null || selectedWeek === null || selectedPart === null) {
      return [];
    }
    return visibleLessons.filter(
      (l) =>
        l.pathway === selectedTrack &&
        (l.stage ?? 1) === selectedStage &&
        l.week === selectedWeek &&
        l.part === selectedPart
    );
  }, [visibleLessons, selectedTrack, selectedStage, selectedWeek, selectedPart]);

  const allSelected =
    selectedStage !== null && selectedWeek !== null && selectedPart !== null;

  const canAccessLesson = (lesson: LessonRecord): { allowed: boolean; reason?: string } => {
    if (canManageLessons) return { allowed: true };
    if (lesson.accessTier === 'public_free') return { allowed: true };
    if (!firebaseUser) return { allowed: false, reason: t.lessons.lockedRegister };
    if (lesson.accessTier === 'registered_free') return { allowed: true };
    if (lesson.accessTier === 'premium_only') {
      if (
        userProfile?.subscriptionTier === 'premium' ||
        userProfile?.subscriptionTier === 'institutional'
      ) {
        return { allowed: true };
      }
      return { allowed: false, reason: t.lessons.lockedPremium };
    }
    if (lesson.accessTier === 'paid_single') {
      const purchased = userTransactions.some(
        (tx) => tx.itemType === 'lesson' && tx.itemId === lesson.id
      );
      if (purchased) return { allowed: true };
      return {
        allowed: false,
        reason: `${t.lessons.lockedPaid} (${lesson.price || 0} ${lesson.currency || 'MAD'})`,
      };
    }
    return { allowed: true };
  };

  const handleToggleBookmark = async (lesson: LessonRecord) => {
    if (!firebaseUser) {
      await signInWithGoogle();
      return;
    }
    const bookmarkId = `${firebaseUser.uid}_lesson_${lesson.id}`;
    const exists = bookmarks.some((b) => b.id === bookmarkId);
    try {
      if (exists) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkId));
      } else {
        await setDoc(doc(db, 'bookmarks', bookmarkId), {
          userUid: firebaseUser.uid,
          itemId: lesson.id,
          itemType: 'lesson',
          title: lesson.title,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookmarks/${bookmarkId}`);
    }
  };

  const handleDownload = async (lesson: LessonRecord) => {
    await trackDownload(lesson.id, lesson.title, 'lesson');
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'lessons', lesson.id), {
          downloadCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking if visitor
      }
    }
    const downloadUrl = lesson.fileUrl.includes('/api/files/')
      ? `${lesson.fileUrl}?download=1`
      : lesson.fileUrl;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = lesson.fileName;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRequestPaidLesson = async (lesson: LessonRecord) => {
    if (!firebaseUser || !userProfile) {
      await signInWithGoogle();
      return;
    }
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'transactions', txId), {
        userUid: firebaseUser.uid,
        userEmail: userProfile.email,
        itemType: 'lesson',
        itemId: lesson.id,
        itemTitle: lesson.title.slice(0, 240),
        amount: lesson.price || 0,
        currency: lesson.currency || 'MAD',
        provider: 'manual',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setPurchaseNotice(
        `Access request ${txId} recorded (${lesson.price || 0} ${lesson.currency || 'MAD'}). Track status in your Account.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `transactions/${txId}`);
    }
  };

  const SepIcon = isRtl ? ChevronLeft : ChevronRight;
  const breadcrumbs = [
    `ⴰⵙⴰⴽⴰ ${selectedTrack}`,
    selectedStage !== null ? `ⵜⵉⴽⵍⵉ ${selectedStage}` : null,
    selectedWeek !== null ? `ⵉⵎⴰⵍⴰⵙⵙ ${selectedWeek}` : null,
    selectedPart !== null ? `ⴰⴳⵣⵣⵓⵎ ${selectedPart}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Clean Page Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C68B1C] font-tifinagh">
            <YazEmblem className="w-4 h-4 text-[#C68B1C]" />
            <span>{t.lessons.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#16222E] font-tifinagh">
            ⵜⴰⵙⴷⵍⵉⵙⵜ ⵏ ⵜⵎⵙⵉⵔⵉⵏ
          </h1>
          <p className="text-sm text-[#475569]">{t.lessons.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedStage !== null && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#475569] bg-white border border-[#E5E4DF] rounded-xl hover:border-[#C68B1C] hover:text-[#16222E] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C68B1C]" />
              <span>{t.lessons.resetSelection}</span>
            </button>
          )}
          {canManageLessons && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-xl hover:bg-[#16222E] transition-colors whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.lessons.adminUploadPrompt}</span>
            </button>
          )}
        </div>
      </header>

      {/* Top Track Selector — ⴰⵙⴰⴽⴰ (1–6) */}
      <section className="bg-white border border-[#E5E4DF] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#16222E] font-tifinagh">
            {t.lessons.trackTitle}
          </h2>
          <div className="flex items-center gap-1.5 text-xs font-tifinagh">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={`${crumb}-${idx}`}>
                {idx > 0 && <SepIcon className="w-3.5 h-3.5 text-[#94A3B8]" />}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'font-semibold text-[#1D3A5F]'
                      : 'text-[#64748B]'
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((trackNum) => {
            const count = visibleLessons.filter((l) => l.pathway === trackNum).length;
            return (
              <UnifiedOptionButton
                key={trackNum}
                label={`ⴰⵙⴰⴽⴰ ${trackNum}`}
                sublabel={getTrackSubtitle(trackNum)}
                count={count}
                selected={selectedTrack === trackNum}
                onClick={() => handleSelectTrack(trackNum)}
              />
            );
          })}
        </div>
      </section>

      {/* Side-by-Side 3-Column Dependent Picker: ⵜⵉⴽⵍⵉ · ⵉⵎⴰⵍⴰⵙⵙ · ⴰⴳⵣⵣⵓⵎ */}
      <section className="bg-white border border-[#E5E4DF] rounded-2xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse divide-[#E5E4DF] overflow-hidden">
        {/* Column 1: Stage — ⵜⵉⴽⵍⵉ (1–6) */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-semibold font-tifinagh ${
                selectedStage === null ? 'text-[#C68B1C]' : 'text-[#16222E]'
              }`}
            >
              {t.lessons.stageTitle}
            </h3>
            {selectedStage !== null && (
              <span className="text-xs font-semibold text-[#1D3A5F] font-tifinagh">
                ⵜⵉⴽⵍⵉ {selectedStage}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((stageNum) => {
              const count = visibleLessons.filter(
                (l) => l.pathway === selectedTrack && (l.stage ?? 1) === stageNum
              ).length;
              return (
                <UnifiedOptionButton
                  key={stageNum}
                  label={`ⵜⵉⴽⵍⵉ ${stageNum}`}
                  count={count}
                  selected={selectedStage === stageNum}
                  onClick={() => handleSelectStage(stageNum)}
                />
              );
            })}
          </div>
        </div>

        {/* Column 2: Week — ⵉⵎⴰⵍⴰⵙⵙ (1–6) */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-semibold font-tifinagh ${
                selectedStage !== null && selectedWeek === null
                  ? 'text-[#C68B1C]'
                  : selectedStage === null
                  ? 'text-[#94A3B8]'
                  : 'text-[#16222E]'
              }`}
            >
              {t.lessons.weekTitle}
            </h3>
            {selectedWeek !== null && (
              <span className="text-xs font-semibold text-[#1D3A5F] font-tifinagh">
                ⵉⵎⴰⵍⴰⵙⵙ {selectedWeek}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((weekNum) => {
              const count =
                selectedStage !== null
                  ? visibleLessons.filter(
                      (l) =>
                        l.pathway === selectedTrack &&
                        (l.stage ?? 1) === selectedStage &&
                        l.week === weekNum
                    ).length
                  : 0;
              return (
                <UnifiedOptionButton
                  key={weekNum}
                  label={`ⵉⵎⴰⵍⴰⵙⵙ ${weekNum}`}
                  count={count}
                  disabled={selectedStage === null}
                  selected={selectedWeek === weekNum}
                  onClick={() => handleSelectWeek(weekNum)}
                />
              );
            })}
          </div>
        </div>

        {/* Column 3: Part — ⴰⴳⵣⵣⵓⵎ (1–2) */}
        <div className="p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-semibold font-tifinagh ${
                  selectedWeek !== null && selectedPart === null
                    ? 'text-[#C68B1C]'
                    : selectedWeek === null
                    ? 'text-[#94A3B8]'
                    : 'text-[#16222E]'
                }`}
              >
                {t.lessons.partTitle}
              </h3>
              {selectedPart !== null && (
                <span className="text-xs font-semibold text-[#1D3A5F] font-tifinagh">
                  ⴰⴳⵣⵣⵓⵎ {selectedPart}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {[1, 2].map((partNum) => {
                const count =
                  selectedStage !== null && selectedWeek !== null
                    ? visibleLessons.filter(
                        (l) =>
                          l.pathway === selectedTrack &&
                          (l.stage ?? 1) === selectedStage &&
                          l.week === selectedWeek &&
                          l.part === partNum
                      ).length
                    : 0;
                return (
                  <UnifiedOptionButton
                    key={partNum}
                    label={`ⴰⴳⵣⵣⵓⵎ ${partNum}`}
                    sublabel={language !== 'zgh' ? `${t.lessons.part} ${partNum}` : undefined}
                    count={count}
                    disabled={selectedWeek === null}
                    selected={selectedPart === partNum}
                    onClick={() => handleSelectPart(partNum)}
                  />
                );
              })}
            </div>
          </div>

          {!allSelected && (
            <p className="text-xs text-[#64748B] pt-2 text-center">
              {selectedStage === null
                ? t.lessons.selectStagePrompt
                : selectedWeek === null
                ? t.lessons.selectWeekPrompt
                : t.lessons.selectPartPrompt}
            </p>
          )}
        </div>
      </section>

      {/* Loaded Official Lesson Result */}
      {allSelected && (
        <section className="space-y-4">
          {matchingLessons.length === 0 ? (
            <div className="bg-white border border-[#E5E4DF] rounded-2xl p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] flex items-center justify-center mx-auto text-[#C68B1C]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-semibold text-[#16222E]">{t.lessons.emptyTitle}</h3>
                <p className="text-sm text-[#475569]">{t.lessons.emptyBody}</p>
              </div>
              {canManageLessons && (
                <button
                  type="button"
                  onClick={() => navigate('admin')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-xl hover:bg-[#16222E]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.lessons.adminUploadPrompt}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {matchingLessons.map((lesson) => {
                const access = canAccessLesson(lesson);
                const isSaved = bookmarks.some(
                  (b) => b.itemId === lesson.id && b.itemType === 'lesson'
                );

                return (
                  <article
                    key={lesson.id}
                    className="bg-white border border-[#E5E4DF] rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                          <span>{lesson.fileFormat.toUpperCase()}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {lesson.accessTier === 'public_free'
                              ? t.common.free
                              : lesson.accessTier === 'premium_only'
                              ? t.common.premium
                              : lesson.accessTier === 'paid_single'
                              ? `${lesson.price || 0} ${lesson.currency || 'MAD'}`
                              : t.auth.roleLabels.ordinary_member}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{lesson.downloadCount || 0} ↓</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#16222E]">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-[#475569] leading-relaxed">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(lesson)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E4DF] rounded-xl hover:bg-[#FAFAF8] text-[#475569]"
                      >
                        {isSaved ? (
                          <Check className="w-3.5 h-3.5 text-[#1B6B50]" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        <span>{isSaved ? t.lessons.bookmarked : t.lessons.bookmark}</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#E5E4DF] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#64748B] truncate max-w-xs">
                        {lesson.fileName}
                      </span>

                      {access.allowed ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewerLesson(lesson)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl hover:bg-[#F4F3EF]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.lessons.viewOnline}</span>
                          </button>
                          {lesson.allowDownload && (
                            <button
                              type="button"
                              onClick={() => handleDownload(lesson)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-xl hover:bg-[#16222E]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t.lessons.downloadFile}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412]">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{access.reason}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!firebaseUser) {
                                signInWithGoogle();
                              } else if (lesson.accessTier === 'paid_single') {
                                handleRequestPaidLesson(lesson);
                              } else {
                                navigate('account');
                              }
                            }}
                            className="px-3.5 py-2 text-xs font-semibold text-[#16222E] bg-[#C68B1C] rounded-xl hover:bg-[#E5AD44]"
                          >
                            {!firebaseUser
                              ? t.auth.signIn
                              : lesson.accessTier === 'paid_single'
                              ? 'Request Access'
                              : t.account.upgradePlan}
                          </button>
                        </div>
                      )}
                    </div>
                    {purchaseNotice && lesson.accessTier === 'paid_single' && (
                      <div className="text-xs font-medium text-[#1B6B50] pt-1">
                        {purchaseNotice}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <AdSlot slotKey="lessonsSidebar" />

      {/* Online Lesson Document Viewer Modal */}
      {viewerLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E4DF] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#16222E] truncate">
                  {viewerLesson.title}
                </h3>
                <p className="text-xs text-[#64748B] truncate">{viewerLesson.fileName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {viewerLesson.allowDownload && (
                  <button
                    type="button"
                    onClick={() => handleDownload(viewerLesson)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.lessons.downloadFile}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewerLesson(null)}
                  className="p-2 text-[#64748B] hover:text-[#16222E] rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#F4F3EF] p-4 overflow-auto flex items-center justify-center min-h-[420px]">
              {viewerLesson.fileFormat === 'pdf' ? (
                <iframe
                  src={viewerLesson.fileUrl}
                  title={viewerLesson.title}
                  className="w-full h-[70vh] rounded-xl border border-[#E5E4DF] bg-white"
                />
              ) : viewerLesson.fileFormat === 'image' ? (
                <img
                  src={viewerLesson.fileUrl}
                  alt={viewerLesson.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl border border-[#E5E4DF] bg-white"
                />
              ) : (
                <div className="bg-white border border-[#E5E4DF] rounded-2xl p-8 text-center space-y-4 max-w-md">
                  <FileText className="w-10 h-10 text-[#1D3A5F] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-[#16222E]">{viewerLesson.fileName}</h4>
                    <p className="text-xs text-[#64748B]">
                      Format: {viewerLesson.fileFormat.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <a
                      href={viewerLesson.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-xl"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open File</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
