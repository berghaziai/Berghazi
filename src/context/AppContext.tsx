import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  MAIN_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  testFirestoreConnection,
} from '../lib/firebase';
import { translations, TranslationBundle } from '../i18n/translations';
import {
  AdsSettings,
  BookmarkItem,
  DocumentTemplateRecord,
  LanguageCode,
  LessonRecord,
  MonetizationSettings,
  PageId,
  PathwayRecord,
  ResearchArticle,
  RoleDefinition,
  SiteAppearanceSettings,
  SubscriptionPlan,
  UserProfile,
} from '../types';

interface AppContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationBundle;
  isRtl: boolean;
  activePage: PageId;
  navigate: (page: PageId) => void;
  firebaseUser: User | null;
  authReady: boolean;
  userProfile: UserProfile | null;
  isMainAdmin: boolean;
  isAssistantAdmin: boolean;
  hasPermission: (perm: keyof UserProfile['permissions']) => boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  uploadFile: (
    file: File,
    purpose: 'lesson' | 'template' | 'research' | 'cover' | 'avatar'
  ) => Promise<{ url: string; fileName: string; size: number; format: 'pdf' | 'pptx' | 'docx' | 'image' | 'other' }>;
  lessons: LessonRecord[];
  templates: DocumentTemplateRecord[];
  articles: ResearchArticle[];
  pathways: PathwayRecord[];
  roles: RoleDefinition[];
  plans: SubscriptionPlan[];
  bookmarks: BookmarkItem[];
  adsSettings: AdsSettings;
  siteSettings: SiteAppearanceSettings;
  monetizationSettings: MonetizationSettings;
  trackDownload: (resourceId: string, title: string, type: 'lesson' | 'document') => Promise<void>;
  trackAdImpression: (slotId: string, clicked?: boolean) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const DEFAULT_ADS_SETTINGS: AdsSettings = {
  adsEnabled: false,
  adsensePublisherId: '',
  customNetworkName: '',
  slots: {
    homepageBanner: { enabled: false, slotId: '' },
    lessonsSidebar: { enabled: false, slotId: '' },
    researchFeed: { enabled: false, slotId: '' },
    cultureArticle: { enabled: false, slotId: '' },
  },
  privacyConsentRequired: true,
};

const DEFAULT_SITE_SETTINGS: SiteAppearanceSettings = {
  welcomeZgh: 'ⴰⵣⵓⵍ ⴼⵍⵍⴰⵡⵏ ⴳ ⴱⵔⵖⴰⵣⵉ',
  welcomeAr: 'أهلاً بكم في منصة برغازي الأمازيغية',
  welcomeEn: 'Welcome to Berghazi Amazigh Educational Platform',
  accentColor: '#C68B1C',
  showHeritageGuide: true,
  contactEmail: 'berghazi9@gmail.com',
  socialLinks: {
    facebook: '',
    youtube: '',
    instagram: '',
    x: '',
  },
};

