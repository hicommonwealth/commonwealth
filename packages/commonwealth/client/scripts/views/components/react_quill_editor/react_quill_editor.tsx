import React, { useCallback, useRef, useState } from 'react';
import type { DeltaOperation, DeltaStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';
import ReactQuill, { Quill } from 'react-quill';

import { base64ToFile, getTextFromDelta, uploadFileToS3 } from './utils';

import app from 'state';
import { CWText } from '../component_kit/cw_text';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { PreviewModal } from '../../modals/preview_modal';
import { Modal } from '../component_kit/cw_modal';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';

export type QuillMode = 'markdown' | 'richText' | 'hybrid';

const VALID_IMAGE_TYPES = ['jpeg', 'gif', 'png'];

const LoadingIndicator = () => {
  return (
    <div className="LoadingIndicator">
      <div className="outer-circle">
        <div className="inner-circle"></div>
      </div>
    </div>
  );
};

Quill.register('modules/imageDropAndPaste', imageDropAndPaste);

type ReactQuillEditorProps = {
  className?: string;
  placeholder?: string;
  tabIndex?: number;
  mode?: QuillMode; // Use in order to limit editor to only MD or RT support
  contentDelta: DeltaStatic;
  setContentDelta: (d: DeltaStatic) => void;
};

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
  className = '',
  placeholder,
  tabIndex,
  contentDelta,
  setContentDelta
}: ReactQuillEditorProps) => {
  const editorRef = useRef<ReactQuill>();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMarkdownEnabled, setIsMarkdownEnabled] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);

  const handleChange = (value, delta, source, editor) => {
    setContentDelta(editor.getContents());
  };

  // must use memoized function or else it'll render in an infinite loop
  const handleImageDropAndPaste = useCallback(
    async (imageDataUrl, imageType) => {
      const editor = editorRef.current?.editor;

      try {
        if (!editor) {
          throw new Error('editor is not set');
        }

        setIsUploading(true);

        editor.disable();

        if (!imageType) {
          imageType = 'image/png';
        }

        const selectedIndex = editor.getSelection()?.index || editor.getLength() || 0;

        // filter out ops that contain a base64 image
        const opsWithoutBase64Images: DeltaOperation[] = (editor.getContents() || []).filter((op) => {
          for (const opImageType of VALID_IMAGE_TYPES) {
            const base64Prefix = `data:image/${opImageType};base64`;
            if (op.insert?.image?.startsWith(base64Prefix)) {
              return false;
            }
          }
          return true;
        });
        setContentDelta({ ops: opsWithoutBase64Images } as DeltaStatic);

        const file = base64ToFile(imageDataUrl, imageType);

        const uploadedFileUrl = await uploadFileToS3(file, app.serverUrl(), app.user.jwt);

        // insert image op at the selected index
        editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
        setContentDelta(editor.getContents()); // sync state with editor content
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, setContentDelta]
  );

  const handlePreviewModalClose = () => {
    setIsPreviewVisible(false);
  };

  return (
    <div className="QuillEditorWrapper">
      {isUploading && <LoadingIndicator />}
      <Modal
        content={
          <PreviewModal
            doc={isMarkdownEnabled ? getTextFromDelta(contentDelta) : contentDelta}
            onModalClose={handlePreviewModalClose}
            title={isMarkdownEnabled ? 'As Markdown' : 'As Rich Text'}
          />
        }
        onClose={handlePreviewModalClose}
        open={isPreviewVisible}
      />
      <div className="custom-buttons">
        {isMarkdownEnabled && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="custom-button"
            title="Switch to RichText mode"
            onClick={(e) => {
              setIsMarkdownEnabled(false);
            }}
          >
            R
          </CWText>
        )}
        {!isMarkdownEnabled && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="custom-button"
            title="Switch to Markdown mode"
            onClick={async () => {
              setIsMarkdownEnabled(true);
            }}
          >
            M
          </CWText>
        )}
        <CWIconButton
          className="custom-button preview"
          iconName="search"
          iconSize="small"
          iconButtonTheme="primary"
          onClick={(e) => {
            e.preventDefault();
            setIsPreviewVisible(true);
          }}
        />
      </div>
      <ReactQuill
        ref={editorRef}
        className={`QuillEditor ${className}`}
        placeholder={placeholder}
        tabIndex={tabIndex}
        theme="snow"
        value={contentDelta}
        onChange={handleChange}
        modules={{
          toolbar: ([[{ header: 1 }, { header: 2 }]] as any).concat([
            ['bold', 'italic', 'strike'],
            ['link', 'code-block', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }]
          ]),
          imageDropAndPaste: {
            handler: handleImageDropAndPaste
          }
        }}
      />
    </div>
  );
};

export default ReactQuillEditor;
