import type { DeltaStatic } from 'quill';
import { getTextFromDelta } from 'views/components/react_quill_editor';

const WORDS_PER_MINUTE = 200;

function extractPlainTextForReadingTime(body: string): string {
  if (!body?.trim()) {
    return '';
  }
  try {
    const parsed = JSON.parse(body) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'ops' in parsed &&
      Array.isArray((parsed as DeltaStatic).ops)
    ) {
      return getTextFromDelta(parsed as DeltaStatic);
    }
  } catch {
    // Markdown or plain text
  }
  return body;
}

export function estimateReadingTimeMinutes(body: string): number {
  const text = extractPlainTextForReadingTime(body);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) {
    return 1;
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatCompactSocialCount(count: number): string {
  const absCount = Math.abs(count);
  if (absCount < 1000) {
    return count.toString();
  }

  if (absCount < 10_000) {
    const compact = count / 1000;
    return `${Number(compact.toFixed(1)).toString()}k`;
  }

  if (absCount < 1_000_000) {
    return `${Math.floor(count / 1000)}k`;
  }

  if (absCount < 10_000_000) {
    const compact = count / 1_000_000;
    return `${Number(compact.toFixed(1)).toString()}m`;
  }

  if (absCount < 1_000_000_000) {
    return `${Math.floor(count / 1_000_000)}m`;
  }

  const compact = count / 1_000_000_000;
  return `${Number(compact.toFixed(1)).toString()}b`;
}
