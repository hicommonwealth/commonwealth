import {
  codeBlockPlugin,
  codeMirrorPlugin,
  defaultSvgIcons,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  IconKey,
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
import React, { useCallback } from 'react';

import './Editor.scss';

import 'commonwealth-mdxeditor/style.css';

import {
  Code,
  ListChecks,
  ListDashes,
  ListNumbers,
  Table,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { uploadFileToS3 } from 'views/components/react_quill_editor/utils';
import { codeBlockLanguages } from 'views/pages/Editor/codeBlockLanguages';
import { fileToText } from 'views/pages/Editor/fileToText';
import { ToolbarForDesktop } from 'views/pages/Editor/ToolbarForDesktop';
import { ToolbarForMobile } from 'views/pages/Editor/ToolbarForMobile';
import supported from './supported.md?raw';

type ImageURL = string;

function useImageUploadHandlerS3() {
  const user = useUserStore();

  return useCallback(async (file: File): Promise<ImageURL> => {
    const uploadedFileUrl = await uploadFileToS3(
      file,
      SERVER_URL,
      user.jwt || '',
    );
    return uploadedFileUrl;
  }, []);
}

/**
 * Just a basic local image handler that uses a file URL.
 */
function useImageUploadHandlerLocal() {
  return useCallback(async (file: File) => {
    return URL.createObjectURL(file);
  }, []);
}

type EditorMode = 'desktop' | 'mobile';

type EditorProps = {
  readonly mode?: EditorMode;
  readonly placeholder?: string;
};

const DEFAULT_ICON_SIZE = 22;

const iconComponentFor = (name: IconKey) => {
  // 'undo' | 'redo' | 'format_bold' | 'format_italic' |
  // 'format_underlined' | 'code' | 'strikeThrough' | 'superscript' |
  // 'subscript' | 'format_list_bulleted' | 'format_list_numbered' |
  // 'format_list_checked' | 'link' | 'add_photo' | 'table' |
  // 'horizontal_rule' | 'frontmatter' | 'frame_source' |
  // 'arrow_drop_down' | 'admonition' | 'sandpack' | 'rich_text' |
  // 'difference' | 'markdown' | 'open_in_new' | 'link_off' | 'edit' |
  // 'content_copy' | 'more_horiz' | 'more_vert' | 'close' | 'settings' |
  // 'delete_big' | 'delete_small' | 'format_align_center' |
  // 'format_align_left' | 'format_align_right' | 'add_row' | 'add_column'
  // | 'insert_col_left' | 'insert_row_above' | 'insert_row_below' |
  // 'insert_col_right' | 'check';

  switch (name) {
    case 'format_bold':
      return <TextB size={DEFAULT_ICON_SIZE} />;
    case 'format_italic':
      return <TextItalic size={DEFAULT_ICON_SIZE} />;
    case 'format_underlined':
      return <TextUnderline size={DEFAULT_ICON_SIZE} />;
    case 'strikeThrough':
      return <TextStrikethrough size={DEFAULT_ICON_SIZE} />;
    case 'superscript':
      return <TextSuperscript size={DEFAULT_ICON_SIZE} />;
    case 'subscript':
      return <TextSubscript size={DEFAULT_ICON_SIZE} />;
    case 'format_list_bulleted':
      return <ListDashes size={DEFAULT_ICON_SIZE} />;
    case 'format_list_numbered':
      return <ListNumbers size={DEFAULT_ICON_SIZE} />;
    case 'format_list_checked':
      return <ListChecks size={DEFAULT_ICON_SIZE} />;
    case 'frame_source':
    case 'code':
      console.log('FIXME: code');
      return <Code size={DEFAULT_ICON_SIZE} />;
    case 'table':
      return <Table size={DEFAULT_ICON_SIZE + 2} />;

    default:
      return defaultSvgIcons[name];
  }
};

export const Editor = (props: EditorProps) => {
  const imageUploadHandler = useImageUploadHandlerLocal();
  // const imageUploadHandler = useImageUploadHandlerS3();

  const mode = props.mode ?? 'desktop';
  // const mode = props.mode ?? 'mobile';

  const placeholder = props.placeholder ?? 'Share your thoughts...';

  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);

  // TODO: handle html but I'm not sure about the correct way to handle it
  // because I have to convert to markdown
  const handleDrop = useCallback((event: React.DragEvent) => {
    async function doAsync() {
      console.log(event.dataTransfer.files.length);

      const nrFiles = event.dataTransfer.files.length;

      if (nrFiles === 1) {
        const type = event.dataTransfer.files[0].type;

        if (['text/markdown', 'text/plain'].includes(type)) {
          const text = await fileToText(event.dataTransfer.files[0]);
          mdxEditorRef.current?.setMarkdown(text);
        } else {
          // TODO: use a snackbar
          console.log('File not markdown');
        }
      }

      if (nrFiles <= 0) {
        // TODO: use a snackbar
        console.log('No files given');
        return;
      }

      if (nrFiles > 1) {
        // TODO: use a snackbar
        console.log('Too many files given');
        return;
      }
    }

    doAsync().catch(console.error);
  }, []);

  return (
    <div
      className={clsx(
        'mdxeditor-container',
        'mdxeditor-container-mode-' + mode,
      )}
      onDrop={handleDrop}
    >
      <MDXEditor
        ref={mdxEditorRef}
        markdown={supported}
        placeholder={placeholder}
        iconComponentFor={iconComponentFor}
        translation={(key, defaultValue, interpolations) => {
          switch (key) {
            case 'toolbar.blockTypeSelect.placeholder':
              // show the default placeholder that's active here..
              return 'H1';
            case 'toolbar.blockTypes.heading':
              if (interpolations?.level) {
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                return 'H' + interpolations.level;
              }
              return 'H1';
            case 'toolbar.blockTypes.quote':
              return 'Q';
            case 'toolbar.blockTypes.paragraph':
              return 'P';
            default:
              return defaultValue;
          }
        }}
        plugins={[
          toolbarPlugin({
            location: mode === 'mobile' ? 'bottom' : 'top',
            toolbarContents: () =>
              mode === 'mobile' ? <ToolbarForMobile /> : <ToolbarForDesktop />,
          }),
          listsPlugin(),
          quotePlugin(),
          headingsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
          codeMirrorPlugin({
            codeBlockLanguages,
          }),
          imagePlugin({ imageUploadHandler }),
          tablePlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
          markdownShortcutPlugin(),
        ]}
      />

      {mode === 'desktop' && <div className="mdxeditor-footer">here it is</div>}
    </div>
  );
};
