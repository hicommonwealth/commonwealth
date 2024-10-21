import clsx from 'clsx';
import {
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from 'commonwealth-mdxeditor';
import 'commonwealth-mdxeditor/style.css';
import { notifyError } from 'controllers/app/notifications';
import React, {
  memo,
  MutableRefObject,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TooltipIndicator } from 'views/components/MarkdownEditor/indicators/TooltipIndicator';
import { MarkdownEditorModeContext } from 'views/components/MarkdownEditor/MarkdownEditorModeContext';
import { useDeviceProfile } from 'views/components/MarkdownEditor/useDeviceProfile';
import { MarkdownEditorMethods } from 'views/components/MarkdownEditor/useMarkdownEditorMethods';
import { DragIndicator } from './indicators/DragIndicator';
import { UploadIndicator } from './indicators/UploadIndicator';
import './MarkdownEditor.scss';
import { MarkdownEditorContext } from './MarkdownEditorContext';
import { DesktopEditorFooter } from './toolbars/DesktopEditorFooter';
import { ToolbarForDesktop } from './toolbars/ToolbarForDesktop';
import { ToolbarForMobile } from './toolbars/ToolbarForMobile';
import { useImageUploadHandler } from './useImageUploadHandler';
import { useMarkdownEditorErrorHandler } from './useMarkdownEditorErrorHandler';
import { canAcceptFileForImport } from './utils/canAcceptFileForImport';
import { codeBlockLanguages } from './utils/codeBlockLanguages';
import { editorTranslator } from './utils/editorTranslator';
import { fileToText } from './utils/fileToText';
import { iconComponentFor } from './utils/iconComponentFor';

export type ImageURL = string;

export type MarkdownEditorMode = 'desktop' | 'mobile';

export type ImageHandler = 'S3' | 'local' | 'failure';

/**
 * A string that contains markdown.
 */
export type MarkdownStr = string;

export type UpdateContentStrategy = 'insert' | 'replace';

/**
 * Allows us to easily set the strategy back to replace but I suspect we will
 * have insert used for some things and replace used for others.  File uploads
 * seem like they should be 'replace'
 */
export const DEFAULT_UPDATE_CONTENT_STRATEGY =
  'insert' as UpdateContentStrategy;

export type MarkdownEditorProps = Readonly<{
  markdown?: MarkdownStr;

  disabled?: boolean;

  /**
   * Manually set the mode for the markdown editor, You shouldn't use this
   * in prod, just in stories and debug code.
   *
   * @internal
   */
  mode?: MarkdownEditorMode;
  placeholder?: string;
  imageHandler?: ImageHandler;
  SubmitButton?: () => ReactNode;
  tooltip?: string;
  onMarkdownEditorMethods?: (methods: MarkdownEditorMethods) => void;
  onChange?: (markdown: MarkdownStr) => void;
  autoFocus?: boolean;
}>;

export const MarkdownEditor = memo(function MarkdownEditor(
  props: MarkdownEditorProps,
) {
  const {
    SubmitButton,
    onMarkdownEditorMethods,
    disabled,
    onChange,
    autoFocus,
    tooltip,
  } = props;
  const errorHandler = useMarkdownEditorErrorHandler();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState(false);
  const [hovering, setHovering] = useState(false);

  const dragCounterRef = useRef(0);

  const deviceProfile = useDeviceProfile();

  const mode = props.mode ?? deviceProfile;
  const imageHandler: ImageHandler = props.imageHandler ?? 'S3';

  const placeholder = props.placeholder ?? 'Share your thoughts...';

  const mdxEditorRef: MutableRefObject<MDXEditorMethods | null> = useRef(null);

  const imageUploadHandlerDelegate = useImageUploadHandler(imageHandler);

  /**
   * When we've stopped dragging, we also need to decrement the drag counter.
   */
  const terminateDragging = useCallback(() => {
    setDragging(false);
    dragCounterRef.current = 0;
  }, []);

  const imageUploadHandler = useCallback(
    async (file: File) => {
      try {
        terminateDragging();
        setUploading(true);
        return await imageUploadHandlerDelegate(file);
      } finally {
        setUploading(false);
      }
    },
    [imageUploadHandlerDelegate, terminateDragging],
  );

  const imageUploadHandlerWithMarkdownInsertion = useCallback(
    (file: File) => {
      async function doAsync() {
        const url = await imageUploadHandler(file);

        mdxEditorRef.current?.insertMarkdown(`![](${url} "")`);
      }

      doAsync().catch(errorHandler);
    },
    [errorHandler, imageUploadHandler],
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      notifyError('Not a markdown file.');
      return;
    }

    const text = await fileToText(file);

    switch (DEFAULT_UPDATE_CONTENT_STRATEGY) {
      case 'insert':
        mdxEditorRef.current?.insertMarkdown(text);
        break;

      case 'replace':
        mdxEditorRef.current?.setMarkdown(text);
        break;
    }
  }, []);

  const handleImportMarkdown = useCallback(
    (file: File) => {
      async function doAsync() {
        await handleFile(file);
      }

      doAsync().catch(errorHandler);
    },
    [handleFile, errorHandler],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 1) {
        const file = files[0];

        if (canAcceptFileForImport(file)) {
          await handleFile(file);
        } else {
          notifyError('File not markdown. Has invalid type: ' + file.type);
        }
      }

      if (files.length > 1) {
        notifyError('Too many files given');
        return;
      }
    },
    [handleFile],
  );

  const handleDropAsync = useCallback(
    async (event: React.DragEvent) => {
      try {
        const files = event.dataTransfer.files;

        await handleFiles(files);
      } finally {
        terminateDragging();
      }
    },
    [handleFiles, terminateDragging],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      // ONLY handle this if it is markdown, else, allow the default paste
      // handler to work

      const files = event.dataTransfer.files;

      if (files.length === 1) {
        if (canAcceptFileForImport(files[0])) {
          event.preventDefault();
          handleDropAsync(event).catch(errorHandler);
        } else {
          notifyError('Can not accept files of this type.');
        }
      }

      terminateDragging();
    },
    [errorHandler, handleDropAsync, terminateDragging],
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current = dragCounterRef.current + 1;

    if (dragCounterRef.current === 1) {
      setDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // This is necessary to allow a drop
    event.dataTransfer!.dropEffect = 'copy'; // Shows a copy cursor when dragging files
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current = dragCounterRef.current - 1;

    if (dragCounterRef.current === 0) {
      setDragging(false);
    }
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const files = event.clipboardData.files;

      if (files.length === 0) {
        // now files here is acceptable because this could be a paste of other
        // data like text/markdown, and we're relying on the MDXEditor paste
        // handler to work
        return;
      }

      if (canAcceptFileForImport(files[0])) {
        // if we can accept this file for import, go ahead and do so...
        event.preventDefault();
        handleFiles(files).catch(errorHandler);
      }
    },
    [errorHandler, handleFiles],
  );

  const doFocus = useCallback(() => {
    if (mdxEditorRef.current) {
      mdxEditorRef.current.focus();
    } else {
      console.warn('No markdown editor ref');
    }
  }, []);

  const handleRef = useCallback(
    (methods: MDXEditorMethods) => {
      if (methods && mdxEditorRef.current === null) {
        // on startup, the mdx editor places the cursor at the END of the
        // document when loading content but this doesn't make a ton of sense.
        methods.focus(undefined, { defaultSelection: 'rootStart' });
      }

      mdxEditorRef.current = methods;
      onMarkdownEditorMethods?.(methods);
    },
    [onMarkdownEditorMethods],
  );

  const mdxEditorMethods = useMemo(() => {
    return {
      getMarkdown: () => mdxEditorRef.current!.getMarkdown(),
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) {
        // needed to prevent the user from typing into the contenteditable
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [disabled],
  );

  return (
    <MarkdownEditorModeContext.Provider value={mode}>
      <MarkdownEditorContext.Provider value={mdxEditorMethods}>
        <div
          className={clsx('mdxeditor-parent', 'mdxeditor-parent-mode-' + mode)}
        >
          <div
            className={clsx(
              'mdxeditor-container',
              'mdxeditor-container-mode-' + mode,
              active ? 'mdxeditor-container-active' : null,
              disabled ? 'mdxeditor-container-disabled' : null,
            )}
            onKeyDownCapture={handleKeyDown}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onPaste={(event) => handlePaste(event)}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            autoFocus={autoFocus}
          >
            <MDXEditor
              onError={errorHandler}
              ref={handleRef}
              markdown={props.markdown ?? ''}
              placeholder={placeholder}
              iconComponentFor={iconComponentFor}
              translation={editorTranslator}
              onChange={(markdown) => onChange?.(markdown)}
              plugins={[
                toolbarPlugin({
                  location: mode === 'mobile' ? 'bottom' : 'top',
                  toolbarContents: () =>
                    mode === 'mobile' ? (
                      <ToolbarForMobile
                        SubmitButton={SubmitButton}
                        onImage={imageUploadHandlerWithMarkdownInsertion}
                        focus={doFocus}
                      />
                    ) : (
                      <ToolbarForDesktop
                        focus={doFocus}
                        onImage={imageUploadHandlerWithMarkdownInsertion}
                      />
                    ),
                }),
                listsPlugin(),
                quotePlugin(),
                headingsPlugin(),
                linkPlugin(),
                // FIXME: this one will be when I click an *existing* link.
                // this one DOES anchor itself

                linkDialogPlugin(),
                // {LinkDialog: CustomLinkDialog}
                codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                codeMirrorPlugin({
                  codeBlockLanguages,
                }),
                imagePlugin({ imageUploadHandler }),
                tablePlugin(),
                thematicBreakPlugin(),
                frontmatterPlugin(),
                diffSourcePlugin({
                  viewMode: 'rich-text',
                  diffMarkdown: 'boo',
                }),
                markdownShortcutPlugin(),
              ]}
            />

            {mode === 'desktop' && (
              <DesktopEditorFooter
                onImage={imageUploadHandlerWithMarkdownInsertion}
                onImportMarkdown={handleImportMarkdown}
                SubmitButton={SubmitButton}
              />
            )}

            {disabled && hovering && tooltip && (
              <TooltipIndicator label={tooltip} />
            )}
            {dragging && <DragIndicator />}
            {uploading && <UploadIndicator />}
          </div>
        </div>
      </MarkdownEditorContext.Provider>
    </MarkdownEditorModeContext.Provider>
  );
});
