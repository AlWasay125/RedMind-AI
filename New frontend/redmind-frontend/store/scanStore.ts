import { create } from 'zustand';
import { runModule } from '@/lib/api';
import { ScanRecord, ScanType, SevCounts } from '@/lib/types';

const HISTORY_KEY = 'rm_scan_history';
const LAST_KEY = 'rm_last_results';

function loadHistory(): ScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadLast(): ScanRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
  } catch {
    return null;
  }
}

function computeRiskScore(c: SevCounts): number {
  return Math.min(100, c.CRITICAL * 25 + c.HIGH * 12 + c.MEDIUM * 6 + c.LOW * 2 + c.INFO * 0.5);
}

interface ScanStore {
  current: ScanRecord | null;
  history: ScanRecord[];
  aborted: boolean;
  logs: string[];
  startScan: (target: string, modules: string[], scanType: ScanType, notes?: string) => Promise<void>;
  abortScan: () => void;
  clearHistory: () => void;
  hydrate: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  current: null,
  history: [],
  aborted: false,
  logs: [],

  hydrate: () => {
    set({ history: loadHistory(), current: loadLast() });
  },

  abortScan: () => {
    set({ aborted: true });
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
    set({ history: [] });
  },

  startScan: async (target, modules, scanType, notes = '') => {
    const id = crypto.randomUUID();
    const startTime = Date.now();

    const initial: ScanRecord = {
      id,
      target,
      scanType,
      date: new Date().toISOString(),
      status: 'running',
      results: [],
      completed: 0,
      total: modules.length,
      sevCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
      riskScore: 0,
      secScore: 100,
      duration: '',
      notes,
    };

    set({ current: initial, aborted: false, logs: [`▶ Target: ${target}`, `▶ Profile: ${scanType} — ${modules.length} module(s)`] });

    for (let i = 0; i < modules.length; i++) {
      if (get().aborted) {
        set((s) => ({ logs: [...s.logs, '⏹ Scan aborted by user.'] }));
        break;
      }

      const modId = modules[i];

      try {
        const result = await runModule(modId, target);
        const hasFindings = Array.isArray(result.findings) && result.findings.length > 0;

        set((s) => {
          if (!s.current) return s;
          const sevCounts = { ...s.current.sevCounts };
          if (hasFindings) sevCounts[result.severity] = (sevCounts[result.severity] || 0) + 1;

          const logLine = hasFindings
            ? `✔ ${modId} — ${result.severity} — ${result.findings.length} finding(s)`
            : `· ${modId} — clean`;

          return {
            current: {
              ...s.current,
              completed: i + 1,
              sevCounts,
              results: hasFindings
                ? [...s.current.results, { moduleId: modId, result }]
                : s.current.results,
            },
            logs: [...s.logs, logLine],
          };
        });
      } catch (e: any) {
        set((s) => ({
          logs: [...s.logs, `✗ ${modId} — ${e?.message || 'request failed'}`],
          current: s.current ? { ...s.current, completed: i + 1 } : s.current,
        }));
      }
    }

    const durSec = Math.round((Date.now() - startTime) / 1000);
    const duration = `${Math.floor(durSec / 60)}m ${durSec % 60}s`;

    set((s) => {
      if (!s.current) return s;
      const riskScore = computeRiskScore(s.current.sevCounts);
      const finished: ScanRecord = {
        ...s.current,
        status: get().aborted ? 'aborted' : 'complete',
        riskScore,
        secScore: Math.max(0, 100 - riskScore),
        duration,
      };
      const history = [finished, ...s.history].slice(0, 50);
      localStorage.setItem(LAST_KEY, JSON.stringify(finished));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return {
        current: finished,
        history,
        logs: [...s.logs, `\n✅ Done — ${finished.results.length} finding(s) in ${duration}`],
      };
    });
  },
}));
