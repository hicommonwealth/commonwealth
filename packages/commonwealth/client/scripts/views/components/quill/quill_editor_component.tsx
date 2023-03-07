import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/quill/quill_editor.scss';
import $ from 'jquery';

import app from 'state';
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

type QuillEditorComponentAttrs = {
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

export class QuillEditorComponent extends ClassComponent<QuillEditorComponentAttrs> {
  unsavedChanges;
  $editor: JQuery<HTMLElement>;
  editor: QuillEditor;
  activeMode: QuillActiveMode;
  defaultContents: QuillTextContents;
  loaded: boolean;

  private _beforeunloadHandler: () => void | string;

  private _loadSavedState(
    contentsDoc?: string,
    editorNamespace?: string,
    mode?: QuillMode
  ) {
    const storedDoc: string = localStorage.getItem(
      `${app.activeChainId()}-${editorNamespace}-storedText`
    );
    const storedMode = localStorage.getItem(
      `${editorNamespace}-activeMode`
    ) as QuillActiveMode;

    if (contentsDoc) {
      try {
        this.defaultContents = JSON.parse(contentsDoc);
      } catch (e) {
        this.defaultContents = contentsDoc;
      }
    } else if (storedDoc) {
      try {
        this.defaultContents = JSON.parse(storedDoc);
        this.activeMode = 'richText';
      } catch (e) {
        contentsDoc = localStorage.getItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        this.activeMode = 'markdown';
      }
    }

    if (mode === 'hybrid') {
      if (storedMode === 'markdown') {
        this.activeMode = 'markdown';
      } else if (storedMode === 'richText') {
        this.activeMode = 'richText';
      } else {
        // Otherwise, set this.activeMode based on the app setting
        this.activeMode = app.user?.disableRichText ? 'markdown' : 'richText';
      }
    } else if (mode === 'markdown') {
      this.activeMode = 'markdown';
    } else {
      this.activeMode = 'richText';
    }
  }

  private async _confirmRemoveFormatting() {
    let confirmed = false;

    // If contents pre- and post-formatting are identical, then nothing will be lost,
    // and there's no reason to confirm the switch.
    this.defaultContents = this.editor.contents;
    this.editor.removeFormat(0, this.editor.endIndex);
    if (this.editor.contents.ops.length === this.defaultContents.ops.length) {
      confirmed = true;
    } else {
      confirmed = window.confirm(
        'All formatting and images will be lost. Continue?'
      );
    }

    if (!confirmed) {
      // Restore formatted contents
      this.editor.contents = this.defaultContents;
    }
    return confirmed;
  }

  // LIFECYCLE HELPERS

  oncreate(vnode: ResultNode<QuillEditorComponentAttrs>) {
    // Only bind the alert if we are actually trying to persist the user's changes
    if (!vnode.attrs.contentsDoc) {
      this._beforeunloadHandler = () => {
        if (this.unsavedChanges && this.unsavedChanges.length() > 0) {
          return 'There are unsaved changes. Are you sure you want to leave?';
        }
      };
      $(window).on('beforeunload', this._beforeunloadHandler);
    }
  }

  onremove(vnode: ResultNode<QuillEditorComponentAttrs>) {
    if (!vnode.attrs.contentsDoc) {
      $(window).off('beforeunload', this._beforeunloadHandler);
    }
  }

  view(vnode: ResultNode<QuillEditorComponentAttrs>) {
    const {
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
    } = vnode.attrs;

    const editorClass = getClasses<{ mode: string; className?: string }>(
      { mode: `${this.activeMode}-mode`, className },
      'QuillEditor'
    );

    if (!this.loaded) {
      this._loadSavedState(contentsDoc, editorNamespace, mode);
      this.loaded = true;
    }

    return (
      <div
        className={editorClass}
        oncreate={async (childVnode) => {
          this.$editor = $(childVnode.dom).find('.quill-editor');
          this.editor = new QuillEditor(
            this.$editor,
            this.activeMode,
            theme,
            imageUploader,
            placeholder,
            editorNamespace,
            onkeyboardSubmit,
            this.defaultContents,
            tabIndex
          );
          await this.editor.initialize();
          if (oncreateBind) oncreateBind(this.editor);
        }}
      >
        <div className="quill-editor" />
        {this.activeMode === 'markdown' && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="mode-switcher"
            title="Switch to RichText mode"
            onClick={(e) => {
              this.activeMode = 'richText';
              this.editor.activeMode = this.activeMode;
            }}
          >
            R
          </CWText>
        )}
        {this.activeMode === 'richText' && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="mode-switcher"
            title="Switch to Markdown mode"
            onClick={async () => {
              // Confirm before removing formatting and switching to Markdown mode.
              const confirmed = await this._confirmRemoveFormatting();
              if (!confirmed) return;

              // Remove formatting, switch to Markdown.
              this.editor.removeFormat(0, this.editor.endIndex);
              this.activeMode = 'markdown';
              this.editor.activeMode = this.activeMode;
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
            // @REACT @TODO: Re-add PreviewModal using new pattern
            return null;
          }}
        />
      </div>
    );
  }
}
