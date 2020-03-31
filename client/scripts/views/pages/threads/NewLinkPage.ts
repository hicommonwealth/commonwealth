import 'pages/new_thread.scss';

import m from 'mithril';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import ObjectPage from 'views/pages/_object_page';
import { notifyInfo } from 'controllers/app/notifications';
import User from 'views/components/widgets/user';
import QuillEditor from 'views/components/quill_editor';
import { getLinkTitle, detectURL, newLink } from './index';
import AutoCompleteTagForm from '../../components/autocomplete_tag_form';
import PageLoading from '../loading';

interface INewLinkPageState {
  autoTitleOverride: boolean;
  hasComment: boolean;
  form: INewLinkFormState;
  error: any;
  quillEditorState: any;
  timeout: any;
}

interface INewLinkFormState {
  categoryId: number;
  title: string;
  url: string;
}

const LinkUrlComponent = (vnode, author) => {
  const getUrlForLinkPost = _.debounce(async () => {
    const res = await getLinkTitle(vnode.state.form.url);
    if (res === '404: Not Found' || res === '500: Server Error') {
      vnode.state.error.url = res;
    } else {
      delete vnode.state.error.url;
      if (!vnode.state.autoTitleOverride) vnode.state.form.title = res;
    }
    m.redraw();
  }, 750);

  return m('input[type="text"].form-field', {
    name: 'LinkURL',
    placeholder: 'https://',
    onclick: (e) => {
      e.preventDefault();
      if (!author) vnode.state.error = 'You must be logged in to post.';
    },
    oninput: async (e) => {
      const { value } = e.target;
      vnode.state.form.url = value;
      if (detectURL(value)) {
        getUrlForLinkPost();
      }
    },
    autocomplete: 'off',
    tabindex: 1,
  });
};

const LinkTitleComponent = (vnode) => {
  return m('input[type="text"].form-field', {
    name: 'LinkTitle',
    oninput: (e) => {
      vnode.state.autoTitleOverride = true;
      if (vnode.state.error.title) delete vnode.state.error.title;
      vnode.state.form.title = e.target.value;
    },
    placeholder: 'Title',
    tabindex: 2,
    autocomplete: 'off',
    value: vnode.state.form.title,
  });
};

const AddCommentComponent = (vnode) => {
  return vnode.state.hasComment ? m(QuillEditor, {
    contentsDoc: '', // Prevent the editor from being filled in with previous content
    oncreateBind: (state) => {
      vnode.state.quillEditorState = state;
    },
    placeholder: 'Comment (optional)',
    editorNamespace: 'new-link',
  }) : m('a.add-comment', {
    href: '#',
    onclick: (e) => { vnode.state.hasComment = true; },
  }, [
    'Add comment',
  ]);
};

const ActionsComponent = (vnode, author) => {
  return m('.actions', [
    m('button', {
      type: 'submit',
      onclick: (e) => {
        e.preventDefault();
        if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
          vnode.state.error.url = 'Must provide a valid URL.';
        }
        if (!Object.values(vnode.state.error).length) {
          Object.assign(vnode.state.error, newLink(vnode.state.form, vnode.state.quillEditorState, author));
        }
      },
    }, author ? 'Create link post' : 'Setup required'),
  ]);
};

const AutoCompleteComponent = (vnode, activeEntity) => {
  return m(AutoCompleteTagForm, {
    results: activeEntity.meta.tags || [],
    updateFormData: (tags: string[]) => {
      vnode.state.form.tags = tags;
    },
    updateParentErrors: (err: string) => {
      if (err) vnode.state.error = err;
      else delete vnode.state.error;
      m.redraw();
    },
    tabindex: 4,
  });
};

const NewLinkPage = {
  oncreate: () => {
    mixpanel.track('PageVisit', { 'Page Name': 'NewLinkPage' });
  },
  view: (vnode: m.VnodeDOM<{}, INewLinkPageState>) => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      m.route.set(`/${app.activeChainId()}/login`);
    } else {
      const activeEntity = app.community ? app.community : app.chain;

      if (!activeEntity) return m(PageLoading);

      const author = app.vm.activeAccount;

      // init;
      if (!vnode.state.form) {
        vnode.state.form = { categoryId: undefined, title: '', url: '' };
      }
      if (!vnode.state.error) {
        vnode.state.error = {};
      }
      const { error } = vnode.state;

      return m(ObjectPage, {
        class: 'NewLinkPage',
        content: activeEntity && [
          m('.forum-container', [
            m('h2.page-title', 'New Link Post'),
            m('.row', [
              m('.new-link-left.col-sm-1', [
                author && m(User, { user: author, avatarOnly: true, avatarSize: 48 }),
              ]),
              m('.new-link-center.col-sm-8', [
                LinkUrlComponent(vnode, author),
                LinkTitleComponent(vnode),
                AddCommentComponent(vnode),
                m('.bottom-panel', [
                  ActionsComponent(vnode, author),
                  AutoCompleteComponent(vnode, activeEntity)
                ]),
                error
                && (typeof error === 'string' || Object.keys(error).length)
                  ? m('.error-message', [
                    (typeof error === 'string')
                      ? m('span', error)
                      : Object.values(error).map((val) => m('span', `${val} `)),
                  ])
                  : m('.error-placeholder'),
              ]),
              m('.new-link-right.col-sm-3', [
              ]),
            ]),
          ]),
        ],
      });
    }
  },
};

export default NewLinkPage;
