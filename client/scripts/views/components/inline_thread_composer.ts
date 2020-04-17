import 'components/inline_thread_composer.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { default as $ } from 'jquery';

import app from 'state';

import { OffchainThread, Account, OffchainThreadKind, AddressInfo, RoleInfo } from 'models';
import QuillEditor from 'views/components/quill_editor';
import User from 'views/components/widgets/user';
import { detectURL, getLinkTitle, newLink, newThread } from 'views/pages/threads';
import AutoCompleteTagForm from './autocomplete_tag_form';
import { isCommunityAdmin } from '../pages/discussions/roles';

interface ILinkPostAttrs {
  author: Account<any>;
  closeComposer: any;
  title: string;
  url: string;
}

interface ILinkPostState {
  autoTitleOverride: boolean;
  closed: boolean;
  error: any;
  form: any;
  quillEditorState: any;
  titleSelected: boolean;
}

const LinkPost: m.Component<ILinkPostAttrs, ILinkPostState> = {
  view: (vnode: m.VnodeDOM<ILinkPostAttrs, ILinkPostState>) => {
    const { author, closeComposer, title, url } = vnode.attrs;
    const { form, autoTitleOverride } = vnode.state;
    if (!vnode.state.error) vnode.state.error = {};
    if (!form) vnode.state.form = { title, url };
    else if (!autoTitleOverride) vnode.state.form = Object.assign(form, { title, url });
    else Object.assign(vnode.state.form, { url });
    const activeEntity = app.community ? app.community : app.chain;

    if (title === '404: Not Found' || title === '500: Server Error') {
      vnode.state.error.url = title;
      m.redraw();
    } else {
      delete vnode.state.error.url;
    }

    const invalidForm = (
      !author
      || Object.values(vnode.state.error).length
      || !vnode.state.form.title
      || !vnode.state.form.url
      || !vnode.state.form.tags
    );

    const createLink = (e?) => {
      if (e) e.preventDefault();
      if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
        vnode.state.error.url = 'Must provide a valid URL.';
      }
      if (Object.values(vnode.state.error).length) return;
      Object.assign(vnode.state.error, newLink(vnode.state.form, vnode.state.quillEditorState, author));
    };

    setTimeout(() => {
      if (document.getElementsByName('link-title')[0] && !vnode.state.titleSelected) {
        vnode.state.titleSelected = true;
        (document.getElementsByName('link-title')[0] as HTMLInputElement).select();
      }
    }, 1);
    const { closed } = vnode.state;
    return closed ? null : m('.LinkPost', [
      m('input[type="text"].form-field', {
        name: 'link-title',
        oninput: (e) => {
          vnode.state.autoTitleOverride = true;
          if (vnode.state.error.title) delete vnode.state.error.title;
          vnode.state.form.title = e.target.value;
        },
        placeholder: 'Link title',
        tabindex: 1,
        value: vnode.state.form.title,
      }),
      m(QuillEditor, {
        contentsDoc: '',
        oncreateBind: (state) => {
          vnode.state.quillEditorState = state;
        },
        placeholder: 'Add a description (optional)',
        tabindex: 2,
        theme: 'bubble',
        editorNamespace: 'new-link-inline',
        onkeyboardSubmit: createLink,
      }),
      m('.bottom-panel', [
        m('.actions', [
          m('button', {
            type: 'submit',
            onclick: createLink,
            tabindex: 4,
          }, 'Create link'),
          // m('button', {
          //   class: !author ? 'disabled' : '',
          //   type: 'cancel',
          //   onclick: closeComposer,
          // }, 'Cancel'),
        ]),
        m('.tag-selection', [
          m(AutoCompleteTagForm, {
            results: activeEntity.meta.tags || [],
            updateFormData: (tags: string[]) => { vnode.state.form.tags = tags; },
            updateParentErrors: (err: string) => {
              if (err) vnode.state.error = err;
              else delete vnode.state.error;
              m.redraw();
            },
            tabindex: 3,
          }),
        ]),
      ]),
      (typeof vnode.state.error === 'string' || Object.entries(vnode.state.error).length > 0)
        && m('.error-message', [
          (typeof vnode.state.error === 'string') ? m('span', vnode.state.error)
            : Object.values(vnode.state.error).map((val) => m('span', `${val} `)),
        ]),
    ]);
  },
};

