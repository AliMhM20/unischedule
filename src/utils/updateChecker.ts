export const CURRENT_APP_VERSION = '1.1.7';

export interface UpdateInfo {
  status: 'checking' | 'update_available' | 'up_to_date' | 'no_internet' | 'error';
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
  errorMessage?: string;
}

/**
 * Compare two semver strings (e.g., "1.2.0" vs "1.1.7").
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, '').trim();
  const cleanV2 = v2.replace(/^v/i, '').trim();

  const parts1 = cleanV1.split('.').map(num => parseInt(num, 10) || 0);
  const parts2 = cleanV2.split('.').map(num => parseInt(num, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Check GitHub repository for the latest release or version
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  // 1. Check browser/system online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'no_internet',
      currentVersion: CURRENT_APP_VERSION,
      errorMessage: 'اتصال اینترنت شما قطع است. لطفاً وضعیت شبکه خود را بررسی کنید.',
    };
  }

  try {
    // 2. Fetch latest release from GitHub API
    const response = await fetch('https://api.github.com/repos/AliMhM20/unischedule/releases/latest', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const latestTag: string = data.tag_name || data.name || '';
      const latestVersion = latestTag.replace(/^v/i, '').trim();
      
      // Find direct .exe asset download URL if available, else use release HTML URL
      let downloadUrl = data.html_url || 'https://github.com/AliMhM20/unischedule/releases/latest';
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const exeAsset = data.assets.find((asset: { name?: string; browser_download_url?: string }) => 
          asset.name?.toLowerCase().endsWith('.exe')
        );
        if (exeAsset?.browser_download_url) {
          downloadUrl = exeAsset.browser_download_url;
        }
      }

      const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

      if (isNewer) {
        return {
          status: 'update_available',
          currentVersion: CURRENT_APP_VERSION,
          latestVersion,
          releaseNotes: data.body || 'به‌روزرسانی جدید شامل بهبود عملکرد و رفع اشکالات.',
          downloadUrl,
          publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString('fa-IR') : undefined,
        };
      } else {
        return {
          status: 'up_to_date',
          currentVersion: CURRENT_APP_VERSION,
          latestVersion,
        };
      }
    }

    // 3. Fallback: Check package.json on main branch directly if API fails (e.g. rate limit)
    const rawPkgResponse = await fetch('https://raw.githubusercontent.com/AliMhM20/unischedule/main/package.json', {
      cache: 'no-store',
    });

    if (rawPkgResponse.ok) {
      const pkg = await rawPkgResponse.json();
      const latestVersion = (pkg.version || '').trim();
      const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

      if (isNewer) {
        return {
          status: 'update_available',
          currentVersion: CURRENT_APP_VERSION,
          latestVersion,
          releaseNotes: 'نسخه جدید در دسترس است.',
          downloadUrl: 'https://github.com/AliMhM20/unischedule/releases/latest',
        };
      } else {
        return {
          status: 'up_to_date',
          currentVersion: CURRENT_APP_VERSION,
          latestVersion,
        };
      }
    }

    throw new Error(`پاسخ ناموفق از سرور (کد وضعیت: ${response.status})`);
  } catch (err: unknown) {
    const error = err as Error;
    // Check if network failed
    if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        status: 'no_internet',
        currentVersion: CURRENT_APP_VERSION,
        errorMessage: 'امکان برقراری ارتباط با سرور وجود ندارد. ممکن است اینترنت قطع باشد یا دسترسی مسدود شده باشد.',
      };
    }

    return {
      status: 'error',
      currentVersion: CURRENT_APP_VERSION,
      errorMessage: error.message || 'خطای ناشناخته در بررسی به‌روزرسانی رخ داد.',
    };
  }
}
