import React, { useState, useEffect } from 'react';
import { settingsRepository } from '../services/storage/settingsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { appConfig } from '../config/appConfig';
import { Raffle } from '../types/raffle';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
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
  Cloud,
  RefreshCw,
  Code2,
  Server,
  AlertCircle,
} from 'lucide-react';
import { supabaseSyncService } from '../services/supabase/supabaseSyncService';
import { supabaseConfig, isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { SUPABASE_SQL_SCHEMA } from '../services/supabase/supabaseSchema';

export const SettingsPage: React.FC = () => {
  const toast = useToast();

  const [settings, setSettings] = useState(settingsRepository.getSettings());

  // Event Manager management state
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Supabase Cloud State
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  const loadRaffles = () => {
    const list = rafflesRepository.getAll();
    setRaffles(list);
    if (list.length > 0 && !selectedRaffleId) {
      setSelectedRaffleId(list[0].id);
    }
  };

  useEffect(() => {
    loadRaffles();
    // Auto-test connection on load
    handleTestCloudConnection();
  }, []);

  const handleTestCloudConnection = async () => {
    setIsTestingCloud(true);
    const result = await supabaseSyncService.testConnection();
    setCloudStatusMsg(result);
    setIsTestingCloud(false);
  };

  const handleSyncCloudAll = async () => {
    setIsSyncingAll(true);
    try {
      await supabaseSyncService.syncAll();
      loadRaffles();
      toast.success('Successfully synchronized with Supabase Cloud Database!');
      handleTestCloudConnection();
    } catch (err: any) {
      toast.error(err?.message || 'Sync failed.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePushCloud = async () => {
    setIsPushingCloud(true);
    try {
      await supabaseSyncService.pushLocalToCloud();
      toast.success('Uploaded all local data to Supabase Cloud Database!');
    } catch (err: any) {
      toast.error(err?.message || 'Upload to Supabase failed.');
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handlePullCloud = async () => {
    setIsPullingCloud(true);
    try {
      await supabaseSyncService.pullFromCloud();
      loadRaffles();
      toast.success('Downloaded latest data from Supabase Cloud Database!');
    } catch (err: any) {
      toast.error(err?.message || 'Download from Supabase failed.');
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleCopySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    toast.success('Supabase SQL Schema copied to clipboard! Paste and run in Supabase SQL Editor.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

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

        {/* Supabase Cloud Database & Live Sync */}
        <Card className="p-5 md:col-span-2 border-orange-200/90 bg-gradient-to-br from-white via-orange-50/20 to-white shadow-sm">
          <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#F97316]" />
              <span>Supabase Cloud Database & Realtime Sync</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  cloudStatusMsg?.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cloudStatusMsg?.success ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {cloudStatusMsg?.success ? 'Connected to Cloud' : 'Cloud Configured'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCloudConnection}
                isLoading={isTestingCloud}
                leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#F97316]" />}
                className="text-xs"
              >
                Test Connection
              </Button>
            </div>
          </CardHeader>

          <div className="space-y-4">
            {/* Connection Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Supabase Project URL
                </span>
                <span className="font-mono text-neutral-800 font-semibold text-xs break-all">
                  {supabaseConfig.url}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                  Authentication Role
                </span>
                <span className="font-mono text-neutral-800 font-semibold text-xs">
                  Public Anon API Key (RLS Protected)
                </span>
              </div>
            </div>

            {/* Status Feedback Notice */}
            {cloudStatusMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  cloudStatusMsg.success
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/80 border-amber-200 text-amber-800'
                }`}
              >
                <Server className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>{cloudStatusMsg.success ? 'Supabase Status:' : 'Notice:'}</strong>{' '}
                  <span>{cloudStatusMsg.message}</span>
                </div>
              </div>
            )}

            {/* Cloud Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Bidirectional Sync</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Push local updates and pull latest cloud records simultaneously.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSyncCloudAll}
                  isLoading={isSyncingAll}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="w-full text-xs"
                >
                  Sync Now
                </Button>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Upload to Supabase</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Push all local events, tickets, booklets, and expenses to cloud.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePushCloud}
                  isLoading={isPushingCloud}
                  leftIcon={<Upload className="w-3.5 h-3.5 text-[#F97316]" />}
                  className="w-full text-xs"
                >
                  Upload to Cloud
                </Button>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Download from Supabase</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Pull cloud database records to this browser's local cache.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePullCloud}
                  isLoading={isPullingCloud}
                  leftIcon={<Download className="w-3.5 h-3.5 text-[#F97316]" />}
                  className="w-full text-xs"
                >
                  Download from Cloud
                </Button>
              </div>
            </div>

            {/* SQL Schema helper button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-orange-100/40 border border-orange-200 rounded-xl gap-2 mt-2">
              <div>
                <strong className="text-xs font-bold text-neutral-900 block">
                  Supabase SQL Database Schema
                </strong>
                <span className="text-[11px] text-neutral-600">
                  Execute the SQL DDL statements in your Supabase SQL Editor to initialize all tables and Realtime replication.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSqlModalOpen(true)}
                  leftIcon={<Code2 className="w-3.5 h-3.5 text-[#F97316]" />}
                  className="text-xs bg-white"
                >
                  View SQL
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopySqlSchema}
                  leftIcon={copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {copiedSql ? 'Copied!' : 'Copy SQL Script'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* System Architecture & Supabase Cloud Status */}
        <Card className="p-5 md:col-span-2 bg-neutral-900 text-white border-neutral-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-orange-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {appConfig.name} v{appConfig.version} • Cloud Database Architecture
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Powered directly by Supabase Cloud PostgreSQL with automated range pagination and batch synchronization.
                Real-time updates, event manager access, and unlimited ticket generation capabilities are actively enabled.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* SQL Schema Modal */}
      <Modal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        title="Supabase Database SQL DDL Schema"
        description="Run this complete SQL script in your Supabase SQL Editor to initialize all tables, indexes, and Realtime replication."
        maxWidth="2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="text-neutral-500">PostgreSQL DDL for Supabase (Also available in schema.sql)</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopySqlSchema}
              leftIcon={copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
            </Button>
          </div>
          <pre className="p-3.5 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
          <div className="flex justify-end pt-2 border-t border-neutral-100">
            <Button variant="outline" size="sm" onClick={() => setIsSqlModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
