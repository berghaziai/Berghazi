import { LanguageCode } from '../types';

export interface TranslationBundle {
  brand: string;
  brandSubtitle: string;
  tagline: string;
  nav: {
    home: string;
    lessons: string;
    documents: string;
    research: string;
    culture: string;
    studio: string;
    about: string;
    account: string;
    contact: string;
    admin: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    welcomeBack: string;
    visitorMode: string;
    suspendedNotice: string;
    roleLabels: {
      main_admin: string;
      assistant_admin: string;
      page_writer: string;
      permanent_member: string;
      ordinary_member: string;
      visitor: string;
    };
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    exploreLessons: string;
    openDocuments: string;
    pathwaysHeading: string;
    pathwaysSubheading: string;
    docsHeading: string;
    docsSubheading: string;
    mindMapsTitle: string;
    mindMapsDesc: string;
    distributionsTitle: string;
    distributionsDesc: string;
    latestResearchHeading: string;
    culturalHeading: string;
    popularResourcesHeading: string;
    membershipHeading: string;
    membershipDesc: string;
    joinNow: string;
    noResourcesYet: string;
    noResearchYet: string;
  };
  lessons: {
    title: string;
    subtitle: string;
    pathwayLabel: string;
    trackTitle: string;
    levelTitle: string;
    stageTitle: string;
    weekTitle: string;
    partTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    selectTrackPrompt: string;
    selectLevelPrompt: string;
    selectStagePrompt: string;
    selectWeekPrompt: string;
    selectPartPrompt: string;
    resetSelection: string;
    selectLevel: string;
    stage: string;
    week: string;
    part: string;
    emptyTitle: string;
    emptyBody: string;
    adminUploadPrompt: string;
    viewOnline: string;
    downloadFile: string;
    bookmark: string;
    bookmarked: string;
    lockedRegister: string;
    lockedPremium: string;
    lockedPaid: string;
    levels: { value: string; label: string }[];
    unifiedLevels: { value: string; label: string; tazLabel: string }[];
  };
  documents: {
    title: string;
    subtitle: string;
    tabs: {
      mindMap: string;
      annual: string;
      periodic: string;
    };
    teacherInfo: string;
    teacherName: string;
    schoolName: string;
    institution: string;
    academicYear: string;
    extraInfo: string;
    selectionTitle: string;
    customizationTitle: string;
    palette: string;
    background: string;
    typography: string;
    pattern: string;
    layout: string;
    borderStyle: string;
    headerFooter: string;
    preview: string;
    downloadPdf: string;
    downloadPng: string;
    printDoc: string;
    noTemplateTitle: string;
    noTemplateBody: string;
    templateNotice: string;
  };
  research: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allCategories: string;
    submitResearch: string;
    pendingModeration: string;
    approved: string;
    rejected: string;
    abstract: string;
    references: string;
    comments: string;
    addComment: string;
    postComment: string;
    like: string;
    share: string;
    copiedLink: string;
    report: string;
    reportSubmitted: string;
    noArticles: string;
    categories: { value: string; label: string }[];
  };
  culture: {
    title: string;
    subtitle: string;
    tifinaghGuideTitle: string;
    tifinaghGuideDesc: string;
    heritagePillarsTitle: string;
    articlesTitle: string;
  };
  about: {
    title: string;
    subtitle: string;
    missionTitle: string;
    missionBody: string;
    audienceTitle: string;
    architectureTitle: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    sentSuccess: string;
  };
  account: {
    title: string;
    profileTab: string;
    bookmarksTab: string;
    membershipTab: string;
    transactionsTab: string;
    saveProfile: string;
    savedSuccess: string;
    upgradePlan: string;
    activePlan: string;
  };
  admin: {
    title: string;
    subtitle: string;
    tabs: {
      overview: string;
      lessons: string;
      documents: string;
      research: string;
      users: string;
      ads: string;
      monetization: string;
      analytics: string;
      appearance: string;
      translations: string;
      notifications: string;
      logs: string;
      backup: string;
    };
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    upload: string;
    close: string;
    all: string;
    free: string;
    premium: string;
    paid: string;
    sponsoredLabel: string;
  };
}

