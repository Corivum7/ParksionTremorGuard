import { apiFetch } from './client';

export interface DeviceBind {
  name: string;
  mac_address: string;
  serial_number: string;
  firmware_version?: string;
  hardware_version?: string;
  model?: string;
  device_key: string;
  patient_id?: string;
  battery_level?: number;
}

export interface DeviceResponse {
  id: string;
  user_id: string;
  name: string;
  mac_address: string;
  serial_number: string;
  firmware_version: string;
  hardware_version: string;
  model: string;
  status: string;
  battery_level: number;
  bound_at: string;
}

export async function listDevices(): Promise<DeviceResponse[]> {
  return apiFetch<DeviceResponse[]>('/devices');
}

export async function bindDevice(data: DeviceBind): Promise<DeviceResponse> {
  return apiFetch<DeviceResponse>('/devices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDevice(deviceId: string): Promise<DeviceResponse> {
  return apiFetch<DeviceResponse>(`/devices/${deviceId}`);
}

export async function unbindDevice(deviceId: string): Promise<void> {
  return apiFetch<void>(`/devices/${deviceId}`, {
    method: 'DELETE',
  });
}