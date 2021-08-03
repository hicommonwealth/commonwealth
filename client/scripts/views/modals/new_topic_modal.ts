import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';

interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}

const NewTopicModal: m.Component<{
  id: number,
  name: string,
  description: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isSiteAdmin && !app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featured_in_sidebar, featured_in_new_post } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featured_in_sidebar, featured_in_new_post };
    }

    return m('.NewTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'New topic'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              class: 'topic-form-name',
              tabindex: 1,
              defaultValue: vnode.state.form.name,
              autocomplete: 'off',
              oncreate: (vvnode) => {
                // use oncreate to focus because autofocus: true fails when component is recycled in a modal
                setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
              },
              oninput: (e) => {
                vnode.state.form.name = (e.target as any).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              class: 'topic-form-description',
              tabindex: 2,
              defaultValue: vnode.state.form.description,
              oninput: (e) => {
                vnode.state.form.description = (e.target as any).value;
              }
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in Sidebar',
              checked: vnode.state.form.featured_in_sidebar,
              onchange: (e) => {
                vnode.state.form.featured_in_sidebar = !vnode.state.form.featured_in_sidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featured_in_new_post,
              onchange: (e) => {
                vnode.state.form.featured_in_new_post = !vnode.state.form.featured_in_new_post;
              },
            }),
          ]),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              if (!vnode.state.form.name.trim()) return;
              app.topics.add(
                vnode.state.form.name, vnode.state.form.description, null, vnode.state.form.featured_in_sidebar, vnode.state.form.featured_in_new_post
              ).then(() => {
                vnode.state.saving = false;
                m.redraw();
                $(e.target).trigger('modalexit');
              }).catch(() => {
                vnode.state.error = 'Error creating topic';
                vnode.state.saving = false;
                m.redraw();
              });
            },
            label: 'Create topic',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ])
    ]);
  }
};

export default NewTopicModal;
