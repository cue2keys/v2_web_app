import { useEffect } from 'react';
import { fetchLatestFirmwareRelease, isFirmwareUpdateAvailable } from '@/lib/firmwareRelease';
import { logger } from '@/lib/logger';
import { formatErrorMessage } from '@/lib/utils';
import { useDeviceStore } from '@/store/deviceStore';
import { useShallow } from 'zustand/react/shallow';

interface UseFirmwareReleaseArgs {
  currentFirmware: string;
  enabled: boolean;
}

export function useFirmwareRelease({ currentFirmware, enabled }: UseFirmwareReleaseArgs) {
  const {
    setLatestFirmwareVersion,
    setLatestReleaseUrl,
    setUpdateAvailable,
    setFirmwareCheckState,
    resetFirmwareReleaseInfo,
  } = useDeviceStore(
    useShallow((state) => ({
      setLatestFirmwareVersion: state.setLatestFirmwareVersion,
      setLatestReleaseUrl: state.setLatestReleaseUrl,
      setUpdateAvailable: state.setUpdateAvailable,
      setFirmwareCheckState: state.setFirmwareCheckState,
      resetFirmwareReleaseInfo: state.resetFirmwareReleaseInfo,
    })),
  );

  useEffect(() => {
    if (!enabled || !currentFirmware) {
      resetFirmwareReleaseInfo();
      return;
    }

    let cancelled = false;
    setFirmwareCheckState('checking');

    void (async () => {
      try {
        const release = await fetchLatestFirmwareRelease();
        if (cancelled) return;
        setLatestFirmwareVersion(release.firmwareVersion);
        setLatestReleaseUrl(release.releaseUrl);
        setUpdateAvailable(isFirmwareUpdateAvailable(currentFirmware, release.firmwareVersion));
        setFirmwareCheckState('ready');
      } catch (error) {
        if (cancelled) return;
        logger.warn(`firmware release check failed: ${formatErrorMessage(error)}`);
        resetFirmwareReleaseInfo();
        setFirmwareCheckState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentFirmware,
    enabled,
    resetFirmwareReleaseInfo,
    setFirmwareCheckState,
    setLatestFirmwareVersion,
    setLatestReleaseUrl,
    setUpdateAvailable,
  ]);
}
