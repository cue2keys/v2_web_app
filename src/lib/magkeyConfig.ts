import { clampMagkey } from '@/lib/utils';

export const MAGKEY_RT_DEFAULT_RELEASE = 100;

export const getMagkeyReleaseUi = (rapid: boolean): { label: string; hint: string } =>
  rapid
    ? {
        label: 'RT距離 (Release)',
        hint: 'RT有効時は入力値=戻し距離、スライダーは発動位置(Actuation - 距離)を表示します。',
      }
    : {
        label: 'Reset',
        hint: 'キーを戻した位置を設定します。',
      };

export const getMagkeyReleasePoint = ({
  actuation,
  release,
  rapid,
}: {
  actuation: number;
  release: number;
  rapid: boolean;
}): number => clampMagkey(rapid ? actuation - release : release);

export const toRapidToggleState = ({
  currentRapid,
  nextRapid,
  release,
  releaseBeforeRapid,
  defaultRelease = MAGKEY_RT_DEFAULT_RELEASE,
}: {
  currentRapid: boolean;
  nextRapid: boolean;
  release: number;
  releaseBeforeRapid: number | null;
  defaultRelease?: number;
}): {
  rapid: boolean;
  release: number;
  releaseBeforeRapid: number | null;
} => {
  const normalizedRelease = clampMagkey(release);
  const normalizedBeforeRapid =
    releaseBeforeRapid === null ? null : clampMagkey(releaseBeforeRapid);
  if (currentRapid === nextRapid) {
    return {
      rapid: currentRapid,
      release: normalizedRelease,
      releaseBeforeRapid: normalizedBeforeRapid,
    };
  }
  if (nextRapid) {
    return {
      rapid: true,
      release: clampMagkey(defaultRelease),
      releaseBeforeRapid: normalizedRelease,
    };
  }
  const restore = clampMagkey(normalizedBeforeRapid ?? normalizedRelease);
  return {
    rapid: false,
    release: restore,
    releaseBeforeRapid: restore,
  };
};
