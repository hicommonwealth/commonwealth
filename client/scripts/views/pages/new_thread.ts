import 'pages/new_thread.scss';

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import {
  RadioGroup, Form, FormGroup, Input, Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem
} from 'construct-ui';

import app from 'state';
import { OffchainThreadKind, CommunityInfo, NodeInfo } from 'models';

import { notifyInfo } from 'controllers/app/notifications';
import PreviewModal from 'views/modals/preview_modal';
import User from 'views/components/widgets/user';
import QuillEditor from 'views/components/quill_editor';
import { newThread, getLinkTitle, detectURL, newLink } from 'views/pages/threads';
import { re_weburl } from '../../lib/url-validation';
import { updateLastVisited } from '../../controllers/app/login';
import AutoCompleteTagForm from '../components/autocomplete_tag_form';
import PageLoading from './loading';

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
  tags: any[];
}

const NewThreadPage = {
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

    return m('.NewThreadPage', [
      m('.forum-container', [
        m('h2.page-title', 'New Post'),
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
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              label: 'Create link',
              onclick: () => {
                if (!vnode.state.error.url && !detectURL(vnode.state.form.url)) {
                  vnode.state.error.url = 'Must provide a valid URL.';
                }
                if (!Object.values(vnode.state.error).length) {
                  Object.assign(vnode.state.error, newLink(vnode.state.form, vnode.state.quillEditorState, author));
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
          m(FormGroup, [
            m(Button, {
              disabled: !author || vnode.state.uploadsInProgress > 0,
              intent: 'primary',
              onclick: () => {
                vnode.state.error = newThread(vnode.state.form, vnode.state.quillEditorState, author);
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
      ]),
    ]);
  },
};

export default NewThreadPage;
