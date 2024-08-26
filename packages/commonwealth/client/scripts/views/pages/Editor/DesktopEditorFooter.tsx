import React, { useCallback, useRef } from 'react';

import './DesktopEditorFooter.scss';

export const DesktopEditorFooter = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        console.log('nr files: ' + event.target.files.length);
      }
    },
    [],
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
          className="FilePicker"
          onChange={fileHandler}
        />

        <button onClick={handleImportMarkdown}>Import markdown</button>
      </div>
    </div>
  );
};
