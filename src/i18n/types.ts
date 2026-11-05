import type { SYNC_TEXT } from "./sync-messages";
export interface TranslationSchema {
  sync: typeof SYNC_TEXT.en;
  review: {
    managementLoading: string;
    managementUnavailable: string;
    readOnly: string;
    globalShortcut: string;
    recoveryNotice: string;
    healthHistory: string;
    lastSuccess: string;
    healthUnknown: string;
    healthHistoryHint: string;

    imageTypes: string;
    embedBlocked: string;
    openExternal: string;
    embedHint: string;
    noUrl: string;
    loadFailed: string;
    pveHost: string;
    selectHost: string;
    pveHostHelp: string;
    tokenConfigured: string;
    tokenHelp: string;
    tokenFailed: string;
    tags: string;
    starter: string;
    template: string;
    homeTemplate: string;
    minimalTemplate: string;
    workTemplate: string;
    templateHelp: string;
    apply: string;
    bookmarks: string;
    bookmarkHelp: string;
    importPreview: string;
    importInvalid: string;
    importBookmarks: string;
    globalSearch: string;
    searchEmpty: string;
    noResults: string;
    shortcutHint: string;
    uploadFailed: string;
    iconSource: string;
    customUpload: string;
    initialLetter: string;
    customIcon: string;
    linkNumber: string;
  };
  app: {
    title: string;
    description: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    confirm: string;
    loading: string;
    error: string;
    retry: string;
    search: string;
    settings: string;
    close: string;
    off: string;
    on: string;
    no: string;
    yes: string;
    never: string;
  };
  registry: {
    group: {
      content: string;
      navigation: string;
      media: string;
      system: string;
      utilities: string;
    };
    widget: {
      clock: string;
      titleHeader: string;
      markdownText: string;
      webLink: string;
      webPage: string;
      pveStatus: string;
      searchBox: string;
      image: string;
    };
  };
  widget: {
    clock: {
      name: string;
      displayMode: {
        analog: string;
        digital: string;
      };
      timezone: string;
      showSeconds: string;
      showDate: string;
      dateFormat: string;
      is24Hour: string;
    };
    titleHeader: {
      headingLabel: string;
      alignment: string;
      name: string;
      headingLevel: string;
      textAlign: {
        left: string;
        center: string;
        right: string;
      };
      showDivider: string;
      iconName: string;
    };
    markdownText: {
      emptyMessage: string;
      preview: string;
      nothingToPreview: string;
      placeholder: string;
      name: string;
      content: string;
    };
    webLink: {
      displayFields: string;
      emptyMessage: string;
      checking: string;
      online: string;
      offline: string;
      name: string;
      links: string;
      linkName: string;
      url: string;
      description: string;
      icon: string;
      openInNewTab: string;
      healthCheckEnabled: string;
      healthCheckInterval: string;
      showName: string;
      showUrl: string;
      showDescription: string;
      addLink: string;
      dragToReorder: string;
    };
    webPage: {
      name: string;
      url: string;
    };
    pveStatus: {
      name: string;
      proxmoxHost: string;
      nodeName: string;
      cpu: string;
      memory: string;
      uptime: string;
      storage: string;
      vmCounts: string;
      refreshInterval: string;
      running: string;
      stopped: string;
      connectionError: string;
      showCpu: string;
      showMemory: string;
      showUptime: string;
      showStorage: string;
      showVmCounts: string;
      showTitleLink: string;
      openWebUi: string;
      loading: string;
      noData: string;
      lastUpdate: string;
      vms: string;
      lxcs: string;
    };
    searchBox: {
      name: string;
      placeholder: string;
      defaultEngine: string;
      customEngineUrl: string;
      enableLocalSearch: string;
      ctrlKEnabled: string;
      engines: {
        google: string;
        baidu: string;
        bing: string;
        duckduckgo: string;
        custom: string;
      };
    };
    image: {
      emptyMessage: string;
      loadFailed: string;
      source: string;
      url: string;
      uploadImage: string;
      scale: string;
      horizontalAlignment: string;
      verticalAlignment: string;
      clickAction: string;
      altPlaceholder: string;
      containDescription: string;
      coverDescription: string;
      fillDescription: string;
      originalDescription: string;
      noneDescription: string;
      previewDescription: string;
      linkDescription: string;
      name: string;
      alt: string;
      sourceType: {
        url: string;
        upload: string;
      };
      scaleMode: {
        contain: string;
        cover: string;
        fill: string;
        original: string;
      };
      alignX: {
        left: string;
        center: string;
        right: string;
      };
      alignY: {
        top: string;
        center: string;
        bottom: string;
      };
      caption: string;
      borderRadius: string;
      showShadow: string;
      onClick: {
        none: string;
        preview: string;
        link: string;
      };
      linkUrl: string;
      openInNewTab: string;
    };
  };
  dashboard: {
    title: string;

    toolbar: string;
    emptyTitle: string;
    emptyDescription: string;
    startEditing: string;
  };
  sidebar: {
    title: string;
    open: string;
    close: string;
    widgetLibrary: string;
    addWidget: string;
    clickOrDrag: string;
    cellsSuffix: string;
  };
  widgetShell: {
    moreOptions: string;
    moveUp: string;
    moveDown: string;
    width: string;
    height: string;
    layout: string;

    settings: string;
    delete: string;
    editControls: string;
    copy: string;
    paste: string;
    duplicate: string;
  };
  settings: {
    configure: string;
    widgetTitle: string;
    widgetTitlePlaceholder: string;
    loading: string;
    deleteWidget: string;
    confirmDeleteMessage: string;
    noSettings: string;
    typeAndId: string;
  };
  error: {
    title: string;
    retry: string;
    remove: string;
  };
  toolbar: {
    viewOptions: string;
    moreOptions: string;
    theme: string;
    themeLight: string;
    themeDark: string;

    cellSize: string;
    showGridLines: string;
    editMode: string;
    exportImport: string;
    undo: string;
    redo: string;
    showGrid: string;
    hideGrid: string;
    exportConfig: string;
    importConfig: string;
    importError: string;
    switchToLight: string;
    switchToDark: string;
    themeSystem: string;
    colorPalette: string;
    enterEditMode: string;
    exitEditMode: string;
    saveExit: string;
    editBtn: string;
    rowHeight: string;
    rowLabel: string;
    toggleWidgetPanel: string;
  };
  colorEditor: {
    contrastWarning: string;
    title: string;
    lightTheme: string;
    darkTheme: string;
    resetDefault: string;
    bgPrimary: string;
    bgSecondary: string;
    bgWidget: string;
    bgWidgetHover: string;
    bgInput: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textAccent: string;
    borderDefault: string;
    borderFocus: string;
    statusOnline: string;
    statusOffline: string;
    statusWarning: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    glassSection: string;
    glassEnabled: string;
    glassBlur: string;
  };
}
