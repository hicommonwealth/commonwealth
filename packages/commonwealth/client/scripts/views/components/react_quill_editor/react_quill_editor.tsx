import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DeltaOperation, DeltaStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';
import ReactQuill, { Quill } from 'react-quill';

import type { SerializableDeltaStatic } from './utils';
import { base64ToFile, getTextFromDelta, uploadFileToS3 } from './utils';

import app from 'state';
import { CWText } from '../component_kit/cw_text';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { PreviewModal } from '../../modals/preview_modal';
import { Modal } from '../component_kit/cw_modal';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';
import { nextTick } from 'process';

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

const Delta = Quill.import('delta');
Quill.register('modules/imageDropAndPaste', imageDropAndPaste);

type ReactQuillEditorProps = {
  className?: string;
  placeholder?: string;
  tabIndex?: number;
  contentDelta: SerializableDeltaStatic;
  setContentDelta: (d: SerializableDeltaStatic) => void;
};

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
  className = '',
  placeholder,
  tabIndex,
  contentDelta,
  setContentDelta,
}: ReactQuillEditorProps) => {
  const editorRef = useRef<ReactQuill>();

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMarkdownEnabled, setIsMarkdownEnabled] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);

  // refreshQuillComponent unmounts and remounts the
  // React Quill component, as this is the only way
  // to refresh the component if the 'modules'
  // prop is changed
  const refreshQuillComponent = () => {
    setIsVisible(false);
    nextTick(() => {
      setIsVisible(true);
    });
  };

  const handleChange = (value, delta, source, editor) => {
    setContentDelta({
      ...editor.getContents(),
      ___isMarkdown: isMarkdownEnabled,
    } as SerializableDeltaStatic);
  };

  // must be memoized or else infinite loop
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

        const selectedIndex =
          editor.getSelection()?.index || editor.getLength() || 0;

        // filter out ops that contain a base64 image
        const opsWithoutBase64Images: DeltaOperation[] = (
          editor.getContents() || []
        ).filter((op) => {
          for (const opImageType of VALID_IMAGE_TYPES) {
            const base64Prefix = `data:image/${opImageType};base64`;
            if (op.insert?.image?.startsWith(base64Prefix)) {
              return false;
            }
          }
          return true;
        });
        setContentDelta({
          ops: opsWithoutBase64Images,
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic);

        const file = base64ToFile(imageDataUrl, imageType);

        const uploadedFileUrl = await uploadFileToS3(
          file,
          app.serverUrl(),
          app.user.jwt
        );

        // insert image op at the selected index
        if (isMarkdownEnabled) {
          editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);
        } else {
          editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
        }
        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic); // sync state with editor content
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, isMarkdownEnabled, setContentDelta]
  );

  const handleToggleMarkdown = () => {
    const editor = editorRef.current?.getEditor();
    if (!editor) {
      throw new Error('editor not set');
    }
    // if enabling markdown, confirm and remove formatting
    const newMarkdownEnabled = !isMarkdownEnabled;
    if (newMarkdownEnabled) {
      let confirmed = true;
      if (getTextFromDelta(editor.getContents()).length > 0) {
        confirmed = window.confirm(
          'All formatting and images will be lost. Continue?'
        );
      }
      if (confirmed) {
        editor.removeFormat(0, editor.getLength());
        setIsMarkdownEnabled(newMarkdownEnabled);
        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: newMarkdownEnabled,
        });
      }
    } else {
      setIsMarkdownEnabled(newMarkdownEnabled);
    }
  };

  const handlePreviewModalClose = () => {
    setIsPreviewVisible(false);
  };

  // must be memoized or else infinite loop
  const clipboardMatchers = useMemo(() => {
    return [
      [
        Node.ELEMENT_NODE,
        (node, delta) => {
          return delta.compose(
            new Delta().retain(delta.length(), {
              header: false,
              align: false,
              color: false,
              background: false,
            })
          );
        },
      ],
    ];
  }, []);

  // when markdown state is changed, add markdown metadata to delta ops
  // and refresh quill component
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: isMarkdownEnabled,
      } as SerializableDeltaStatic);
    }
    refreshQuillComponent();
  }, [isMarkdownEnabled, setContentDelta]);

  // when initialized, update markdown state to match content type
  useEffect(() => {
    setIsMarkdownEnabled(!!contentDelta?.___isMarkdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if markdown is disabled, hide toolbar buttons
  const toolbar = useMemo(() => {
    if (isMarkdownEnabled) {
      return [];
    }
    return ([[{ header: 1 }, { header: 2 }]] as any).concat([
      ['bold', 'italic', 'strike'],
      ['link', 'code-block', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ]);
  }, [isMarkdownEnabled]);

  return (
    <div className="QuillEditorWrapper">
      {isUploading && <LoadingIndicator />}
      <Modal
        content={
          <PreviewModal
            doc={
              isMarkdownEnabled ? getTextFromDelta(contentDelta) : contentDelta
            }
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
            onClick={handleToggleMarkdown}
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
            onClick={handleToggleMarkdown}
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
      {isVisible && (
        <ReactQuill
          ref={editorRef}
          className={`QuillEditor ${className}`}
          placeholder={placeholder}
          tabIndex={tabIndex}
          theme="snow"
          value={contentDelta}
          onChange={handleChange}
          modules={{
            toolbar,
            imageDropAndPaste: {
              handler: handleImageDropAndPaste,
            },
            clipboard: {
              matchers: clipboardMatchers,
            },
          }}
        />
      )}
    </div>
  );
};

export default ReactQuillEditor;
