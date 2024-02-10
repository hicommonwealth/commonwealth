import { useEffect } from 'react';

export const useNotionPaste = (setContentDelta, contentDelta) => {
  useEffect(() => {
    const handlePaste = (event) => {
      const pastedText = event.clipboardData.getData('text');
      if (pastedText) {
        const lines = pastedText.split('\n');
        console.log('lines', lines);
        const fixedLines = lines
          .map((line) => {
            if (
              line.trim().startsWith('[ ]') ||
              line.trim().startsWith('[x]')
            ) {
              console.log('line', line);
              return `- ${line.trim()}`;
            }
            return line;
          })
          .filter((line) => {
            return line.trim() !== '';
          });

        const fixedText = fixedLines.join('\n');
        console.log('fixedText', fixedText);

        // Ensure contentDelta is updated correctly
        setContentDelta((prevContentDelta) => {
          // Clone the previous ops array
          const newOps = prevContentDelta.ops.slice();

          // Append the fixedText as a new insert operation
          newOps.push({
            insert: fixedText,
          });

          console.log('new', newOps);

          // Return the updated contentDelta
          return {
            ...prevContentDelta,
            ops: newOps,
          };
        });

        event.preventDefault();
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setContentDelta, contentDelta]);
};
