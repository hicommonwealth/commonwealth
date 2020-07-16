import 'pages/new_thread.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';
import { OffchainThreadKind, CommunityInfo, NodeInfo } from 'models';
import { re_weburl } from '../../../lib/url-validation';
import { updateLastVisited } from '../../../controllers/app/login';

enum NewThreadErrors {
  NoBody = 'Thread body cannot be blank',
  NoTag = 'Thread must have a tag',
  NoTitle = 'Title cannot be blank',
  NoUrl = 'URL cannot be blank',
}

enum NewDraftErrors {
  InsufficientData = 'Draft must have a title, body, or attachment'
}

export const formDataIncomplete = (state) : string => {
  if (!state.form.title) return NewThreadErrors.NoTitle;
  if (!state.form.tag) return NewThreadErrors.NoTag;
};

export const parseMentionsForServer = (text, isMarkdown) => {
  // Extract links to Commonwealth profiles, so they can be processed by the server as mentions
  const regexp = RegExp('\\[\\@.+?\\]\\(.+?\\)', 'g');
  if (isMarkdown) {
    const matches = text.match(regexp);
    if (matches && matches.length) {
      return matches.map((match) => {
        const chunks = match.slice(0, match.length - 1).split('/');
        const refIdx = chunks.indexOf('account');
        return [chunks[refIdx - 1], chunks[refIdx + 1]];
      });
    }
  } else {
    return text.ops
      .filter((op) => op.attributes?.link?.length && op.insert?.slice(0, 1) === '@')
      .map((op) => {
        const chunks = op.attributes.link.split('/');
        const refIdx = chunks.indexOf('account');
        return [chunks[refIdx - 1], chunks[refIdx + 1]];
      });
  }
};

export const saveDraft = (
  form,
  quillEditorState,
  author,
  existingDraft?
) => {
  const bodyText = !quillEditorState ? ''
    : quillEditorState.markdownMode
      ? quillEditorState.editor.getText()
      : JSON.stringify(quillEditorState.editor.getContents());
  const { threadTitle, tagName } = form;
  if (quillEditorState.editor.getText().length <= 1 && !threadTitle) {
    throw new Error(NewDraftErrors.InsufficientData);
  }
  const attachments = [];
  if (existingDraft) {
    (async () => {
      let result;
      try {
        result = await app.user.discussionDrafts.edit(
          existingDraft,
          threadTitle,
          bodyText,
          tagName,
          attachments
        );
      } catch (e) {
        console.error(e);
      }
      mixpanel.track('Update discussion draft', {
        'Step No': 2,
        Step: 'Filled in Proposal and Discussion',
      });
    })();
  } else {
    (async () => {
      let result;
      try {
        result = await app.user.discussionDrafts.create(
          threadTitle,
          bodyText,
          tagName,
          attachments
        );
      } catch (e) {
        console.error(e);
        return ({ draft: e });
      }
      mixpanel.track('Save discussion draft', {
        'Step No': 2,
        Step: 'Filled in Proposal and Discussion',
      });
    })();
  }
};

export const newThread = async (
  form,
  quillEditorState,
  author,
  kind = OffchainThreadKind.Forum,
  privacy?: boolean,
  readOnly?: boolean
) => {
  if (kind === OffchainThreadKind.Forum) {
    if (!form.threadTitle) {
      throw new Error(NewThreadErrors.NoTitle);
    }
  }
  if (kind === OffchainThreadKind.Link) {
    if (!form.linkTitle) {
      throw new Error(NewThreadErrors.NoTitle);
    }
    if (!form.url) {
      throw new Error(NewThreadErrors.NoUrl);
    }
  }
  if (!form.tagName) {
    throw new Error(NewThreadErrors.NoTag);
  }
  if (kind === OffchainThreadKind.Forum && quillEditorState.editor.editor.isBlank()) {
    throw new Error(NewThreadErrors.NoBody);
  }

  quillEditorState.editor.enable(false);

  const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
  if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
  const bodyText = !quillEditorState ? ''
    : quillEditorState.markdownMode
      ? quillEditorState.editor.getText()
      : JSON.stringify(quillEditorState.editor.getContents());
  const mentions = !quillEditorState ? []
    : quillEditorState.markdownMode
      ? parseMentionsForServer(quillEditorState.editor.getText(), true)
      : parseMentionsForServer(quillEditorState.editor.getContents(), false);

  const { tagName, tagId, threadTitle, linkTitle, url } = form;
  const title = threadTitle || linkTitle;
  const attachments = [];
  // const $textarea = $(vnode.dom).find('.DropzoneTextarea textarea');
  // const unescapedText = '' + $textarea.val();
  // const attachments = vnode.state.files ?
  //   vnode.state.files.map((f) => f.uploadURL && f.uploadURL.replace(/\?.*/, '')) : [];
  // if (!unescapedText.trim() && !attachments) {
  //   return vnode.state.error = 'Description or attachments are required.';
  //   throw new Error();
  // }
  const chainId = app.activeCommunityId() ? null : app.activeChainId();
  const communityId = app.activeCommunityId();

  let result;
  try {
    result = await app.threads.create(
      author.address,
      kind,
      chainId,
      communityId,
      title,
      tagName,
      tagId,
      bodyText,
      url,
      attachments,
      mentions,
      privacy,
      readOnly,
    );
  } catch (e) {
    console.error(e);
    quillEditorState.editor.enable();
    throw new Error(e);
  }
  const activeEntity = app.activeCommunityId() ? app.community : app.chain;
  updateLastVisited(app.activeCommunityId()
    ? (activeEntity.meta as CommunityInfo)
    : (activeEntity.meta as NodeInfo).chain, true);
  await app.user.notifications.refresh();
  m.route.set(`/${app.activeId()}/proposal/discussion/${result.id}`);

  try {
    const tagNames = Array.isArray(activeEntity?.meta?.tags)
      ? activeEntity.meta.tags.map((t) => t.name)
      : [];
    if (!tagNames.includes(result.tag.name)) {
      activeEntity.meta.tags.push(result.tag);
    }
  } catch (e) {
    console.log(`Error adding new tag to ${activeEntity}.`);
  }

  mixpanel.track('Create Thread', {
    'Step No': 2,
    Step: 'Filled in Proposal and Discussion',
    'Thread Type': kind,
  });
};

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`;
  return !!str.match(re_weburl);
}

export const newLink = async (form, quillEditorState, author, kind = OffchainThreadKind.Link) => {
  const errors = await newThread(form, quillEditorState, author, kind);
  return errors;
};

export const getLinkTitle = async (url: string) => {
  if (url.slice(0, 4) !== 'http') url = `http://${url}`;
  const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
  if (response.status === 404) throw new Error(`404: ${url} Not Found`);
  if (response.status === 500) throw new Error(`500: ${url} Server Error`);
  return (document.querySelector('input[name=\'title\']') as HTMLInputElement).innerText;
};
