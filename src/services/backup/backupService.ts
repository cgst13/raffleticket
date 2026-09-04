import { settingsRepository } from '../storage/settingsRepository';
import { BackupData } from '../../types/settings';

export const backupService = {
  /**
   * Export all application data as JSON download
   */
  exportToFile(): void {
    const data = settingsRepository.exportAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `rafflepro-backup-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Import data from JSON file content
   */
  async importFromFile(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;

      if (!parsed || !Array.isArray(parsed.raffles)) {
        return { success: false, message: 'Invalid backup file format: Missing raffles data.' };
      }

      const success = settingsRepository.importAllData(parsed);
      if (success) {
        return { success: true, message: `Successfully restored ${parsed.raffles.length} raffle(s) and ${parsed.tickets?.length || 0} ticket(s).` };
      } else {
        return { success: false, message: 'Failed to write restored data to local storage.' };
      }
    } catch (err) {
      console.error('Import error:', err);
      return { success: false, message: 'Could not parse JSON file. Please ensure it is a valid RafflePro backup.' };
    }
  },

  /**
   * Clear all application data
   */
  clearAllData(): void {
    settingsRepository.clearAllData();
  },
};
