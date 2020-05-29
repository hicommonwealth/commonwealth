import 'pages/new_thread.scss';

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Form, FormGroup, Input, Button, ButtonGroup, Icons, Grid, Col, Tooltip } from 'construct-ui';

import app from 'state';
import { OffchainTag } from 'models';

import { notifyInfo } from 'controllers/app/notifications';
import QuillEditor from 'views/components/quill_editor';
import { formDataIncomplete, detectURL, getLinkTitle, newLink, newThread } from 'views/pages/threads';
import AutoCompleteTagForm from '../components/autocomplete_tag_form';
import PageLoading from './loading';

interface IState {
  form: IThreadForm,
  error,
  quillEditorState,
  hasComment,
  autoTitleOverride,
  newType,
  uploadsInProgress,
}

interface IThreadForm {
  tag?: OffchainTag | string;
  url?: string;
  title?: string;
}

export const NewThreadForm: m.Component<{}, IState> = {
  view: (vnode: VnodeDOM<{}, IState>) => {
    const author = app.vm.activeAccount;
    const activeEntity = app.community ? app.community : app.chain;
    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;


    // init
    if (vnode.state.form === undefined) vnode.state.form = {};
    if (vnode.state.error === undefined) vnode.state.error = {};
    if (vnode.state.uploadsInProgress === undefined) vnode.state.uploadsInProgress = 0;
    if (vnode.state.newType === undefined) vnode.state.newType = 'Discussion';
    const { error } = vnode.state;

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

    const typeSelector = m(FormGroup, [
      m(ButtonGroup, { fluid: true, outlined: true }, [
        m(Button, {
          iconLeft: Icons.FEATHER,
          label: 'Discussion',
          onclick: () => {
            vnode.state.newType = 'Discussion';
          },
          active: vnode.state.newType === 'Discussion',
          intent: vnode.state.newType === 'Discussion' ? 'primary' : 'none',
        }),
        m(Button, {
          iconLeft: Icons.LINK,
          label: 'Link',
          onclick: () => {
            vnode.state.newType = 'Link';
          },
          active: vnode.state.newType === 'Link',
          intent: vnode.state.newType === 'Link' ? 'primary' : 'none',
        }),
      ]),
    ]);

    return m('.NewThreadForm', {
      oncreate: (vvnode) => {
        $(vvnode.dom).find('.cui-input input').prop('autocomplete', 'off').focus();
      },
    }, [
      vnode.state.newType === 'Link' && m(Form, [
        typeSelector,
        m(FormGroup, [
          m(Input, {
            placeholder: 'https://',
            onchange: (e) => {
              const { value } = e.target as any;
              vnode.state.form.url = value;
              if (detectURL(value)) getUrlForLinkPost();
            },
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            class: 'new-thread-title',
            placeholder: 'Title',
            onchange: (e) => {
              const { value } = e.target as any;
              vnode.state.autoTitleOverride = true;
              if (vnode.state.error.title) delete vnode.state.error.title;
              vnode.state.form.title = value;
            },
          }),
        ]),
        m(FormGroup, [
          vnode.state.hasComment ? m(QuillEditor, {
            contentsDoc: '', // Prevent the editor from being filled in with previous content
            oncreateBind: (state) => {
              vnode.state.quillEditorState = state;
            },
            placeholder: 'Comment (optional)',
            editorNamespace: 'new-link',
          }) : m('a.add-comment', {
            href: '#',
            onclick: (e) => { vnode.state.hasComment = true; },
          }, 'Add comment'),
        ]),
        m(FormGroup, [
          m(AutoCompleteTagForm, {
            tags: activeEntityInfo.tags || [],
            featuredTags: activeEntityInfo.tags.filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
            updateFormData: (tag: OffchainTag | string) => {
              vnode.state.form.tag = tag;
            },
            updateParentErrors: (err: string) => {
              if (err) vnode.state.error = err;
              else delete vnode.state.error;
              m.redraw();
            },
            tabindex: 4,
          }),
        ]),
        m(FormGroup, [
          m(Button, {
            class: !author ? 'disabled' : '',
            intent: 'primary',
            label: 'Create link',
            onclick: () => {
              if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
                vnode.state.error.url = 'Must provide a valid URL.';
              }
              if (!Object.values(vnode.state.error).length) {
                newLink(vnode.state.form, vnode.state.quillEditorState, author);
              }
              if (!vnode.state.error) {
                $(vnode.dom).trigger('modalcomplete');
                setTimeout(() => {
                  $(vnode.dom).trigger('modalexit');
                }, 0);
              }
            },
          }),
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
      //
      vnode.state.newType === 'Discussion' && m(Form, [
        typeSelector,
        m(FormGroup, [
          m(Input, {
            name: 'title',
            placeholder: 'Title',
            onchange: (e) => {
              vnode.state.form.title = (e as any).target.value;
            },
          }),
        ]),
        m(FormGroup, [
          m(QuillEditor, {
            contentsDoc: '',
            oncreateBind: (state) => {
              vnode.state.quillEditorState = state;
            },
            tabindex: 2,
            editorNamespace: 'new-link',
          }),
        ]),
        m(FormGroup, [
          m(AutoCompleteTagForm, {
            tags: activeEntityInfo.tags || [],
            featuredTags: activeEntityInfo.tags.filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
            updateFormData: (tag: OffchainTag | string) => {
              vnode.state.form.tag = tag;
            },
            updateParentErrors: (err: string) => {
              if (err) vnode.state.error = err;
              else delete vnode.state.error;
              m.redraw();
            },
            tabindex: 3,
          }),
        ]),
        m(FormGroup, [
          m(Button, {
            class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
            intent: 'primary',
            onclick: () => {
              vnode.state.error = newThread(vnode.state.form, vnode.state.quillEditorState, author);
              if (!vnode.state.error) {
                $(vnode.dom).trigger('modalcomplete');
                setTimeout(() => {
                  $(vnode.dom).trigger('modalexit');
                }, 0);
              }
            },
            label: (vnode.state.uploadsInProgress > 0) ? 'Uploading...' : 'Create thread',
          }),
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
    ]);
  }
};

const NewThreadPage: m.Component = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'NewThreadPage' });
  },
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      notifyInfo('You need to log in first');
      m.route.set(`/${app.activeChainId()}/login`);
      return;
    }

    const author = app.vm.activeAccount;
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading);

    const span = {
      xs: 12,
      sm: 12,
      md: 11,
      lg: 10,
      xl: 8,
    };

    return m('.NewThreadPage', [
      m('.forum-container', [
        m('h2.page-title', 'New Post'),
        m(Grid, [
          m(Col, { span }, [
            m(NewThreadForm),
          ])
        ])
      ]),
    ]);
  },
};

export default NewThreadPage;
