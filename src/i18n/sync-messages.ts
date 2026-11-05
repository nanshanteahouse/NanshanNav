export const SYNC_TEXT = {
  en: {
    storageFailure:
      "Browser storage is unavailable. Export your draft before leaving.",
    saving: "Saving…",
    draftStored: "Draft stored locally",
    saved: "Saved",
    fullBackup: "Full backup",
    exportBackup: "Export backup with uploaded images",
    versions: "Saved versions",
    restorePreview: "Restore preview",
    widgets: "widgets",
    images: "uploaded images",
    restoreHelp:
      "Import can be undone. Save and exit to persist it on the server. External image URLs are retained.",
    versionHelp:
      "Restoring writes to the server immediately and archives its current version. Export any local draft first.",
    noVersions: "No saved versions yet",
    restore: "Restore",
    backupTooLarge: "Backup exceeds 100 MB",
    versionsFailed: "Unable to load versions ({status})",
    invalidVersionResponse: "Invalid version response",
    loadAccess: "Dashboard access was denied by the server or gateway.",
    loadFailed:
      "Unable to load dashboard ({status}). Your local draft is retained.",
    saveConflict:
      "Another device saved a newer version. Export your draft, then reload before merging your changes.",
    saveAccess:
      "Management access was denied by the server or gateway. Your draft is retained.",
    saveFailed: "Save failed ({status}). Your draft is retained; please retry.",
    saveUnconfirmed:
      "The server did not confirm the save. Your draft is retained.",
    restoreConflict:
      "A newer server version exists. Reload before restoring a version.",
    restoreFailed: "Restore failed ({status}). Your draft is retained.",
    restoreChanged:
      "The server version was restored. Edits made during restoration remain in your local draft.",
  },
  "zh-CN": {
    storageFailure: "本机存储不可用，请在离开页面前导出草稿。",
    saving: "保存中…",
    draftStored: "草稿已保存在本机",
    saved: "已保存",
    fullBackup: "完整备份",
    exportBackup: "导出完整备份（含上传图片）",
    versions: "历史版本",
    restorePreview: "恢复预览",
    widgets: "个组件",
    images: "张上传图片",
    restoreHelp:
      "应用后可撤销；点击“保存并退出”后才会写入服务端。外部图片保留原网址。",
    versionHelp:
      "恢复会立即写入服务端，并保存当前服务端版本。未保存的本机草稿请先导出备份。",
    noVersions: "暂无历史版本",
    restore: "恢复",
    backupTooLarge: "备份不能超过100 MB",
    versionsFailed: "读取历史失败 ({status})",
    invalidVersionResponse: "历史版本响应格式错误",
    loadAccess: "服务端或网关拒绝访问面板。",
    loadFailed: "读取面板失败 ({status})，本机草稿已保留。",
    saveConflict:
      "其他设备已保存新版本。请先导出本机草稿，再刷新页面合并修改。",
    saveAccess: "服务端或网关拒绝管理操作，本机草稿已保留。",
    saveFailed: "保存失败 ({status})，草稿已保留，请重试。",
    saveUnconfirmed: "服务端未确认保存成功，本机草稿已保留。",
    restoreConflict: "服务端已有更新的版本，请刷新页面后再恢复。",
    restoreFailed: "恢复失败 ({status})，本机草稿已保留。",
    restoreChanged: "服务端版本已恢复。恢复期间新增的修改仍保留在本机草稿中。",
  },
};
export type SyncMessageKey = keyof typeof SYNC_TEXT.en;
export function syncText(
  locale: string,
  key: SyncMessageKey,
  params: Record<string, string | number> = {},
) {
  let value = (locale === "zh-CN" ? SYNC_TEXT["zh-CN"] : SYNC_TEXT.en)[key];
  for (const [key, replacement] of Object.entries(params))
    value = value.replaceAll(`{${key}}`, String(replacement));
  return value;
}
