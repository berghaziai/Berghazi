import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Check,
  Download,
  Flag,
  Heart,
  MessageSquare,
  Plus,
  Search,
  Share2,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';
import { LanguageCode, PublicProfile, ResearchArticle, ResearchComment } from '../types';

interface ResearchPageProps {
  initialArticleId: string | null;
  onClearInitialArticle: () => void;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({
  initialArticleId,
  onClearInitialArticle,
}) => {
  const {
    t,
    language,
    articles,
    firebaseUser,
    userProfile,
    isMainAdmin,
    hasPermission,
    bookmarks,
    signInWithGoogle,
    uploadFile,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedKind, setSelectedKind] = useState<'all' | 'research' | 'culture'>('all');
  const [activeArticle, setActiveArticle] = useState<ResearchArticle | null>(null);
  const [comments, setComments] = useState<ResearchComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [authorModalProfile, setAuthorModalProfile] = useState<PublicProfile | null>(null);

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inaccurate or unverified sources');
  const [reportDetails, setReportDetails] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  // Publish Modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ResearchArticle | null>(null);
  const [formKind, setFormKind] = useState<'research' | 'culture'>('research');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('linguistic');
  const [formLang, setFormLang] = useState<LanguageCode>(language);
  const [formAbstract, setFormAbstract] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRefs, setFormRefs] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    if (initialArticleId) {
      const found = articles.find((a) => a.id === initialArticleId);
      if (found) {
        setActiveArticle(found);
      }
      onClearInitialArticle();
    }
  }, [initialArticleId, articles, onClearInitialArticle]);

  // Listen to user's likes
  useEffect(() => {
    if (!firebaseUser) {
      setLikedIds({});
      return;
    }
    const q = query(collection(db, 'research_likes'), where('userUid', '==', firebaseUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, boolean> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as { articleId: string };
          map[data.articleId] = true;
        });
        setLikedIds(map);
      },
      () => {}
    );
    return () => unsub();
  }, [firebaseUser]);

  // Listen to comments for active article
  useEffect(() => {
    if (!activeArticle) {
      setComments([]);
      return;
    }
    const q = query(
      collection(db, 'research_comments'),
      where('articleId', '==', activeArticle.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setComments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResearchComment, 'id'>) }))
        );
      },
      () => {
        const fallback = query(
          collection(db, 'research_comments'),
          where('articleId', '==', activeArticle.id)
        );
        onSnapshot(fallback, (s) => {
          setComments(
            s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResearchComment, 'id'>) }))
          );
        });
      }
    );
    return () => unsub();
  }, [activeArticle]);

  const canPublish =
    Boolean(userProfile) &&
    !userProfile?.isSuspended &&
    (isMainAdmin ||
      ['assistant_admin', 'page_writer', 'permanent_member'].includes(userProfile!.role));

  const canAutoApprove =
    isMainAdmin ||
    hasPermission('manageResearch') ||
    (userProfile?.role === 'page_writer' && userProfile?.permissions?.publishDirectly);

  const visibleArticles = articles.filter((a) => {
    const canView =
      a.status === 'approved' ||
      (firebaseUser && a.authorUid === firebaseUser.uid) ||
      isMainAdmin ||
      hasPermission('manageResearch');
    if (!canView) return false;
    if (selectedKind !== 'all' && a.kind !== selectedKind) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return (
        a.title.toLowerCase().includes(s) ||
        a.authorName.toLowerCase().includes(s) ||
        a.abstract.toLowerCase().includes(s) ||
        a.category.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleToggleLike = async (article: ResearchArticle) => {
    if (!firebaseUser) {
      await signInWithGoogle();
      return;
    }
    const likeId = `${article.id}_${firebaseUser.uid}`;
    const likeRef = doc(db, 'research_likes', likeId);
    const articleRef = doc(db, 'research', article.id);
    const isLiked = Boolean(likedIds[article.id]);

    try {
      const batch = writeBatch(db);
      if (isLiked) {
        batch.delete(likeRef);
        batch.update(articleRef, {
          likesCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(likeRef, {
          articleId: article.id,
          userUid: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
        batch.update(articleRef, {
          likesCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `research_likes/${likeId}`);
    }
  };

  const handleToggleBookmark = async (article: ResearchArticle) => {
    if (!firebaseUser) {
      await signInWithGoogle();
      return;
    }
    const bookmarkId = `${firebaseUser.uid}_research_${article.id}`;
    const exists = bookmarks.some((b) => b.id === bookmarkId);
    try {
      if (exists) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkId));
      } else {
        await setDoc(doc(db, 'bookmarks', bookmarkId), {
          userUid: firebaseUser.uid,
          itemId: article.id,
          itemType: 'research',
          title: article.title,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookmarks/${bookmarkId}`);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !activeArticle || !commentText.trim()) return;
    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'research_comments', commentId), {
        articleId: activeArticle.id,
        authorUid: firebaseUser.uid,
        authorName: (userProfile?.displayName || firebaseUser.displayName || 'Member').slice(0, 120),
        content: commentText.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'research', activeArticle.id), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setCommentText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `research_comments/${commentId}`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !activeArticle) return;
    const repId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'reports', repId), {
        articleId: activeArticle.id,
        articleTitle: activeArticle.title.slice(0, 240),
        reporterUid: firebaseUser.uid,
        reason: reportReason.slice(0, 120),
        details: reportDetails.trim().slice(0, 1000),
        status: 'open',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'research', activeArticle.id), {
        reportsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      setReportMsg(t.research.reportSubmitted);
      setReportDetails('');
      setTimeout(() => {
        setReportOpen(false);
        setReportMsg('');
      }, 1400);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reports/${repId}`);
    }
  };

  const openAuthorProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'public_profiles', uid));
      if (snap.exists()) {
        setAuthorModalProfile(snap.data() as PublicProfile);
      }
    } catch {
      // Fallback
    }
  };

  const openPublishModal = (article?: ResearchArticle) => {
    setPublishError('');
    if (article) {
      setEditingArticle(article);
      setFormKind(article.kind);
      setFormTitle(article.title);
      setFormCategory(article.category);
      setFormLang(article.language);
      setFormAbstract(article.abstract);
      setFormContent(article.content);
      setFormRefs(article.referencesText || '');
      setFormCoverUrl(article.coverImageUrl || '');
      setFormAttachmentUrl(article.attachmentUrl || '');
      setFormAttachmentName(article.attachmentName || '');
    } else {
      setEditingArticle(null);
      setFormKind('research');
      setFormTitle('');
      setFormCategory('linguistic');
      setFormLang(language);
      setFormAbstract('');
      setFormContent('');
      setFormRefs('');
      setFormCoverUrl('');
      setFormAttachmentUrl('');
      setFormAttachmentName('');
    }
    setPublishOpen(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userProfile) return;
    if (formTitle.trim().length < 3 || formAbstract.trim().length < 10 || formContent.trim().length < 20) {
      setPublishError('Please provide a full title (3+ chars), abstract (10+ chars), and main content (20+ chars).');
      return;
    }
    setSubmitting(true);
    setPublishError('');
    try {
      const payload = {
        kind: formKind,
        title: formTitle.trim().slice(0, 240),
        abstract: formAbstract.trim().slice(0, 1500),
        content: formContent.trim().slice(0, 30000),
        category: formCategory.slice(0, 80),
        language: formLang,
        referencesText: formRefs.trim().slice(0, 4000),
        coverImageUrl: formCoverUrl.trim().slice(0, 1000),
        attachmentUrl: formAttachmentUrl.trim().slice(0, 1000),
        attachmentName: formAttachmentName.trim().slice(0, 255),
        updatedAt: serverTimestamp(),
      };

      if (editingArticle) {
        await updateDoc(doc(db, 'research', editingArticle.id), {
          ...payload,
          status: canAutoApprove ? editingArticle.status : 'pending',
        });
      } else {
        const newId = `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await setDoc(doc(db, 'research', newId), {
          ...payload,
          authorUid: firebaseUser.uid,
          authorName: (userProfile.displayName || 'Member').slice(0, 120),
          publicationDate: new Date().toISOString().slice(0, 10),
          status: canAutoApprove ? 'approved' : 'pending',
          likesCount: 0,
          commentsCount: 0,
          reportsCount: 0,
          createdAt: serverTimestamp(),
        });
      }
      setPublishOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentUpload = async (file: File, purpose: 'cover' | 'research') => {
    try {
      const res = await uploadFile(file, purpose);
      if (purpose === 'cover') {
        setFormCoverUrl(res.url);
      } else {
        setFormAttachmentUrl(res.url);
        setFormAttachmentName(res.fileName);
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'File upload failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="border-b border-[#E5E4DF] pb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-3xl font-semibold text-[#16222E]">{t.research.title}</h1>
          <p className="text-sm text-[#475569]">{t.research.subtitle}</p>
        </div>

        {canPublish ? (
          <button
            type="button"
            onClick={() => openPublishModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t.research.submitResearch}</span>
          </button>
        ) : !firebaseUser ? (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-4 py-2.5 text-xs font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg hover:bg-[#F4F3EF]"
          >
            {t.auth.signIn}
          </button>
        ) : null}
      </header>

      {/* Search & Category Filter Bar */}
      <div className="bg-white border border-[#E5E4DF] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.research.searchPlaceholder}
            className="w-full ps-9 pe-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg focus:outline-2 focus:outline-[#1D3A5F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value as 'all' | 'research' | 'culture')}
            className="px-3 py-2 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
          >
            <option value="all">{t.common.all}</option>
            <option value="research">{t.nav.research}</option>
            <option value="culture">{t.nav.culture}</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
          >
            <option value="all">{t.research.allCategories}</option>
            {t.research.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AdSlot slotKey="researchFeed" />

      {/* Publications Grid */}
      {visibleArticles.length === 0 ? (
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-12 text-center space-y-3">
          <p className="text-sm text-[#475569]">{t.research.noArticles}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleArticles.map((art) => {
            const isSaved = bookmarks.some(
              (b) => b.itemId === art.id && b.itemType === 'research'
            );
            return (
              <article
                key={art.id}
                className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#C68B1C] transition-colors"
              >
                <div>
                  {art.coverImageUrl && (
                    <img
                      src={art.coverImageUrl}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover border-b border-[#E5E4DF]"
                    />
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <span>
                        {t.research.categories.find((c) => c.value === art.category)?.label ||
                          art.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{art.publicationDate}</span>
                      {art.status !== 'approved' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#C68B1C]">
                            {art.status === 'pending'
                              ? t.research.pendingModeration
                              : t.research.rejected}
                          </span>
                        </>
                      )}
                    </div>

                    <h2
                      onClick={() => setActiveArticle(art)}
                      className="text-lg font-semibold text-[#16222E] hover:text-[#1D3A5F] cursor-pointer"
                    >
                      {art.title}
                    </h2>

                    <p className="text-sm text-[#475569] line-clamp-3 leading-relaxed">
                      {art.abstract}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E4DF] bg-[#FAFAF8] flex items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => openAuthorProfile(art.authorUid)}
                    className="inline-flex items-center gap-1.5 font-medium text-[#1D3A5F] hover:underline truncate"
                  >
                    <UserIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{art.authorName}</span>
                  </button>

                  <div className="flex items-center gap-3 text-[#64748B] shrink-0 tabular-nums">
                    <span>♥ {art.likesCount || 0}</span>
                    <span>💬 {art.commentsCount || 0}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(art)}
                      aria-label={t.lessons.bookmark}
                      className="hover:text-[#16222E]"
                    >
                      {isSaved ? (
                        <Check className="w-3.5 h-3.5 text-[#1B6B50]" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Article Reader & Discussion Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E4DF] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between gap-4">
              <div className="text-xs text-[#64748B] flex items-center gap-2">
                <span>
                  {t.research.categories.find((c) => c.value === activeArticle.category)?.label ||
                    activeArticle.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeArticle.publicationDate}</span>
              </div>
              <div className="flex items-center gap-2">
                {firebaseUser?.uid === activeArticle.authorUid && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeArticle;
                      setActiveArticle(null);
                      openPublishModal(target);
                    }}
                    className="px-3 py-1.5 text-xs font-medium border border-[#D6D3CB] rounded-lg hover:bg-[#FAFAF8]"
                  >
                    {t.common.edit}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F4F3EF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="space-y-3 max-w-3xl">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#16222E]">
                  {activeArticle.title}
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569] pb-4 border-b border-[#E5E4DF]">
                  <button
                    type="button"
                    onClick={() => openAuthorProfile(activeArticle.authorUid)}
                    className="font-semibold text-[#1D3A5F] hover:underline"
                  >
                    Author: {activeArticle.authorName} (Intellectual Property Protected)
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(activeArticle)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        likedIds[activeArticle.id]
                          ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                          : 'border-[#D6D3CB] text-[#475569] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span className="tabular-nums">
                        {t.research.like} ({activeArticle.likesCount || 0})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `${activeArticle.authorName} (${activeArticle.publicationDate}). "${activeArticle.title}". Berghazi Platform.`
                        );
                        setCopiedId(activeArticle.id);
                        setTimeout(() => setCopiedId(null), 1800);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D6D3CB] text-xs font-medium text-[#475569] hover:bg-[#FAFAF8]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>
                        {copiedId === activeArticle.id
                          ? t.research.copiedLink
                          : t.research.share}
                      </span>
                    </button>
                    {firebaseUser && (
                      <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D6D3CB] text-xs text-[#9A3412] hover:bg-[#FAFAF8]"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{t.research.report}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {activeArticle.coverImageUrl && (
                <img
                  src={activeArticle.coverImageUrl}
                  alt={activeArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-80 object-cover rounded-xl border border-[#E5E4DF]"
                />
              )}

              <div className="bg-[#FAFAF8] border border-[#E5E4DF] rounded-xl p-5 space-y-2 max-w-3xl">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  {t.research.abstract}
                </h3>
                <p className="text-sm text-[#16222E] leading-relaxed">{activeArticle.abstract}</p>
              </div>

              <div className="prose max-w-3xl text-[#16222E] text-base leading-relaxed whitespace-pre-line">
                {activeArticle.content}
              </div>

              {activeArticle.attachmentUrl && (
                <div className="border border-[#E5E4DF] rounded-xl p-4 flex items-center justify-between gap-4 max-w-3xl">
                  <div className="text-sm font-medium text-[#16222E] truncate">
                    {activeArticle.attachmentName || 'Research Attachment'}
                  </div>
                  <a
                    href={activeArticle.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.lessons.downloadFile}</span>
                  </a>
                </div>
              )}

              {activeArticle.referencesText && (
                <div className="border-t border-[#E5E4DF] pt-4 space-y-2 max-w-3xl">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    {t.research.references}
                  </h3>
                  <p className="text-xs text-[#475569] whitespace-pre-line leading-relaxed">
                    {activeArticle.referencesText}
                  </p>
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-[#E5E4DF] pt-6 space-y-4 max-w-3xl">
                <h3 className="text-base font-semibold text-[#16222E] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#C68B1C]" />
                  <span>
                    {t.research.comments} ({comments.length})
                  </span>
                </h3>

                {firebaseUser ? (
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t.research.addComment}
                      className="flex-1 px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
                    >
                      {t.research.postComment}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="text-xs font-semibold text-[#1D3A5F] hover:underline"
                  >
                    {t.auth.signIn}
                  </button>
                )}

                <div className="space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#FAFAF8] border border-[#E5E4DF] rounded-lg p-3.5 space-y-1"
                    >
                      <div className="text-xs font-semibold text-[#16222E]">{c.authorName}</div>
                      <p className="text-sm text-[#475569]">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && activeArticle && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="bg-white border border-[#E5E4DF] rounded-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#16222E]">{t.research.report}</h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            >
              <option value="Inaccurate or unverified sources">Inaccurate or unverified sources</option>
              <option value="Plagiarism or intellectual property concern">
                Plagiarism / IP concern
              </option>
              <option value="Inappropriate content">Inappropriate content</option>
            </select>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />
            {reportMsg && <div className="text-xs text-[#1B6B50] font-medium">{reportMsg}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-3 py-2 text-xs border border-[#D6D3CB] rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#9A3412] rounded-lg"
              >
                {t.research.report}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Author Public Profile Modal */}
      {authorModalProfile && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E4DF] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#16222E]">
                  {authorModalProfile.displayName}
                </h3>
                <div className="text-xs text-[#C68B1C] font-medium">
                  {t.auth.roleLabels[authorModalProfile.role]}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthorModalProfile(null)}
                className="p-1 rounded hover:bg-[#F4F3EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {authorModalProfile.institution && (
              <div className="text-xs text-[#475569]">
                Institution: {authorModalProfile.institution}
              </div>
            )}
            <p className="text-sm text-[#475569] leading-relaxed">
              {authorModalProfile.bio || 'Berghazi academic community contributor.'}
            </p>
          </div>
        </div>
      )}

      {/* Submit / Edit Research Modal */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishSubmit}
            className="bg-white border border-[#E5E4DF] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-3">
              <h3 className="text-lg font-semibold text-[#16222E]">
                {editingArticle ? t.common.edit : t.research.submitResearch}
              </h3>
              <button
                type="button"
                onClick={() => setPublishOpen(false)}
                className="p-1 rounded hover:bg-[#F4F3EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as 'research' | 'culture')}
                className="px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              >
                <option value="research">{t.nav.research}</option>
                <option value="culture">{t.nav.culture}</option>
              </select>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              >
                {t.research.categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={formLang}
                onChange={(e) => setFormLang(e.target.value as LanguageCode)}
                className="px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
              >
                <option value="zgh">ⵜⴰⵎⴰⵣⵉⵖⵜ</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Publication Title"
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />

            <textarea
              rows={2}
              required
              value={formAbstract}
              onChange={(e) => setFormAbstract(e.target.value)}
              placeholder={t.research.abstract}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />

            <textarea
              rows={6}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Full research paper or cultural article body..."
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />

            <textarea
              rows={2}
              value={formRefs}
              onChange={(e) => setFormRefs(e.target.value)}
              placeholder={t.research.references}
              className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block border border-dashed border-[#D6D3CB] rounded-lg p-3 cursor-pointer hover:bg-[#FAFAF8]">
                <span className="font-semibold text-[#16222E] block mb-1">
                  Cover Image (optional)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAttachmentUpload(f, 'cover');
                  }}
                  className="text-xs"
                />
                {formCoverUrl && <span className="text-[#1B6B50] block mt-1">Cover uploaded</span>}
              </label>

              <label className="block border border-dashed border-[#D6D3CB] rounded-lg p-3 cursor-pointer hover:bg-[#FAFAF8]">
                <span className="font-semibold text-[#16222E] block mb-1">
                  PDF / Word Attachment (optional)
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAttachmentUpload(f, 'research');
                  }}
                  className="text-xs"
                />
                {formAttachmentName && (
                  <span className="text-[#1B6B50] block mt-1 truncate">{formAttachmentName}</span>
                )}
              </label>
            </div>

            {publishError && <div className="text-xs text-[#9A3412]">{publishError}</div>}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#64748B]">
                {canAutoApprove
                  ? 'Published directly under authorized account.'
                  : 'Submitted for administrative review before publication.'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPublishOpen(false)}
                  className="px-4 py-2 text-xs border border-[#D6D3CB] rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
                >
                  {t.research.submitResearch}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
