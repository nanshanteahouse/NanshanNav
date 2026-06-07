export interface TranslationSchema {
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
      name: string;
      content: string;
    };
    webLink: {
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
    settings: string;
    delete: string;
    editControls: string;
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
    cellSize: string;
    showGridLines: string;
    editMode: string;
    exportImport: string;
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
  };
}
