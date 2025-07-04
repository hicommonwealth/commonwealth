import clsx from 'clsx';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { RangeStatic } from 'quill';
import MagicUrl from 'quill-magic-url';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import ReactQuill, { Quill } from 'react-quill';
import { openConfirmation } from '../../modals/confirmation_modal';
import type { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import { CustomQuillFooter } from './CustomQuillFooter';
import QuillTooltip from './QuillTooltip';
import { LoadingIndicator } from './loading_indicator';
import { CustomQuillToolbar, useMarkdownToolbarHandlers } from './toolbar';
import { convertTwitterLinksToEmbeds } from './twitter_embed';
import { useImageDropAndPaste } from './use_image_drop_and_paste';
import { useImageUploader } from './use_image_uploader';
import { useMarkdownShortcuts } from './use_markdown_shortcuts';
import { useMention } from './use_mention';
import { RTFtoMD, SerializableDeltaStatic, getTextFromDelta } from './utils';

import { useQuillPasteText } from './useQuillPasteText';

import { useFormContext } from 'react-hook-form';
import 'react-quill/dist/quill.snow.css';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { MessageRow } from '../component_kit/new_designs/CWTextInput/MessageRow';
import { MarkdownPreview } from './MarkdownPreview';
import './react_quill_editor.scss';

import { LinkModal } from './LinkModal';
Quill.register('modules/magicUrl', MagicUrl);

type ReactQuillEditorFormValidationProps =
  | {
      name: string;
      hookToForm: boolean;
      contentDelta?: never;
      setContentDelta?: never;
    }
  | {
      name?: never;
      hookToForm?: never;
      contentDelta: SerializableDeltaStatic;
      setContentDelta: (d: SerializableDeltaStatic) => void;
    };

type ReactQuillEditorProps = {
  label?: string;
  className?: string;
  placeholder?: string;
  tabIndex?: number;
  isDisabled?: boolean;
  tooltipLabel?: string;
  shouldFocus?: boolean;
  cancelEditing?: () => void;
  fromManageTopic?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  justClosed?: (isOpen: boolean) => void;
} & ReactQuillEditorFormValidationProps;

const TABS = [
  { label: 'Markdown', iconLeft: 'code' },
  { label: 'Preview', iconLeft: 'eye' },
];

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
  label,
  className = '',
  placeholder,
  tabIndex,
  contentDelta,
  setContentDelta,
  isDisabled = false,
  tooltipLabel = 'Join community',
  shouldFocus = false,
  cancelEditing,
  hookToForm,
  name,
  fromManageTopic = false,
  onKeyDown,
  justClosed,
}: ReactQuillEditorProps) => {
  const toolbarId = useMemo(() => {
    return `cw-toolbar-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }, []);

  const editorRef = useRef<ReactQuill>();
  type QuillRange = { index: number; length: number };
  const childInputRef = useRef<QuillRange | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedTab, setSelectedTab] = useState(TABS[0].label);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  const formContext = useFormContext();
  const formFieldContext =
    hookToForm && name ? formContext.register(name) : undefined;
  const formFieldErrorMessage =
    hookToForm &&
    name &&
    (
      formContext?.formState?.errors?.[
        name
      ] as unknown as SerializableDeltaStatic
    )?.ops?.[0]?.insert?.message;

  const isHookedToFormProper = hookToForm && name && formContext;

  const contentDeltaToUse = isHookedToFormProper
    ? formContext.getValues(name)
    : contentDelta;

  const setContentDeltaToUse = (delta) => {
    isHookedToFormProper
      ? formContext.setValue(name, delta)
      : setContentDelta?.(delta);
  };

  // ref is used to prevent rerenders when selection
  // is changed, since rerenders bug out the editor
  const lastSelectionRef = useRef<RangeStatic | null>(null);
  const { mention } = useMention({
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    lastSelectionRef,
    justClosed,
  });

  // handle image upload for drag and drop
  const { handleImageDropAndPaste } = useImageDropAndPaste({
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    setContentDeltaToUse,
    setIsUploading,
  });

  //Handles the incomplete notion checkbox syntax when pasting
  //We may end up expanding this hook to handle other pasting issues
  const handleTextPaste = useQuillPasteText(
    setContentDeltaToUse,
    contentDeltaToUse,
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    isFocused || isHovering,
  );

  // handle image upload for image toolbar button
  const { handleImageUploader } = useImageUploader({
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    setContentDeltaToUse,
    setIsUploading,
  });

  // handle custom toolbar behavior for markdown
  const markdownToolbarHandlers = useMarkdownToolbarHandlers({
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    setContentDeltaToUse,
    isModalOpen,
    setIsModalOpen,
    childInputRef,
  });

  // handle keyboard shortcuts for markdown
  const markdownKeyboardShortcuts = useMarkdownShortcuts({
    // @ts-expect-error <StrictNullChecks/>
    editorRef,
    setContentDeltaToUse,
  });

  const handleChange = (value, delta, source, editor) => {
    // Check if this change is coming from ReactQuill's internal setEditorContents
    // by examining the stack trace for setEditorContents
    const stack = new Error().stack || '';
    const isInternalPropSync = stack.includes('setEditorContents');

    if (isInternalPropSync) {
      return;
    }

    const newContent = convertTwitterLinksToEmbeds(editor.getContents());

    setContentDeltaToUse({
      ...newContent,
      ___isMarkdown: true,
    } as SerializableDeltaStatic);
  };

  useNecessaryEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const editor = editorRef.current?.getEditor();

    if (!contentDeltaToUse.___isMarkdown && !fromManageTopic) {
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
                const mdDelta = RTFtoMD(contentDeltaToUse);
                setContentDeltaToUse({
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
                cancelEditing?.();
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

  useEffect(() => {
    if (formFieldContext) {
      formFieldContext.ref(editorRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const handleAddLink = () => {
    if (linkText === '' || linkUrl === '') {
      return;
    }
    const editor = editorRef?.current?.getEditor();
    if (!editor) {
      return;
    }
    // Retrieve the stored selection from childInputRef
    const selection = childInputRef.current;
    if (!selection) {
      return;
    }
    // Format the link to ensure it has 'https://'
    let newLink = linkUrl;
    if (!linkUrl.startsWith('https://')) {
      if (linkUrl.startsWith('http://')) {
        newLink = `https://${linkUrl.substring('http://'.length)}`;
      } else {
        newLink = `https://${linkUrl}`;
      }
    }
    const linkMarkdown = `[${linkText}](${newLink})`;

    editor.deleteText(selection.index, selection.length);
    editor.insertText(selection.index, linkMarkdown);
    editor.setSelection(selection.index + linkMarkdown.length, 0);
    setContentDeltaToUse({
      ...editor.getContents(),
      ___isMarkdown: true,
    });
    setIsModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleLinkModalClose = () => {
    const editor = editorRef?.current?.getEditor();
    if (!editor) {
      return;
    }
    const selection = childInputRef.current;
    if (!selection) {
      return;
    }
    editor.setSelection(selection.index, 0);
    setIsModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  return (
    <div className="CWEditor">
      {label && <MessageRow label={label} />}
      <div
        className={clsx('editor-and-tabs-container', {
          error: !!formFieldErrorMessage,
        })}
      >
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
              <CustomQuillToolbar
                toolbarId={toolbarId}
                isDisabled={isDisabled}
                setIsModalOpen={setIsModalOpen}
                isModalOpen={isModalOpen}
              />
              <DragDropContext onDragEnd={handleDragStop}>
                <Droppable droppableId="quillEditor">
                  {(provided) => (
                    <div
                      className={`${isDraggingOver ? 'ondragover' : ''} ReactQuillDragParent`}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      onDragOver={handleDragStart}
                      onDragLeave={handleDragStop}
                      onDrop={handleDragStop}
                    >
                      <div data-text-editor="name" className="ReactQuillParent">
                        <div onKeyDown={onKeyDown}>
                          <ReactQuill
                            // @ts-expect-error <StrictNullChecks/>
                            ref={editorRef}
                            className={`QuillEditor markdownEnabled ${className}`}
                            scrollingContainer="ql-container"
                            placeholder={placeholder}
                            tabIndex={tabIndex}
                            theme="snow"
                            bounds={`[data-text-editor="name"]`}
                            value={contentDeltaToUse}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                              setIsFocused(false);
                              isHookedToFormProper &&
                                formContext.trigger(name).catch(console.error);
                            }}
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
                                handler: handleTextPaste,
                              },
                              mention,
                              magicUrl: false,
                              keyboard: markdownKeyboardShortcuts,
                            }}
                          />
                        </div>
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <CustomQuillFooter
                // @ts-expect-error <StrictNullChecks/>
                handleImageUploader={handleImageUploader}
              />
            </div>
          </div>
        ) : (
          <MarkdownPreview
            classNameProp={fromManageTopic ? 'preview' : ''}
            doc={getTextFromDelta(contentDeltaToUse)}
          />
        )}
      </div>
      <CWModal
        size="small"
        content={
          <LinkModal
            linkText={linkText}
            linkUrl={linkUrl}
            onModalClose={handleLinkModalClose}
            setLinkText={setLinkText}
            setLinkUrl={setLinkUrl}
            handleAddLink={handleAddLink}
          />
        }
        onClose={handleLinkModalClose}
        open={isModalOpen}
      />
      {formFieldErrorMessage && (
        <div className="form-error-container">
          <div className="msg">
            <MessageRow
              hasFeedback={!!formFieldErrorMessage}
              statusMessage={formFieldErrorMessage || ''}
              validationStatus={formFieldErrorMessage ? 'failure' : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactQuillEditor;
