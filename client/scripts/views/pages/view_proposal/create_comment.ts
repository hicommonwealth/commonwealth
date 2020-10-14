import 'pages/view_proposal/create_comment.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Button, Callout } from 'construct-ui';

import app from 'state';

import { OffchainThread, OffchainComment, AnyProposal } from 'models';
import { CommentParent } from 'controllers/server/comments';
import { parseMentionsForServer } from 'views/pages/threads';
import QuillEditor from 'views/components/quill_editor';
import User from 'views/components/widgets/user';

import { GlobalStatus } from './body';

const CreateComment: m.Component<{
  callback: CallableFunction,
  cancellable?: boolean,
  getSetGlobalEditingStatus: CallableFunction,
  getSetGlobalReplyStatus: CallableFunction,
  parentComment?: OffchainComment<any>,
  rootProposal: AnyProposal | OffchainThread,
  tabindex?: number,
}, {
  quillEditorState: any,
  uploadsInProgress,
  error,
  saving: boolean,
  sendingComment,
}> = {
  view: (vnode) => {
    const {
      callback,
      cancellable,
      getSetGlobalEditingStatus,
      getSetGlobalReplyStatus,
      rootProposal
    } = vnode.attrs;
    let { parentComment } = vnode.attrs;
    const author = app.user.activeAccount;
    const parentType = parentComment ? CommentParent.Comment : CommentParent.Proposal;
    if (!parentComment) parentComment = null;
    if (vnode.state.uploadsInProgress === undefined) {
      vnode.state.uploadsInProgress = 0;
    }

    const submitComment = async (e?) => {
      if (!vnode.state.quillEditorState || !vnode.state.quillEditorState.editor) {
        if (e) e.preventDefault();
        vnode.state.error = 'Editor not initialized, please try again';
        return;
      }
      if (vnode.state.quillEditorState.editor.editor.isBlank()) {
        if (e) e.preventDefault();
        vnode.state.error = 'Comment cannot be blank';
        return;
      }

      const { quillEditorState } = vnode.state;

      const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';


      const commentText = quillEditorState.markdownMode
        ? quillEditorState.editor.getText()
        : JSON.stringify(quillEditorState.editor.getContents());
      const mentions = !quillEditorState
        ? null
        : quillEditorState.markdownMode
          ? parseMentionsForServer(quillEditorState.editor.getText(), true)
          : parseMentionsForServer(quillEditorState.editor.getContents(), false);

      const attachments = [];
      // const attachments = vnode.state.files ?
      //   vnode.state.files.map((f) => f.uploadURL.replace(/\?.*/, '')) : [];

      vnode.state.error = null;
      vnode.state.sendingComment = true;
      quillEditorState.editor.enable(false);
      const chainId = app.activeCommunityId() ? null : app.activeChainId();
      const communityId = app.activeCommunityId();
      try {
        const res = await app.comments.create(author.address, rootProposal.uniqueIdentifier,
          chainId, communityId, commentText, parentComment?.id, attachments, mentions);
        callback();
        if (vnode.state.quillEditorState.editor) {
          vnode.state.quillEditorState.editor.enable();
          vnode.state.quillEditorState.editor.setContents();
          vnode.state.quillEditorState.clearUnsavedChanges();
        }
        vnode.state.sendingComment = false;
        // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
        // once we are receiving notifications from the websocket
        await app.user.notifications.refresh();
        m.redraw();
      } catch (err) {
        if (vnode.state.quillEditorState.editor) {
          vnode.state.quillEditorState.editor.enable();
        }
        vnode.state.error = err.message;
        vnode.state.sendingComment = false;
        m.redraw();
      }
      vnode.state.saving = false;
      mixpanel.track('Proposal Funnel', {
        'Step No': 2,
        'Step': 'Create Comment',
        'Proposal Name': `${(rootProposal).slug}: ${(rootProposal).identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Comment');
      mixpanel.people.set({
        'Last Comment Created': new Date().toISOString()
      });

      getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
    };

    const { error, sendingComment, uploadsInProgress } = vnode.state;

    return m('.CreateComment', {
      class: parentType === CommentParent.Comment ? 'new-comment-child' : 'new-thread-child'
    }, [
      m('.create-comment-avatar', [
        m(User, { user: author, popover: true, avatarOnly: true, avatarSize: 36 }),
      ]),
      m('.create-comment-body', [
        m(User, { user: author, popover: true, hideAvatar: true }),
        (rootProposal instanceof OffchainThread && rootProposal.readOnly)
          ? m(Callout, {
            intent: 'primary',
            content: 'Commenting is disabled because this post has been locked.',
          })
          : [
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              editorNamespace: `${document.location.pathname}-commenting`,
              onkeyboardSubmit: () => {
                submitComment();
                m.redraw(); // ensure button is disabled
              },
              tabindex: vnode.attrs.tabindex,
            }),
            m('.form-bottom', [
              m(Button, {
                intent: 'primary',
                type: 'submit',
                compact: true,
                disabled: getSetGlobalEditingStatus(GlobalStatus.Get) || sendingComment || uploadsInProgress > 0,
                onclick: submitComment,
                label: (uploadsInProgress > 0)
                  ? 'Uploading...'
                  : parentType === CommentParent.Proposal ? 'Post comment' : 'Reply to comment'
              }),
              cancellable
                && m(Button, {
                  intent: 'none',
                  type: 'cancel',
                  compact: true,
                  onclick: (e) => {
                    e.preventDefault();
                    getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
                  },
                  label: 'Cancel'
                }),
              error
                && m('.new-comment-error', error),
            ])
          ]
      ])
    ]);
  }
};

export default CreateComment;
