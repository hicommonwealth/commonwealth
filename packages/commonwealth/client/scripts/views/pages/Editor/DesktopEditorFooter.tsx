import React, { useCallback, useRef } from 'react';

import './DesktopEditorFooter.scss';

type DesktopEditorFooterProps = Readonly<{
  onImportMarkdown?: (file: File) => void;
}>;

export const DesktopEditorFooter = (props: DesktopEditorFooterProps) => {
  const { onImportMarkdown } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        console.log('nr files: ' + event.target.files.length);
        onImportMarkdown?.(event.target.files[0]);
      }
    },
    [onImportMarkdown],
  );

  const handleImportMarkdown = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="DesktopEditorFooter">
      <div>Paste, drop or click to add files.</div>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="FilePicker"
          onChange={fileHandler}
        />

        <button onClick={handleImportMarkdown}>Import markdown</button>
      </div>
    </div>
  );
};
