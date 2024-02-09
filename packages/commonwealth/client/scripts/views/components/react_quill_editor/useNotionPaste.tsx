import { useEffect } from 'react';

export const useNotionPaste = (setContentDelta) => {
  useEffect(() => {
    const handlePaste = (event: {
      clipboardData: { getData: (arg0: string) => string };
      preventDefault: () => void;
    }) => {
      const pastedText = event.clipboardData.getData('text');
      if (pastedText) {
        const lines = pastedText.split('\n');
        const fixedLines = lines.map((line: string) => {
          if (line.trim().startsWith('[ ]')) {
            return `- ${line.trim()}`;
          }
          return line;
        });
        const fixedText = fixedLines.join('\n');
        setContentDelta((prevDelta) => ({
          ...prevDelta,
          ops: [
            ...prevDelta.ops,
            {
              insert: fixedText,
            },
          ],
        }));
        event.preventDefault();
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setContentDelta]);
};
