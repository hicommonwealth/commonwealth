/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'components/quill/quill_editor.scss';

import app from 'state';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { PreviewModal } from 'views/modals/preview_modal';
import { QuillEditor } from './instantiate_editor_helper';
import { getClasses } from '../component_kit/helpers';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import {
  QuillTextContents,
  QuillActiveMode,
  QuillMode,
  QuillDelta,
} from './types';

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
  oncreateBind;
  onkeyboardSubmit?;
  placeholder?: string;
  tabIndex?: number;
  theme?: string;
};

// TODO:
// - Modularize
// - Fix image blots, Twitter blots if broken
// - Convert generic HTML tags to CWText components

export class QuillEditorComponent
  implements m.ClassComponent<QuillEditorComponentAttrs>
{
  private _$editor: JQuery<HTMLElement>;
  private _activeMode: QuillActiveMode;
  private _defaultContents: QuillTextContents;
  private _loaded: boolean;

  public get activeMode() {
    return this._activeMode;
  }
  public set activeMode(mode: QuillActiveMode) {
    this._activeMode = mode;
  }

  // which are private?
  editor: QuillEditor;
  uploading?: boolean;
  enableSubmission: boolean;

  // for localStorage drafts:
  alteredText: boolean;

  // Unsaved content alerts
  beforeunloadHandler;
  clearUnsavedChanges;
  unsavedChanges;

  loadSavedState(
    contentsDoc?: string,
    editorNamespace?: string,
    mode?: QuillMode
  ) {
    const storedDoc: string = localStorage.getItem(
      `${app.activeChainId()}-${editorNamespace}-storedText`
    );
    const storedMode = localStorage.getItem(
      `${editorNamespace}-_activeMode`
    ) as QuillActiveMode;

    if (contentsDoc) {
      // better logic for guessing and parsing, e.g. based on string includes 'op:'
      try {
        this._defaultContents = JSON.parse(contentsDoc);
      } catch (e) {
        this._defaultContents = contentsDoc;
      }
    } else if (storedDoc) {
      // better logic for guessing and parsing
      try {
        this._defaultContents = JSON.parse(storedDoc);
        this._activeMode = 'richText';
      } catch (e) {
        contentsDoc = localStorage.getItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        this._activeMode = 'markdown';
      }
    }

    if (mode === 'hybrid') {
      if (storedMode === 'markdown') {
        this._activeMode = 'markdown';
      } else if (storedMode === 'richText') {
        this._activeMode = 'richText';
      } else {
        // Otherwise, set this._activeMode based on the app setting
        this._activeMode = app.user?.disableRichText ? 'markdown' : 'richText';
      }
    }
  }

  private async _confirmRemoveFormatting() {
    let confirmed = false;

    // If contents pre- and post-formatting are identical, then nothing will be lost,
    // and there's no reason to confirm the switch.
    this._defaultContents = this.editor.getContents() as QuillDelta;
    this.editor.removeFormat(0, this.editor.getText().length - 1);
    if (
      this.editor.getContents().ops.length === this._defaultContents.ops.length
    ) {
      confirmed = true;
    } else {
      confirmed = await confirmationModalWithText(
        'All formatting and images will be lost. Continue?'
      )();
    }

    if (!confirmed) {
      // Restore formatted contents
      this.editor.setContents(this._defaultContents);
      this.editor.setSelection(this.editor.getText().length - 1);
    }
    return confirmed;
  }

  // LIFECYCLE HELPERS

  oncreate(vnode) {
    // Only bind the alert if we are actually trying to persist the user's changes
    if (!vnode.attrs.contentsDoc) {
      this.beforeunloadHandler = () => {
        if (this.unsavedChanges && this.unsavedChanges.length() > 0) {
          return 'There are unsaved changes. Are you sure you want to leave?';
        }
      };
      $(window).on('beforeunload', this.beforeunloadHandler);
    }
  }

  onremove(vnode) {
    if (!vnode.attrs.contentsDoc) {
      $(window).off('beforeunload', this.beforeunloadHandler);
    }
  }

  view(vnode) {
    const theme = vnode.attrs.theme || 'snow';

    const {
      className,
      contentsDoc,
      editorNamespace,
      imageUploader,
      onkeyboardSubmit,
      placeholder,
      tabIndex,
      oncreateBind,
    } = vnode.attrs;

    // TODO: Sync up SCSS classes to new activeMode schema
    const editorClass = getClasses<{ mode: string; className?: string }>(
      { mode: this._activeMode, className },
      'QuillEditor'
    );

    if (!this._loaded) {
      this.loadSavedState(contentsDoc, editorNamespace);
      this.clearUnsavedChanges = () => {
        Object.keys(localStorage)
          .filter((key) => key.includes(editorNamespace))
          .forEach((key) => {
            localStorage.removeItem(key);
          });
      };
      this._loaded = true;
    }

    return (
      <div
        class={editorClass}
        oncreate={(childVnode) => {
          this._$editor = $(childVnode.dom).find('.quill-editor');
          this.editor = new QuillEditor(
            this._$editor,
            theme,
            imageUploader,
            placeholder,
            editorNamespace,
            this,
            onkeyboardSubmit,
            this._defaultContents,
            tabIndex
          );
          if (oncreateBind) oncreateBind(this);
        }}
      >
        <div class="quill-editor" />
        {this._activeMode === 'markdown' && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="mode-switcher"
            title="Switch to Rich Text mode"
            onclick={(e) => {
              this._defaultContents = this.editor.getContents();
              this._activeMode = 'richText';
              this.editor = new QuillEditor(
                this._$editor,
                theme,
                imageUploader,
                placeholder,
                editorNamespace,
                this,
                onkeyboardSubmit,
                this._defaultContents,
                tabIndex
              );
            }}
          >
            R
          </CWText>
        )}
        ,
        {this._activeMode === 'richText' && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="mode-switcher"
            title="Switch to markdown mode"
            onclick={async (e) => {
              // Confirm before removing formatting and switching to Markdown mode.
              const confirmed = await this._confirmRemoveFormatting();
              if (!confirmed) return;

              // Remove formatting, switch to Markdown.
              this.editor.removeFormat(0, this.editor.getText().length - 1);
              this._defaultContents = this.editor.getContents();
              this._activeMode = 'markdown';

              this.editor = new QuillEditor(
                this._$editor,
                theme,
                imageUploader,
                placeholder,
                editorNamespace,
                this,
                onkeyboardSubmit,
                this._defaultContents
              );
            }}
          >
            M
          </CWText>
        )}
        <CWIconButton
          iconName="search"
          iconSize="small"
          iconButtonTheme="primary"
          onclick={(e) => {
            e.preventDefault();
            app.modals.create({
              modal: PreviewModal,
              data: {
                doc:
                  this._activeMode === 'markdown'
                    ? this.editor.getText()
                    : JSON.stringify(this.editor.getContents()),
              },
            });
          }}
        />
      </div>
    );
  }
}
