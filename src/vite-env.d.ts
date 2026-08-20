/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

interface Window {
  electronAPI?: {
    isElectron: boolean;
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    checkForUpdates: () => Promise<{ success: boolean; updateInfo?: any; isDev?: boolean; error?: string; currentVersion?: string }>;
    startDownloadUpdate: () => Promise<{ success: boolean; error?: string }>;
    quitAndInstall: () => Promise<void>;
    onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
    onUpdateDownloaded: (callback: (info: { version?: string; releaseNotes?: string }) => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
  };
}

