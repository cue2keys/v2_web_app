const GITHUB_LATEST_RELEASE_API_URL =
  'https://api.github.com/repos/cue2keys/v2_qmk_fw/releases/latest';
const SEMVER_RE = /^\d+(?:\.\d+)*$/;
const PREFXED_SEMVER_RE = /^[vV](\d+(?:\.\d+)*)$/;
const LEGACY_FIRMWARE_VERSION_RE = /^\d{8}-(\d+(?:\.\d+)*)$/;
const EMBEDDED_PREFXED_SEMVER_RE = /[vV](\d+(?:\.\d+)*)/;
const EMBEDDED_SEMVER_RE = /(\d+(?:\.\d+)*)/;

interface GitHubReleaseAsset {
  name: string;
  browser_download_url?: string;
}

interface GitHubReleaseResponse {
  tag_name?: string;
  html_url?: string;
  assets?: GitHubReleaseAsset[];
}

export interface FirmwareReleaseInfo {
  firmwareVersion: string;
  downloadUrl: string;
  releaseUrl: string;
}

function normalizeFirmwareVersion(version: string): string | null {
  const trimmed = version.trim();
  if (!trimmed) return null;
  if (SEMVER_RE.test(trimmed)) return trimmed;

  const prefixedSemverMatch = PREFXED_SEMVER_RE.exec(trimmed);
  if (prefixedSemverMatch) {
    return prefixedSemverMatch[1] ?? null;
  }

  const legacyMatch = LEGACY_FIRMWARE_VERSION_RE.exec(trimmed);
  if (legacyMatch) {
    return legacyMatch[1] ?? null;
  }

  const embeddedPrefixedSemverMatch = EMBEDDED_PREFXED_SEMVER_RE.exec(trimmed);
  if (embeddedPrefixedSemverMatch) {
    return embeddedPrefixedSemverMatch[1] ?? null;
  }

  const embeddedSemverMatch = EMBEDDED_SEMVER_RE.exec(trimmed);
  if (!embeddedSemverMatch) return null;
  return embeddedSemverMatch[1] ?? null;
}

function parseFirmwareVersion(version: string) {
  const normalizedVersion = normalizeFirmwareVersion(version);
  if (!normalizedVersion) return null;
  return {
    parts: normalizedVersion.split('.').map((part) => Number(part)),
  };
}

export function compareFirmwareVersions(current: string, latest: string): number | null {
  const currentParsed = parseFirmwareVersion(current);
  const latestParsed = parseFirmwareVersion(latest);
  if (!currentParsed || !latestParsed) return null;

  const maxLength = Math.max(currentParsed.parts.length, latestParsed.parts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = currentParsed.parts[index] ?? 0;
    const latestPart = latestParsed.parts[index] ?? 0;
    if (currentPart !== latestPart) {
      return currentPart - latestPart;
    }
  }
  return 0;
}

export function isFirmwareUpdateAvailable(current: string, latest: string): boolean {
  const comparison = compareFirmwareVersions(current, latest);
  return comparison === null ? false : comparison < 0;
}

function getReleaseDownloadUrl(release: GitHubReleaseResponse): string {
  const releaseUf2Asset = release.assets?.find(
    (asset) =>
      asset.name.endsWith('.uf2') &&
      !asset.name.endsWith('_debug.uf2') &&
      Boolean(asset.browser_download_url),
  );
  return releaseUf2Asset?.browser_download_url ?? '';
}

export async function fetchLatestFirmwareRelease(): Promise<FirmwareReleaseInfo> {
  const releaseResponse = await fetch(GITHUB_LATEST_RELEASE_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });
  if (!releaseResponse.ok) {
    throw new Error(`latest release request failed: ${releaseResponse.status}`);
  }

  const release = (await releaseResponse.json()) as GitHubReleaseResponse;
  const firmwareVersion = normalizeFirmwareVersion(release.tag_name ?? '');
  const releaseUrl = release.html_url?.trim() ?? '';
  if (!firmwareVersion || !releaseUrl) {
    throw new Error('latest release response is missing version metadata');
  }

  const downloadUrl = getReleaseDownloadUrl(release) || releaseUrl;

  return {
    firmwareVersion,
    downloadUrl,
    releaseUrl,
  };
}
