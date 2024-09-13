import React from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';
import { IMAGE_ACCEPT } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import './DesktopEditorFooter.scss';

type DesktopEditorFooterProps = Readonly<{
  onImportMarkdown?: (file: File) => void;
  onImage?: (file: File) => void;
  onSubmit?: () => void;
}>;

export const DesktopEditorFooter = (props: DesktopEditorFooterProps) => {
  const { onImportMarkdown, onSubmit, onImage } = props;

  return (
    <div className="DesktopEditorFooter">
      <div className="Item">
        <FileUploadButton
          accept={IMAGE_ACCEPT}
          iconName="clipboard"
          text="Paste, drop or click to add images"
          onFile={(file) => onImage?.(file)}
        />
      </div>
      <div className="Item">
        <FileUploadButton
          accept=".md"
          iconName="downloadSimple"
          text="Import markdown"
          onFile={(file) => onImportMarkdown?.(file)}
        />
      </div>

      <div className="Item SubmitButtonItem">
        <button onClick={() => onSubmit?.()} className="SubmitButton">
          Submit
        </button>
      </div>
    </div>
  );
};
