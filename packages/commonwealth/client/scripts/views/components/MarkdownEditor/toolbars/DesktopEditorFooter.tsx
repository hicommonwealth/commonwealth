import React, { ReactNode } from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';
import { IMAGE_ACCEPT } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import { ThreadActionPopover } from '../../NewThreadFormLegacy/ThreadActionPopover/ThreadActionPopover';
import './DesktopEditorFooter.scss';

type DesktopEditorFooterProps = Readonly<{
  onImportMarkdown?: (file: File) => void;
  onImage?: (file: File) => void;
  SubmitButton?: () => ReactNode;
  setSelectedActionCard?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedActionCard?: string[];
}>;

export const DesktopEditorFooter = (props: DesktopEditorFooterProps) => {
  const {
    onImportMarkdown,
    SubmitButton,
    onImage,
    selectedActionCard,
    setSelectedActionCard,
  } = props;

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

      <div className="Item">
        <ThreadActionPopover
          setSelectedActionCard={setSelectedActionCard}
          selectedActionCard={selectedActionCard}
        />
      </div>

      <div className="Item SubmitButtonItem">
        {SubmitButton && <SubmitButton />}
      </div>
    </div>
  );
};
