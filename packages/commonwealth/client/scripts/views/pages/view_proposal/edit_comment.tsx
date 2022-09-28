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
import { GlobalStatus } from './types';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';

export class ProposalBodyCancelEdit
  implements
    m.Component<{
      item;
      getSetGlobalEditingStatus;
      parentState;
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return (
      <CWButton
        label="Cancel"
        disabled={parentState.saving}
        buttonType="secondary-blue"
        onclick={async (e) => {
          e.preventDefault();

          let confirmed = true;

          const threadText = parentState.quillEditorState.textContentsAsString;

          if (threadText !== parentState.currentText) {
            confirmed = await confirmationModalWithText(
              'Cancel editing? Changes will not be saved.'
            )();
          }

          if (!confirmed) return;

          parentState.editing = false;

          getSetGlobalEditingStatus(GlobalStatus.Set, false);

          clearEditingLocalStorage(item, item instanceof Thread);

          m.redraw();
        }}
      />
    );
  }
}

export class ProposalBodySaveEdit
  implements
    m.Component<{
      item: Thread | Comment<any>;
      getSetGlobalEditingStatus;
      parentState;
      callback?: () => void; // required for Comments
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, parentState, callback } =
      vnode.attrs;

    return (
      <CWButton
        label="Save"
        disabled={parentState.saving}
        onclick={(e) => {
          e.preventDefault();

          if (parentState.updatedUrl) {
            if (!validURL(parentState.updatedUrl)) {
              notifyError('Must provide a valid URL.');
              return;
            }
          }

          parentState.saving = true;

          parentState.quillEditorState.disable();

          const itemText = parentState.quillEditorState.textContentsAsString;

          if (item instanceof Thread) {
            app.threads
              .edit(
                item,
                itemText,
                parentState.updatedTitle,
                parentState.updatedUrl
              )
              .then(() => {
                navigateToSubpage(`/discussion/${item.id}`);

                parentState.editing = false;

                parentState.saving = false;

                clearEditingLocalStorage(item, true);

                getSetGlobalEditingStatus(GlobalStatus.Set, false);

                m.redraw();

                notifySuccess('Thread successfully edited');
              });
          } else if (item instanceof Comment) {
            app.comments.edit(item, itemText).then(() => {
              parentState.editing = false;

              parentState.saving = false;

              clearEditingLocalStorage(item, false);

              getSetGlobalEditingStatus(GlobalStatus.Set, false);

              callback();
            });
          }
        }}
      />
    );
  }
}

export class ProposalBodyEditor
  implements
    m.Component<{
      item: Thread | Comment<any>;
      parentState;
    }>
{
  private restoreEdits: boolean;
  private savedEdits: string;

  async oninit(vnode) {
    const { item } = vnode.attrs;

    const isThread = item instanceof Thread;

    this.savedEdits = isThread
      ? localStorage.getItem(
          `${app.activeChainId()}-edit-thread-${item.id}-storedText`
        )
      : localStorage.getItem(
          `${app.activeChainId()}-edit-comment-${item.id}-storedText`
        );

    if (this.savedEdits) {
      const modalMsg = 'Previous changes found. Restore edits?';

      this.restoreEdits = await confirmationModalWithText(
        modalMsg,
        'Yes',
        'No'
      )();

      clearEditingLocalStorage(item, isThread);

      m.redraw();
    }
  }

  view(vnode) {
    const { item, parentState } = vnode.attrs;
    const { restoreEdits, savedEdits } = this;

    const isThread = item instanceof Thread;

    const body =
      restoreEdits && savedEdits
        ? savedEdits
        : item instanceof Comment
        ? (item as Comment<any>).text
        : item instanceof Thread
        ? (item as Thread).body
        : null;

    if (savedEdits && restoreEdits === undefined) {
      return <QuillEditorComponent />;
    }

    return (
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
          parentState.quillEditorState = state;
        }}
        imageUploader
        theme="snow"
        editorNamespace={
          isThread ? `edit-thread-${item.id}` : `edit-comment-${item.id}`
        }
      />
    );
  }
}

type EditCommentAttrs = {
  callback?: CallableFunction;
  comment: Comment<any>;
  getSetGlobalEditingStatus: CallableFunction;
};

export class EditComment implements m.ClassComponent<EditCommentAttrs> {
  view(vnode) {
    const { callback, comment, getSetGlobalEditingStatus } = vnode.attrs;

    return (
      <div class="EditComment">
        <ProposalBodyEditor item={comment} parentState={this} />
        <div class="comment-edit-buttons">
          <ProposalBodyCancelEdit
            item={comment}
            getSetGlobalEditingStatus={getSetGlobalEditingStatus}
            parentState={this}
          />
          <ProposalBodySaveEdit
            item={comment}
            getSetGlobalEditingStatus={getSetGlobalEditingStatus}
            parentState={this}
            callback={callback}
          />
        </div>
      </div>
    );
  }
}
