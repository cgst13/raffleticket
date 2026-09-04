import React, { useState, useRef, useEffect } from 'react';
import { settingsRepository } from '../services/storage/settingsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { backupService } from '../services/backup/backupService';
import { appConfig } from '../config/appConfig';
import { Raffle } from '../types/raffle';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Printer,
  ShieldCheck,
  Database,
  Users,
  Mail,
  UserPlus,
  Share2,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState(settingsRepository.getSettings());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Event Manager management state
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadRaffles = () => {
    const list = rafflesRepository.getAll();
    setRaffles(list);
    if (list.length > 0 && !selectedRaffleId) {
      setSelectedRaffleId(list[0].id);
    }
  };

  useEffect(() => {
    loadRaffles();
  }, []);

  const currentSelectedRaffle = raffles.find((r) => r.id === selectedRaffleId) || raffles[0] || null;

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedRaffle) return;

    const email = newManagerEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const currentManagers = currentSelectedRaffle.managers || [];
    if (currentManagers.map((m) => m.toLowerCase()).includes(email)) {
      toast.warning('This manager email is already added to this event.');
      return;
    }

    const updatedManagers = [...currentManagers, email];
    const updated = { ...currentSelectedRaffle, managers: updatedManagers };
    rafflesRepository.update(currentSelectedRaffle.id, updated);
    loadRaffles();
    setNewManagerEmail('');
    toast.success(`Manager ${email} added to ${currentSelectedRaffle.raffleName}!`);
  };

  const handleRemoveManager = (emailToRemove: string) => {
    if (!currentSelectedRaffle) return;
    const updatedManagers = (currentSelectedRaffle.managers || []).filter(
      (m) => m.toLowerCase() !== emailToRemove.toLowerCase()
    );
    const updated = { ...currentSelectedRaffle, managers: updatedManagers };
    rafflesRepository.update(currentSelectedRaffle.id, updated);
    loadRaffles();
    toast.success(`Manager ${emailToRemove} removed.`);
  };

  const shareableManagerLink = currentSelectedRaffle
    ? `${window.location.origin}/join/${currentSelectedRaffle.id}`
    : '';

  const handleCopyShareLink = () => {
    if (!shareableManagerLink) return;
    navigator.clipboard.writeText(shareableManagerLink);
    setCopiedLink(true);
    toast.success('Shareable event manager link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsRepository.saveSettings(settings);
    toast.success('Application settings updated!');
  };

  const handleExport = () => {
    backupService.exportToFile();
    toast.success('Backup file exported to your downloads folder.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await backupService.importFromFile(file);
    if (result.success) {
      toast.success(result.message);
      setSettings(settingsRepository.getSettings());
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.message);
    }
    e.target.value = '';
  };

  const handleConfirmClear = () => {
    backupService.clearAllData();
    setIsClearModalOpen(false);
    toast.success('All local storage data cleared.');
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">System Settings</h2>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Manage global defaults, backup and restore data, printer presets, and architecture status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Defaults */}
        <Card className="p-5">
          <CardHeader className="pb-3 mb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#F97316]" />
              <span>Application Preferences</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <Input
              label="Application Name"
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Default Ticket Price (₱)"
                type="number"
                value={settings.defaultTicketAmount}
                onChange={(e) => setSettings({ ...settings, defaultTicketAmount: Number(e.target.value) })}
              />
              <Input
                label="Default Number Padding"
                type="number"
                min={1}
                max={8}
                value={settings.defaultNumberPadding}
                onChange={(e) => setSettings({ ...settings, defaultNumberPadding: Number(e.target.value) })}
              />
            </div>

            <Button variant="primary" size="sm" type="submit">
              Save Preferences
            </Button>
          </form>
        </Card>

        {/* Printing Defaults */}
        <Card className="p-5">
          <CardHeader className="pb-3 mb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Printer className="w-4 h-4 text-neutral-800" />
              <span>Printing Presets</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Default Paper Size"
                value={settings.defaultPaperSize}
                onChange={(e) => setSettings({ ...settings, defaultPaperSize: e.target.value as any })}
              >
                <option value="Folio">Folio (8.5 × 13 in / 216 × 330 mm)</option>
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in / 216 × 279 mm)</option>
                <option value="Legal">Legal (8.5 × 14 in / 216 × 356 mm)</option>
              </Select>

              <Select
                label="Default Orientation"
                value={settings.defaultOrientation}
                onChange={(e) => setSettings({ ...settings, defaultOrientation: e.target.value as any })}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </Select>
            </div>

            <Input
              label="Default Tickets Per Print Row"
              type="number"
              min={1}
              max={10}
              value={settings.defaultTicketsPerRow}
              onChange={(e) => setSettings({ ...settings, defaultTicketsPerRow: Number(e.target.value) })}
              helperText="Interleaved booklets printed horizontally across sheet"
            />

            <Button variant="outline" size="sm" type="submit">
              Save Printing Presets
            </Button>
          </form>
        </Card>

        {/* Event Managers & Access Sharing */}
        <Card className="p-5 md:col-span-2">
          <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5]">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F97316]" />
                <span>Event Managers & Shareable Links</span>
              </div>
              {raffles.length > 0 && (
                <div className="w-56">
                  <Select
                    value={selectedRaffleId}
                    onChange={(e) => setSelectedRaffleId(e.target.value)}
                    className="text-xs"
                  >
                    {raffles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.raffleName}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </CardTitle>
          </CardHeader>

          {raffles.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
              No raffle events created yet. Create a raffle event first to invite managers.
            </div>
          ) : currentSelectedRaffle ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Add Manager */}
                <div className="space-y-3">
                  <form onSubmit={handleAddManager} className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-700">
                      Add Manager by Email Address
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={newManagerEmail}
                          onChange={(e) => setNewManagerEmail(e.target.value)}
                          placeholder="manager@example.com"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-neutral-900"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      >
                        Add
                      </Button>
                    </div>
                  </form>

                  {/* List of active managers for selected event */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Active Managers ({currentSelectedRaffle.managers?.length || 0})
                    </span>
                    {(!currentSelectedRaffle.managers || currentSelectedRaffle.managers.length === 0) ? (
                      <p className="text-xs text-neutral-400 italic">
                        No managers assigned to this event yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {currentSelectedRaffle.managers.map((mEmail) => (
                          <div
                            key={mEmail}
                            className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate font-semibold text-neutral-800">{mEmail}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveManager(mEmail)}
                              className="text-neutral-400 hover:text-red-600 p-1 h-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Share Link & Access Limits */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#F97316]" />
                        Shareable Manager Link
                      </span>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                        Email login only
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareableManagerLink}
                        className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-orange-200 rounded text-neutral-800 focus:outline-none select-all"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCopyShareLink}
                        leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedLink ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                      <span>Shared to all event managers</span>
                      <a
                        href={`/join/${currentSelectedRaffle.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ea580c] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500 leading-relaxed">
                    <strong className="text-neutral-700">Manager Navigation:</strong> Generate Tickets, Booklets, Ticket Inventory, Print Sets, and QR Scanner.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Backup & Restore */}
        <Card className="p-5 md:col-span-2">
          <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5]">
            <CardTitle className="text-sm">Database Backup & Data Portability</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Export */}
            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-neutral-900">Export All Data</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Download full database JSON (raffles, tickets, booklets, designs, print sets).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export JSON
              </Button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-neutral-900">Import / Restore</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Restore previously exported backup JSON file.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Import JSON
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E5E5E5]">
            <span className="text-xs text-neutral-500">
              Need a completely fresh start? Clear all locally persisted records.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear All Data
            </Button>
          </div>
        </Card>

        {/* System Architecture & Supabase Readiness */}
        <Card className="p-5 md:col-span-2 bg-neutral-900 text-white border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-orange-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {appConfig.name} v{appConfig.version} • Pluggable Repository Architecture
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The storage system is decoupled via standard TypeScript interfaces (`ITicketRepository`, `IRaffleRepository`, etc.).
                LocalStorage persistence operates completely offline as a Progressive Web App. The repository layer is architected to seamlessly plug into Supabase or PostgreSQL without modifying UI code.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clear Confirmation Modal */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Local Storage Data?"
        message="This action will permanently delete all raffles, tickets, print sets, designs, and settings from this browser. Make sure you have exported a backup if you wish to keep your records."
        confirmLabel="Yes, Clear Everything"
        variant="danger"
      />
    </div>
  );
};
