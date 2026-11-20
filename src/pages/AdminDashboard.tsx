import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  Database,
  DollarSign,
  FileText,
  FlaskConical,
  Globe,
  Inbox,
  Layout,
  Megaphone,
  Pencil,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, MAIN_ADMIN_EMAIL, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import {
  AccessTier,
  AdsSettings,
  AnalyticsSummary,
  AssistantPermissions,
  AuditLogRecord,
  ContentReport,
  CurrencyCode,
  DocumentTemplateRecord,
  DocumentTemplateType,
  FirestoreAnalyticsDaily,
  LessonRecord,
  MonetizationSettings,
  SiteAppearanceSettings,
  TransactionRecord,
  UserProfile,
  UserRole,
} from '../types';

type AdminTabId =
  | 'overview'
  | 'lessons'
  | 'documents'
  | 'research'
  | 'users'
  | 'ads'
  | 'monetization'
  | 'analytics'
  | 'appearance'
  | 'translations'
  | 'notifications'
  | 'logs'
  | 'backup';

const PERMISSION_KEYS: { key: keyof AssistantPermissions; label: string }[] = [
  { key: 'manageLessons', label: 'Manage Lessons (6 Pathways)' },
  { key: 'manageDocuments', label: 'Manage Document Templates' },
  { key: 'manageResearch', label: 'Moderate Research & Articles' },
  { key: 'manageUsers', label: 'Manage Members' },
  { key: 'manageAds', label: 'Manage Advertising' },
  { key: 'manageMonetization', label: 'Manage Monetization & Plans' },
  { key: 'viewAnalytics', label: 'View Analytics' },
  { key: 'manageDesign', label: 'Manage Website Design' },
  { key: 'manageTranslations', label: 'Manage Multilingual Copy' },
  { key: 'publishDirectly', label: 'Publish Articles Without Review' },
];

