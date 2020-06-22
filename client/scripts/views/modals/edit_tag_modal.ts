import 'modals/edit_tag_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from '../modal';
import { TextInputFormField, CheckboxFormField, TextareaFormField } from '../components/forms';

interface IEditTagModalAttrs {
  description: string,
  id: number,
  name: string;
}

interface IEditTagModalState {
  error: any;
  form: IEditTagModalForm
  saving: boolean;
}

interface IEditTagModalForm {
  description: string,
  id: number,
  name: string,
}

const EditTagModal : m.Component<IEditTagModalAttrs, IEditTagModalState> = {
  view: (vnode: m.VnodeDOM<IEditTagModalAttrs, IEditTagModalState>) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, description, name } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { description, id, name };
    }

    const updateTag = async (form) => {
      const tagInfo = {
        id,
        description: form.description,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      await app.tags.edit(tagInfo);
      m.redraw();
    };

    const deleteTag = async (form) => {
      const tagInfo = {
        id,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      await app.tags.remove(tagInfo);
    };

    return m('.EditTagModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit Tag'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('.metadata', [
          m(TextInputFormField, {
            title: 'Name',
            options: {
              class: 'tag-form-name',
              tabindex: 1,
              value: vnode.state?.form?.name,
            },
            callback: (value) => {
              vnode.state.form.name = value;
            },
            oncreate: (vvnode) => $(vvnode.dom).find('input[type="text"]').focus().select(),
          }),
          m(TextareaFormField, {
            title: 'Description',
            options: {
              class: 'tag-form-description',
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
              await updateTag(vnode.state.form);
              if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
              vnode.state.saving = false;
            },
            label: 'Save Changes',
          }),
          m(Button, {
            intent: 'negative',
            class: vnode.state.saving ? 'disabled' : '',
            onclick: async (e) => {
              e.preventDefault();
              const confirmed = await confirmationModalWithText('Delete this tag?')();
              if (!confirmed) return;
              await deleteTag(id);
              if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
              vnode.state.saving = false;
              m.redraw();
            },
            label: 'Delete Tag',
          }),
        ]),
        vnode.state.error && m('.error-message', vnode.state.error),
      ])
    ]);
  }
};

export default EditTagModal;