interface ITextPostAttrs {
  author: Account<any>;
  closeComposer: any;
  title: string;
}

interface ITextPostState {
  read_only: boolean;
  privacy: boolean;
  tags: string[];
  uploadsInProgress: number;
  closed: boolean;
  error: any;
  form: any;
  quillEditorState: any;
}

const TextPost: m.Component<ITextPostAttrs, ITextPostState> = {
  oninit: (vnode: m.VnodeDOM<ITextPostAttrs, ITextPostState>) => {
    vnode.state.privacy = false;
    vnode.state.read_only = false;
  },
  view: (vnode: m.VnodeDOM<ITextPostAttrs, ITextPostState>) => {
    const { author, closeComposer, title } = vnode.attrs;
    const { closed } = vnode.state;
    const activeEntity = app.community ? app.community : app.chain;
    if (!vnode.state.error) vnode.state.error = {};
    if (closed) return null;
    vnode.state.form = vnode.state.form ? Object.assign(vnode.state.form, { title }) : { title };

    const createThread = (e?) => {
      if (e) e.preventDefault();
      const { form, quillEditorState } = vnode.state;
      const read_only = vnode.state.read_only || false;
      const privacy = vnode.state.privacy || false;
      vnode.state.error = newThread(form, quillEditorState, author, OffchainThreadKind.Forum, privacy, read_only);
      m.redraw();
    };

    return m('.TextPost', [
      m(QuillEditor, {
        contentsDoc: '',
        oncreateBind: (state) => {
          vnode.state.quillEditorState = state;
        },
        placeholder: 'Thread body',
        tabindex: 2,
        theme: 'bubble',
        editorNamespace: 'new-thread-inline',
        onkeyboardSubmit: createThread,
      }),
      m('.bottom-panel', [
        m('.actions', [
          m('button', {
            type: 'submit',
            onclick: createThread,
            tabindex: 4
          }, 'Create thread'),
          m('.property-group', [
            m('input[type="radio"]', {
              name: 'properties',
              value: 'public',
              id: 'public-thread',
              checked: (vnode.state.read_only === false && vnode.state.privacy === false),
              onclick: () => {
                vnode.state.read_only = false;
                vnode.state.privacy = false;
              }
            }),
            m('label', {
              for: 'public-thread',
            }, 'Public'),
            m('input[type="radio"]', {
              name: 'properties',
              value: 'private',
              id: 'private-thread',
              onclick: () => {
                vnode.state.read_only = false;
                vnode.state.privacy = true;
              }
            }),
            m('label', {
              for: 'private-thread',
            }, 'Private (Only admins/mods)'),
            m('input[type="radio"]', {
              name: 'properties',
              value: 'readOnly',
              id: 'read-only',
              onclick: () => {
                vnode.state.read_only = true;
                vnode.state.privacy = false;
              }
            }),
            m('label', {
              for: 'read-only',
            }, 'Read-Only'),
          ]),
        ]),
        m('.tag-selection', [
          m(AutoCompleteTagForm, {
            results: activeEntity.meta.tags || [],
            updateFormData: (tags: string[]) => {
              vnode.state.form.tags = tags;
            },
            updateParentErrors: (err: string) => {
              if (err) vnode.state.error = err;
              else delete vnode.state.error;
              m.redraw();
            },
            tabindex: 3,
          }),
        ]),
        (typeof vnode.state.error === 'string' || Object.entries(vnode.state.error).length > 0)
          && m('.error-message', [
            (typeof vnode.state.error === 'string') ? m('span', vnode.state.error)
              : Object.values(vnode.state.error).map((val) => m('span', `${val} `)),
          ]),
      ]),
    ]);
  },
};

