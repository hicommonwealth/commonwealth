import React from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';
import { DEFAULT_ICON_SIZE } from 'views/components/MarkdownEditor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import './DesktopEditorFooter.scss';

type DesktopEditorFooterProps = Readonly<{
  onImportMarkdown?: (file: File) => void;
  onSubmit?: () => void;
}>;

export const DesktopEditorFooter = (props: DesktopEditorFooterProps) => {
  const { onImportMarkdown, onSubmit } = props;

  return (
    <div className="DesktopEditorFooter">
      <div className="Item">
        <div className="IconAndText">
          <div>
            <CWIcon iconName="clipboard" iconSize={DEFAULT_ICON_SIZE} />
          </div>
          <div>Paste, drop or click to add files</div>
        </div>
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
