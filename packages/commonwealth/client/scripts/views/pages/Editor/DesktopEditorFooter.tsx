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
      <div className="Item">
        <Clipboard size={24} />
        &nbsp; Paste, drop or click to add files.
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
          <DownloadSimple size={24} />
          &nbsp; Import markdown
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
