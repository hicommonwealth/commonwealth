import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';

interface INewTopicModalForm {
  id: number;
  name: string;
  description: string;
  telegram: string;
}

const NewTopicModal: m.Component<
  {
    id: number;
    name: string;
    description: string;
    telegram: string;
  },
  {
    error: any;
    form: INewTopicModalForm;
    saving: boolean;
  }
> = {
  view: (vnode) => {
    if (
      !app.user.isAdminOfEntity({
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      })
    )
      return null;
    const { id, name, description, telegram } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, telegram };
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
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'telegram' }, 'Telegram'),
            m(Input, {
              title: 'Telegram',
              class: 'topic-form-telegram',
              tabindex: 2,
              defaultValue: vnode.state.form.telegram,
              oninput: (e) => {
                vnode.state.form.telegram = (e.target as any).value;
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
              app.topics
                .add(
                  vnode.state.form.name,
                  vnode.state.form.description,
                  vnode.state.form.telegram
                )
                .then(() => {
                  vnode.state.saving = false;
                  m.redraw();
                  $(e.target).trigger('modalexit');
                })
                .catch(() => {
                  vnode.state.error = 'Error creating topic';
                  vnode.state.saving = false;
                  m.redraw();
                });
            },
            label: 'Create topic',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ]),
    ]);
  },
};

export default NewTopicModal;
