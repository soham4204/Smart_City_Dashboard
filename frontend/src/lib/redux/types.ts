// frontend/src/lib/types.ts

// ENUMS for consistent state management
export enum ZoneType {
  HOSPITAL = 'HOSPITAL',
  AIRPORT = 'AIRPORT',
  SCHOOL = 'SCHOOL',
  POLICE = 'POLICE',
  RESIDENTIAL = 'RESIDENTIAL',
  PLAYGROUND = 'PLAYGROUND',
  ROAD = 'ROAD',
}

export enum GeometryType {
  CIRCLE = 'CIRCLE',
  POLYGON = 'POLYGON',
}

export enum PoleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  FAULTY = 'FAULTY',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum OperationalStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED',
  TESTING = 'TESTING',
}

export enum SensorStatus {
  WORKING = 'WORKING',
  FAULTY = 'FAULTY',
  CALIBRATING = 'CALIBRATING',
}

export enum PrecipitationType {
  NONE = 'NONE',
  RAIN = 'RAIN',
  SNOW = 'SNOW',
  SLEET = 'SLEET',
  HAIL = 'HAIL',
}

// ZONE SCHEMA
export interface Zone {
  zoneId: string;
  zoneName: string;
  zoneType: ZoneType;
  priority: number; // 1-5
  coordinates: { lat: number; lng: number }[];
  geometry: GeometryType;
  radius?: number;
  parentZoneId: string | null;
  color: string;
}

// POLE SCHEMA
export interface Pole {
  // Common properties
  poleId: string;
  poleNumber: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  zoneId: string;
  zoneName: string;
  zonePriority: number;
  subZoneId: string | null;
  status: PoleStatus;
  operationalStatus: OperationalStatus;
  healthScore: number; // 0-100%
  brightness: number; // 0-100% - Added for lighting control

  // Weather-specific properties
  weather?: {
    temperature: {
      current: number; // Celsius
      sensorStatus: SensorStatus;
    };
    humidity: {
      relative: number; // %
      absolute: number; // g/m³
    };
    pressure: {
      current: number;
      sensorStatus: SensorStatus;
    };
    wind: {
      speed: number; // km/h
      direction: number; // degrees
      sensorStatus: SensorStatus;
    };
    precipitation: {
      type: PrecipitationType;
      intensity: number; // mm/hour
      sensorStatus: SensorStatus;
    };
    airQuality: {
      aqi: number;
      pm25: number;
      pm10: number;
      co: number;
      no2: number;
      o3: number;
      sensorStatus: SensorStatus;
    };
  };

  // Power Outage specific properties
  power?: {
    status: 'ONLINE' | 'OFFLINE' | 'BATTERY';
    source: 'GRID' | 'SOLAR' | 'BATTERY';
    voltage: number;
    consumption: number; // Watts
  };

  // Cybersecurity specific properties
  cyber?: {
    status: 'SECURE' | 'WARNING' | 'BREACHED';
    threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    lastScan: string; // ISO Date
  };
}