const DEFAULT_MONETIZATION_SETTINGS: MonetizationSettings = {
  activeGateway: 'none',
  stripePublishableKey: '',
  paypalClientId: '',
  cmiMerchantId: '',
  defaultCurrency: 'MAD',
  paymentsEnabled: false,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('berghazi_lang');
    return saved === 'zgh' || saved === 'ar' || saved === 'en' ? saved : 'en';
  });
  const [activePage, setActivePage] = useState<PageId>('home');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([]);
  const [articles, setArticles] = useState<ResearchArticle[]>([]);
  const [pathways, setPathways] = useState<PathwayRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(DEFAULT_ADS_SETTINGS);
  const [siteSettings, setSiteSettings] = useState<SiteAppearanceSettings>(DEFAULT_SITE_SETTINGS);
  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings>(
    DEFAULT_MONETIZATION_SETTINGS
  );

  const isRtl = language === 'ar';

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('berghazi_lang', lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Privacy-conscious visitor analytics (recorded server-side; admins sync daily ledger to Firestore)
  const navigate = useCallback((page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let visitorId = sessionStorage.getItem('berghazi_vid');
    if (!visitorId) {
      visitorId = `v_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('berghazi_vid', visitorId);
    }
    fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, visitorId }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    testFirestoreConnection();
    let visitorId = sessionStorage.getItem('berghazi_vid');
    if (!visitorId) {
      visitorId = `v_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('berghazi_vid', visitorId);
    }
    fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'home', visitorId }),
    }).catch(() => {});
  }, []);

  const syncUserProfile = useCallback(async (fbUser: User) => {
    const userRef = doc(db, 'users', fbUser.uid);
    const pubRef = doc(db, 'public_profiles', fbUser.uid);
    try {
      const snap = await getDoc(userRef);
      const isOwnerEmail = fbUser.email === MAIN_ADMIN_EMAIL && fbUser.emailVerified;
      if (!snap.exists()) {
        const safeName = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Member').slice(0, 120);
        const safePhoto = (fbUser.photoURL || '').slice(0, 500);
        const initialProfile: UserProfile = {
          uid: fbUser.uid,
          email: (fbUser.email || '').slice(0, 200),
          displayName: safeName,
          photoURL: safePhoto,
          role: isOwnerEmail ? 'main_admin' : 'ordinary_member',
          permissions: {},
          schoolName: '',
          institution: '',
          academicYear: '2026-2027',
          city: '',
          bio: '',
          subscriptionTier: 'free',
          isSuspended: false,
          preferredLanguage: 'en',
        };
        await setDoc(userRef, {
          ...initialProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(pubRef, {
          uid: fbUser.uid,
          displayName: initialProfile.displayName,
          role: initialProfile.role,
          institution: '',
          bio: '',
          photoURL: safePhoto,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setUserProfile(initialProfile);
      } else {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        const pubSnap = await getDoc(pubRef);
        if (!pubSnap.exists()) {
          await setDoc(pubRef, {
            uid: fbUser.uid,
            displayName: data.displayName || fbUser.displayName || 'Member',
            role: data.role,
            institution: data.institution || '',
            bio: data.bio || '',
            photoURL: data.photoURL || fbUser.photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncUserProfile(user).catch((e) => {
          setAuthError(e instanceof Error ? e.message : 'Failed to synchronize account profile.');
        });
      } else {
        setUserProfile(null);
        setBookmarks([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [syncUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    }
  }, [firebaseUser]);

  const isMainAdmin = Boolean(
    firebaseUser?.email === MAIN_ADMIN_EMAIL && firebaseUser?.emailVerified
  ) || userProfile?.role === 'main_admin';

  const isAssistantAdmin = userProfile?.role === 'assistant_admin' && !userProfile?.isSuspended;

  const hasPermission = useCallback(
    (perm: keyof UserProfile['permissions']) => {
      if (isMainAdmin) return true;
      if (!userProfile || userProfile.isSuspended) return false;
      if (userProfile.role === 'assistant_admin') {
        return Boolean(userProfile.permissions?.[perm]);
      }
      if (userProfile.role === 'page_writer' && perm === 'publishDirectly') {
        return Boolean(userProfile.permissions?.publishDirectly);
      }
      return false;
    },
    [isMainAdmin, userProfile]
  );

  // Public & authenticated Firestore subscriptions
  useEffect(() => {
    if (!authReady) return;

    const lessonQuery = isMainAdmin || hasPermission('manageLessons')
      ? query(collection(db, 'lessons'))
      : query(collection(db, 'lessons'), where('isPublished', '==', true));

    const unsubLessons = onSnapshot(
      lessonQuery,
      (snap) => {
        setLessons(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LessonRecord, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'lessons')
    );

    const templateQuery = isMainAdmin || hasPermission('manageDocuments')
      ? query(collection(db, 'documents'))
      : query(collection(db, 'documents'), where('isPublished', '==', true));

    const unsubTemplates = onSnapshot(
      templateQuery,
      (snap) => {
        setTemplates(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentTemplateRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'documents')
    );

    const isModerator = isMainAdmin || hasPermission('manageResearch');
    let publicArticles: ResearchArticle[] = [];
    let ownArticles: ResearchArticle[] = [];

    const mergeArticles = () => {
      const byId = new Map<string, ResearchArticle>();
      for (const a of publicArticles) byId.set(a.id, a);
      for (const a of ownArticles) byId.set(a.id, a);
      setArticles(Array.from(byId.values()));
    };

    const articleQuery = isModerator
      ? query(collection(db, 'research'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'research'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );

    let unsubFallback: (() => void) | null = null;
    const unsubArticles = onSnapshot(
      articleQuery,
      (snap) => {
        publicArticles = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ResearchArticle, 'id'>),
        }));
        mergeArticles();
      },
      () => {
        const fallbackQuery = isModerator
          ? query(collection(db, 'research'))
          : query(collection(db, 'research'), where('status', '==', 'approved'));
        unsubFallback = onSnapshot(
          fallbackQuery,
          (s) => {
            publicArticles = s.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ResearchArticle, 'id'>),
            }));
            mergeArticles();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'research')
        );
      }
    );

    let unsubOwnArticles: (() => void) | null = null;
    if (!isModerator && firebaseUser) {
      unsubOwnArticles = onSnapshot(
        query(collection(db, 'research'), where('authorUid', '==', firebaseUser.uid)),
        (snap) => {
          ownArticles = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ResearchArticle, 'id'>),
          }));
          mergeArticles();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'research')
      );
    }

    const unsubPathways = onSnapshot(
      query(collection(db, 'pathways'), where('isActive', '==', true)),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PathwayRecord, 'id'>) }))
          .sort((a, b) => a.number - b.number);
        setPathways(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'pathways')
    );

    const unsubRoles = onSnapshot(
      collection(db, 'roles'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as RoleDefinition)
          .sort((a, b) => a.rank - b.rank);
        setRoles(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'roles')
    );

    const planQuery = isMainAdmin || hasPermission('manageMonetization')
      ? query(collection(db, 'subscription_plans'))
      : query(collection(db, 'subscription_plans'), where('isActive', '==', true));

    const unsubPlans = onSnapshot(
      planQuery,
      (snap) => {
        setPlans(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'subscription_plans')
    );

    const settingsQuery = query(collection(db, 'platform_settings'), where('isPublic', '==', true));
    const unsubSettings = onSnapshot(
      settingsQuery,
      (snap) => {
        snap.docs.forEach((d) => {
          const payload = d.data() as { key: string; data: Record<string, unknown> };
          if (payload.key === 'ads_config') {
            setAdsSettings({ ...DEFAULT_ADS_SETTINGS, ...(payload.data as unknown as AdsSettings) });
          } else if (payload.key === 'site_config') {
            setSiteSettings({
              ...DEFAULT_SITE_SETTINGS,
              ...(payload.data as unknown as SiteAppearanceSettings),
            });
          } else if (payload.key === 'monetization_config') {
            setMonetizationSettings({
              ...DEFAULT_MONETIZATION_SETTINGS,
              ...(payload.data as unknown as MonetizationSettings),
            });
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'platform_settings')
    );

    return () => {
      unsubLessons();
      unsubTemplates();
      unsubArticles();
      if (unsubFallback) unsubFallback();
      if (unsubOwnArticles) unsubOwnArticles();
      unsubPathways();
      unsubRoles();
      unsubPlans();
      unsubSettings();
    };
  }, [authReady, firebaseUser, isMainAdmin, hasPermission]);

  // Bootstrap structural 'roles' and 'pathways' metadata once when Main Admin signs in (no preloaded lessons)
  useEffect(() => {
    if (!authReady || !firebaseUser || !isMainAdmin) return;
    (async () => {
      try {
        const rolesSnap = await getDocs(collection(db, 'roles'));
        if (rolesSnap.empty) {
          const defaultRoles: Omit<RoleDefinition, 'updatedAt'>[] = [
            {
              id: 'main_admin',
              labelEn: 'Main Administrator',
              labelAr: 'المدير العام',
              labelZgh: 'ⴰⵏⵎⵀⴰⵍ ⴰⵎⵇⵔⴰⵏ',
              description: 'Full platform ownership and security governance.',
              rank: 1,
              defaultPermissions: {
                manageLessons: true,
                manageDocuments: true,
                manageResearch: true,
                manageUsers: true,
                manageAds: true,
                manageMonetization: true,
                viewAnalytics: true,
                manageDesign: true,
                manageTranslations: true,
                publishDirectly: true,
              },
            },
            {
              id: 'assistant_admin',
              labelEn: 'Assistant Administrator',
              labelAr: 'مساعد إداري',
              labelZgh: 'ⴰⵎⴰⵡⴰⵙ ⵏ ⵓⵙⵡⵓⴷⴷⵓ',
              description: 'Delegated administrative capabilities configured by Main Admin.',
              rank: 2,
              defaultPermissions: {},
            },
            {
              id: 'page_writer',
              labelEn: 'Page Writer',
              labelAr: 'محرر محتوى',
              labelZgh: 'ⴰⵎⴰⵔⴰ ⵏ ⵜⵙⵏⴰ',
              description: 'Authorized academic and cultural writer.',
              rank: 3,
              defaultPermissions: { publishDirectly: false },
            },
            {
              id: 'permanent_member',
              labelEn: 'Permanent Member',
              labelAr: 'عضو دائم',
              labelZgh: 'ⴰⴳⵎⴰⵎ ⴰⵎⵖⵍⴰⵍ',
              description: 'Active researcher and community contributor subject to moderation.',
              rank: 4,
              defaultPermissions: {},
            },
            {
              id: 'ordinary_member',
              labelEn: 'Ordinary Member',
              labelAr: 'عضو عادي',
              labelZgh: 'ⴰⴳⵎⴰⵎ',
              description: 'Registered learner or educator.',
              rank: 5,
              defaultPermissions: {},
            },
          ];
          for (const r of defaultRoles) {
            await setDoc(doc(db, 'roles', r.id), { ...r, updatedAt: serverTimestamp() });
          }
        }

        const pathwaysSnap = await getDocs(collection(db, 'pathways'));
        if (pathwaysSnap.empty) {
          for (let num = 1; num <= 6; num++) {
            await setDoc(doc(db, 'pathways', `pathway_${num}`), {
              number: num,
              titleEn: `Pathway ${num}`,
              titleAr: `المسار التعليمي ${num}`,
              titleZgh: `ⴰⴱⵔⵉⴷ ${num}`,
              description: `Independent Amazigh educational pathway ${num} supporting levels 1-6, weeks 1-6, and parts 1-2.`,
              levels: ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6'],
              weeksCount: 6,
              partsCount: 2,
              isActive: true,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch {
        // Non-blocking initialization check
      }
    })();
  }, [authReady, firebaseUser, isMainAdmin]);

  // Authenticated user bookmarks listener
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setBookmarks([]);
      return;
    }
    const q = query(collection(db, 'bookmarks'), where('userUid', '==', firebaseUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookmarks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BookmarkItem, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookmarks')
    );
    return () => unsub();
  }, [authReady, firebaseUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    if (activePage === 'admin') {
      setActivePage('home');
    }
  }, [activePage]);

  const uploadFile = useCallback(
    async (file: File, purpose: 'lesson' | 'template' | 'research' | 'cover' | 'avatar') => {
      if (!firebaseUser) throw new Error('Authentication required to upload files.');
      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Upload failed.');
      }
      return json;
    },
    [firebaseUser]
  );

  const trackDownload = useCallback(
    async (resourceId: string, title: string, type: 'lesson' | 'document') => {
      fetch('/api/analytics/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, title, type }),
      }).catch(() => {});
    },
    []
  );

  const trackAdImpression = useCallback(async (slotId: string, clicked = false) => {
    fetch('/api/analytics/ad-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, clicked }),
    }).catch(() => {});
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      isRtl,
      activePage,
      navigate,
      firebaseUser,
      authReady,
      userProfile,
      isMainAdmin,
      isAssistantAdmin,
      hasPermission,
      signInWithGoogle,
      logout,
      refreshProfile,
      uploadFile,
      lessons,
      templates,
      articles,
      pathways,
      roles,
      plans,
      bookmarks,
      adsSettings,
      siteSettings,
      monetizationSettings,
      trackDownload,
      trackAdImpression,
      authError,
      clearAuthError: () => setAuthError(null),
    }),
    [
      language,
      setLanguage,
      isRtl,
      activePage,
      navigate,
      firebaseUser,
      authReady,
      userProfile,
      isMainAdmin,
      isAssistantAdmin,
      hasPermission,
      signInWithGoogle,
      logout,
      refreshProfile,
      uploadFile,
      lessons,
      templates,
      articles,
      pathways,
      roles,
      plans,
      bookmarks,
      adsSettings,
      siteSettings,
      monetizationSettings,
      trackDownload,
      trackAdImpression,
      authError,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
