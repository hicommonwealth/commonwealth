import { Clipboard, DownloadSimple } from '@phosphor-icons/react';
import React, { useCallback, useRef } from 'react';
import './DesktopEditorFooter.scss';

type DesktopEditorFooterProps = Readonly<{
  onImportMarkdown?: (file: File) => void;
  onSubmit?: () => void;
}>;

export const DesktopEditorFooter = (props: DesktopEditorFooterProps) => {
  const { onImportMarkdown, onSubmit } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        onImportMarkdown?.(event.target.files[0]);
      }
    },
    [onImportMarkdown],
  );

  const handleImportMarkdown = useCallback(() => {
    if (fileInputRef.current) {
      // this is needed to clear the current file input ref or else you won't
      // be able to import the same file multiple times.
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="DesktopEditorFooter">
      <div className="Item">
        <div className="IconAndText">
          <div>
            <Clipboard size={24} />
          </div>
          <div>Paste, drop or click to add files</div>
        </div>
      </div>
      <div className="Item">
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="FilePickerInput"
          onChange={fileHandler}
        />
        <button onClick={handleImportMarkdown} className="FilePickerButton">
          <div className="IconAndText">
            <div>
              <DownloadSimple size={24} />
            </div>
            <div>Import markdown</div>
          </div>
        </button>
      </div>

      <div className="Item SubmitButtonItem">
        <button onClick={() => onSubmit?.()} className="SubmitButton">
          Submit
        </button>
      </div>
    </div>
  );
};
