const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/cue2keys/v2_qmk_fw/releases/latest';
const SEMVER_RE = /^\d+(?:\.\d+)*$/;
const LEGACY_FIRMWARE_VERSION_RE = /^\d{8}-(\d+(?:\.\d+)*)$/;

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubReleaseResponse {
  html_url: string;
  assets: GitHubReleaseAsset[];
}

interface FirmwareManifestArtifact {
  name: string;
  sha256: string;
}

interface FirmwareManifest {
  qmk?: {
    firmware_version?: string;
    release_url?: string;
    uf2?: FirmwareManifestArtifact;
  };
}

export interface FirmwareReleaseInfo {
  firmwareVersion: string;
  releaseUrl: string;
  uf2Name: string;
  uf2Sha256: string;
}

function normalizeFirmwareVersion(version: string): string | null {
  const trimmed = version.trim();
  if (!trimmed) return null;
  if (SEMVER_RE.test(trimmed)) return trimmed;

  const legacyMatch = LEGACY_FIRMWARE_VERSION_RE.exec(trimmed);
  if (!legacyMatch) return null;
  return legacyMatch[1] ?? null;
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

export async function fetchLatestFirmwareRelease(): Promise<FirmwareReleaseInfo> {
  const releaseResponse = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!releaseResponse.ok) {
    throw new Error(`latest release request failed: ${releaseResponse.status}`);
  }

  const release = (await releaseResponse.json()) as GitHubReleaseResponse;
  const manifestAsset = release.assets.find((asset) => asset.name === 'manifest.json');
  if (!manifestAsset) {
    throw new Error('manifest.json not found in latest release');
  }

  const manifestResponse = await fetch(manifestAsset.browser_download_url, {
    headers: { Accept: 'application/json' },
  });
  if (!manifestResponse.ok) {
    throw new Error(`manifest request failed: ${manifestResponse.status}`);
  }

  const manifest = (await manifestResponse.json()) as FirmwareManifest;
  const firmwareVersion = manifest.qmk?.firmware_version?.trim() ?? '';
  const releaseUrl = manifest.qmk?.release_url?.trim() || release.html_url;
  const uf2Name = manifest.qmk?.uf2?.name?.trim() ?? '';
  const uf2Sha256 = manifest.qmk?.uf2?.sha256?.trim() ?? '';

  if (!firmwareVersion || !releaseUrl || !uf2Name || !uf2Sha256) {
    throw new Error('latest firmware manifest is missing qmk release metadata');
  }

  return {
    firmwareVersion,
    releaseUrl,
    uf2Name,
    uf2Sha256,
  };
}
