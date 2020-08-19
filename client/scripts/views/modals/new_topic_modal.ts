import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';
import { TextInputFormField, CheckboxFormField, TextareaFormField } from 'views/components/forms';

interface INewTopicModalForm {
  description: string,
  id: number,
  name: string,
}

const NewTopicModal: m.Component<{
  description: string,
  id: number,
  name: string,
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, description, name } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { description, id, name };
    }

    return m('.NewTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'New topic'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('.metadata', [
          m(TextInputFormField, {
            title: 'Name',
            options: {
              class: 'topic-form-name',
              tabindex: 1,
              value: vnode.state?.form?.name,
              autofocus: true,
            },
            callback: (value) => {
              vnode.state.form.name = value;
            },
          }),
          m(TextareaFormField, {
            title: 'Description',
            options: {
              class: 'topic-form-description',
              tabindex: 2,
              value: vnode.state.form.description,
            },
            callback: (value) => {
              vnode.state.form.description = value;
            }
          }),
        ]),
      ]),
      m('.compact-modal-actions', [
        m('.buttons', [
          m(Button, {
            intent: 'primary',
            class: vnode.state.saving ? 'disabled' : '',
            onclick: async (e) => {
              e.preventDefault();
              const { name, description } = vnode.state.form;
              if (!name.trim()) return;
              app.topics.add(name, description).then(() => {
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
        ]),
        vnode.state.error && m('.error-message', vnode.state.error),
      ])
    ]);
  }
};

export default NewTopicModal;
