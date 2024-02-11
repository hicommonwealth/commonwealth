import clsx from 'clsx';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { nextTick } from 'process';
import { RangeStatic } from 'quill';
import ImageUploader from 'quill-image-uploader';
import MagicUrl from 'quill-magic-url';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import ReactQuill, { Quill } from 'react-quill';
import { openConfirmation } from '../../modals/confirmation_modal';
import type { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import QuillTooltip from './QuillTooltip';
import { LoadingIndicator } from './loading_indicator';
import { CustomQuillToolbar, useMarkdownToolbarHandlers } from './toolbar';
import { convertTwitterLinksToEmbeds } from './twitter_embed';
import { useNotionPaste } from './useNotionPaste';
import { useImageDropAndPaste } from './use_image_drop_and_paste';
import { useImageUploader } from './use_image_uploader';
import { useMarkdownShortcuts } from './use_markdown_shortcuts';
import { useMention } from './use_mention';
import { RTFtoMD, SerializableDeltaStatic, getTextFromDelta } from './utils';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';
import { MarkdownPreview } from './MarkdownPreview';

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
  cancelEditing?: () => void;
};

const TABS = [
  { label: 'Markdown', iconLeft: 'code' },
  { label: 'Preview', iconLeft: 'eye' },
];

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
  cancelEditing,
}: ReactQuillEditorProps) => {
  const toolbarId = useMemo(() => {
    return `cw-toolbar-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }, []);

  const editorRef = useRef<ReactQuill>();

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedTab, setSelectedTab] = useState(TABS[0].label);

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
  });

  //Handles the incomplete notion checkbox syntax when pasting
  //We may end up expanding this hook to handle other pasting issues
  const handleNotionPaste = useNotionPaste(
    setContentDelta,
    contentDelta,
    editorRef,
  );

  // handle image upload for image toolbar button
  const { handleImageUploader } = useImageUploader({
    editorRef,
    setContentDelta,
    setIsUploading,
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

  const handleChange = (value, delta, source, editor) => {
    const newContent = convertTwitterLinksToEmbeds(editor.getContents());
    setContentDelta({
      ...newContent,
      ___isMarkdown: true,
    } as SerializableDeltaStatic);
  };
  //

  useNecessaryEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const editor = editorRef.current?.getEditor();

    if (!contentDelta.___isMarkdown) {
      const isContentAvailable =
        getTextFromDelta(editor.getContents()).length > 0;

      if (isContentAvailable) {
        openConfirmation({
          title: 'Warning',
          description: (
            <>
              <div>This content is not Markdown.</div>{' '}
              <div>
                If you choose to edit, formatting and images may be lost.
                Continue?
              </div>
            </>
          ),

          buttons: [
            {
              label: 'Yes',
              buttonType: 'destructive',
              buttonHeight: 'sm',
              onClick: () => {
                const mdDelta = RTFtoMD(contentDelta);
                setContentDelta({
                  ...mdDelta,
                  ___isMarkdown: true,
                });
              },
            },
            {
              label: 'No',
              buttonType: 'secondary',
              buttonHeight: 'sm',
              onClick: () => {
                cancelEditing();
              },
            },
          ],
          onClose: () => {
            return;
          },
        });
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="editor-and-tabs-container">
      <CWTabsRow boxed>
        {TABS.map((tab, index) => (
          <CWTab
            key={index}
            label={tab.label}
            boxed={true}
            iconLeft={tab.iconLeft as IconName}
            isSelected={selectedTab === tab.label}
            onClick={() => {
              setSelectedTab(tab.label);
            }}
          />
        ))}
      </CWTabsRow>
      {selectedTab === TABS[0].label ? (
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

            {isVisible && (
              <>
                <CustomQuillToolbar
                  toolbarId={toolbarId}
                  isDisabled={isDisabled}
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
                            className={`QuillEditor markdownEnabled ${className}`}
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
                            formats={[]}
                            modules={{
                              toolbar: {
                                container: `#${toolbarId}`,
                                handlers: markdownToolbarHandlers,
                              },
                              imageDropAndPaste: {
                                handler: handleImageDropAndPaste,
                              },
                              clipboard: {
                                matchVisual: false,
                                handler: handleNotionPaste,
                              },
                              mention,
                              magicUrl: false,
                              keyboard: markdownKeyboardShortcuts,
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
      ) : (
        <MarkdownPreview doc={getTextFromDelta(contentDelta)} />
      )}
    </div>
  );
};

export default ReactQuillEditor;