export const AdminDashboard: React.FC = () => {
  const {
    t,
    language,
    firebaseUser,
    userProfile,
    isMainAdmin,
    hasPermission,
    lessons,
    templates,
    articles,
    pathways,
    roles,
    plans,
    adsSettings,
    siteSettings,
    monetizationSettings,
    uploadFile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingPathwayNum, setEditingPathwayNum] = useState<number | null>(null);
  const [pathwayTitleEn, setPathwayTitleEn] = useState('');
  const [pathwayTitleAr, setPathwayTitleAr] = useState('');
  const [pathwayTitleZgh, setPathwayTitleZgh] = useState('');

  // Collections loaded for Admin
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [contactMessages, setContactMessages] = useState<
    { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string }[]
  >([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [firestoreAnalytics, setFirestoreAnalytics] = useState<FirestoreAnalyticsDaily[]>([]);

  // Lesson Upload / Edit Form State
  const [editingLesson, setEditingLesson] = useState<LessonRecord | null>(null);
  const [lessonPathway, setLessonPathway] = useState(1);
  const [lessonLevel, setLessonLevel] = useState('level_1');
  const [lessonStage, setLessonStage] = useState(1);
  const [lessonWeek, setLessonWeek] = useState(1);
  const [lessonPart, setLessonPart] = useState(1);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonTier, setLessonTier] = useState<AccessTier>('public_free');
  const [lessonPrice, setLessonPrice] = useState(0);
  const [lessonAllowDownload, setLessonAllowDownload] = useState(true);
  const [lessonPublished, setLessonPublished] = useState(true);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [uploadingLesson, setUploadingLesson] = useState(false);

  // Document Template Upload / Edit Form State
  const [editingTpl, setEditingTpl] = useState<DocumentTemplateRecord | null>(null);
  const [tplType, setTplType] = useState<DocumentTemplateType>('mind_map');
  const [tplPathway, setTplPathway] = useState(1);
  const [tplLevel, setTplLevel] = useState('level_1');
  const [tplWeek, setTplWeek] = useState(1);
  const [tplPart, setTplPart] = useState(1);
  const [tplTitle, setTplTitle] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplTier, setTplTier] = useState<AccessTier>('public_free');
  const [tplPrice, setTplPrice] = useState(0);
  const [tplPublished, setTplPublished] = useState(true);
  const [tplFile, setTplFile] = useState<File | null>(null);
  const [uploadingTpl, setUploadingTpl] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  // Plan Creation State
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(49);
  const [planCurrency, setPlanCurrency] = useState<CurrencyCode>('MAD');
  const [planCycle, setPlanCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [planFeaturesText, setPlanFeaturesText] = useState('Exclusive educational materials\nAdvanced document templates\nPriority research tools');
  const [planStorageMb, setPlanStorageMb] = useState(500);

  // Settings Editable Copies
  const [adsDraft, setAdsDraft] = useState<AdsSettings>(adsSettings);
  const [siteDraft, setSiteDraft] = useState<SiteAppearanceSettings>(siteSettings);
  const [monDraft, setMonDraft] = useState<MonetizationSettings>(monetizationSettings);

  useEffect(() => {
    setAdsDraft(adsSettings);
  }, [adsSettings]);
  useEffect(() => {
    setSiteDraft(siteSettings);
  }, [siteSettings]);
  useEffect(() => {
    setMonDraft(monetizationSettings);
  }, [monetizationSettings]);

  const canEnterAdmin = isMainAdmin || userProfile?.role === 'assistant_admin';

  const logAudit = async (action: string, targetType: string, targetId: string, details: string) => {
    if (!firebaseUser || !userProfile) return;
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'audit_logs', logId), {
        actorUid: firebaseUser.uid,
        actorEmail: userProfile.email,
        action,
        targetType,
        targetId,
        details,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (!canEnterAdmin || !firebaseUser) return;

    const unsubs: (() => void)[] = [];

    if (isMainAdmin || hasPermission('manageUsers')) {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );
    }

    if (isMainAdmin || hasPermission('manageResearch')) {
      unsubs.push(
        onSnapshot(
          collection(db, 'reports'),
          (snap) => {
            setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContentReport, 'id'>) })));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
        )
      );
    }

    if (isMainAdmin || hasPermission('manageMonetization')) {
      unsubs.push(
        onSnapshot(
          collection(db, 'transactions'),
          (snap) => {
            setTransactions(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TransactionRecord, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
        )
      );
    }

    if (isMainAdmin || hasPermission('viewAnalytics')) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'analytics'), orderBy('date', 'desc')),
          (snap) => {
            setFirestoreAnalytics(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FirestoreAnalyticsDaily, 'id'>) })).slice(0, 14)
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'analytics')
        )
      );
    }

    if (isMainAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')),
          (snap) => {
            setAuditLogs(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogRecord, 'id'>) })).slice(0, 100)
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );
    }

    // Load Analytics & Contact Inbox via verified backend endpoints
    firebaseUser.getIdToken().then((token) => {
      if (isMainAdmin || hasPermission('viewAnalytics')) {
        fetch('/api/analytics/summary', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then(async (data: AnalyticsSummary | null) => {
            if (data) {
              setAnalytics(data);
              // Sync real server daily analytics counters into Firestore 'analytics' collection
              for (const day of (data.dailySeries || []).slice(-7)) {
                if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day.date)) {
                  try {
                    await setDoc(doc(db, 'analytics', day.date), {
                      date: day.date,
                      pageViews: day.pageViews || 0,
                      downloads: day.downloads || 0,
                      adImpressions: day.adImpressions || 0,
                      updatedAt: serverTimestamp(),
                    });
                  } catch {
                    // Non-blocking sync
                  }
                }
              }
            }
          })
          .catch(() => {});
      }
      if (isMainAdmin || hasPermission('manageUsers')) {
        fetch('/api/contact', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.messages) setContactMessages(data.messages);
          })
          .catch(() => {});
      }
    });

    return () => unsubs.forEach((u) => u());
  }, [canEnterAdmin, firebaseUser, isMainAdmin, hasPermission]);

  if (!canEnterAdmin || !firebaseUser || !userProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <Shield className="w-10 h-10 text-[#9A3412] mx-auto" />
        <h1 className="text-xl font-semibold text-[#16222E]">Administrator Access Required</h1>
        <p className="text-sm text-[#475569]">
          This administrative panel is restricted strictly to the Main Administrator and explicitly authorized Assistant Administrators.
        </p>
      </div>
    );
  }

  const notify = (msg: string) => {
    setErrorMessage('');
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const fail = (err: unknown) => {
    setStatusMessage('');
    setErrorMessage(err instanceof Error ? err.message : String(err));
  };

  const resetLessonForm = () => {
    setEditingLesson(null);
    setLessonStage(1);
    setLessonTitle('');
    setLessonDesc('');
    setLessonPrice(0);
    setLessonAllowDownload(true);
    setLessonPublished(true);
    setLessonFile(null);
  };

  // Upload or Update/Replace Official Lesson
  const handleCreateOrUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) {
      return fail(new Error('Lesson title is required.'));
    }
    if (!editingLesson && !lessonFile) {
      return fail(new Error('Lesson file is required when uploading a new lesson.'));
    }
    setUploadingLesson(true);
    try {
      const safeTitle = lessonTitle.trim().slice(0, 200);
      const safeDesc = lessonDesc.trim().slice(0, 2000);
      const uploaded = lessonFile ? await uploadFile(lessonFile, 'lesson') : null;

      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), {
          pathway: lessonPathway,
          level: lessonLevel,
          stage: lessonStage,
          week: lessonWeek,
          part: lessonPart,
          title: safeTitle,
          description: safeDesc,
          fileUrl: uploaded ? uploaded.url : editingLesson.fileUrl,
          fileName: uploaded ? uploaded.fileName : editingLesson.fileName,
          fileFormat: uploaded ? uploaded.format : editingLesson.fileFormat,
          fileSize: uploaded ? uploaded.size : (editingLesson.fileSize ?? 0),
          accessTier: lessonTier,
          price: lessonTier === 'paid_single' ? Number(lessonPrice) : 0,
          currency: monDraft.defaultCurrency || 'MAD',
          allowDownload: lessonAllowDownload,
          isPublished: lessonPublished,
          updatedAt: serverTimestamp(),
        });
        await logAudit(
          uploaded ? 'REPLACE_LESSON' : 'UPDATE_LESSON',
          'lesson',
          editingLesson.id,
          `Pathway ${lessonPathway} · Stage ${lessonStage} - ${safeTitle}`
        );
        resetLessonForm();
        notify('Official lesson updated successfully.');
      } else if (uploaded) {
        const lessonId = `les_p${lessonPathway}_${lessonLevel}_s${lessonStage}_w${lessonWeek}_${lessonPart}_${Date.now()}`;
        await setDoc(doc(db, 'lessons', lessonId), {
          pathway: lessonPathway,
          level: lessonLevel,
          stage: lessonStage,
          week: lessonWeek,
          part: lessonPart,
          title: safeTitle,
          description: safeDesc,
          fileUrl: uploaded.url,
          fileName: uploaded.fileName.slice(0, 255),
          fileFormat: uploaded.format,
          fileSize: uploaded.size,
          accessTier: lessonTier,
          price: lessonTier === 'paid_single' ? Number(lessonPrice) : 0,
          currency: monDraft.defaultCurrency || 'MAD',
          allowDownload: lessonAllowDownload,
          isPublished: lessonPublished,
          downloadCount: 0,
          uploadedByUid: firebaseUser.uid,
          uploadedByName: (userProfile.displayName || firebaseUser.email || 'Administrator').slice(0, 120),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logAudit('UPLOAD_LESSON', 'lesson', lessonId, `Pathway ${lessonPathway} · Stage ${lessonStage} - ${safeTitle}`);
        resetLessonForm();
        notify('Official lesson uploaded successfully.');
      }
    } catch (err) {
      fail(err);
    } finally {
      setUploadingLesson(false);
    }
  };

  const resetTemplateForm = () => {
    setEditingTpl(null);
    setTplTitle('');
    setTplDesc('');
    setTplPrice(0);
    setTplPublished(true);
    setTplFile(null);
  };

  // Upload or Update/Replace Educational Document Template
  const handleCreateOrUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim()) {
      return fail(new Error('Template title is required.'));
    }
    if (!editingTpl && !tplFile) {
      return fail(new Error('Template file is required when uploading a new template.'));
    }
    setUploadingTpl(true);
    try {
      const safeTitle = tplTitle.trim().slice(0, 200);
      const safeDesc = tplDesc.trim().slice(0, 2000);
      const uploaded = tplFile ? await uploadFile(tplFile, 'template') : null;
      let safeFormat = editingTpl?.templateFormat || 'png';
      if (uploaded) {
        const ext = uploaded.fileName.split('.').pop()?.toLowerCase() || 'png';
        safeFormat = (
          ['png', 'jpg', 'svg', 'pdf', 'docx', 'pptx'].includes(ext)
            ? ext
            : ext === 'jpeg'
            ? 'jpg'
            : 'pdf'
        ) as DocumentTemplateRecord['templateFormat'];
      }

      if (editingTpl) {
        await updateDoc(doc(db, 'documents', editingTpl.id), {
          docType: tplType,
          pathway: tplPathway,
          level: tplType === 'annual_distribution' ? 'all' : tplLevel,
          week: tplType === 'mind_map' ? tplWeek : 0,
          part: tplType === 'mind_map' ? tplPart : 0,
          title: safeTitle,
          description: safeDesc,
          templateFileUrl: uploaded ? uploaded.url : editingTpl.templateFileUrl,
          templateFileName: uploaded ? uploaded.fileName.slice(0, 255) : editingTpl.templateFileName,
          templateFormat: safeFormat,
          accessTier: tplTier,
          price: tplTier === 'paid_single' ? Number(tplPrice) : 0,
          currency: monDraft.defaultCurrency || 'MAD',
          isPublished: tplPublished,
          updatedAt: serverTimestamp(),
        });
        await logAudit(
          uploaded ? 'REPLACE_TEMPLATE' : 'UPDATE_TEMPLATE',
          'documents',
          editingTpl.id,
          `${tplType} - ${safeTitle}`
        );
        resetTemplateForm();
        notify('Document template updated successfully.');
      } else if (uploaded) {
        const tplId = `tpl_${tplType}_p${tplPathway}_${Date.now()}`;
        await setDoc(doc(db, 'documents', tplId), {
          docType: tplType,
          pathway: tplPathway,
          level: tplType === 'annual_distribution' ? 'all' : tplLevel,
          week: tplType === 'mind_map' ? tplWeek : 0,
          part: tplType === 'mind_map' ? tplPart : 0,
          title: safeTitle,
          description: safeDesc,
          templateFileUrl: uploaded.url,
          templateFileName: uploaded.fileName.slice(0, 255),
          templateFormat: safeFormat,
          accessTier: tplTier,
          price: tplTier === 'paid_single' ? Number(tplPrice) : 0,
          currency: monDraft.defaultCurrency || 'MAD',
          isPublished: tplPublished,
          downloadCount: 0,
          uploadedByUid: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logAudit('UPLOAD_TEMPLATE', 'documents', tplId, `${tplType} - ${safeTitle}`);
        resetTemplateForm();
        notify('Document template uploaded successfully.');
      }
    } catch (err) {
      fail(err);
    } finally {
      setUploadingTpl(false);
    }
  };

  const handleUpdateUserRole = async (
    targetUser: UserProfile,
    newRole: UserRole,
    newPerms?: AssistantPermissions,
    newSuspended?: boolean
  ) => {
    if (targetUser.email === MAIN_ADMIN_EMAIL && newRole !== 'main_admin') {
      return fail(new Error('Main Administrator ownership cannot be transferred or downgraded.'));
    }
    try {
      const userUpdates: Record<string, unknown> = {
        role: newRole,
        isSuspended: newSuspended ?? targetUser.isSuspended,
        updatedAt: serverTimestamp(),
      };
      // Only Main Administrator can alter granular assistant/writer permissions per firestore.rules
      if (isMainAdmin) {
        userUpdates.permissions = newPerms ?? targetUser.permissions ?? {};
      }
      await updateDoc(doc(db, 'users', targetUser.uid), userUpdates);
      await updateDoc(doc(db, 'public_profiles', targetUser.uid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      await logAudit(
        'UPDATE_USER_RBAC',
        'user',
        targetUser.uid,
        `Role: ${newRole}, Suspended: ${Boolean(newSuspended ?? targetUser.isSuspended)}`
      );
      notify(`Updated permissions for ${targetUser.displayName}.`);
    } catch (err) {
      fail(err);
    }
  };

  const handleSaveSetting = async (settingKey: string, payload: unknown) => {
    try {
      await setDoc(doc(db, 'platform_settings', settingKey), {
        key: settingKey,
        isPublic: true,
        data: payload,
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE_SETTING', 'platform_settings', settingKey, 'Updated configuration');
      notify('Platform configuration saved.');
    } catch (err) {
      fail(err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    const planId = `plan_${Date.now()}`;
    try {
      await setDoc(doc(db, 'subscription_plans', planId), {
        name: planName.trim(),
        price: Number(planPrice),
        currency: planCurrency,
        billingCycle: planCycle,
        features: planFeaturesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 15),
        storageLimitMb: Number(planStorageMb),
        isActive: true,
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE_PLAN', 'subscription_plan', planId, planName);
      setPlanName('');
      notify('Subscription plan created.');
    } catch (err) {
      fail(err);
    }
  };

  const handleApproveTransaction = async (tx: TransactionRecord, status: 'completed' | 'failed') => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status,
      });
      if (status === 'completed' && tx.itemType === 'subscription') {
        await updateDoc(doc(db, 'users', tx.userUid), {
          subscriptionTier: 'premium',
          updatedAt: serverTimestamp(),
        });
      }
      await logAudit('UPDATE_TRANSACTION', 'transaction', tx.id, `Status: ${status}`);
      notify(`Transaction marked as ${status}.`);
    } catch (err) {
      fail(err);
    }
  };

  const handleSavePathwayTitle = async (num: number) => {
    if (!isMainAdmin) return;
    try {
      await setDoc(
        doc(db, 'pathways', `pathway_${num}`),
        {
          number: num,
          titleEn: pathwayTitleEn.trim() || `Pathway ${num}`,
          titleAr: pathwayTitleAr.trim() || `المسار التعليمي ${num}`,
          titleZgh: pathwayTitleZgh.trim() || `ⴰⴱⵔⵉⴷ ${num}`,
          description: `Independent Amazigh educational pathway ${num} supporting levels 1-6, weeks 1-6, and parts 1-2.`,
          levels: ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6'],
          weeksCount: 6,
          partsCount: 2,
          isActive: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await logAudit('UPDATE_PATHWAY', 'pathways', `pathway_${num}`, pathwayTitleEn.trim());
      setEditingPathwayNum(null);
      notify(`Updated Pathway ${num} metadata.`);
    } catch (err) {
      fail(err);
    }
  };

  const handleContactStatus = async (msgId: string, status: 'read' | 'replied') => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/contact/${encodeURIComponent(msgId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update message status.');
      setContactMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status } : m))
      );
      notify(`Message marked as ${status}.`);
    } catch (err) {
      fail(err);
    }
  };

  const handleExportBackup = async () => {
    try {
      const collectionsToBackup = isMainAdmin
        ? [
            'roles',
            'pathways',
            'lessons',
            'documents',
            'research',
            'research_comments',
            'analytics',
            'subscription_plans',
            'platform_settings',
            'users',
            'public_profiles',
            'transactions',
            'reports',
            'audit_logs',
          ]
        : [
            'roles',
            'pathways',
            'lessons',
            'documents',
            'research',
            'analytics',
            'subscription_plans',
            'platform_settings',
          ];
      const snapshotData: Record<string, unknown[]> = {};
      for (const colName of collectionsToBackup) {
        const s = await getDocs(collection(db, colName));
        snapshotData[colName] = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), platform: 'Berghazi', data: snapshotData }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `berghazi_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logAudit('EXPORT_BACKUP', 'system', 'backup', 'Full JSON backup exported');
      notify('Full platform backup exported.');
    } catch (err) {
      fail(err);
    }
  };

  const handleRestoreBackup = async (file: File) => {
    if (!isMainAdmin) return;
    setRestoringBackup(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { platform?: string; data?: Record<string, Record<string, unknown>[]> };
      if (parsed.platform !== 'Berghazi' || !parsed.data || typeof parsed.data !== 'object') {
        throw new Error('Invalid Berghazi backup file format.');
      }
      let restoredCount = 0;
      const restorable = ['roles', 'pathways', 'subscription_plans', 'platform_settings'] as const;
      for (const colName of restorable) {
        const rows = parsed.data[colName];
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
          const { id, ...rest } = row;
          if (typeof id !== 'string' || !id) continue;
          await setDoc(doc(db, colName, id), {
            ...rest,
            updatedAt: serverTimestamp(),
          });
          restoredCount += 1;
        }
      }
      await logAudit('RESTORE_BACKUP', 'system', 'backup', `Restored ${restoredCount} configuration records`);
      notify(`Restored ${restoredCount} configuration records from backup.`);
    } catch (err) {
      fail(err);
    } finally {
      setRestoringBackup(false);
    }
  };

  const completedRevenue = transactions
    .filter((tx) => tx.status === 'completed')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const pendingResearch = articles.filter((a) => a.status === 'pending');

  const navItems: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }>; visible: boolean }[] = [
    { id: 'overview', label: t.admin.tabs.overview, icon: Layout, visible: true },
    { id: 'lessons', label: t.admin.tabs.lessons, icon: BookOpen, visible: isMainAdmin || hasPermission('manageLessons') },
    { id: 'documents', label: t.admin.tabs.documents, icon: FileText, visible: isMainAdmin || hasPermission('manageDocuments') },
    { id: 'research', label: t.admin.tabs.research, icon: FlaskConical, visible: isMainAdmin || hasPermission('manageResearch') },
    { id: 'users', label: t.admin.tabs.users, icon: Users, visible: isMainAdmin || hasPermission('manageUsers') },
    { id: 'ads', label: t.admin.tabs.ads, icon: Megaphone, visible: isMainAdmin || hasPermission('manageAds') },
    { id: 'monetization', label: t.admin.tabs.monetization, icon: DollarSign, visible: isMainAdmin || hasPermission('manageMonetization') },
    { id: 'analytics', label: t.admin.tabs.analytics, icon: BarChart3, visible: isMainAdmin || hasPermission('viewAnalytics') },
    { id: 'appearance', label: t.admin.tabs.appearance, icon: Layout, visible: isMainAdmin || hasPermission('manageDesign') },
    { id: 'translations', label: t.admin.tabs.translations, icon: Globe, visible: isMainAdmin || hasPermission('manageTranslations') },
    { id: 'notifications', label: t.admin.tabs.notifications, icon: Inbox, visible: isMainAdmin || hasPermission('manageUsers') || hasPermission('manageResearch') },
    { id: 'logs', label: t.admin.tabs.logs, icon: Activity, visible: isMainAdmin },
    { id: 'backup', label: t.admin.tabs.backup, icon: Database, visible: isMainAdmin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="bg-[#16222E] text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-[#E5AD44] font-semibold">
            {isMainAdmin ? t.auth.roleLabels.main_admin : t.auth.roleLabels.assistant_admin} ·{' '}
            {userProfile.email}
          </div>
          <h1 className="text-2xl font-semibold">{t.admin.title}</h1>
          <p className="text-xs text-slate-300">{t.admin.subtitle}</p>
        </div>
      </header>

      {statusMessage && (
        <div className="bg-[#ECFDF5] border border-[#1B6B50]/30 text-[#1B6B50] px-4 py-3 rounded-lg text-xs font-medium">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-[#FEF2F2] border border-[#9A3412]/30 text-[#9A3412] px-4 py-3 rounded-lg text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-[#E5E4DF] rounded-xl p-3 space-y-1">
          {navItems
            .filter((i) => i.visible)
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-start ${
                    active
                      ? 'bg-[#1D3A5F] text-white font-semibold'
                      : 'text-[#475569] hover:bg-[#FAFAF8] hover:text-[#16222E]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </aside>

        {/* Main Admin Canvas */}
        <main className="lg:col-span-9 space-y-6">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5">
                  <div className="text-xs text-[#64748B]">Uploaded Lessons</div>
                  <div className="text-2xl font-bold text-[#16222E] tabular-nums mt-1">
                    {lessons.length}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5">
                  <div className="text-xs text-[#64748B]">Document Templates</div>
                  <div className="text-2xl font-bold text-[#16222E] tabular-nums mt-1">
                    {templates.length}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5">
                  <div className="text-xs text-[#64748B]">Pending Research</div>
                  <div className="text-2xl font-bold text-[#C68B1C] tabular-nums mt-1">
                    {pendingResearch.length}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5">
                  <div className="text-xs text-[#64748B]">Verified Revenue</div>
                  <div className="text-2xl font-bold text-[#1B6B50] tabular-nums mt-1">
                    {completedRevenue.toFixed(2)} {monDraft.defaultCurrency}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-3">
                <h2 className="text-base font-semibold text-[#16222E]">
                  Six Educational Pathways Coverage
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((p) => {
                    const pw = pathways.find((item) => item.number === p);
                    const pwLabel = pw
                      ? language === 'zgh'
                        ? pw.titleZgh
                        : language === 'ar'
                        ? pw.titleAr
                        : pw.titleEn
                      : `Pathway ${p}`;
                    return (
                      <div
                        key={p}
                        className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] flex items-center justify-between text-xs gap-2"
                      >
                        <span className="font-semibold text-[#16222E] truncate">{pwLabel}</span>
                        <span className="font-mono-num text-[#1D3A5F] shrink-0">
                          {lessons.filter((l) => l.pathway === p).length} lessons
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. LESSON MANAGEMENT */}
          {activeTab === 'lessons' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateOrUpdateLesson}
                className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#16222E]">
                    {editingLesson
                      ? `Edit / Replace Lesson: ${editingLesson.title}`
                      : 'Upload Official Lesson (Pathways 1–6)'}
                  </h2>
                  {editingLesson && (
                    <button
                      type="button"
                      onClick={resetLessonForm}
                      className="text-xs font-medium text-[#9A3412] hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#475569] mb-1">Track (ⴰⵙⴰⴽⴰ)</label>
                    <select
                      value={lessonPathway}
                      onChange={(e) => setLessonPathway(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6].map((p) => (
                        <option key={p} value={p}>
                          ⴰⵙⴰⴽⴰ {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#475569] mb-1">Stage (ⵜⵉⴽⵍⵉ)</label>
                    <select
                      value={lessonStage}
                      onChange={(e) => setLessonStage(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <option key={s} value={s}>
                          ⵜⵉⴽⵍⵉ {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#475569] mb-1">Week (ⵉⵎⴰⵍⴰⵙⵙ)</label>
                    <select
                      value={lessonWeek}
                      onChange={(e) => setLessonWeek(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6].map((w) => (
                        <option key={w} value={w}>
                          ⵉⵎⴰⵍⴰⵙⵙ {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#475569] mb-1">Part (ⴰⴳⵣⵣⵓⵎ)</label>
                    <select
                      value={lessonPart}
                      onChange={(e) => setLessonPart(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      <option value={1}>ⴰⴳⵣⵣⵓⵎ 1</option>
                      <option value={2}>ⴰⴳⵣⵣⵓⵎ 2</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Official Lesson Title"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                />
                <textarea
                  rows={2}
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  placeholder="Optional description or pedagogical notes..."
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <select
                    value={lessonTier}
                    onChange={(e) => setLessonTier(e.target.value as AccessTier)}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="public_free">Public (Free)</option>
                    <option value="registered_free">Registered Members Only (Free)</option>
                    <option value="premium_only">Premium Subscription Only</option>
                    <option value="paid_single">Paid Single Resource</option>
                  </select>
                  {lessonTier === 'paid_single' && (
                    <input
                      type="number"
                      min={0}
                      value={lessonPrice}
                      onChange={(e) => setLessonPrice(Number(e.target.value))}
                      placeholder="Price"
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg">
                    <input
                      type="checkbox"
                      checked={lessonAllowDownload}
                      onChange={(e) => setLessonAllowDownload(e.target.checked)}
                    />
                    <span>Allow File Download</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg">
                    <input
                      type="checkbox"
                      checked={lessonPublished}
                      onChange={(e) => setLessonPublished(e.target.checked)}
                    />
                    <span>Published</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept=".pdf,.pptx,.ppt,.docx,.doc,.png,.jpg,.jpeg,.svg,.webp"
                      onChange={(e) => setLessonFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    {editingLesson && !lessonFile && (
                      <div className="text-[11px] text-[#64748B]">
                        Current file: {editingLesson.fileName} (leave blank to keep)
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingLesson}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingLesson
                        ? 'Saving...'
                        : editingLesson
                        ? 'Save / Replace Lesson'
                        : 'Publish Official Lesson'}
                    </span>
                  </button>
                </div>
              </form>

              <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                    <tr>
                      <th className="py-3 px-4 text-start">Title</th>
                      <th className="py-3 px-4 text-start">Track / Stage / Week</th>
                      <th className="py-3 px-4 text-start">Format</th>
                      <th className="py-3 px-4 text-end">Downloads</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {lessons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#64748B]">
                          Lesson library is currently empty.
                        </td>
                      </tr>
                    ) : (
                      lessons.map((l) => (
                        <tr key={l.id}>
                          <td className="py-3 px-4 font-medium text-[#16222E]">
                            {l.title}
                            {!l.isPublished && (
                              <span className="ms-2 text-[10px] text-[#9A3412] font-semibold">
                                (Draft)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#475569]">
                            T{l.pathway} · S{l.stage ?? 1} · W{l.week} · Pt{l.part}
                          </td>
                          <td className="py-3 px-4 uppercase">{l.fileFormat}</td>
                          <td className="py-3 px-4 text-end tabular-nums">{l.downloadCount || 0}</td>
                          <td className="py-3 px-4 text-end space-x-1">
                            <button
                              type="button"
                              aria-label="Edit lesson"
                              onClick={() => {
                                setEditingLesson(l);
                                setLessonPathway(l.pathway);
                                setLessonLevel(l.level);
                                setLessonStage(l.stage ?? 1);
                                setLessonWeek(l.week);
                                setLessonPart(l.part);
                                setLessonTitle(l.title);
                                setLessonDesc(l.description || '');
                                setLessonTier(l.accessTier);
                                setLessonPrice(l.price || 0);
                                setLessonAllowDownload(l.allowDownload);
                                setLessonPublished(l.isPublished);
                                setLessonFile(null);
                              }}
                              className="p-1.5 text-[#1D3A5F] hover:bg-[#FAFAF8] rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete lesson"
                              onClick={async () => {
                                await deleteDoc(doc(db, 'lessons', l.id));
                                await logAudit('DELETE_LESSON', 'lesson', l.id, l.title);
                                if (editingLesson?.id === l.id) resetLessonForm();
                                notify('Lesson deleted.');
                              }}
                              className="p-1.5 text-[#9A3412] hover:bg-[#FAFAF8] rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-[#16222E]">
                  Pathways Structure (Firestore `pathways`)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const pw = pathways.find((p) => p.number === num);
                    const isEditing = editingPathwayNum === num;
                    return (
                      <div
                        key={num}
                        className="p-3.5 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] space-y-2"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={pathwayTitleZgh}
                              onChange={(e) => setPathwayTitleZgh(e.target.value)}
                              placeholder="Tifinagh Title"
                              className="w-full px-2 py-1 bg-white border border-[#D6D3CB] rounded font-tifinagh"
                            />
                            <input
                              type="text"
                              dir="rtl"
                              value={pathwayTitleAr}
                              onChange={(e) => setPathwayTitleAr(e.target.value)}
                              placeholder="Arabic Title"
                              className="w-full px-2 py-1 bg-white border border-[#D6D3CB] rounded"
                            />
                            <input
                              type="text"
                              value={pathwayTitleEn}
                              onChange={(e) => setPathwayTitleEn(e.target.value)}
                              placeholder="English Title"
                              className="w-full px-2 py-1 bg-white border border-[#D6D3CB] rounded"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSavePathwayTitle(num)}
                                className="px-2.5 py-1 bg-[#1D3A5F] text-white rounded font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPathwayNum(null)}
                                className="px-2.5 py-1 border border-[#D6D3CB] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#16222E]">
                                {pw?.titleEn || `Pathway ${num}`}
                              </span>
                              {isMainAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPathwayNum(num);
                                    setPathwayTitleEn(pw?.titleEn || `Pathway ${num}`);
                                    setPathwayTitleAr(pw?.titleAr || `المسار التعليمي ${num}`);
                                    setPathwayTitleZgh(pw?.titleZgh || `ⴰⴱⵔⵉⴷ ${num}`);
                                  }}
                                  className="text-[#1D3A5F] hover:underline font-medium"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            <div className="text-[#64748B] truncate font-tifinagh">
                              {pw?.titleZgh || `ⴰⴱⵔⵉⴷ ${num}`} · {pw?.titleAr || `المسار التعليمي ${num}`}
                            </div>
                            <div className="text-[#475569] tabular-nums">
                              6 Stages · 6 Weeks · 2 Parts · {lessons.filter((l) => l.pathway === num).length} lessons
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. EDUCATIONAL DOCUMENT TEMPLATES */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateOrUpdateTemplate}
                className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#16222E]">
                    {editingTpl
                      ? `Edit / Replace Template: ${editingTpl.title}`
                      : 'Upload Original Document Template'}
                  </h2>
                  {editingTpl && (
                    <button
                      type="button"
                      onClick={resetTemplateForm}
                      className="text-xs font-medium text-[#9A3412] hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <select
                    value={tplType}
                    onChange={(e) => setTplType(e.target.value as DocumentTemplateType)}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="mind_map">Mind Map Template</option>
                    <option value="annual_distribution">Annual Distribution Template</option>
                    <option value="periodic_distribution">Periodic Distribution Template</option>
                  </select>
                  <select
                    value={tplPathway}
                    onChange={(e) => setTplPathway(Number(e.target.value))}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6].map((p) => (
                      <option key={p} value={p}>
                        Pathway {p}
                      </option>
                    ))}
                  </select>
                  {tplType !== 'annual_distribution' && (
                    <select
                      value={tplLevel}
                      onChange={(e) => setTplLevel(e.target.value)}
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {t.lessons.levels.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {tplType === 'mind_map' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <select
                      value={tplWeek}
                      onChange={(e) => setTplWeek(Number(e.target.value))}
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6].map((w) => (
                        <option key={w} value={w}>
                          Week {w}
                        </option>
                      ))}
                    </select>
                    <select
                      value={tplPart}
                      onChange={(e) => setTplPart(Number(e.target.value))}
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    >
                      <option value={1}>Part 1</option>
                      <option value={2}>Part 2</option>
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  placeholder="Template Title"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                />
                <textarea
                  rows={2}
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  placeholder="Optional instructions for teachers..."
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <select
                    value={tplTier}
                    onChange={(e) => setTplTier(e.target.value as AccessTier)}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="public_free">Public Free</option>
                    <option value="registered_free">Registered Free</option>
                    <option value="premium_only">Premium Only</option>
                    <option value="paid_single">Paid Template</option>
                  </select>
                  {tplTier === 'paid_single' && (
                    <input
                      type="number"
                      min={0}
                      value={tplPrice}
                      onChange={(e) => setTplPrice(Number(e.target.value))}
                      placeholder="Price"
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg">
                    <input
                      type="checkbox"
                      checked={tplPublished}
                      onChange={(e) => setTplPublished(e.target.checked)}
                    />
                    <span>Published</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.pdf,.docx,.pptx"
                      onChange={(e) => setTplFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    {editingTpl && !tplFile && (
                      <div className="text-[11px] text-[#64748B]">
                        Current file: {editingTpl.templateFileName} (leave blank to keep)
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingTpl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E] disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingTpl
                        ? 'Saving...'
                        : editingTpl
                        ? 'Save / Replace Template'
                        : 'Upload Template'}
                    </span>
                  </button>
                </div>
              </form>

              <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                    <tr>
                      <th className="py-3 px-4 text-start">Title</th>
                      <th className="py-3 px-4 text-start">Type</th>
                      <th className="py-3 px-4 text-start">Mapping</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#64748B]">
                          No document templates uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      templates.map((tpl) => (
                        <tr key={tpl.id}>
                          <td className="py-3 px-4 font-medium text-[#16222E]">
                            {tpl.title}
                            {!tpl.isPublished && (
                              <span className="ms-2 text-[10px] text-[#9A3412] font-semibold">
                                (Draft)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">{tpl.docType}</td>
                          <td className="py-3 px-4">
                            P{tpl.pathway} · {tpl.level}
                            {tpl.docType === 'mind_map' ? ` · W${tpl.week} Pt${tpl.part}` : ''}
                          </td>
                          <td className="py-3 px-4 text-end space-x-1">
                            <button
                              type="button"
                              aria-label="Edit template"
                              onClick={() => {
                                setEditingTpl(tpl);
                                setTplType(tpl.docType);
                                setTplPathway(tpl.pathway);
                                setTplLevel(tpl.level === 'all' ? 'level_1' : tpl.level);
                                setTplWeek(tpl.week || 1);
                                setTplPart(tpl.part || 1);
                                setTplTitle(tpl.title);
                                setTplDesc(tpl.description || '');
                                setTplTier(tpl.accessTier);
                                setTplPrice(tpl.price || 0);
                                setTplPublished(tpl.isPublished);
                                setTplFile(null);
                              }}
                              className="p-1.5 text-[#1D3A5F] hover:bg-[#FAFAF8] rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete template"
                              onClick={async () => {
                                await deleteDoc(doc(db, 'documents', tpl.id));
                                await logAudit('DELETE_TEMPLATE', 'documents', tpl.id, tpl.title);
                                if (editingTpl?.id === tpl.id) resetTemplateForm();
                                notify('Template deleted.');
                              }}
                              className="p-1.5 text-[#9A3412] hover:bg-[#FAFAF8] rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. RESEARCH MODERATION */}
          {activeTab === 'research' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl divide-y divide-[#E5E4DF]">
              {articles.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#64748B]">
                  No research submissions in the queue.
                </div>
              ) : (
                articles.map((art) => (
                  <div key={art.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        <span className="font-semibold uppercase text-[#1D3A5F]">{art.status}</span>
                        <span>·</span>
                        <span>{art.authorName}</span>
                        <span>·</span>
                        <span>{art.category}</span>
                      </div>
                      <h3 className="text-base font-semibold text-[#16222E]">{art.title}</h3>
                      <p className="text-xs text-[#475569]">{art.abstract}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {art.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateDoc(doc(db, 'research', art.id), {
                              status: 'approved',
                              updatedAt: serverTimestamp(),
                            });
                            await logAudit('APPROVE_RESEARCH', 'research', art.id, art.title);
                            notify('Publication approved.');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1B6B50] rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                      {art.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateDoc(doc(db, 'research', art.id), {
                              status: 'rejected',
                              updatedAt: serverTimestamp(),
                            });
                            await logAudit('REJECT_RESEARCH', 'research', art.id, art.title);
                            notify('Publication rejected.');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#9A3412] border border-[#9A3412]/40 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDoc(doc(db, 'research', art.id));
                          await logAudit('DELETE_RESEARCH', 'research', art.id, art.title);
                          notify('Publication deleted.');
                        }}
                        className="p-1.5 text-[#9A3412]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. USERS & RBAC */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {roles.length > 0 && (
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-[#16222E]">
                    RBAC Roles Directory (Firestore `roles`)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                    {roles.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] space-y-1"
                      >
                        <div className="font-semibold text-[#16222E]">{r.labelEn}</div>
                        <div className="text-[#C68B1C] font-tifinagh">{r.labelZgh}</div>
                        <div className="text-[#64748B]">{r.labelAr}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allUsers.map((u) => {
                const isOwnerAccount = u.email === MAIN_ADMIN_EMAIL;
                return (
                  <div
                    key={u.uid}
                    className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-[#16222E]">{u.displayName}</div>
                        <div className="text-xs text-[#64748B]">{u.email}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isOwnerAccount ? (
                          <span className="text-xs font-semibold text-[#C68B1C]">
                            Main Administrator (Protected Owner)
                          </span>
                        ) : (
                          <>
                            <select
                              value={u.role}
                              disabled={!isMainAdmin && ['main_admin', 'assistant_admin'].includes(u.role)}
                              onChange={(e) =>
                                handleUpdateUserRole(u, e.target.value as UserRole)
                              }
                              className="px-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                            >
                              {isMainAdmin && (
                                <option value="assistant_admin">Assistant Administrator</option>
                              )}
                              <option value="page_writer">Page Writer</option>
                              <option value="permanent_member">Permanent Member</option>
                              <option value="ordinary_member">Ordinary Member</option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateUserRole(u, u.role, u.permissions, !u.isSuspended)
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                                u.isSuspended
                                  ? 'bg-[#1B6B50] text-white border-[#1B6B50]'
                                  : 'text-[#9A3412] border-[#9A3412]/40'
                              }`}
                            >
                              {u.isSuspended ? 'Restore Account' : 'Suspend Account'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isMainAdmin &&
                      (u.role === 'assistant_admin' || u.role === 'page_writer') && (
                        <div className="pt-3 border-t border-[#E5E4DF] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {PERMISSION_KEYS.map((pk) => {
                            if (u.role === 'page_writer' && pk.key !== 'publishDirectly') {
                              return null;
                            }
                            const checked = Boolean(u.permissions?.[pk.key]);
                            return (
                              <label
                                key={pk.key}
                                className="flex items-center gap-2 p-2 rounded bg-[#FAFAF8] border border-[#E5E4DF]"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const nextPerms = {
                                      ...(u.permissions || {}),
                                      [pk.key]: e.target.checked,
                                    };
                                    handleUpdateUserRole(u, u.role, nextPerms);
                                  }}
                                />
                                <span>{pk.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 6. ADVERTISING */}
          {activeTab === 'ads' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-[#16222E]">
                Advertising &amp; Google AdSense Configuration
              </h2>
              <label className="flex items-center gap-2 text-sm font-medium text-[#16222E]">
                <input
                  type="checkbox"
                  checked={adsDraft.adsEnabled}
                  onChange={(e) => setAdsDraft({ ...adsDraft, adsEnabled: e.target.checked })}
                />
                <span>Enable Public Advertising Placements</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-[#475569] mb-1">
                    Google AdSense Publisher ID (ca-pub-...)
                  </label>
                  <input
                    type="text"
                    value={adsDraft.adsensePublisherId}
                    onChange={(e) =>
                      setAdsDraft({ ...adsDraft, adsensePublisherId: e.target.value })
                    }
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">
                    Authorized Network Name
                  </label>
                  <input
                    type="text"
                    value={adsDraft.customNetworkName}
                    onChange={(e) =>
                      setAdsDraft({ ...adsDraft, customNetworkName: e.target.value })
                    }
                    placeholder="Google AdSense"
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E5E4DF] text-xs">
                {(
                  [
                    { key: 'homepageBanner', label: 'Homepage Banner Slot' },
                    { key: 'lessonsSidebar', label: 'Lessons Sidebar Slot' },
                    { key: 'researchFeed', label: 'Research Feed Slot' },
                    { key: 'cultureArticle', label: 'Culture Heritage Slot' },
                  ] as const
                ).map((s) => (
                  <div key={s.key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <label className="flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={adsDraft.slots[s.key].enabled}
                        onChange={(e) =>
                          setAdsDraft({
                            ...adsDraft,
                            slots: {
                              ...adsDraft.slots,
                              [s.key]: { ...adsDraft.slots[s.key], enabled: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>{s.label}</span>
                    </label>
                    <input
                      type="text"
                      value={adsDraft.slots[s.key].slotId}
                      onChange={(e) =>
                        setAdsDraft({
                          ...adsDraft,
                          slots: {
                            ...adsDraft.slots,
                            [s.key]: { ...adsDraft.slots[s.key], slotId: e.target.value },
                          },
                        })
                      }
                      placeholder="Ad Unit Slot ID"
                      className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSaveSetting('ads_config', adsDraft)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
              >
                Save Advertising Settings
              </button>
            </div>
          )}

          {/* 7. MONETIZATION & PLANS */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-[#16222E]">
                  Payment Gateway &amp; Currency Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <select
                    value={monDraft.activeGateway}
                    onChange={(e) =>
                      setMonDraft({
                        ...monDraft,
                        activeGateway: e.target.value as MonetizationSettings['activeGateway'],
                      })
                    }
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="none">Manual / Pending Invoice</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="cmi">CMI Morocco</option>
                  </select>
                  <select
                    value={monDraft.defaultCurrency}
                    onChange={(e) =>
                      setMonDraft({
                        ...monDraft,
                        defaultCurrency: e.target.value as CurrencyCode,
                      })
                    }
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="MAD">MAD (Moroccan Dirham)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="text"
                    value={monDraft.stripePublishableKey}
                    onChange={(e) =>
                      setMonDraft({ ...monDraft, stripePublishableKey: e.target.value })
                    }
                    placeholder="Stripe Publishable Key (pk_live_...)"
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                  <input
                    type="text"
                    value={monDraft.paypalClientId}
                    onChange={(e) => setMonDraft({ ...monDraft, paypalClientId: e.target.value })}
                    placeholder="PayPal Client ID"
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={monDraft.paymentsEnabled}
                    onChange={(e) =>
                      setMonDraft({ ...monDraft, paymentsEnabled: e.target.checked })
                    }
                  />
                  <span>Activate Online Checkout Provider</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSaveSetting('monetization_config', monDraft)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
                >
                  Save Monetization Config
                </button>
              </div>

              <form
                onSubmit={handleCreatePlan}
                className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4"
              >
                <h2 className="text-base font-semibold text-[#16222E]">
                  Create Premium Membership Plan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Plan Name (e.g. Educator Pro)"
                    className="sm:col-span-2 px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                  <input
                    type="number"
                    min={0}
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                  <select
                    value={planCycle}
                    onChange={(e) =>
                      setPlanCycle(e.target.value as 'monthly' | 'yearly' | 'lifetime')
                    }
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <select
                    value={planCurrency}
                    onChange={(e) => setPlanCurrency(e.target.value as CurrencyCode)}
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  >
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="number"
                    min={50}
                    value={planStorageMb}
                    onChange={(e) => setPlanStorageMb(Number(e.target.value))}
                    placeholder="Storage Limit MB"
                    className="px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <textarea
                  rows={3}
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  placeholder="One feature per line"
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                />
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
                >
                  Publish Plan
                </button>
              </form>

              {plans.length > 0 && (
                <div className="bg-white border border-[#E5E4DF] rounded-xl divide-y divide-[#E5E4DF]">
                  {plans.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#16222E]">{p.name}</span> ·{' '}
                        <span className="tabular-nums">
                          {p.price} {p.currency} / {p.billingCycle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteDoc(doc(db, 'subscription_plans', p.id))}
                        className="text-[#9A3412]"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
                <div className="px-5 py-3 border-b border-[#E5E4DF] text-xs font-semibold text-[#16222E]">
                  Transactions Ledger
                </div>
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                    <tr>
                      <th className="py-2.5 px-4 text-start">Member</th>
                      <th className="py-2.5 px-4 text-start">Item</th>
                      <th className="py-2.5 px-4 text-end">Amount</th>
                      <th className="py-2.5 px-4 text-start">Status</th>
                      <th className="py-2.5 px-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#64748B]">
                          No transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2.5 px-4">{tx.userEmail}</td>
                          <td className="py-2.5 px-4">{tx.itemTitle}</td>
                          <td className="py-2.5 px-4 text-end tabular-nums">
                            {tx.amount} {tx.currency}
                          </td>
                          <td className="py-2.5 px-4 capitalize font-semibold">{tx.status}</td>
                          <td className="py-2.5 px-4 text-end space-x-2">
                            {tx.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveTransaction(tx, 'completed')}
                                  className="text-[#1B6B50] font-semibold"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveTransaction(tx, 'failed')}
                                  className="text-[#9A3412] font-semibold"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. ANALYTICS & REVENUE */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Total Visitors</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics?.totalVisitors ?? 0}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Daily Visitors</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics?.dailyVisitors ?? 0}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Monthly Visitors</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics?.monthlyVisitors ?? 0}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Registered Members</div>
                  <div className="text-xl font-bold tabular-nums mt-1">{allUsers.length}</div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Ad Impressions</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics?.totalAdImpressions ?? 0}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
                  <div className="text-[11px] text-[#64748B]">Completed Revenue</div>
                  <div className="text-xl font-bold text-[#1B6B50] tabular-nums mt-1">
                    {completedRevenue.toFixed(2)} {monDraft.defaultCurrency}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-[#16222E]">Most Visited Pages</h3>
                  {(analytics?.topPages || []).map((p) => (
                    <div key={p.page} className="flex justify-between text-xs border-b border-[#F4F3EF] pb-2">
                      <span className="capitalize font-medium">{p.page}</span>
                      <span className="font-mono-num">{p.views} views</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-[#16222E]">
                    Most Downloaded Resources
                  </h3>
                  {(analytics?.topResources || []).length === 0 ? (
                    <p className="text-xs text-[#64748B]">No resource downloads recorded yet.</p>
                  ) : (
                    analytics!.topResources.map((r) => (
                      <div key={r.id} className="flex justify-between text-xs border-b border-[#F4F3EF] pb-2">
                        <span className="truncate max-w-[200px]">{r.title}</span>
                        <span className="font-mono-num">{r.downloads} ↓</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
                <div className="px-5 py-3 border-b border-[#E5E4DF] text-xs font-semibold text-[#16222E]">
                  Daily Firestore Analytics Ledger (`analytics` collection)
                </div>
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                    <tr>
                      <th className="py-2.5 px-4 text-start">Date</th>
                      <th className="py-2.5 px-4 text-end">Page Views</th>
                      <th className="py-2.5 px-4 text-end">Downloads</th>
                      <th className="py-2.5 px-4 text-end">Ad Impressions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {firestoreAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#64748B]">
                          No daily Firestore analytics entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      firestoreAnalytics.map((row) => (
                        <tr key={row.id}>
                          <td className="py-2.5 px-4 font-mono-num">{row.date}</td>
                          <td className="py-2.5 px-4 text-end tabular-nums">{row.pageViews}</td>
                          <td className="py-2.5 px-4 text-end tabular-nums">{row.downloads}</td>
                          <td className="py-2.5 px-4 text-end tabular-nums">{row.adImpressions}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#FAFAF8] border border-[#E5E4DF] rounded-xl p-4 text-xs text-[#475569]">
                Advertising revenue is reported strictly from connected AdSense / ad provider APIs when configured (`{adsDraft.adsensePublisherId || 'Not connected'}`). No estimated or synthetic revenue figures are generated.
              </div>
            </div>
          )}

          {/* 9. APPEARANCE & DESIGN */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#16222E]">
                Website Identity &amp; Contact Configuration
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[#475569] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={siteDraft.contactEmail}
                    onChange={(e) => setSiteDraft({ ...siteDraft, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={siteDraft.socialLinks.facebook}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        socialLinks: { ...siteDraft.socialLinks, facebook: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">YouTube URL</label>
                  <input
                    type="text"
                    value={siteDraft.socialLinks.youtube}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        socialLinks: { ...siteDraft.socialLinks, youtube: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={siteDraft.socialLinks.instagram}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        socialLinks: { ...siteDraft.socialLinks, instagram: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveSetting('site_config', siteDraft)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
              >
                Save Design &amp; Identity Settings
              </button>
            </div>
          )}

          {/* 10. MULTILINGUAL CONTENT MANAGEMENT */}
          {activeTab === 'translations' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#16222E]">
                Multilingual Welcome Copy (Tifinagh, Arabic, English)
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#475569] mb-1">
                    Amazigh Welcome (ⵜⴰⵎⴰⵣⵉⵖⵜ)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.welcomeZgh}
                    onChange={(e) => setSiteDraft({ ...siteDraft, welcomeZgh: e.target.value })}
                    className="w-full px-3 py-2 font-tifinagh bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">
                    Arabic Welcome (العربية)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={siteDraft.welcomeAr}
                    onChange={(e) => setSiteDraft({ ...siteDraft, welcomeAr: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#475569] mb-1">English Welcome</label>
                  <input
                    type="text"
                    value={siteDraft.welcomeEn}
                    onChange={(e) => setSiteDraft({ ...siteDraft, welcomeEn: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveSetting('site_config', siteDraft)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg"
              >
                Save Multilingual Settings
              </button>
            </div>
          )}

          {/* 11. NOTIFICATIONS, INBOX & REPORTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#16222E]">
                  Moderation Reports ({reports.length})
                </h2>
                {reports.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No content reports submitted.</p>
                ) : (
                  reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#16222E]">
                          {r.articleTitle || r.articleId}
                        </div>
                        <div className="text-[#475569]">
                          {r.reason} · Status: {r.status}
                        </div>
                      </div>
                      {r.status === 'open' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateDoc(doc(db, 'reports', r.id), { status: 'resolved' })
                            }
                            className="text-[#1B6B50] font-semibold"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateDoc(doc(db, 'reports', r.id), { status: 'dismissed' })
                            }
                            className="text-[#64748B]"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#16222E]">
                  Contact Form Messages ({contactMessages.length})
                </h2>
                {contactMessages.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No contact messages received yet.</p>
                ) : (
                  contactMessages.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-lg bg-[#FAFAF8] border border-[#E5E4DF] space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#16222E]">{m.subject}</span>
                        <span className="text-[#64748B]">
                          {m.name} ({m.email}) · <span className="uppercase">{m.status}</span>
                        </span>
                      </div>
                      <p className="text-[#475569]">{m.message}</p>
                      <div className="flex gap-3 pt-1">
                        {m.status === 'unread' && (
                          <button
                            type="button"
                            onClick={() => handleContactStatus(m.id, 'read')}
                            className="text-[#1D3A5F] font-semibold hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                        {m.status !== 'replied' && (
                          <button
                            type="button"
                            onClick={() => handleContactStatus(m.id, 'replied')}
                            className="text-[#1B6B50] font-semibold hover:underline"
                          >
                            Mark Replied
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 12. SECURITY & AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[#FAFAF8] border-b border-[#E5E4DF] text-[#64748B]">
                  <tr>
                    <th className="py-3 px-4 text-start">Actor</th>
                    <th className="py-3 px-4 text-start">Action</th>
                    <th className="py-3 px-4 text-start">Target</th>
                    <th className="py-3 px-4 text-start">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4DF]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#64748B]">
                        No administrative actions logged yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-4">{l.actorEmail}</td>
                        <td className="py-2.5 px-4 font-mono">{l.action}</td>
                        <td className="py-2.5 px-4">{l.targetType}</td>
                        <td className="py-2.5 px-4 text-[#475569]">{l.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 13. BACKUP & RESTORATION */}
          {activeTab === 'backup' && (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-[#16222E]">
                  Platform Backup &amp; Restoration
                </h2>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Export a full JSON snapshot containing roles, pathways, official lessons metadata, document templates, research publications, subscription plans, analytics, user permissions, and audit logs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1D3A5F] rounded-lg hover:bg-[#16222E]"
                >
                  Download Full Platform Backup (JSON)
                </button>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#16222E] bg-[#FAFAF8] border border-[#D6D3CB] rounded-lg cursor-pointer hover:bg-[#F4F3EF]">
                  <span>{restoringBackup ? 'Restoring...' : 'Restore Configuration from Backup JSON'}</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    disabled={restoringBackup}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleRestoreBackup(f);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
