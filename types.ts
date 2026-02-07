
export enum MaintenanceType {
  CORRETIVA = 'Corretiva',
  PREVENTIVA = 'Preventiva',
  PREDITIVA = 'Preditiva'
}

export interface ServiceItem {
  id: string;
  category: string;
  system: string;
  name: string;
  quantity: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  mechanics: string[];
  plate: string;
  km: number;
  type: MaintenanceType;
  observations: string;
  services: ServiceItem[];
  photos?: string[];
}

export interface AppState {
  currentMaintenance: MaintenanceRecord | null;
  history: MaintenanceRecord[];
}
