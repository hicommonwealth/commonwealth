import clsx from 'clsx';
import { RangeStatic } from 'quill';
import ImageUploader from 'quill-image-uploader';
import MagicUrl from 'quill-magic-url';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import ReactQuill, { Quill, UnprivilegedEditor } from 'react-quill';

import { nextTick } from 'process';
import { openConfirmation } from '../../modals/confirmation_modal';
import { PreviewModal } from '../../modals/preview_modal';
import { CWModal } from '../component_kit/new_designs/CWModal';
import QuillTooltip from './QuillTooltip';
import { LoadingIndicator } from './loading_indicator';
import { CustomQuillToolbar, useMarkdownToolbarHandlers } from './toolbar';
import { convertTwitterLinksToEmbeds } from './twitter_embed';
import { useImageDropAndPaste } from './use_image_drop_and_paste';
import { useImageUploader } from './use_image_uploader';
import { useMarkdownShortcuts } from './use_markdown_shortcuts';
import { useMention } from './use_mention';
import { SerializableDeltaStatic, getTextFromDelta } from './utils';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';

Quill.register('modules/magicUrl', MagicUrl);
Quill.register('modules/imageUploader', ImageUploader);

type ReactQuillEditorProps = {
  className?: string;
  placeholder?: string;
  tabIndex?: number;
  contentDelta: SerializableDeltaStatic;
  setContentDelta: (d: SerializableDeltaStatic) => void;
  isDisabled?: boolean;
  tooltipLabel?: string;
  shouldFocus?: boolean;
};

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
  className = '',
  placeholder,
  tabIndex,
  contentDelta,
  setContentDelta,
  isDisabled = false,
  tooltipLabel = 'Join community',
  shouldFocus = false,
}: ReactQuillEditorProps) => {
  const toolbarId = useMemo(() => {
    return `cw-toolbar-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }, []);

  const editorRef = useRef<ReactQuill>();

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMarkdownEnabled, setIsMarkdownEnabled] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ref is used to prevent rerenders when selection
  // is changed, since rerenders bug out the editor
  const lastSelectionRef = useRef<RangeStatic | null>(null);
  const { mention } = useMention({
    editorRef,
    lastSelectionRef,
  });

  // handle image upload for drag and drop
  const { handleImageDropAndPaste } = useImageDropAndPaste({
    editorRef,
    setContentDelta,
    setIsUploading,
    isMarkdownEnabled,
  });

  // handle image upload for image toolbar button
  const { handleImageUploader } = useImageUploader({
    editorRef,
    setContentDelta,
    setIsUploading,
    isMarkdownEnabled,
  });

  // handle custom toolbar behavior for markdown
  const markdownToolbarHandlers = useMarkdownToolbarHandlers({
    editorRef,
    setContentDelta,
  });

  // handle keyboard shortcuts for markdown
  const markdownKeyboardShortcuts = useMarkdownShortcuts({
    editorRef,
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

  const handleChange = (value, delta, source, editor: UnprivilegedEditor) => {
    const newContent = convertTwitterLinksToEmbeds(editor.getContents());

    setContentDelta({
      ...newContent,
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
              buttonType: 'destructive',
              buttonHeight: 'sm',
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
              buttonType: 'secondary',
              buttonHeight: 'sm',
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
    // since we only want to focus on setting setIsMarkdownEnabled if
    // 1- the editor is present
    // 2- the initial contentDelta?.___isMarkdown is true
    // 3- the initial isMarkdownEnabled is false
    // so we dont have to include them in the dependency array
    if (isMarkdownEnabled !== !!contentDelta?.___isMarkdown) {
      setIsMarkdownEnabled(!!contentDelta?.___isMarkdown);
      // sometimes a force refresh is needed to render the editor
      setTimeout(() => {
        refreshQuillComponent();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef]);

  const handleDragStart = () => setIsDraggingOver(true);
  const handleDragStop = () => setIsDraggingOver(false);

  useEffect(() => {
    if (shouldFocus) {
      // Important: We need to initially focus the editor and then focus it again after
      // a small delay. Some code higher up in the tree will cause the quill
      // editor to remount/redraw because of some force re-renders use emitters. This causes
      // the editor to remain focused while losing the text cursor and not being able to type.
      editorRef && editorRef.current && editorRef.current.focus();
      setTimeout(
        () => editorRef && editorRef.current && editorRef.current.focus(),
        200,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTooltip = isDisabled && isHovering;

  return (
    <div
      className={clsx('QuillEditorContainer', { isDisabled })}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={clsx('QuillEditorWrapper', {
          isFocused,
          isDisabled,
          isHovering,
        })}
      >
        {showTooltip && <QuillTooltip label={tooltipLabel} />}
        {isUploading && <LoadingIndicator />}
        <CWModal
          size="medium"
          content={
            <PreviewModal
              doc={
                isMarkdownEnabled
                  ? getTextFromDelta(contentDelta)
                  : contentDelta
              }
              onModalClose={handlePreviewModalClose}
              title={isMarkdownEnabled ? 'As Markdown' : 'As Rich Text'}
            />
          }
          onClose={handlePreviewModalClose}
          open={isPreviewVisible}
        />
        {isVisible && (
          <>
            <CustomQuillToolbar
              toolbarId={toolbarId}
              isMarkdownEnabled={isMarkdownEnabled}
              handleToggleMarkdown={handleToggleMarkdown}
              setIsPreviewVisible={setIsPreviewVisible}
              isDisabled={isDisabled}
              isPreviewDisabled={getTextFromDelta(contentDelta).length < 1}
            />
            <DragDropContext onDragEnd={handleDragStop}>
              <Droppable droppableId="quillEditor">
                {(provided) => (
                  <div
                    className={`${isDraggingOver ? 'ondragover' : ''}`}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    onDragOver={handleDragStart}
                    onDragLeave={handleDragStop}
                    onDrop={handleDragStop}
                  >
                    <div data-text-editor="name">
                      <ReactQuill
                        ref={editorRef}
                        className={clsx('QuillEditor', className, {
                          markdownEnabled: isMarkdownEnabled,
                        })}
                        scrollingContainer="ql-container"
                        placeholder={placeholder}
                        tabIndex={tabIndex}
                        theme="snow"
                        bounds={`[data-text-editor="name"]`}
                        value={contentDelta}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={handleChange}
                        onChangeSelection={(selection: RangeStatic) => {
                          if (!selection) {
                            return;
                          }
                          lastSelectionRef.current = selection;
                        }}
                        formats={isMarkdownEnabled ? [] : undefined}
                        modules={{
                          toolbar: {
                            container: `#${toolbarId}`,
                            handlers: isMarkdownEnabled
                              ? markdownToolbarHandlers
                              : undefined,
                          },
                          imageDropAndPaste: {
                            handler: handleImageDropAndPaste,
                          },
                          clipboard: {
                            matchVisual: false,
                          },
                          mention,
                          magicUrl: !isMarkdownEnabled,
                          keyboard: isMarkdownEnabled
                            ? markdownKeyboardShortcuts
                            : undefined,
                          imageUploader: {
                            upload: handleImageUploader,
                          },
                        }}
                      />
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>
    </div>
  );
};

export default ReactQuillEditor;
