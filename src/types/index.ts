export type ItemCategory =
  | 'documents'
  | 'keys'
  | 'electronics'
  | 'car'
  | 'home'
  | 'travel'
  | 'valuable'
  | 'storage'
  | 'other';

export const CATEGORY_ORDER: ItemCategory[] = [
  'documents',
  'keys',
  'electronics',
  'car',
  'home',
  'travel',
  'valuable',
  'storage',
  'other',
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  documents: 'مستندات',
  keys: 'مفاتيح',
  electronics: 'إلكترونيات',
  car: 'سيارة',
  home: 'منزل',
  travel: 'سفر',
  valuable: 'أشياء ثمينة',
  storage: 'تخزين',
  other: 'أخرى',
};

export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  width: number | null;
  height: number | null;
  originalSize: number;
  compressedSize: number;
  createdAt: string;
}

export interface LocationHistoryEntry {
  id: string;
  location: string;
  note: string | null;
  createdAt: string;
}

export interface StoredItem {
  id: string;
  name: string;
  location: string;
  notes: string;
  category: ItemCategory | null;
  isFavorite: boolean;

  imageId: string | null;

  createdAt: string;
  updatedAt: string;

  locationHistory: LocationHistoryEntry[];

  /** Normalized, lowercased search text built from name + location + notes + category label */
  searchText: string;

  /** Soft-delete timestamp; when set the item is hidden but recoverable for undo */
  deletedAt?: string | null;
}

export interface AppSettings {
  id: string; // always 'app'
  theme: 'system' | 'light' | 'dark';
  onboardingCompleted: boolean;
  lastBackupAt: string | null;
  backupReminderDismissedAt: string | null;
  installPromptDismissedAt: string | null;
  persistRequested: boolean;

  // ── App lock (UI gate, not encryption) ────────────────────────────
  // When lockEnabled is true, the app shows a lock screen on launch
  // requiring the password (or biometric, if enabled) before access.
  // The password is stored as a SHA-256 hash + random salt. Biometric
  // uses WebAuthn platform authenticator (fingerprint/face) and stores
  // only the credential ID. No data is encrypted — this is a UI gate.
  lockEnabled: boolean;
  passwordHash: string | null; // base64 of SHA-256(salt + password)
  passwordSalt: string | null; // base64 of random 16-byte salt
  biometricEnabled: boolean;
  biometricCredentialId: string | null; // base64 of WebAuthn credential ID
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  theme: 'system',
  onboardingCompleted: false,
  lastBackupAt: null,
  backupReminderDismissedAt: null,
  installPromptDismissedAt: null,
  persistRequested: false,
  lockEnabled: false,
  passwordHash: null,
  passwordSalt: null,
  biometricEnabled: false,
  biometricCredentialId: null,
};
