import { ISettingsRepository } from './interfaces';
import { AppSettings, ActivityItem, BackupData } from '../../types/settings';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { appConfig } from '../../config/appConfig';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const defaultSettings: AppSettings = {
  appName: appConfig.name,
  theme: 'light',
  defaultTicketAmount: appConfig.defaults.ticketAmount,
  defaultNumberPadding: appConfig.defaults.numberPadding,
  defaultPaperSize: appConfig.defaults.paperSize,
  defaultOrientation: appConfig.defaults.orientation,
  defaultTicketsPerRow: appConfig.defaults.bookletsPerRow,
};

export class LocalStorageSettingsRepository implements ISettingsRepository {
  getSettings(): AppSettings {
    return storageAdapter.get<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    storageAdapter.set(STORAGE_KEYS.SETTINGS, updated);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('app_settings').upsert(
          {
            id: 'global_settings',
            organization_name: updated.appName || appConfig.name,
            theme_mode: updated.theme || 'light',
            default_paper_size: updated.defaultPaperSize || 'Folio',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase settings save error:', res.error);
        })
        .catch((err) => console.error('Supabase settings save error:', err));
    }

    return updated;
  }

  getActivities(): ActivityItem[] {
    const activities = storageAdapter.get<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, []);
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  }

  addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): ActivityItem {
    const activities = storageAdapter.get<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, []);
    const newActivity: ActivityItem = {
      ...activity,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    activities.unshift(newActivity);
    storageAdapter.set(STORAGE_KEYS.ACTIVITIES, activities.slice(0, 100));
    return newActivity;
  }

  exportAllData(): BackupData {
    return {
      version: appConfig.version,
      exportedAt: new Date().toISOString(),
      users: storageAdapter.get(STORAGE_KEYS.USERS, []),
      raffles: storageAdapter.get(STORAGE_KEYS.RAFFLES, []),
      designs: storageAdapter.get(STORAGE_KEYS.DESIGNS, []),
      printLayouts: storageAdapter.get(STORAGE_KEYS.PRINT_LAYOUTS, []),
      printSets: storageAdapter.get(STORAGE_KEYS.PRINT_SETS, []),
      booklets: storageAdapter.get(STORAGE_KEYS.BOOKLETS, []),
      tickets: storageAdapter.get(STORAGE_KEYS.TICKETS, []),
      expenses: storageAdapter.get(STORAGE_KEYS.EXPENSES, []),
      activities: storageAdapter.get(STORAGE_KEYS.ACTIVITIES, []),
      settings: this.getSettings(),
    };
  }

  importAllData(data: BackupData): boolean {
    try {
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.users)) storageAdapter.set(STORAGE_KEYS.USERS, data.users);
      if (Array.isArray(data.raffles)) storageAdapter.set(STORAGE_KEYS.RAFFLES, data.raffles);
      if (Array.isArray(data.designs)) storageAdapter.set(STORAGE_KEYS.DESIGNS, data.designs);
      if (Array.isArray(data.printLayouts)) storageAdapter.set(STORAGE_KEYS.PRINT_LAYOUTS, data.printLayouts);
      if (Array.isArray(data.printSets)) storageAdapter.set(STORAGE_KEYS.PRINT_SETS, data.printSets);
      if (Array.isArray(data.booklets)) storageAdapter.set(STORAGE_KEYS.BOOKLETS, data.booklets);
      if (Array.isArray(data.tickets)) storageAdapter.set(STORAGE_KEYS.TICKETS, data.tickets);
      if (Array.isArray(data.expenses)) storageAdapter.set(STORAGE_KEYS.EXPENSES, data.expenses);
      if (Array.isArray(data.activities)) storageAdapter.set(STORAGE_KEYS.ACTIVITIES, data.activities);
      if (data.settings) storageAdapter.set(STORAGE_KEYS.SETTINGS, data.settings);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }

  clearAllData(): void {
    storageAdapter.clear();
  }
}

export const settingsRepository = new LocalStorageSettingsRepository();

