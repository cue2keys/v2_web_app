import { useDeviceStore } from './deviceStore';
import { useKeypressStore } from './keypressStore';
import { useMagkeyStore } from './magkeyStore';

/**
 * Reset all connection-related state across stores.
 * This is equivalent to the old resetConnectionState action.
 */
export function resetAllStores() {
  useDeviceStore.getState().resetDeviceState();
  useKeypressStore.getState().resetKeypressState();
  useMagkeyStore.getState().resetMagkeyState();
}
