import { useMemo } from 'react';
import { MarkdownStr } from 'views/components/MarkdownViewer/MarkdownViewer';

export function useComputeMarkdownWithCutoff(
  markdown: MarkdownStr,
  cutoffLines: number | undefined,
): [boolean, string, string] {
  return useMemo(() => {
    const lines = markdown.split('\n');

    if (!cutoffLines || cutoffLines >= lines.length) {
      return [false, markdown, markdown];
    }

    const head = lines.slice(0, cutoffLines);

    return [true, head.join('\n'), markdown];
  }, [cutoffLines, markdown]);
}
