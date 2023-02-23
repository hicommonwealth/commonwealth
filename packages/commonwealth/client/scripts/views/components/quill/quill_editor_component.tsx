import React, { useEffect, useState } from 'react';
import $ from 'jquery';

import 'components/quill/quill_editor.scss';

import app from 'state';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { PreviewModal } from 'views/modals/preview_modal';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { getClasses } from '../component_kit/helpers';
import { QuillEditor } from './quill_editor';
import type { QuillActiveMode, QuillMode, QuillTextContents } from './types';

// Rich text and Markdown editor.
//
// When the editor is created, oncreateBind is called with the state
// object. This can be used to retrieve the editor and mode later.
//
// The editor can be toggled between rich text and markdown mode.
// Toggling reinitializes the editor, with or without a list of
// `formats` and the rich text toolbar (there doesn't appear to be a
// way to unregister formats once the editor has been initialized)

type QuillEditorComponentProps = {
  className?: string;
  contentsDoc?;
  editorNamespace: string;
  imageUploader?;
  mode?: QuillMode; // Use in order to limit editor to only MD or RT support
  oncreateBind;
  onkeyboardSubmit?;
  placeholder?: string;
  tabIndex?: number;
  theme?: string;
};

// Quill TODO: Graham 6-26-22
// - Audit and fix image, video, & Twitter blots as necessary
// - Convert generic HTML tags to CWText components in QuillFormattedText

export const QuillEditorComponent = ({
  className,
  contentsDoc,
  editorNamespace,
  imageUploader,
  onkeyboardSubmit,
  mode = 'hybrid',
  placeholder,
  tabIndex,
  theme = 'snow',
  oncreateBind,
}: QuillEditorComponentProps) => {
  const [unsavedChanges, setUnsavedChanges] = useState([]);
  const [$editor, set$editor] = useState<JQuery<HTMLElement>>();
  const [editor, setEditor] = useState<QuillEditor>();
  const [activeMode, setActiveMode] = useState<QuillActiveMode>();
  const [defaultContents, setDefaultContents] = useState<QuillTextContents>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const beforeunloadHandler = () => {
      if (unsavedChanges.length > 0) {
        return 'There are unsaved changes. Are you sure you want to leave?';
      }
    };

    // Only bind the alert if we are actually trying to persist the user's changes
    if (!contentsDoc) {
      $(window).on('beforeunload', beforeunloadHandler);
    }

    return () => {
      $(window).off('beforeunload', beforeunloadHandler);
    };
  }, []);

  const loadSavedState = () => {
    const storedDoc: string = localStorage.getItem(
      `${app.activeChainId()}-${editorNamespace}-storedText`
    );

    const storedMode = localStorage.getItem(
      `${editorNamespace}-activeMode`
    ) as QuillActiveMode;

    if (contentsDoc) {
      try {
        setDefaultContents(JSON.parse(contentsDoc));
      } catch (e) {
        setDefaultContents(contentsDoc);
      }
    } else if (storedDoc) {
      try {
        setDefaultContents(JSON.parse(storedDoc));
        setActiveMode('richText');
      } catch (e) {
        contentsDoc = localStorage.getItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );

        setActiveMode('markdown');
      }
    }

    if (mode === 'hybrid') {
      if (storedMode === 'markdown') {
        setActiveMode('markdown');
      } else if (storedMode === 'richText') {
        setActiveMode('richText');
      } else {
        // Otherwise, set activeMode based on the app setting
        setActiveMode(app.user?.disableRichText ? 'markdown' : 'richText');
      }
    } else if (mode === 'markdown') {
      setActiveMode('markdown');
    } else {
      setActiveMode('richText');
    }
  };

  const confirmRemoveFormatting = async () => {
    let confirmed = false;

    // If contents pre- and post-formatting are identical, then nothing will be lost,
    // and there's no reason to confirm the switch.
    setDefaultContents(editor.contents);

    editor.removeFormat(0, editor.endIndex);

    if (editor.contents.ops.length === defaultContents.ops.length) {
      confirmed = true;
    } else {
      confirmed = await confirmationModalWithText(
        'All formatting and images will be lost. Continue?'
      )();
    }

    if (!confirmed) {
      // Restore formatted contents
      editor.contents = defaultContents;
    }
    return confirmed;
  };

  if (!loaded) {
    loadSavedState();
    setLoaded(true);
  }

  return (
    <div
      className={getClasses<{ mode: string; className?: string }>(
        { mode: `${activeMode}-mode`, className },
        'QuillEditor'
      )}
      oncreate={async (childVnode) => {
        set$editor($(childVnode.dom).find('.quill-editor'));

        setEditor(
          new QuillEditor(
            $editor,
            activeMode,
            theme,
            imageUploader,
            placeholder,
            editorNamespace,
            onkeyboardSubmit,
            defaultContents,
            tabIndex
          )
        );

        await editor.initialize();

        if (oncreateBind) {
          oncreateBind(editor);
        }
      }}
    >
      <div className="quill-editor" />
      {activeMode === 'markdown' && (
        <CWText
          type="h5"
          fontWeight="semiBold"
          className="mode-switcher"
          title="Switch to RichText mode"
          onClick={() => {
            setActiveMode('richText');
            editor.activeMode = activeMode;
          }}
        >
          R
        </CWText>
      )}
      {activeMode === 'richText' && (
        <CWText
          type="h5"
          fontWeight="semiBold"
          className="mode-switcher"
          title="Switch to Markdown mode"
          onClick={async () => {
            // Confirm before removing formatting and switching to Markdown mode.
            const confirmed = await confirmRemoveFormatting();

            if (confirmed) {
              // Remove formatting, switch to Markdown.
              editor.removeFormat(0, editor.endIndex);
              setActiveMode('markdown');
              editor.activeMode = activeMode;
            }
          }}
        >
          M
        </CWText>
      )}
      <CWIconButton
        iconName="search"
        iconSize="small"
        iconButtonTheme="primary"
        onClick={(e) => {
          e.preventDefault();

          app.modals.create({
            modal: PreviewModal,
            data: {
              doc:
                activeMode === 'markdown'
                  ? editor.text
                  : JSON.stringify(editor.contents),
            },
          });
        }}
      />
    </div>
  );
};
