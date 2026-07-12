'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScanStore } from '@/store/scanStore';
import { MODULES_FULL, MODULES_QUICK, MODULES_WEB, MODULES_NETWORK } from '@/lib/catalog';
import { ScanType } from '@/lib/types';
import AttackGrid from '@/components/AttackGrid';
import ProgressBar from '@/components/ProgressBar';
import ScanConsole from '@/components/ScanConsole';
import { Crosshair, Square } from 'lucide-react';

const PROFILES: { id: ScanType; label: string; desc: string }[] = [
  { id: 'quick', label: 'Quick', desc: `${MODULES_QUICK.length} checks — fastest pass` },
  { id: 'web', label: 'Web', desc: `${MODULES_WEB.length} checks — app-layer focus` },
  { id: 'network', label: 'Network', desc: `${MODULES_NETWORK.length} checks — infra/TLS focus` },
  { id: 'custom', label: 'Custom', desc: 'Pick specific checks' },
  { id: 'full', label: 'Full', desc: `${MODULES_FULL.length} checks — everything` },
];

export default function ScanPage() {
  const router = useRouter();
  const { current, startScan, abortScan } = useScanStore();
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const isRunning = current?.status === 'running';

  function resolveModules(): string[] {
    switch (scanType) {
      case 'quick': return MODULES_QUICK;
      case 'web': return MODULES_WEB;
      case 'network': return MODULES_NETWORK;
      case 'custom': return [...selected];
      case 'full': return MODULES_FULL;
    }
  }

  async function handleStart() {
    if (!target.trim()) return;
    const modules = resolveModules();
    if (modules.length === 0) return;
    await startScan(target.trim(), modules, scanType, notes);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-wide text-red-glow text-glow">
          NEW SCAN
        </h1>
        <p className="text-text-muted text-sm mt-1">Configure and launch an assessment.</p>
      </header>

      <div className="bg-panel border border-hairline rounded-md p-6 space-y-5">
        <div>
          <label className="text-xs font-mono text-text-muted block mb-1.5">TARGET</label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isRunning}
            placeholder="https://target.example.com"
            className="w-full bg-void border border-hairline rounded px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-red-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-text-muted block mb-2">SCAN PROFILE</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                disabled={isRunning}
                onClick={() => setScanType(p.id)}
                className={`text-left p-3 rounded border transition-all disabled:opacity-50 ${
                  scanType === p.id
                    ? 'border-red-primary bg-red-primary/10'
                    : 'border-hairline hover:border-red-dim'
                }`}
              >
                <div className="font-display font-semibold text-sm">{p.label}</div>
                <div className="text-[11px] text-text-muted">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {scanType === 'custom' && (
          <div>
            <label className="text-xs font-mono text-text-muted block mb-2">SELECT CHECKS</label>
            <AttackGrid selected={selected} onChange={setSelected} />
          </div>
        )}

        <div>
          <label className="text-xs font-mono text-text-muted block mb-1.5">NOTES (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isRunning}
            rows={2}
            className="w-full bg-void border border-hairline rounded px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-red-primary disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-red-primary hover:bg-red-glow transition-colors text-void font-mono font-semibold px-6 py-2.5 rounded-md"
            >
              <Crosshair size={18} /> START SCAN
            </button>
          ) : (
            <button
              onClick={abortScan}
              className="flex items-center gap-2 border border-critical text-critical hover:bg-critical/10 transition-colors font-mono font-semibold px-6 py-2.5 rounded-md"
            >
              <Square size={16} /> STOP SCAN
            </button>
          )}
          {current && current.status === 'complete' && (
            <button
              onClick={() => router.push(`/results/${current.id}`)}
              className="border border-hairline hover:border-red-dim font-mono px-6 py-2.5 rounded-md"
            >
              VIEW RESULTS
            </button>
          )}
        </div>
      </div>

      {current && (
        <div className="bg-panel border border-hairline rounded-md p-6 space-y-4">
          <ProgressBar />
          <ScanConsole />
        </div>
      )}
    </div>
  );
}
