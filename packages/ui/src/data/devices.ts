export interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const defaultDevices: Device[] = [
  { id: "mobile", name: "iPhone 13", width: 390, height: 844 },
  { id: "tablet", name: "iPad Pro", width: 834, height: 1194 },
  { id: "desktop", name: "MacBook", width: 1280, height: 800 },
];
