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
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  theme: 'system',
  onboardingCompleted: false,
  lastBackupAt: null,
  backupReminderDismissedAt: null,
  installPromptDismissedAt: null,
  persistRequested: false,
};
