import { CheckResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function runModule(
  moduleId: string,
  target: string
): Promise<CheckResult> {
  const res = await fetch(`${API_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module_id: moduleId, target, context: {} }),
  });

  if (!res.ok) {
    return {
      check_id: moduleId,
      severity: 'INFO',
      findings: [],
      error: `HTTP ${res.status}`,
      summary: { tested_requests: 0, positive_hits: 0 },
    };
  }

  const data = await res.json();
  const result: CheckResult = data && data.result ? data.result : data;

  // normalize severity casing defensively
  const map: Record<string, CheckResult['severity']> = {
    CRITICAL: 'CRITICAL', Critical: 'CRITICAL', critical: 'CRITICAL',
    HIGH: 'HIGH', High: 'HIGH', high: 'HIGH',
    MEDIUM: 'MEDIUM', Medium: 'MEDIUM', medium: 'MEDIUM',
    LOW: 'LOW', Low: 'LOW', low: 'LOW',
    INFO: 'INFO', Informational: 'INFO', info: 'INFO',
  };
  result.severity = map[result.severity as unknown as string] || 'INFO';
  return result;
}

export { API_URL };