interface IInlineThreadComposerAttrs {
  thread?: OffchainThread;
}

interface IInlineThreadComposerState {
  open: boolean;
  tags: string[];
  threadType: string | boolean;
  timeout: any;
  textTitle: string;
  linkTitle: string;
  url: string;
  mousedown: boolean;
  ctrlkeydown: boolean;
}

const InlineThreadComposer: m.Component<IInlineThreadComposerAttrs, IInlineThreadComposerState> = {
  oncreate: (vnode) => {
    vnode.state.timeout = null;
  },
  view: (vnode: m.VnodeDOM<IInlineThreadComposerAttrs, IInlineThreadComposerState>) => {
    const { threadType, textTitle, linkTitle, url } = vnode.state;
    const author = app.vm.activeAccount;
    if (!author) return null;

    const getTitleForLinkPost = _.debounce(async () => {
      vnode.state.linkTitle = await getLinkTitle(vnode.state.url);
      if (!vnode.state.linkTitle) vnode.state.linkTitle = 'No title found';
      vnode.state.textTitle = null;
      m.redraw();
    }, 750);
    const closeComposer = (e, clear) => {
      e.preventDefault();
      vnode.state.open = false;
      if (!clear) return;
      // The code below is unused but may be useful later, if we want to stay on the page after creating a thread
      vnode.state.threadType = false;
      vnode.state.textTitle = '';
      vnode.state.linkTitle = '';
      vnode.state.url = '';
      (document.getElementsByName('thread-composer')[0] as HTMLInputElement).value = '';
    };

    return m('.InlineThreadComposer', {
      class: vnode.state.open ? 'open' : '',
      onmousedown: (e) => {
        vnode.state.mousedown = true;
      },
      onmouseup: (e) => {
        vnode.state.mousedown = false;
      },
      onkeydown: (e) => {
        if (e.keyCode === 17) vnode.state.ctrlkeydown = true;
      },
      onkeyup: (e) => {
        if (e.keyCode === 17) vnode.state.ctrlkeydown = false;
      },
    }, [
      m('.flex-wrap', {
        onclick: (e) => {
          e.stopPropagation();
          if (vnode.state.open) return;
          const input = document.getElementsByName('thread-composer')[0];
          input.focus();
        },
      }, [
        m('.thread-avatar', [
          m(User, { user: author, avatarOnly: true, avatarSize: 28 }),
        ]),
        m('.thread-content', [
          m('.thread-title', [
            m('input[type="text"].form-field', {
              name: 'thread-composer',
              placeholder: 'Start a thread, or paste a link',
              autocomplete: 'off',
              onfocus: (e) => {
                vnode.state.open = true;
              },
              onblur: (e) => {
                if (e.relatedTarget && $(e.relatedTarget).hasClass('ql-editor')) return; // handle tabbing
                if (vnode.state.mousedown || vnode.state.ctrlkeydown || textTitle || linkTitle) return;
                vnode.state.open = false;
              },
              oninput: async (e) => {
                const { value } = e.target;
                vnode.state.threadType = detectURL(value) ? OffchainThreadKind.Link : OffchainThreadKind.Forum;

                if (vnode.state.threadType === OffchainThreadKind.Forum) {
                  vnode.state.textTitle = value;
                  vnode.state.linkTitle = null;
                } else if (vnode.state.threadType === OffchainThreadKind.Link) {
                  vnode.state.textTitle = null;
                  vnode.state.url = value;
                  getTitleForLinkPost();
                }
              },
              tabindex: 1,
            }),
          ]),
        ]),
      ]),
      vnode.state.open && m('.body-panel', [
        threadType !== OffchainThreadKind.Link
          ? m(TextPost, { author, closeComposer, title: textTitle })
          : linkTitle ? m(LinkPost, { author, closeComposer, title: linkTitle, url })
            : m('.spinner-wrap', [
              m('div', m('span.icon-spinner2.animate-spin')),
            ]),
      ]),
    ]);
  },
};

export default InlineThreadComposer;