export const translations: Record<LanguageCode, TranslationBundle> = {
  zgh: {
    brand: 'ⴱⵔⵖⴰⵣⵉ',
    brandSubtitle: 'ⴰⵙⴰⵜⵓⵔ ⴰⵙⴳⵎⴰⵏ ⴰⵎⴰⵣⵉⵖ',
    tagline: 'ⴰⵙⵍⵎⴷ · ⵉⵙⴰⵍⴰⵏ · ⴰⵔⵣⵣⵓ ⴰⵎⴰⵙⵙⴰⵏ',
    nav: {
      home: 'ⴰⵙⵏⵓⴱⴳ',
      lessons: 'ⵜⵉⵎⵙⵉⵔⵉⵏ',
      documents: 'ⵉⵙⴰⵍⴰⵏ',
      research: 'ⴰⵔⵣⵣⵓ',
      culture: 'ⵜⴰⴷⵍⵙⴰ',
      studio: 'ⵜⵉⵖⵉⵙⵜ · Studio',
      about: 'ⵖⴼ ⴱⵔⵖⴰⵣⵉ',
      account: 'ⴰⵎⵉⴹⴰⵏ',
      contact: 'ⴰⵎⵢⴰⵡⴰⴹ',
      admin: 'ⴰⵙⵡⵓⴷⴷⵓ',
    },
    auth: {
      signIn: 'ⴽⵛⵎ ⵙ Google',
      signOut: 'ⴼⴼⵖ',
      welcomeBack: 'ⴰⵏⵙⵓⴼ ⵢⵉⵙⴽ',
      visitorMode: 'ⴰⵏⵔⵣⴰⴼ',
      suspendedNotice: 'ⴰⵎⵉⴹⴰⵏ ⵏⵏⴽ ⵉⵜⵜⵓⵙⴱⴷⴷ.',
      roleLabels: {
        main_admin: 'ⴰⵏⵎⵀⴰⵍ ⴰⵎⵇⵔⴰⵏ',
        assistant_admin: 'ⴰⵎⴰⵡⴰⵙ ⵏ ⵓⵙⵡⵓⴷⴷⵓ',
        page_writer: 'ⴰⵎⴰⵔⴰ ⵏ ⵜⵙⵏⴰ',
        permanent_member: 'ⴰⴳⵎⴰⵎ ⴰⵎⵖⵍⴰⵍ',
        ordinary_member: 'ⴰⴳⵎⴰⵎ',
        visitor: 'ⴰⵏⵔⵣⴰⴼ',
      },
    },
    home: {
      heroTitle: 'ⴱⵔⵖⴰⵣⵉ — ⴰⵙⴰⵜⵓⵔ ⴰⵎⴰⵣⵉⵖ ⵉ ⵓⵙⵍⵎⴷ ⴷ ⵓⵔⵣⵣⵓ',
      heroSubtitle:
        'ⴰⵏⵙⴰ ⴰⵎⴰⴷⴷⵓⴷ ⵉ ⵉⵙⵍⵎⴰⴷⵏ, ⵉⵏⵍⵎⴰⴷⵏ, ⴷ ⵉⵎⵔⵣⵓⵜⵏ ⵏ ⵜⵓⵜⵍⴰⵢⵜ ⵜⴰⵎⴰⵣⵉⵖⵜ ⴷ ⵜⴷⵍⵙⴰ ⵜⴰⵎⵖⵔⴰⴱⵉⵜ.',
      exploreLessons: 'ⵥⵕ ⵜⵉⵎⵙⵉⵔⵉⵏ',
      openDocuments: 'ⵉⵙⴰⵍⴰⵏ ⵉⵙⴳⵎⴰⵏⵏ',
      pathwaysHeading: 'ⵙⴹⵉⵙ ⵉⴱⵔⴷⴰⵏ ⵉⵙⴳⵎⴰⵏⵏ',
      pathwaysSubheading: 'ⴰⴼ ⵜⵉⵎⵙⵉⵔⵉⵏ ⵜⵉⵎⴰⴷⴷⵓⴷⵉⵏ ⵙ ⵓⵙⵡⵉⵔ, ⴰⵎⴰⵍⴰⵙⵙ, ⴷ ⵓⴳⵣⵣⵓⵎ.',
      docsHeading: 'ⵜⵉⵙⴰⵖⵓⵍⵉⵏ ⴷ ⵉⵙⴰⵍⴰⵏ ⵏ ⵓⵙⵍⵎⴰⴷ',
      docsSubheading: 'ⵙⵙⵓⴷⵙ ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵜⵉⵏⵍⵍⵉⵢⵉⵏ ⴷ ⵉⴱⵟⵟⵓⵜⵏ ⵙ ⵜⵓⵎⴰⵢⵜ ⵏ ⵓⵏⵎⵀⴰⵍ.',
      mindMapsTitle: 'ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵜⵉⵏⵍⵍⵉⵢⵉⵏ',
      mindMapsDesc: 'ⵙⵙⴽⵛⵎ ⵉⵙⴼⴽⴰ ⵏⵏⴽ ⵙ ⵓⵎⵙⴰⵙⴰ ⵏ ⵜⵡⵉⵍⴰ ⴷ ⵉⴽⵯⵍⴰⵏ.',
      distributionsTitle: 'ⵉⴱⵟⵟⵓⵜⵏ ⵉⵙⴳⴳⵯⴰⵙⴰⵏ ⴷ ⵉⵡⴰⵍⴰⵏⵏ',
      distributionsDesc: 'ⵜⵉⵡⵉⵍⴰⵜⵉⵏ ⵉⵜⵜⵓⵙⵎⵓⵜⵜⴳⵏ ⵉ ⵓⵙⵉⴳⴳⵣ ⴷ ⵓⵙⵓⴼⵖ PDF.',
      latestResearchHeading: 'ⵉⵔⵣⵣⵓⵜⵏ ⵉⵎⴰⵙⵙⴰⵏⵏ ⵉⵎⴰⵢⵏⵓⵜⵏ',
      culturalHeading: 'ⵜⴰⴷⵍⵙⴰ ⴷ ⵜⴰⵢⵙⵉ ⵜⴰⵎⴰⵣⵉⵖⵜ',
      popularResourcesHeading: 'ⵉⵙⵓⴳⴰⵎ ⵉⵜⵜⵓⵙⵎⵔⴰⵙⵏ ⴽⵉⴳⴰⵏ',
      membershipHeading: 'ⴰⵎⵓⵏ ⵏ ⴱⵔⵖⴰⵣⵉ ⴷ ⵓⵙⴷⵓⵙ ⵏ ⵜⵎⵓⵙⵏⵉ',
      membershipDesc: 'ⵔⵏⵓ ⵉ ⵉⵎⵔⵣⵓⵜⵏ ⴷ ⵉⵙⵍⵎⴰⴷⵏ ⵃⵎⴰ ⴰⴷ ⵜⵥⵕⴹ ⵜⵉⵎⵙⵉⵔⵉⵏ ⴷ ⵉⵔⵣⵣⵓⵜⵏ.',
      joinNow: 'ⴽⵛⵎ ⴷⵖⵉ',
      noResourcesYet: 'ⵓⵔ ⵜⴰ ⵉⵜⵜⵓⵔⵏⵉ ⵓⵙⵓⴳⵎ ⴰⵎⴰⴷⴷⵓⴷ.',
      noResearchYet: 'ⵓⵔ ⵜⴰ ⵍⵍⵉⵏ ⵉⵔⵣⵣⵓⵜⵏ ⵉⵜⵜⵓⵙⵏⴼⵍⵏ.',
    },
    lessons: {
      title: 'ⵜⴰⵙⴷⵍⵉⵙⵜ ⵏ ⵜⵎⵙⵉⵔⵉⵏ',
      subtitle: 'ⴼⵔⵏ ⴰⵙⴰⴽⴰ, ⵜⵉⴽⵍⵉ, ⵉⵎⴰⵍⴰⵙⵙ, ⴷ ⵓⴳⵣⵣⵓⵎ ⵙ ⵜⵖⴰⵔⴰⵙⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ.',
      pathwayLabel: 'ⴰⵙⴰⴽⴰ',
      trackTitle: 'ⴰⵙⴰⴽⴰ',
      levelTitle: 'ⴰⵙⵡⵉⵔ',
      stageTitle: 'ⵜⵉⴽⵍⵉ',
      weekTitle: 'ⵉⵎⴰⵍⴰⵙⵙ',
      partTitle: 'ⴰⴳⵣⵣⵓⵎ',
      step1: 'ⴰⵙⴰⴽⴰ',
      step2: 'ⴰⵙⵡⵉⵔ',
      step3: 'ⵜⵉⴽⵍⵉ',
      step4: 'ⵉⵎⴰⵍⴰⵙⵙ',
      step5: 'ⴰⴳⵣⵣⵓⵎ',
      selectTrackPrompt: 'ⴼⵔⵏ ⴰⵙⴰⴽⴰ ⵃⵎⴰ ⴰⴷ ⴷ ⴱⴰⵏⵏⵜ ⵜⵉⴽⵍⵉⵡⵉⵏ.',
      selectLevelPrompt: 'ⴼⵔⵏ ⴰⵙⵡⵉⵔ.',
      selectStagePrompt: 'ⴼⵔⵏ ⵜⵉⴽⵍⵉ (1–6).',
      selectWeekPrompt: 'ⴼⵔⵏ ⵉⵎⴰⵍⴰⵙⵙ (1–6).',
      selectPartPrompt: 'ⴼⵔⵏ ⴰⴳⵣⵣⵓⵎ (1 ⵏⵖ 2).',
      resetSelection: 'ⴰⵍⵍⵙ ⴰⵙⵜⴰⵢ',
      selectLevel: 'ⴼⵔⵏ ⴰⵙⵡⵉⵔ',
      stage: 'ⵜⵉⴽⵍⵉ',
      week: 'ⵉⵎⴰⵍⴰⵙⵙ',
      part: 'ⴰⴳⵣⵣⵓⵎ',
      emptyTitle: 'ⵓⵔ ⵜⵍⵍⵉ ⵜⵎⵙⵉⵔⵜ ⴷⴰ',
      emptyBody: 'ⵓⵔ ⵜⴰ ⵉⵙⵙⴽⵛⵎ ⵓⵏⵎⵀⴰⵍ ⵜⴰⵎⵙⵉⵔⵜ ⵜⴰⵎⴰⴷⴷⵓⴷⵜ ⵉ ⵓⵙⵜⴰⵢ ⴰⴷ.',
      adminUploadPrompt: 'ⵔⵏⵓ ⵜⴰⵎⵙⵉⵔⵜ ⴳ ⵓⵙⵡⵓⴷⴷⵓ',
      viewOnline: 'ⵥⵕ ⴳ ⵓⵥⵟⵟⴰ',
      downloadFile: 'ⴰⴳⵎ ⴰⴼⴰⵢⵍⵓ',
      bookmark: 'ⵃⴹⵓ',
      bookmarked: 'ⵉⵜⵜⵓⵃⴹⴰ',
      lockedRegister: 'ⴽⵛⵎ ⵃⵎⴰ ⴰⴷ ⵜⵥⵕⴹ ⵜⴰⵎⵙⵉⵔⵜ ⴰⴷ',
      lockedPremium: 'ⵉⵍⵍⴰ ⵉ ⵉⴳⵎⴰⵎⵏ ⵏ ⵓⵙⵡⵉⵔ ⴰⵎⴰⵜⵜⴰⵢ',
      lockedPaid: 'ⴰⵙⵓⴳⵎ ⴰⵎⵅⵍⵍⵚ',
      levels: [
        { value: 'level_1', label: 'ⴰⵙⵡⵉⵔ 1' },
        { value: 'level_2', label: 'ⴰⵙⵡⵉⵔ 2' },
        { value: 'level_3', label: 'ⴰⵙⵡⵉⵔ 3' },
        { value: 'level_4', label: 'ⴰⵙⵡⵉⵔ 4' },
        { value: 'level_5', label: 'ⴰⵙⵡⵉⵔ 5' },
        { value: 'level_6', label: 'ⴰⵙⵡⵉⵔ 6' },
      ],
      unifiedLevels: [
        { value: 'level_1', label: 'ⴰⵙⵡⵉⵔ 1', tazLabel: 'ⴰⵙⵡⵉⵔ 1' },
        { value: 'level_2', label: 'ⴰⵙⵡⵉⵔ 2', tazLabel: 'ⴰⵙⵡⵉⵔ 2' },
        { value: 'level_3', label: 'ⴰⵙⵡⵉⵔ 3', tazLabel: 'ⴰⵙⵡⵉⵔ 3' },
      ],
    },
    documents: {
      title: 'ⵉⵙⴰⵍⴰⵏ ⵉⵙⴳⵎⴰⵏⵏ',
      subtitle: 'ⵙⵙⵓⴷⵙ ⵜⵉⵡⵉⵍⴰⵜⵉⵏ ⵏ ⵓⵏⵎⵀⴰⵍ ⵙ ⵉⵙⴼⴽⴰ ⵏ ⵓⵙⵍⵎⴰⴷ.',
      tabs: {
        mindMap: 'ⵜⵉⴽⴰⵕⴹⵉⵡⵉⵏ ⵜⵉⵏⵍⵍⵉⵢⵉⵏ',
        annual: 'ⴰⴱⵟⵟⵓ ⴰⵙⴳⴳⵯⴰⵙⴰⵏ',
        periodic: 'ⵉⴱⵟⵟⵓⵜⵏ ⵉⵡⴰⵍⴰⵏⵏ',
      },
      teacherInfo: 'ⵉⵙⴼⴽⴰ ⵏ ⵓⵙⵍⵎⴰⴷ',
      teacherName: 'ⵉⵙⵎ ⵓⵎⴷⵉ ⵏ ⵓⵙⵍⵎⴰⴷ',
      schoolName: 'ⵉⵙⵎ ⵏ ⵜⵉⵏⵎⵍ',
      institution: 'ⵜⵉⵎⵔⵙⵍⵜ ⵜⴰⵙⴳⵎⴰⵏⵜ',
      academicYear: 'ⴰⵙⴳⴳⵯⴰⵙ ⴰⵏⵎⵍⴰⵏ',
      extraInfo: 'ⵉⵙⴼⴽⴰ ⵉⵣⴰⵢⴷⵏ',
      selectionTitle: 'ⴰⵙⵜⴰⵢ ⴰⵙⴳⵎⴰⵏ',
      customizationTitle: 'ⴰⵙⵏⴼⵍ ⵏ ⵜⵡⵉⵍⴰ',
      palette: 'ⵉⴽⵯⵍⴰⵏ',
      background: 'ⴰⵖⴰⵡⵙ ⵏ ⵜⵓⵏⵏⵓⵏⵜ',
      typography: 'ⵜⵉⵔⵔⴰ',
      pattern: 'ⵉⵣⵔⵉⵔⵉⴳⵏ ⵉⵎⴰⵣⵉⵖⵏ',
      layout: 'ⵜⴰⵡⵉⵍⴰ',
      borderStyle: 'ⵉⴳⵎⵎⴰⴹⵏ',
      headerFooter: 'ⴰⴳⴰⴼⴰ ⴷ ⵓⵣⴷⴰⵔ',
      preview: 'ⴰⵙⴽⵏ ⴷⴰⵜ ⵏ ⵡⴰⴳⴰⵎ',
      downloadPdf: 'ⴰⴳⵎ PDF',
      downloadPng: 'ⴰⴳⵎ PNG',
      printDoc: 'ⵙⵉⴳⴳⵣ',
      noTemplateTitle: 'ⵓⵔ ⵜⵍⵍⵉ ⵜⵡⵉⵍⴰ ⵜⴰⵎⴰⴷⴷⵓⴷⵜ',
      noTemplateBody: 'ⵓⵔ ⵜⴰ ⵉⵙⵙⴽⵛⵎ ⵓⵏⵎⵀⴰⵍ ⵜⴰⵡⵉⵍⴰ ⵉ ⵓⵙⵜⴰⵢ ⴰⴷ.',
      templateNotice: 'ⵜⵓⵎⴰⵢⵜ ⵜⴰⵏⵚⵍⵉⵜ ⵜⴳⴰ ⵜⵉⵏ ⵓⵏⵎⵀⴰⵍ ⵓⵔ ⵜⵜⵓⵙⵏⴼⴰⵍ ⴰⴱⵍⴰ ⵉⵙⴼⴽⴰ ⵏ ⵓⵙⵍⵎⴰⴷ ⴷ ⵜⵡⵉⵍⴰ.',
    },
    research: {
      title: 'ⴰⵔⵣⵣⵓ ⴰⵎⴰⵙⵙⴰⵏ ⴷ ⵜⵎⵓⵙⵏⵉ ⵜⴰⵎⴰⵣⵉⵖⵜ',
      subtitle: 'ⴰⵙⴰⵜⵓⵔ ⴰⴽⴰⴷⵉⵎⵉ ⵉ ⵜⵖⵓⵔⵉⵡⵉⵏ ⵜⵉⵎⴰⵣⵉⵖⵉⵏ ⴷ ⵜⵎⵙⵏⵉⵍⵙⵜ ⴷ ⵓⵎⵣⵔⵓⵢ.',
      searchPlaceholder: 'ⵔⵣⵓ ⵙ ⵓⵣⵡⵍ, ⴰⵎⴰⵔⴰ, ⵏⵖ ⴰⵏⴰⵡ...',
      allCategories: 'ⴰⴽⴽⵯ ⵉⴳⵔⴰⵏ',
      submitResearch: 'ⴰⵣⵏ ⴰⵔⵣⵣⵓ',
      pendingModeration: 'ⵉⵜⵜⵕⴰⵊⵓ ⴰⵙⴷⵖⵉ',
      approved: 'ⵉⵜⵜⵓⵙⴷⵖⴰ',
      rejected: 'ⵉⵜⵜⵓⴳⵉ',
      abstract: 'ⵜⴰⴳⴹⵡⵉⵜ',
      references: 'ⵜⵉⵙⴰⵖⵓⵍⵉⵏ ⴷ ⵉⵖⴱⵓⵍⴰ',
      comments: 'ⵉⵅⴼⴰⵡⴰⵍⵏ',
      addComment: 'ⵔⵏⵓ ⴰⵅⴼⴰⵡⴰⵍ...',
      postComment: 'ⴰⵣⵏ',
      like: 'ⵉⵙⵙⵓⵙⵎ ⵉⵢⵉ',
      share: 'ⴱⴹⵓ',
      copiedLink: 'ⵉⵜⵜⵓⵏⵖⵍ ⵓⵣⴷⴰⵢ',
      report: 'ⵎⵍ ⴰⵙⵃⵉⵡⵍ',
      reportSubmitted: 'ⵉⵜⵜⵓⵣⵏ ⵓⵎⵍⴰⵏ ⵉ ⵓⵙⵡⵓⴷⴷⵓ.',
      noArticles: 'ⵓⵔ ⵜⴰ ⵍⵍⵉⵏ ⵉⵔⵣⵣⵓⵜⵏ ⵉⵜⵜⵓⴼⵙⴰⵔⵏ.',
      categories: [
        { value: 'linguistic', label: 'ⵜⴰⵙⵏⵉⵍⵙⵜ ⵜⴰⵎⴰⵣⵉⵖⵜ' },
        { value: 'tifinagh', label: 'ⵜⵉⵔⵔⴰ ⵏ ⵜⵉⴼⵉⵏⴰⵖ' },
        { value: 'historical', label: 'ⴰⵎⵣⵔⵓⵢ ⴷ ⵜⵖⵔⵎⴰ' },
        { value: 'heritage', label: 'ⵜⴰⵢⵙⵉ ⵜⴰⴷⵍⵙⴰⵏⵜ' },
        { value: 'traditions', label: 'ⵜⵉⵎⵢⵓⵔⵉⵏ ⴷ ⵉⵏⵙⴰⵢⵏ' },
        { value: 'literature', label: 'ⵜⴰⵙⴽⵍⴰ ⴷ ⵜⵎⴷⵢⴰⵣⵜ' },
        { value: 'educational', label: 'ⵜⵉⵖⵓⵔⵉⵡⵉⵏ ⵜⵉⵙⴳⵎⴰⵏⵉⵏ' },
        { value: 'books', label: 'ⵉⴷⵍⵉⵙⵏ ⴷ ⵜⵥⵕⵉⴳⵉⵏ' },
      ],
    },
    culture: {
      title: 'ⵜⴰⴷⵍⵙⴰ ⴷ ⵜⴰⵢⵙⵉ ⵜⴰⵎⴰⵣⵉⵖⵜ',
      subtitle: 'ⴰⴳⵍⴰ ⴰⴷⵍⵙⴰⵏ, ⵜⵉⴼⵉⵏⴰⵖ, ⵜⴰⵥⵓⵕⵉ, ⴷ ⵓⵎⵣⵔⵓⵢ ⵏ ⵍⵎⵖⵔⵉⴱ.',
      tifinaghGuideTitle: 'ⴰⵎⵙⵙⴰⵏ ⵏ ⵓⴳⵎⵎⴰⵢ ⵏ ⵜⵉⴼⵉⵏⴰⵖ (IRC)',
      tifinaghGuideDesc: 'ⴰⴼ ⵉⵙⴽⴽⵉⵍⵏ ⵉⵏⵚⵍⵉⵢⵏ ⵏ ⵜⵉⴼⵉⵏⴰⵖ ⴷ ⵉⵎⵙⵍⵉⵜⵏ ⵏⵏⵙⵏ.',
      heritagePillarsTitle: 'ⵜⵉⴳⵊⴷⴰ ⵏ ⵜⴰⵢⵙⵉ ⵜⴰⵎⴰⵣⵉⵖⵜ',
      articlesTitle: 'ⵉⵎⴰⴳⵔⴰⴷⵏ ⵉⴷⵍⵙⴰⵏⵏ',
    },
    about: {
      title: 'ⵖⴼ ⴱⵔⵖⴰⵣⵉ',
      subtitle: 'ⵜⴰⵎⴰⴳⵉⵜ ⵏⵏⵖ ⵜⴰⵙⴳⵎⴰⵏⵜ ⴷ ⵜⵎⴰⵙⵙⴰⵏⵜ ⵉ ⵓⵙⴱⵓⵖⵍⵓ ⵏ ⵜⵎⴰⵣⵉⵖⵜ.',
      missionTitle: 'ⵜⴰⵡⵓⵔⵉ ⵏ ⵓⵙⴰⵜⵓⵔ',
      missionBody:
        'ⵉⴳⴰ ⴱⵔⵖⴰⵣⵉ ⵢⴰⵏ ⵓⵙⴰⵜⵓⵔ ⴰⵎⴰⴹⵍⴰⵏ ⵉ ⵓⵙⵎⵓⵏ ⵏ ⵜⵎⵙⵉⵔⵉⵏ ⵜⵉⵎⴰⴷⴷⵓⴷⵉⵏ, ⵉⵙⴰⵍⴰⵏ ⵏ ⵉⵙⵍⵎⴰⴷⵏ, ⴷ ⵓⵔⵣⵣⵓ ⴰⵎⴰⵙⵙⴰⵏ ⴳ ⵜⵓⵜⵍⴰⵢⵜ ⵜⴰⵎⴰⵣⵉⵖⵜ.',
      audienceTitle: 'ⵡⵉⵏⵏⴰ ⵉⵜⵜⴱⵖⴰⵔⵏ',
      architectureTitle: 'ⵜⴰⵖⴰⵔⴰⵙⵜ ⵏ ⵜⵎⵓⵙⵏⵉ',
    },
    contact: {
      title: 'ⴰⵎⵢⴰⵡⴰⴹ ⴷ ⴱⵔⵖⴰⵣⵉ',
      subtitle: 'ⴰⵣⵏ ⴰⵖ ⵉⵙⵇⵙⵉⵜⵏ ⵏⵏⴽ ⵉⵙⴳⵎⴰⵏⵏ ⵏⵖ ⵉⵎⴰⵙⵙⴰⵏⵏ.',
      name: 'ⵉⵙⵎ ⵓⵎⴷⵉ',
      email: 'ⵉⵎⴰⵢⵍ',
      subject: 'ⴰⵙⵏⵜⵍ',
      message: 'ⵜⴰⴱⵔⴰⵜ',
      send: 'ⴰⵣⵏ ⵜⴰⴱⵔⴰⵜ',
      sentSuccess: 'ⵜⵜⵓⵣⵏ ⵜⴱⵔⴰⵜ ⵏⵏⴽ ⵙ ⵓⵎⵓⵔⵙ.',
    },
    account: {
      title: 'ⴰⵎⵉⴹⴰⵏ ⵏ ⵓⵏⵙⵙⵎⵔⵙ',
      profileTab: 'ⴰⴼⵔⴰⵢ ⵉⵏⵓ',
      bookmarksTab: 'ⵉⵙⵓⴳⴰⵎ ⵉⵜⵜⵓⵃⴹⴰⵏ',
      membershipTab: 'ⴰⵙⵡⵉⵔ ⴷ ⵓⵜⵜⵓ',
      transactionsTab: 'ⵉⵎⵓⵙⵙⵓⵜⵏ',
      saveProfile: 'ⵃⴹⵓ ⵉⵙⴼⴽⴰ',
      savedSuccess: 'ⵜⵜⵓⵃⴹⴰⵏ ⵉⵙⴼⴽⴰ ⵏ ⵓⴼⵔⴰⵢ.',
      upgradePlan: 'ⵙⵙⴰⵍⵉ ⴰⵙⵡⵉⵔ',
      activePlan: 'ⴰⵙⵡⵉⵔ ⵉⵜⵜⵓⵔⵎⴰⴷⵏ',
    },
    admin: {
      title: 'ⵜⴰⴼⵍⵡⵉⵜ ⵏ ⵓⵙⵡⵓⴷⴷⵓ ⴰⵎⵇⵔⴰⵏ',
      subtitle: 'ⴰⵙⵡⵓⴷⴷⵓ ⵓⵎⴷⵉ ⵏ ⴱⵔⵖⴰⵣⵉ, ⵜⵉⵎⵙⵉⵔⵉⵏ, ⵉⵙⴰⵍⴰⵏ, ⵉⴳⵎⴰⵎⵏ, ⴷ ⵉⴷⵔⵉⵎⵏ.',
      tabs: {
        overview: 'ⵜⴰⵎⵓⵖⵍⵉ ⵜⴰⵎⴰⵜⴰⵢⵜ',
        lessons: 'ⴰⵙⵡⵓⴷⴷⵓ ⵏ ⵜⵎⵙⵉⵔⵉⵏ',
        documents: 'ⵜⵉⵡⵉⵍⴰⵜⵉⵏ ⵏ ⵉⵙⴰⵍⴰⵏ',
        research: 'ⴰⵙⴷⵖⵉ ⵏ ⵓⵔⵣⵣⵓ',
        users: 'ⵉⴳⵎⴰⵎⵏ ⴷ ⵜⵎⵙⴽⴰⵔⵉⵏ',
        ads: 'ⵉⵍⵖⵓⵜⵏ',
        monetization: 'ⵉⴷⵔⵉⵎⵏ ⴷ ⵉⵙⵡⵉⵔⵏ',
        analytics: 'ⵉⵙⵏⵎⴽⵜⴰ',
        appearance: 'ⵜⵓⵏⵏⵓⵏⵜ ⵏ ⵓⵙⴰⵜⵓⵔ',
        translations: 'ⵜⵓⵜⵍⴰⵢⵉⵏ',
        notifications: 'ⵉⵎⵢⴰⵡⴰⴹⵏ',
        logs: 'ⵉⵣⵎⵎⵉⵎⵏ ⵏ ⵜⵏⴼⵔⵓⵜ',
        backup: 'ⴰⵃⵟⵟⵓ ⴷ ⵓⵙⵓⵖⴰⵍ',
      },
    },
    common: {
      loading: 'ⴰⵔ ⵉⵜⵜⴰⵍⵢ...',
      save: 'ⵃⴹⵓ',
      cancel: 'ⵙⴱⴷⴷ',
      delete: 'ⴽⴽⵙ',
      edit: 'ⵙⵏⴼⵍ',
      upload: 'ⵙⵙⴽⵛⵎ ⴰⴼⴰⵢⵍⵓ',
      close: 'ⵔⴳⵍ',
      all: 'ⴰⴽⴽⵯ',
      free: 'ⴼⴰⴱⵓⵕ',
      premium: 'ⴰⵎⴰⵜⵜⴰⵢ',
      paid: 'ⵉⵜⵜⵓⵅⵍⵍⵚⵏ',
      sponsoredLabel: 'ⴰⵙⵓⵙⵔ ⵉⵜⵜⵓⵙⵏⴱⴹⵏ',
    },
  },

  ar: {
    brand: 'برغازي',
    brandSubtitle: 'المنصة الأمازيغية التعليمية الشاملة',
    tagline: 'التعليم · الوثائق التربوية · البحث العلمي',
    nav: {
      home: 'الرئيسية',
      lessons: 'الدروس',
      documents: 'الوثائق التربوية',
      research: 'البحث العلمي',
      culture: 'الثقافة والتراث',
      studio: 'استوديو الذكاء والتراث',
      about: 'عن برغازي',
      account: 'الحساب',
      contact: 'اتصل بنا',
      admin: 'لوحة التحكم',
    },
    auth: {
      signIn: 'الدخول عبر Google',
      signOut: 'تسجيل الخروج',
      welcomeBack: 'مرحباً بك',
      visitorMode: 'زائر',
      suspendedNotice: 'تم تعليق حسابك مؤقتاً من طرف الإدارة.',
      roleLabels: {
        main_admin: 'المدير العام',
        assistant_admin: 'مساعد إداري',
        page_writer: 'محرر محتوى',
        permanent_member: 'عضو دائم',
        ordinary_member: 'عضو عادي',
        visitor: 'زائر',
      },
    },
    home: {
      heroTitle: 'برغازي — المنصة المرجعية لتعليم اللغة الأمازيغية والبحث الأكاديمي',
      heroSubtitle:
        'فضاء رقمي متكامل للمدرسين والتلاميذ والباحثين والمهتمين باللغة الأمازيغية وحرف تيفيناغ والتراث الثقافي المغربي.',
      exploreLessons: 'استعراض الدروس',
      openDocuments: 'الوثائق التربوية',
      pathwaysHeading: 'المسارات التعليمية الستة',
      pathwaysSubheading: 'ابحث عن الدروس الرسمية حسب المستوى الدراسي والأسبوع والمقطع.',
      docsHeading: 'استوديو الوثائق التربوية',
      docsSubheading: 'خصص الخرائط الذهنية والتوازيع السنوية والدورية المعتمدة من الإدارة.',
      mindMapsTitle: 'مولد الخرائط الذهنية',
      mindMapsDesc: 'دمج بيانات الأستاذ والمدرسة مع القوالب الرسمية دون المساس بالمحتوى التربوي.',
      distributionsTitle: 'التوازيع السنوية والدورية',
      distributionsDesc: 'إعداد وتنسيق التوازيع المعتمدة مع التصدير الفوري بصيغة PDF والطباعة.',
      latestResearchHeading: 'أحدث الأبحاث العلمية المحكمة',
      culturalHeading: 'إضاءات من الثقافة والتراث الأمازيغي',
      popularResourcesHeading: 'الموارد التعليمية الأكثر تحميلاً',
      membershipHeading: 'انضم إلى مجتمع برغازي المعرفي',
      membershipDesc: 'سجل عضويتك للوصول إلى الموارد، حفظ الأبحاث، والمشاركة في النقاش العلمي.',
      joinNow: 'انضم الآن',
      noResourcesYet: 'لم يتم رفع موارد تعليمية رسمية بعد من طرف الإدارة.',
      noResearchYet: 'لا توجد أبحاث منشورة ومعتمدة حالياً.',
    },
    lessons: {
      title: 'مكتبة الدروس الرسمية',
      subtitle: 'اختر المسار، ثم المرحلة، الأسبوع، والمقطع بكل بساطة.',
      pathwayLabel: 'المسار',
      trackTitle: 'ⴰⵙⴰⴽⴰ · المسار',
      levelTitle: 'ⴰⵙⵡⵉⵔ · المستوى',
      stageTitle: 'ⵜⵉⴽⵍⵉ · المرحلة',
      weekTitle: 'ⵉⵎⴰⵍⴰⵙⵙ · الأسبوع',
      partTitle: 'ⴰⴳⵣⵣⵓⵎ · المقطع',
      step1: 'المسار (ⴰⵙⴰⴽⴰ)',
      step2: 'المستوى (ⴰⵙⵡⵉⵔ)',
      step3: 'المرحلة (ⵜⵉⴽⵍⵉ)',
      step4: 'الأسبوع (ⵉⵎⴰⵍⴰⵙⵙ)',
      step5: 'المقطع (ⴰⴳⵣⵣⵓⵎ)',
      selectTrackPrompt: 'اختر المسار التعليمي أولاً.',
      selectLevelPrompt: 'اختر المستوى.',
      selectStagePrompt: 'اختر المرحلة (1–6).',
      selectWeekPrompt: 'اختر الأسبوع (1–6).',
      selectPartPrompt: 'اختر المقطع (1 أو 2).',
      resetSelection: 'إعادة التعيين',
      selectLevel: 'اختر المستوى',
      stage: 'المرحلة',
      week: 'الأسبوع',
      part: 'المقطع',
      emptyTitle: 'لا يوجد درس مرفوع لهذا الاختيار',
      emptyBody: 'تبقى مكتبة الدروس فارغة حتى يقوم المدير العام أو المخولون برفع الدرس الرسمي.',
      adminUploadPrompt: 'رفع درس عبر لوحة التحكم',
      viewOnline: 'معاينة عبر الإنترنت',
      downloadFile: 'تحميل الملف',
      bookmark: 'حفظ في المفضلة',
      bookmarked: 'محفوظ',
      lockedRegister: 'سجل الدخول للوصول إلى هذا الدرس',
      lockedPremium: 'متاح لأعضاء الاشتراك المميز',
      lockedPaid: 'مورد مدفوع',
      levels: [
        { value: 'level_1', label: 'المستوى الأول (ⴰⵙⵡⵉⵔ 1)' },
        { value: 'level_2', label: 'المستوى الثاني (ⴰⵙⵡⵉⵔ 2)' },
        { value: 'level_3', label: 'المستوى الثالث (ⴰⵙⵡⵉⵔ 3)' },
        { value: 'level_4', label: 'المستوى الرابع (ⴰⵙⵡⵉⵔ 4)' },
        { value: 'level_5', label: 'المستوى الخامس (ⴰⵙⵡⵉⵔ 5)' },
        { value: 'level_6', label: 'المستوى السادس (ⴰⵙⵡⵉⵔ 6)' },
      ],
      unifiedLevels: [
        { value: 'level_1', label: 'المستوى 1', tazLabel: 'ⴰⵙⵡⵉⵔ 1' },
        { value: 'level_2', label: 'المستوى 2', tazLabel: 'ⴰⵙⵡⵉⵔ 2' },
        { value: 'level_3', label: 'المستوى 3', tazLabel: 'ⴰⵙⵡⵉⵔ 3' },
      ],
    },
    documents: {
      title: 'الوثائق التربوية وتخصيص القوالب',
      subtitle: 'تخصيص القوالب الرسمية المرفوعة من الإدارة ببيانات الأستاذ دون تغيير المحتوى الأصلي.',
      tabs: {
        mindMap: 'الخرائط الذهنية',
        annual: 'التوزيع السنوي',
        periodic: 'التوازيع الدورية',
      },
      teacherInfo: 'البيانات المهنية للأستاذ',
      teacherName: 'الاسم الكامل للأستاذ(ة)',
      schoolName: 'اسم المدرسة',
      institution: 'المؤسسة / المديرية الإقليمية',
      academicYear: 'السنة الدراسية',
      extraInfo: 'معلومات إضافية (الفوج / المادة)',
      selectionTitle: 'الاختيار البيداغوجي',
      customizationTitle: 'تخصيص التصميم والهوية البصرية',
      palette: 'لوحة الألوان',
      background: 'لون الخلفية',
      typography: 'الخط والكتابة',
      pattern: 'الزخرفة الأمازيغية',
      layout: 'التخطيط',
      borderStyle: 'الإطار والحدود',
      headerFooter: 'الرأس والتذييل',
      preview: 'معاينة مباشرة',
      downloadPdf: 'تحميل PDF',
      downloadPng: 'تحميل PNG',
      printDoc: 'طباعة الوثيقة',
      noTemplateTitle: 'لا يوجد قالب رسمي مرفوع لهذا التحديد',
      noTemplateBody: 'لم يرفع المدير العام القالب الأصلي لهذه الوثيقة بعد. النظام لا يولد محتوى تعليمياً تلقائياً.',
      templateNotice: 'المحتوى البيداغوجي الأصلي محفوظ بالكامل كما رفعه المدير؛ يقتصر التخصيص على البيانات والتنسيق البصري.',
    },
    research: {
      title: 'مجتمع البحث العلمي والمعرفة الأمازيغية',
      subtitle: 'منصة نشر أكاديمي محكمة للأبحاث اللغوية والتاريخية والثقافية.',
      searchPlaceholder: 'ابحث بالعنوان أو اسم الباحث أو التصنيف...',
      allCategories: 'جميع التخصصات',
      submitResearch: 'نشر بحث أو مقال',
      pendingModeration: 'قيد المراجعة',
      approved: 'معتمد ومنشور',
      rejected: 'مرفوض',
      abstract: 'الملخص العلمي',
      references: 'المصادر والمراجع',
      comments: 'التعليقات والنقاش الأكاديمي',
      addComment: 'أضف تعليقاً علمياً...',
      postComment: 'إرسال التعليق',
      like: 'إعجاب',
      share: 'مشاركة',
      copiedLink: 'تم نسخ رابط المقال',
      report: 'إبلاغ عن محتوى',
      reportSubmitted: 'تم إرسال البلاغ للمراجعة الإدارية.',
      noArticles: 'لا توجد منشورات علمية مطابقة حالياً.',
      categories: [
        { value: 'linguistic', label: 'الدراسات اللسانية' },
        { value: 'tifinagh', label: 'أبحاث تيفيناغ' },
        { value: 'historical', label: 'التاريخ والحضارة' },
        { value: 'heritage', label: 'توثيق التراث الثقافي' },
        { value: 'traditions', label: 'التقاليد والأعراف' },
        { value: 'literature', label: 'الأدب والشعر الأمازيغي' },
        { value: 'educational', label: 'الدراسات التربوية' },
        { value: 'books', label: 'الكتب والإصدارات' },
      ],
    },
    culture: {
      title: 'الثقافة والتراث الأمازيغي المغربي',
      subtitle: 'استكشاف حروف تيفيناغ، العمارة الأمازيغية، الفنون التقليدية، والهوية الحضارية.',
      tifinaghGuideTitle: 'المرجع التفاعلي لأبجدية تيفيناغ المعيارية',
      tifinaghGuideDesc: 'تعرف على الحروف الأمازيغية ونطقها الصوتي ومقابلاتها اللاتينية والعربية.',
      heritagePillarsTitle: 'ركائز الحضارة الأمازيغية',
      articlesTitle: 'مقالات التراث والثقافة',
    },
    about: {
      title: 'حول منصة برغازي',
      subtitle: 'رؤيتنا في رقمنة تعليم الأمازيغية وحفظ التراث المغربي وفق أعلى المعايير.',
      missionTitle: 'رسالة المنصة',
      missionBody:
        'تهدف منصة برغازي إلى توفير بنية تعليمية وبحثية موثوقة تجمع بين مكتبة الدروس الرسمية، واستوديو الوثائق التربوية القابلة للتخصيص، وفضاء النشر الأكاديمي المحكم.',
      audienceTitle: 'الفئات المستفيدة',
      architectureTitle: 'الحوكمة وحماية الملكية الفكرية',
    },
    contact: {
      title: 'تواصل مع إدارة برغازي',
      subtitle: 'نرحب باستفسارات الأساتذة والباحثين والشراكات الأكاديمية والإعلانية.',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      subject: 'الموضوع',
      message: 'نص الرسالة',
      send: 'إرسال الرسالة',
      sentSuccess: 'تم استلام رسالتك بنجاح وسنرد عليك قريباً.',
    },
    account: {
      title: 'حسابي الشخصي',
      profileTab: 'الملف المهني',
      bookmarksTab: 'المحفوظات',
      membershipTab: 'العضوية والاشتراك',
      transactionsTab: 'سجل المعاملات',
      saveProfile: 'حفظ التغييرات',
      savedSuccess: 'تم تحديث بيانات الحساب بنجاح.',
      upgradePlan: 'ترقية العضوية',
      activePlan: 'الباقة الحالية',
    },
    admin: {
      title: 'لوحة الإدارة والتحكم الشاملة',
      subtitle: 'إدارة الدروس، القوالب، الأبحاث، الصلاحيات، الإعلانات، الإيرادات، والتحليلات.',
      tabs: {
        overview: 'نظرة عامة',
        lessons: 'إدارة الدروس',
        documents: 'قوالب الوثائق',
        research: 'إدارة الأبحاث',
        users: 'المستخدمون والأدوار',
        ads: 'إدارة الإعلانات',
        monetization: 'الاشتراكات والمدفوعات',
        analytics: 'التحليلات والإحصائيات',
        appearance: 'تصميم المنصة',
        translations: 'إدارة اللغات',
        notifications: 'الرسائل والبلاغات',
        logs: 'سجلات الأمان',
        backup: 'النسخ الاحتياطي',
      },
    },
    common: {
      loading: 'جاري التحميل...',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      upload: 'رفع ملف',
      close: 'إغلاق',
      all: 'الكل',
      free: 'مجاني',
      premium: 'مميز',
      paid: 'مدفوع',
      sponsoredLabel: 'مساحة إعلانية معتمدة',
    },
  },

  en: {
    brand: 'Berghazi',
    brandSubtitle: 'Amazigh Educational & Heritage Platform',
    tagline: 'Education · Teaching Documents · Scientific Research',
    nav: {
      home: 'Home',
      lessons: 'Lessons',
      documents: 'Documents',
      research: 'Research',
      culture: 'Culture',
      studio: 'AI & Heritage Studio',
      about: 'About',
      account: 'Account',
      contact: 'Contact',
      admin: 'Admin',
    },
    auth: {
      signIn: 'Sign in with Google',
      signOut: 'Sign out',
      welcomeBack: 'Welcome back',
      visitorMode: 'Visitor',
      suspendedNotice: 'Your account is currently suspended.',
      roleLabels: {
        main_admin: 'Main Administrator',
        assistant_admin: 'Assistant Administrator',
        page_writer: 'Page Writer',
        permanent_member: 'Permanent Member',
        ordinary_member: 'Ordinary Member',
        visitor: 'Visitor',
      },
    },
    home: {
      heroTitle: 'Berghazi — The Amazigh Educational & Academic Knowledge Platform',
      heroSubtitle:
        'A multilingual digital institution serving primary educators, students, linguists, and researchers in Amazigh language, Tifinagh literacy, and Moroccan Amazigh heritage.',
      exploreLessons: 'Explore Lessons',
      openDocuments: 'Teaching Documents',
      pathwaysHeading: 'Six Educational Pathways',
      pathwaysSubheading:
        'Select your pathway, educational level, week, and lesson part to locate official administrator-published materials.',
      docsHeading: 'Educational Documents Studio',
      docsSubheading:
        'Personalize administrator-uploaded templates for mind maps and curriculum distributions without altering original educational content.',
      mindMapsTitle: 'Mind Map Generator',
      mindMapsDesc:
        'Apply teacher credentials, school branding, colors, and Amazigh frames onto uploaded templates and export to PDF or PNG.',
      distributionsTitle: 'Annual & Periodic Distributions',
      distributionsDesc:
        'Retrieve official distribution templates by pathway and level, personalize headers, and print clean classroom sheets.',
      latestResearchHeading: 'Latest Scientific Research',
      culturalHeading: 'Amazigh Culture & Heritage',
      popularResourcesHeading: 'Popular Educational Resources',
      membershipHeading: 'Join the Berghazi Academic Community',
      membershipDesc:
        'Create a verified account to access classroom documents, bookmark studies, and contribute peer-reviewed Amazigh scholarship.',
      joinNow: 'Register / Sign In',
      noResourcesYet: 'No official lessons have been uploaded by the administrator yet.',
      noResearchYet: 'No approved scientific publications are listed yet.',
    },
    lessons: {
      title: 'Official Lessons Library',
      subtitle: 'Select Track (ⴰⵙⴰⴽⴰ), Stage (ⵜⵉⴽⵍⵉ), Week (ⵉⵎⴰⵍⴰⵙⵙ), and Part (ⴰⴳⵣⵣⵓⵎ) in one clean view.',
      pathwayLabel: 'Track',
      trackTitle: 'ⴰⵙⴰⴽⴰ · Track',
      levelTitle: 'ⴰⵙⵡⵉⵔ · Level',
      stageTitle: 'ⵜⵉⴽⵍⵉ · Stage',
      weekTitle: 'ⵉⵎⴰⵍⴰⵙⵙ · Week',
      partTitle: 'ⴰⴳⵣⵣⵓⵎ · Part',
      step1: 'Track (ⴰⵙⴰⴽⴰ)',
      step2: 'Level (ⴰⵙⵡⵉⵔ)',
      step3: 'Stage (ⵜⵉⴽⵍⵉ)',
      step4: 'Week (ⵉⵎⴰⵍⴰⵙⵙ)',
      step5: 'Part (ⴰⴳⵣⵣⵓⵎ)',
      selectTrackPrompt: 'Select an educational track first.',
      selectLevelPrompt: 'Select a level.',
      selectStagePrompt: 'Select a stage (1–6).',
      selectWeekPrompt: 'Select a week (1–6).',
      selectPartPrompt: 'Select Part 1 or Part 2.',
      resetSelection: 'Reset Selection',
      selectLevel: 'Select Educational Level',
      stage: 'Stage',
      week: 'Week',
      part: 'Part',
      emptyTitle: 'No Official Lesson Uploaded',
      emptyBody:
        'The official lesson library starts empty. No lesson has been uploaded by the administrator for this Track, Stage, Week, and Part.',
      adminUploadPrompt: 'Upload Lesson in Admin Dashboard',
      viewOnline: 'View Online',
      downloadFile: 'Download File',
      bookmark: 'Save',
      bookmarked: 'Saved',
      lockedRegister: 'Sign in to access this registered resource',
      lockedPremium: 'Available to Premium Members',
      lockedPaid: 'Paid Educational Resource',
      levels: [
        { value: 'level_1', label: 'Level 1 (ⴰⵙⵡⵉⵔ 1)' },
        { value: 'level_2', label: 'Level 2 (ⴰⵙⵡⵉⵔ 2)' },
        { value: 'level_3', label: 'Level 3 (ⴰⵙⵡⵉⵔ 3)' },
        { value: 'level_4', label: 'Level 4 (ⴰⵙⵡⵉⵔ 4)' },
        { value: 'level_5', label: 'Level 5 (ⴰⵙⵡⵉⵔ 5)' },
        { value: 'level_6', label: 'Level 6 (ⴰⵙⵡⵉⵔ 6)' },
      ],
      unifiedLevels: [
        { value: 'level_1', label: 'Level 1', tazLabel: 'ⴰⵙⵡⵉⵔ 1' },
        { value: 'level_2', label: 'Level 2', tazLabel: 'ⴰⵙⵡⵉⵔ 2' },
        { value: 'level_3', label: 'Level 3', tazLabel: 'ⴰⵙⵡⵉⵔ 3' },
      ],
    },
    documents: {
      title: 'Educational Documents & Template Studio',
      subtitle:
        'Personalize official administrator-uploaded templates with your teacher profile, palette, and Amazigh framing.',
      tabs: {
        mindMap: 'Mind Map Generator',
        annual: 'Annual Distribution',
        periodic: 'Periodic Distributions',
      },
      teacherInfo: 'Teacher & School Information',
      teacherName: "Teacher's Full Name",
      schoolName: 'School Name',
      institution: 'Educational Institution / Directorate',
      academicYear: 'Academic Year',
      extraInfo: 'Additional Professional Info',
      selectionTitle: 'Educational Selection',
      customizationTitle: 'Design & Layout Customization',
      palette: 'Color Palette',
      background: 'Background Surface',
      typography: 'Typography',
      pattern: 'Amazigh Geometric Motif',
      layout: 'Layout Style',
      borderStyle: 'Borders & Frames',
      headerFooter: 'Header & Footer',
      preview: 'Live Print Preview',
      downloadPdf: 'Download PDF',
      downloadPng: 'Download PNG',
      printDoc: 'Print Document',
      noTemplateTitle: 'No Uploaded Template Available',
      noTemplateBody:
        'Berghazi never invents or auto-generates educational document content. Once the Main Administrator uploads the template for this selection, it will appear here for personalization.',
      templateNotice:
        'Original educational content remains strictly untouched. Customization applies only teacher metadata, color palette, borders, and print formatting.',
    },
    research: {
      title: 'Scientific Research & Amazigh Knowledge Community',
      subtitle: 'Moderated academic publishing dedicated to Amazigh linguistics, history, Tifinagh, and civilization.',
      searchPlaceholder: 'Search by title, author, or category...',
      allCategories: 'All Categories',
      submitResearch: 'Submit Publication',
      pendingModeration: 'Pending Moderation',
      approved: 'Approved',
      rejected: 'Rejected',
      abstract: 'Abstract',
      references: 'References & Sources',
      comments: 'Academic Discussion',
      addComment: 'Write a scholarly comment...',
      postComment: 'Post Comment',
      like: 'Endorse',
      share: 'Share',
      copiedLink: 'Citation link copied',
      report: 'Report',
      reportSubmitted: 'Report submitted for moderation.',
      noArticles: 'No approved research articles match your search yet.',
      categories: [
        { value: 'linguistic', label: 'Linguistic Research' },
        { value: 'tifinagh', label: 'Tifinagh Studies' },
        { value: 'historical', label: 'Historical Studies' },
        { value: 'heritage', label: 'Cultural Heritage' },
        { value: 'traditions', label: 'Traditions & Customs' },
        { value: 'literature', label: 'Literature & Poetry' },
        { value: 'educational', label: 'Educational Studies' },
        { value: 'books', label: 'Books & Publications' },
      ],
    },
    culture: {
      title: 'Amazigh Culture & Heritage',
      subtitle: 'Preserving Tifinagh script, Atlas architecture, traditional crafts, and Moroccan Amazigh civilization.',
      tifinaghGuideTitle: 'Interactive Tifinagh Script Explorer (Neo-Tifinagh)',
      tifinaghGuideDesc: 'Explore standard Tifinagh glyphs, Latin transliteration, Arabic equivalents, and phonetic names.',
      heritagePillarsTitle: 'Pillars of Moroccan Amazigh Heritage',
      articlesTitle: 'Cultural Heritage Publications',
    },
    about: {
      title: 'About Berghazi',
      subtitle: 'An institutional digital sanctuary for Amazigh education, teacher tooling, and scholarly preservation.',
      missionTitle: 'Our Educational Mission',
      missionBody:
        'Berghazi unites official six-pathway Amazigh curricula, customizable classroom documentation, and a peer-moderated research archive under strict intellectual property protection.',
      audienceTitle: 'Who Berghazi Serves',
      architectureTitle: 'Governance & Content Integrity',
    },
    contact: {
      title: 'Contact Berghazi',
      subtitle: 'Reach the platform administration regarding curricula, academic publishing, or institutional partnerships.',
      name: 'Full Name',
      email: 'Email Address',
      subject: 'Subject',
      message: 'Message',
      send: 'Send Message',
      sentSuccess: 'Your message has been delivered to the administration.',
    },
    account: {
      title: 'User Account & Profile',
      profileTab: 'Profile',
      bookmarksTab: 'Bookmarks',
      membershipTab: 'Membership & Plans',
      transactionsTab: 'Transactions',
      saveProfile: 'Save Profile',
      savedSuccess: 'Profile updated successfully.',
      upgradePlan: 'Upgrade Plan',
      activePlan: 'Current Plan',
    },
    admin: {
      title: 'Main Administrator Dashboard',
      subtitle: 'Full operational control over lessons, templates, research moderation, RBAC, ads, monetization, and logs.',
      tabs: {
        overview: 'Overview',
        lessons: 'Lessons (6 Pathways)',
        documents: 'Document Templates',
        research: 'Research Moderation',
        users: 'Users & RBAC',
        ads: 'Advertising',
        monetization: 'Monetization & Plans',
        analytics: 'Analytics & Revenue',
        appearance: 'Design & Settings',
        translations: 'Multilingual',
        notifications: 'Inbox & Reports',
        logs: 'Security Logs',
        backup: 'Backup & Restore',
      },
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      upload: 'Upload File',
      close: 'Close',
      all: 'All',
      free: 'Free',
      premium: 'Premium',
      paid: 'Paid',
      sponsoredLabel: 'Advertisement',
    },
  },
};
