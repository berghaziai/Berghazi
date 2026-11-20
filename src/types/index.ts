export type LanguageCode = 'zgh' | 'ar' | 'en';

export type PageId =
  | 'home'
  | 'lessons'
  | 'documents'
  | 'research'
  | 'culture'
  | 'studio'
  | 'about'
  | 'account'
  | 'contact'
  | 'admin';

export type UserRole =
  | 'main_admin'
  | 'assistant_admin'
  | 'page_writer'
  | 'permanent_member'
  | 'ordinary_member';

export interface AssistantPermissions {
  manageLessons?: boolean;
  manageDocuments?: boolean;
  manageResearch?: boolean;
  manageUsers?: boolean;
  manageAds?: boolean;
  manageMonetization?: boolean;
  viewAnalytics?: boolean;
  manageDesign?: boolean;
  manageTranslations?: boolean;
  publishDirectly?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  permissions: AssistantPermissions;
  schoolName?: string;
  institution?: string;
  academicYear?: string;
  city?: string;
  bio?: string;
  subscriptionTier: 'free' | 'premium' | 'institutional';
  subscriptionExpiresAt?: string;
  isSuspended: boolean;
  preferredLanguage: LanguageCode;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  institution?: string;
  bio?: string;
  photoURL?: string;
}

export type AccessTier = 'public_free' | 'registered_free' | 'paid_single' | 'premium_only';
export type CurrencyCode = 'MAD' | 'USD' | 'EUR';

export interface LessonRecord {
  id: string;
  pathway: number; // 1..6
  level: string;
  stage?: number; // 1..6
  week: number; // 1..6
  part: number; // 1..2
  title: string;
  titleZgh?: string;
  titleAr?: string;
  titleEn?: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileFormat: 'pdf' | 'pptx' | 'docx' | 'image' | 'other';
  fileSize?: number;
  accessTier: AccessTier;
  price?: number;
  currency?: CurrencyCode;
  allowDownload: boolean;
  isPublished: boolean;
  downloadCount: number;
  uploadedByUid: string;
  uploadedByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type DocumentTemplateType = 'mind_map' | 'annual_distribution' | 'periodic_distribution';

export interface DocumentTemplateRecord {
  id: string;
  docType: DocumentTemplateType;
  pathway: number;
  level: string;
  week: number;
  part: number;
  title: string;
  description?: string;
  templateFileUrl: string;
  templateFileName: string;
  templateFormat: 'png' | 'jpg' | 'svg' | 'pdf' | 'docx' | 'pptx';
  accessTier: AccessTier;
  price?: number;
  currency?: CurrencyCode;
  isPublished: boolean;
  downloadCount: number;
  uploadedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ResearchArticle {
  id: string;
  kind: 'research' | 'culture';
  title: string;
  authorUid: string;
  authorName: string;
  abstract: string;
  content: string;
  category: string;
  language: LanguageCode;
  publicationDate: string;
  coverImageUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  referencesText?: string;
  status: 'pending' | 'approved' | 'rejected';
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ResearchComment {
  id: string;
  articleId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt?: unknown;
}

export interface BookmarkItem {
  id: string;
  userUid: string;
  itemId: string;
  itemType: 'research' | 'lesson' | 'document';
  title: string;
  createdAt?: unknown;
}

export interface ContentReport {
  id: string;
  articleId: string;
  articleTitle?: string;
  reporterUid: string;
  reason: string;
  details?: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt?: unknown;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: CurrencyCode;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  storageLimitMb: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface TransactionRecord {
  id: string;
  userUid: string;
  userEmail: string;
  itemType: 'subscription' | 'lesson' | 'document';
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: CurrencyCode;
  provider: 'stripe' | 'paypal' | 'cmi' | 'manual';
  externalRef?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt?: unknown;
}

export interface AdsSettings {
  adsEnabled: boolean;
  adsensePublisherId: string;
  customNetworkName: string;
  slots: {
    homepageBanner: { enabled: boolean; slotId: string };
    lessonsSidebar: { enabled: boolean; slotId: string };
    researchFeed: { enabled: boolean; slotId: string };
    cultureArticle: { enabled: boolean; slotId: string };
  };
  privacyConsentRequired: boolean;
}

export interface SiteAppearanceSettings {
  welcomeZgh: string;
  welcomeAr: string;
  welcomeEn: string;
  accentColor: string;
  showHeritageGuide: boolean;
  contactEmail: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    instagram: string;
    x: string;
  };
}

export interface MonetizationSettings {
  activeGateway: 'none' | 'stripe' | 'paypal' | 'cmi';
  stripePublishableKey: string;
  paypalClientId: string;
  cmiMerchantId: string;
  defaultCurrency: CurrencyCode;
  paymentsEnabled: boolean;
}

export interface AuditLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt?: unknown;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  dailyVisitors: number;
  monthlyVisitors: number;
  totalPageViews: number;
  totalAdImpressions: number;
  totalDownloads: number;
  adSlots: Record<string, { impressions: number; clicks: number }>;
  topPages: { page: string; views: number }[];
  topResources: { id: string; title: string; type: string; downloads: number }[];
  dailySeries: {
    date: string;
    visitors: number;
    pageViews: number;
    downloads: number;
    adImpressions: number;
  }[];
}

export interface RoleDefinition {
  id: UserRole;
  labelEn: string;
  labelAr: string;
  labelZgh: string;
  description?: string;
  rank: number;
  defaultPermissions: AssistantPermissions;
  updatedAt?: unknown;
}

export interface PathwayRecord {
  id: string;
  number: number;
  titleEn: string;
  titleAr: string;
  titleZgh: string;
  description?: string;
  levels: string[];
  weeksCount: number;
  partsCount: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface FirestoreAnalyticsDaily {
  id: string;
  date: string;
  pageViews: number;
  downloads: number;
  adImpressions: number;
  updatedAt?: unknown;
}

