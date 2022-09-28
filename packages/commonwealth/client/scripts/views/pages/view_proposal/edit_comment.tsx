/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/edit_comment.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { Comment, Thread } from 'models';
import { validURL } from 'utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { clearEditingLocalStorage } from './helpers';
import { ProposalPageState } from './types';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { QuillEditor } from '../../components/quill/quill_editor';

type EditCommentAttrs = {
  callback?: () => void;
  comment: Comment<any>;
  proposalPageState: ProposalPageState;
  setIsGloballyEditing: (status: boolean) => void;
  updatedUrl?: string;
};

export class EditComment implements m.ClassComponent<EditCommentAttrs> {
  private quillEditorState: QuillEditor;
  private restoreEdits: boolean;
  private savedEdits: string;
  private saving: boolean;

  async oninit(vnode) {
    const { comment } = vnode.attrs;

    const isThread = comment instanceof Thread;

    this.savedEdits = isThread
      ? localStorage.getItem(
          `${app.activeChainId()}-edit-thread-${comment.id}-storedText`
        )
      : localStorage.getItem(
          `${app.activeChainId()}-edit-comment-${comment.id}-storedText`
        );

    if (this.savedEdits) {
      const modalMsg = 'Previous changes found. Restore edits?';

      this.restoreEdits = await confirmationModalWithText(
        modalMsg,
        'Yes',
        'No'
      )();

      clearEditingLocalStorage(comment, isThread);

      m.redraw();
    }
  }

  view(vnode) {
    const {
      callback,
      comment,
      setIsGloballyEditing,
      proposalPageState,
      updatedUrl,
    } = vnode.attrs;

    const { restoreEdits, savedEdits } = this;

    const isThread = comment instanceof Thread;

    const body =
      restoreEdits && savedEdits
        ? savedEdits
        : comment instanceof Comment
        ? (comment as Comment<any>).text
        : comment instanceof Thread
        ? (comment as Thread).body
        : null;

    return (
      <div class="EditComment">
        {savedEdits && restoreEdits === undefined ? (
          <QuillEditorComponent />
        ) : (
          <QuillEditorComponent
            contentsDoc={(() => {
              try {
                const doc = JSON.parse(body);
                if (!doc.ops) throw new Error();
                return doc;
              } catch (e) {
                return body;
              }
            })()}
            oncreateBind={(state) => {
              this.quillEditorState = state;
            }}
            imageUploader
            theme="snow"
            editorNamespace={
              isThread
                ? `edit-thread-${comment.id}`
                : `edit-comment-${comment.id}`
            }
          />
        )}
        <div class="comment-edit-buttons">
          <CWButton
            label="Cancel"
            disabled={this.saving}
            buttonType="secondary-blue"
            onclick={async (e) => {
              e.preventDefault();

              let confirmed = true;

              const threadText = this.quillEditorState.textContentsAsString;

              if (threadText !== body) {
                confirmed = await confirmationModalWithText(
                  'Cancel editing? Changes will not be saved.'
                )();
              }

              if (confirmed) {
                setIsGloballyEditing(false);

                clearEditingLocalStorage(comment, comment instanceof Thread);

                m.redraw();
              }
            }}
          />
          <CWButton
            label="Save"
            disabled={this.saving}
            onclick={(e) => {
              e.preventDefault();

              if (updatedUrl) {
                if (!validURL(updatedUrl)) {
                  notifyError('Must provide a valid URL.');
                  return;
                }
              }

              this.saving = true;

              this.quillEditorState.disable();

              const itemText = this.quillEditorState.textContentsAsString;

              if (comment instanceof Thread) {
                app.threads
                  .edit(
                    comment,
                    itemText,
                    proposalPageState.updatedTitle,
                    updatedUrl
                  )
                  .then(() => {
                    navigateToSubpage(`/discussion/${comment.id}`);

                    this.saving = false;

                    clearEditingLocalStorage(comment, true);

                    setIsGloballyEditing(false);

                    m.redraw();

                    notifySuccess('Thread successfully edited');
                  });
              } else if (comment instanceof Comment) {
                app.comments.edit(comment, itemText).then(() => {
                  this.saving = false;

                  clearEditingLocalStorage(comment, false);

                  setIsGloballyEditing(false);

                  callback();
                });
              }
            }}
          />
        </div>
      </div>
    );
  }
}
