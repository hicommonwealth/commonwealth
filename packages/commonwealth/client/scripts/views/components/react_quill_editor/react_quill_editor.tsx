import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RangeStatic } from 'quill';
import ReactQuill, { Quill } from 'react-quill';
import MagicUrl from 'quill-magic-url';

import { SerializableDeltaStatic } from './utils';
import { getTextFromDelta } from './utils';

import { CWText } from '../component_kit/cw_text';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { PreviewModal } from '../../modals/preview_modal';
import { Modal } from '../component_kit/cw_modal';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';
import { nextTick } from 'process';

import { openConfirmation } from 'views/modals/confirmation_modal';
import { LoadingIndicator } from './loading_indicator';
import { useMention } from './use_mention';
import { useClipboardMatchers } from './use_clipboard_matchers';
import { useImageDropAndPaste } from './use_image_drop_and_paste';

Quill.register('modules/magicUrl', MagicUrl);

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

  // ref is used to prevent rerenders when selection
  // is changed, since rerenders bug out the editor
  const lastSelectionRef = useRef<RangeStatic | null>(null);
  const { mention } = useMention({
    editorRef,
    lastSelectionRef,
  });

  const { clipboardMatchers } = useClipboardMatchers();

  const { handleImageDropAndPaste } = useImageDropAndPaste({
    editorRef,
    setIsUploading,
    isMarkdownEnabled,
    setContentDelta,
  });

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

  const handleToggleMarkdown = () => {
    const editor = editorRef.current?.getEditor();

    if (!editor) {
      throw new Error('editor not set');
    }
    // if enabling markdown, confirm and remove formatting
    const newMarkdownEnabled = !isMarkdownEnabled;

    if (newMarkdownEnabled) {
      const isContentAvailable =
        getTextFromDelta(editor.getContents()).length > 0;

      if (isContentAvailable) {
        openConfirmation({
          title: 'Warning',
          description: <>All formatting and images will be lost. Continue?</>,
          buttons: [
            {
              label: 'Yes',
              buttonType: 'mini-red',
              onClick: () => {
                editor.removeFormat(0, editor.getLength());
                setIsMarkdownEnabled(newMarkdownEnabled);
                setContentDelta({
                  ...editor.getContents(),
                  ___isMarkdown: newMarkdownEnabled,
                });
              },
            },
            {
              label: 'No',
              buttonType: 'mini-white',
            },
          ],
        });
      } else {
        setIsMarkdownEnabled(newMarkdownEnabled);
      }
    } else {
      setIsMarkdownEnabled(newMarkdownEnabled);
    }
  };

  const handlePreviewModalClose = () => {
    setIsPreviewVisible(false);
  };

  // if markdown is disabled, hide toolbar buttons
  const toolbar = useMemo(() => {
    if (isMarkdownEnabled) {
      return [];
    }
    // ref: https://quilljs.com/docs/modules/toolbar/
    return ([[{ header: 1 }, { header: 2 }]] as any).concat([
      ['bold', 'italic', 'strike'],
      ['link', 'code-block', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ]);
  }, [isMarkdownEnabled]);

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
    if (!editorRef.current) {
      return;
    }
    setIsMarkdownEnabled(!!contentDelta?.___isMarkdown);
    // sometimes a force refresh is needed to render the editor
    setTimeout(() => {
      refreshQuillComponent();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef]);

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
          onChangeSelection={(selection: RangeStatic) => {
            if (!selection) {
              return;
            }
            lastSelectionRef.current = selection;
          }}
          modules={{
            toolbar,
            imageDropAndPaste: {
              handler: handleImageDropAndPaste,
            },
            clipboard: {
              matchers: clipboardMatchers,
            },
            mention,
            magicUrl: !isMarkdownEnabled,
          }}
        />
      )}
    </div>
  );
};

export default ReactQuillEditor;
