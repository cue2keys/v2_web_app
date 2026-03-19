import type { DeviceItemT } from '@/generated/pendant/v2';
import { ModuleType } from '@/generated/pendant/v2/module-type';

const KEY_MODULE_TYPES = new Set<ModuleType>([
  ModuleType.V2_Keys4,
  ModuleType.V2_MagKeys4,
  ModuleType.V1_PCA9557_Keys4,
  ModuleType.V1_PCA9557_Keys5,
  ModuleType.V1_XL9555_Keys4,
  ModuleType.V1_XL9555_Keys5,
]);

const V2_KEY_MODULE_TYPES = new Set<ModuleType>([ModuleType.V2_Keys4, ModuleType.V2_MagKeys4]);

const ROTARY_ENCODER_TYPES = new Set<ModuleType>([ModuleType.V1_PCA9534A_RE, ModuleType.V2_RE]);
const FIXED_MODULE_TYPES = new Set<ModuleType>([ModuleType.I2C_MUX]);
const OTHER_MODULE_TYPES = new Set<ModuleType>([ModuleType.DISPLAY]);
const EDITABLE_ADDR_TYPES = new Set<ModuleType>([
  ModuleType.V2_Keys4,
  ModuleType.V2_RE,
  ModuleType.V2_MagKeys4,
]);

export interface ClassifiedDeviceGroups {
  recognizedItems: DeviceItemT[];
  sortedFixedModuleItems: DeviceItemT[];
  sortedOtherModuleItems: DeviceItemT[];
  sortedUnrecognizedItems: DeviceItemT[];
  recognitionLabelByKey: Map<string, string>;
}

export const deviceIdentityKey = (device: DeviceItemT): string =>
  device.uid !== BigInt(0)
    ? device.uid.toString()
    : `${device.ch}-${device.addr}-${device.type}-${device.shift}`;

export const isKeyModuleType = (type: ModuleType): boolean => KEY_MODULE_TYPES.has(type);

export const isV2KeyModuleType = (type: ModuleType): boolean => V2_KEY_MODULE_TYPES.has(type);

export const isRotaryEncoderType = (type: ModuleType): boolean => ROTARY_ENCODER_TYPES.has(type);

export const isFixedModuleType = (type: ModuleType): boolean => FIXED_MODULE_TYPES.has(type);

export const isOtherModuleType = (type: ModuleType): boolean => OTHER_MODULE_TYPES.has(type);

export const canEditI2CAddress = (type: ModuleType): boolean => EDITABLE_ADDR_TYPES.has(type);

const compareByAddress = (a: DeviceItemT, b: DeviceItemT) => a.addr - b.addr;

const compareByDeviceIdentity = (a: DeviceItemT, b: DeviceItemT) => {
  if (a.ch !== b.ch) return a.ch - b.ch;
  if (a.addr !== b.addr) return a.addr - b.addr;
  if (a.type !== b.type) return a.type - b.type;
  if (a.shift !== b.shift) return a.shift - b.shift;
  if (a.uid > b.uid) return 1;
  if (a.uid < b.uid) return -1;
  return 0;
};

export function classifyDevices(items: DeviceItemT[]): ClassifiedDeviceGroups {
  const recognitionLabelByKey = new Map<string, string>();
  const byChannel = new Map<number, DeviceItemT[]>();
  for (const device of items) {
    const list = byChannel.get(device.ch);
    if (list) {
      list.push(device);
    } else {
      byChannel.set(device.ch, [device]);
    }
  }

  const channelIds = Array.from(byChannel.keys()).sort((a, b) => a - b);
  const recognizedItems: DeviceItemT[] = [];

  for (const channelId of channelIds) {
    const devicesInChannel = byChannel.get(channelId) ?? [];
    const keyModules = devicesInChannel.filter((device) => isKeyModuleType(device.type));
    const v2Keys = keyModules
      .filter((device) => isV2KeyModuleType(device.type))
      .sort(compareByAddress);
    const v1Keys = keyModules
      .filter((device) => !isV2KeyModuleType(device.type))
      .sort(compareByAddress);

    [...v2Keys, ...v1Keys].forEach((device, idx) => {
      recognitionLabelByKey.set(deviceIdentityKey(device), `${channelId}-key${idx + 1}`);
    });

    const rotaryEncoders = devicesInChannel
      .filter((device) => isRotaryEncoderType(device.type))
      .sort(compareByAddress)
      .map((device, idx) => {
        recognitionLabelByKey.set(deviceIdentityKey(device), `${channelId}-re${idx + 1}`);
        return device;
      });

    recognizedItems.push(...v2Keys, ...v1Keys, ...rotaryEncoders);
  }

  const recognizedKeySet = new Set(recognitionLabelByKey.keys());
  const unrecognizedItems = items.filter(
    (device) => !recognizedKeySet.has(deviceIdentityKey(device)),
  );

  const fixedModuleItems = unrecognizedItems.filter((device) => isFixedModuleType(device.type));
  const otherModuleItems = unrecognizedItems.filter((device) => isOtherModuleType(device.type));
  const unknownItems = unrecognizedItems.filter(
    (device) => !isFixedModuleType(device.type) && !isOtherModuleType(device.type),
  );

  return {
    recognizedItems,
    sortedFixedModuleItems: [...fixedModuleItems].sort(compareByDeviceIdentity),
    sortedOtherModuleItems: [...otherModuleItems].sort(compareByDeviceIdentity),
    sortedUnrecognizedItems: [...unknownItems].sort(compareByDeviceIdentity),
    recognitionLabelByKey,
  };
}
