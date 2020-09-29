import 'components/inline_thread_composer.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Button, Input, RadioGroup, Radio } from 'construct-ui';

import app from 'state';

import { OffchainThread, Account, OffchainThreadKind, AddressInfo, RoleInfo } from 'models';
import QuillEditor from 'views/components/quill_editor';
import User from 'views/components/widgets/user';
import { formDataIncomplete, detectURL, getLinkTitle, newLink, newThread } from 'views/pages/threads';
import { notifyError } from 'controllers/app/notifications';
import TopicSelector from './topic_selector';

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
  form: IThreadForm;
  quillEditorState: any;
  titleSelected: boolean;
}

interface IThreadForm {
  topicName?: string;
  topicId?: number;
  url?: string;
  title?: string;
}

const LinkPost: m.Component<ILinkPostAttrs, ILinkPostState> = {
  view: (vnode: m.VnodeDOM<ILinkPostAttrs, ILinkPostState>) => {
    const { author, closeComposer, title, url } = vnode.attrs;
    const { form, autoTitleOverride } = vnode.state;
    if (!vnode.state.error) vnode.state.error = {};
    if (!form) vnode.state.form = { title, url };
    else if (!autoTitleOverride) vnode.state.form = Object.assign(form, { title, url });
    else Object.assign(vnode.state.form, { url });
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;

    if (title === '404: Not Found' || title === '500: Server Error') {
      vnode.state.error.url = title;
      m.redraw();
    } else {
      delete vnode.state.error.url;
    }

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
      m(Input, {
        fluid: true,
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
      m(TopicSelector, {
        topics: app.topics.getByCommunity(app.activeId()),
        featuredTopics: app.topics.getByCommunity(app.activeId())
          .filter((ele) => activeEntityInfo.featuredTopics.includes(`${ele.id}`)),
        updateFormData: (topicName: string, topicId?: number) => {
          vnode.state.form.topicName = topicName;
          vnode.state.form.topicId = topicId;
        },
        tabindex: 3,
      }),
      m('.bottom-panel', [
        m('.actions', [
          m(Button, {
            disabled: !author || !!formDataIncomplete(vnode.state),
            type: 'submit',
            intent: 'primary',
            onclick: createLink,
            tabindex: 4,
            label: 'Create thread'
          }),
          m(Button, {
            disabled: !author,
            type: 'cancel',
            onclick: closeComposer,
            basic: true,
            outlined: false,
            label: 'Cancel',
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
  readOnly: boolean;
  topics: string[];
  uploadsInProgress: number;
  closed: boolean;
  error: any;
  form: IThreadForm;
  quillEditorState: any;
}

const TextPost: m.Component<ITextPostAttrs, ITextPostState> = {
  oninit: (vnode: m.VnodeDOM<ITextPostAttrs, ITextPostState>) => {
    vnode.state.readOnly = false;
  },
  view: (vnode: m.VnodeDOM<ITextPostAttrs, ITextPostState>) => {
    const { author, closeComposer, title } = vnode.attrs;
    const { closed } = vnode.state;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;
    if (!vnode.state.error) vnode.state.error = {};
    if (closed) return null;
    vnode.state.form = vnode.state.form ? Object.assign(vnode.state.form, { title }) : { title };

    const createThread = (e?) => {
      if (e) e.preventDefault();
      const { form, quillEditorState } = vnode.state;
      const readOnly = vnode.state.readOnly || false;
      vnode.state.error = newThread(form, quillEditorState, author, OffchainThreadKind.Forum, readOnly);
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
      m(TopicSelector, {
        topics: app.topics.getByCommunity(app.activeId()),
        featuredTopics: app.topics.getByCommunity(app.activeId())
          .filter((ele) => activeEntityInfo.featuredTopics.includes(`${ele.id}`)),
        updateFormData: (topicName: string, topicId?: number) => {
          vnode.state.form.topicName = topicName;
          vnode.state.form.topicId = topicId;
        },
        tabindex: 3,
      }),
      m('.bottom-panel', [
        m('.actions', [
          m(Button, {
            disabled: !author || !!formDataIncomplete(vnode.state),
            type: 'submit',
            intent: 'primary',
            onclick: createThread,
            tabindex: 4,
            label: 'Create thread'
          }),
          m(Button, {
            disabled: !author,
            type: 'cancel',
            onclick: closeComposer,
            basic: true,
            outlined: false,
            label: 'Cancel',
            tabindex: 4
          }),
          m('.privacy-selection', [
            m(Radio, {
              name: 'properties',
              value: 'public',
              id: 'public-thread',
              checked: (vnode.state.readOnly === false),
              onclick: () => {
                vnode.state.readOnly = false;
              },
              label: 'Public',
            }),
            m(Radio, {
              name: 'properties',
              value: 'readOnly',
              id: 'read-only',
              onclick: () => {
                vnode.state.readOnly = true;
              },
              label: 'Read-Only',
            }),
          ]),
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
  topics: string[];
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
    const author = app.user.activeAccount;
    if (!author) return null;

    const getTitleForLinkPost = _.debounce(async () => {
      try {
        vnode.state.linkTitle = await getLinkTitle(vnode.state.url);
        if (!vnode.state.linkTitle) vnode.state.linkTitle = 'No title found';
        vnode.state.textTitle = null;
      } catch (err) {
        notifyError(err.message);
      }
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
      m('.top-panel', {
        onclick: (e) => {
          e.stopPropagation();
          if (vnode.state.open) return;
          const input = document.getElementsByName('thread-composer')[0];
          input.focus();
        },
      }, [
        m('.thread-avatar', [
          m(User, { user: author, avatarOnly: true, avatarSize: 30 }),
        ]),
        m('.thread-content', [
          m('.thread-title', [
            m(Input, {
              fluid: true,
              name: 'thread-composer',
              placeholder: 'Start a thread...',
              autocomplete: 'off',
              onfocus: (e) => {
                vnode.state.open = true;
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
