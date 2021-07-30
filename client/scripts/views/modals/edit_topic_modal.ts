import 'modals/edit_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';

interface IEditTopicModalForm {
  description: string,
  id: number,
  name: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}

const EditTopicModal : m.Component<{
  description: string,
  id: number,
  name: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}, {
  error: any,
  form: IEditTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featured_in_sidebar, featured_in_new_post } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featured_in_sidebar, featured_in_new_post };
    }

    const updateTopic = async (form) => {
      const topicInfo = {
        id,
        description: form.description,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
        telegram: null,
        featuredInSidebar: form.featured_in_sidebar,
        featuredInNewPost: form.featured_in_new_post
      };
      await app.topics.edit(topicInfo);
      m.route.set(`/${app.activeId()}/discussions/${encodeURI(form.name.toString().trim())}`);
    };

    const deleteTopic = async (form) => {
      const topicInfo = {
        id,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      await app.topics.remove(topicInfo);
      m.route.set(`/${app.activeId()}`);
    };

    return m('.EditTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit topic'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              autocomplete: 'off',
              oncreate: (vvnode) => {
                // use oncreate to focus because autofocus: true fails when component is recycled in a modal
                setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
              },
              class: 'topic-form-name',
              tabindex: 1,
              defaultValue: vnode.state?.form?.name,
              oninput: (e) => {
                vnode.state.form.name = (e.target as any).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              name: 'description',
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
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              disabled: vnode.state.saving,
              style: 'margin-right: 8px',
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                updateTopic(vnode.state.form).then(() => {
                  $(e.target).trigger('modalexit');
                }).catch((err) => {
                  vnode.state.saving = false;
                  m.redraw();
                });
              },
              label: 'Save changes',
            }),
            m(Button, {
              intent: 'negative',
              disabled: vnode.state.saving,
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                const confirmed = await confirmationModalWithText('Delete this topic?')();
                if (!confirmed) return;
                deleteTopic(vnode.state.form).then(() => {
                  $(e.target).trigger('modalexit');
                  m.route.set(`/${app.activeId()}/`);
                }).catch((err) => {
                  vnode.state.saving = false;
                  m.redraw();
                });
              },
              label: 'Delete topic',
            }),
          ]),
        ]),
        vnode.state.error && m('.error-message', vnode.state.error),
      ])
    ]);
  }
};

export default EditTopicModal;
