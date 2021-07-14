import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel } from 'construct-ui';
import BN from 'bn.js';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';
import { tokensToTokenBaseUnits } from 'helpers';
interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  token_threshold: string
}

const NewTopicModal: m.Component<{
  id: number,
  name: string,
  description: string,
  token_threshold: string
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, token_threshold } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, token_threshold };
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
            m(FormLabel, { for: 'token_threshold' }, `Number of tokens needed to post (${app.chain.meta.chain.symbol})`),
            m(Input, {
              title: 'Token threshold',
              class: 'topic-form-token-threshold',
              tabindex: 2,
              defaultValue: '0',
              value: vnode.state.form.token_threshold,
              oninput: (e) => {
                // restrict it to numerical input
                if (e.target.value === '' || /^\d+\.?\d*$/.test(e.target.value)) {
                  vnode.state.form.token_threshold = (e.target as any).value;
                }
              }
            })
          ]),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              if (!vnode.state.form.name.trim()) return;
              app.topics.add(
                vnode.state.form.name, vnode.state.form.description, null,
                tokensToTokenBaseUnits(vnode.state.form.token_threshold ? vnode.state.form.token_threshold : '0', 
                  app.chain.meta.chain.decimals ? app.chain.meta.chain.decimals : 18)
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
