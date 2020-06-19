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
  const { title, tagName } = form;
  if (quillEditorState.editor.getText().length <= 1 && !title) {
    return ({ draft: NewDraftErrors.InsufficientData });
  }
  const attachments = [];
  if (existingDraft) {
    (async () => {
      let result;
      try {
        result = await app.user.discussionDrafts.edit(
          existingDraft,
          title,
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
          title,
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

export const newThread = (
  form,
  quillEditorState,
  author,
  kind = OffchainThreadKind.Forum,
  privacy?: boolean,
  readOnly?: boolean
) => {
  if (!form.title) {
    return ({ title: NewThreadErrors.NoTitle });
  }
  if (!form.tagName) {
    return ({ tag: NewThreadErrors.NoTag });
  }
  if (kind === OffchainThreadKind.Link && !form.url) {
    return ({ url: NewThreadErrors.NoUrl });
  }
  if (kind === OffchainThreadKind.Forum && quillEditorState.editor.editor.isBlank()) {
    return ({ editor: NewThreadErrors.NoBody });
  }

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

  const { tagName, tagId, title, url } = form;
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

  (async () => {
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
      return ({ thread_creation: e });
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
  })();
};

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`;
  return !!str.match(re_weburl);
}

export const newLink = (form, quillEditorState, author, kind = OffchainThreadKind.Link) => {
  return newThread(form, quillEditorState, author, kind);
};

export const getLinkTitle = async (url: string) => {
  if (url.slice(0, 4) !== 'http') url = `http://${url}`;
  const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
  if (response.status === 404) return '404: Not Found';
  if (response.status === 500) return '500: Server Error';
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = doc.querySelectorAll('title')[0].innerText;
  return title;
};
