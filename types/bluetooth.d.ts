// Web Bluetooth API type definitions
// Add this to support Web Bluetooth in TypeScript

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  readonly watchingAdvertisements: boolean;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;
type BluetoothDescriptorUUID = number | string;

interface BluetoothLEScanFilterInit {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: BluetoothManufacturerDataFilterInit[];
  serviceData?: BluetoothServiceDataFilterInit[];
}

interface BluetoothManufacturerDataFilterInit {
  companyIdentifier: number;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

interface BluetoothServiceDataFilterInit {
  service: BluetoothServiceUUID;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilterInit[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
  optionalManufacturerData?: number[];
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}

interface Navigator {
  bluetooth: Bluetooth;
}
