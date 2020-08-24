import 'modals/edit_profile_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, Input, TextArea } from 'construct-ui';

import AvatarUpload from 'views/components/avatar_upload';

const EditProfileModal = {
  view: (vnode) => {
    const { account } = vnode.attrs;

    return m('.EditProfileModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit profile')
      ]),
      m('.form', [
        m('.avatar', [
          m(AvatarUpload, {
            uploadStartedCallback: () => {
              vnode.state.uploadsInProgress++;
              m.redraw();
            },
            uploadCompleteCallback: (files) => {
              vnode.state.uploadsInProgress--;
              // update textarea
              files.forEach((f) => {
                if (!f.uploadURL) return;
                const url = f.uploadURL.replace(/\?.*/, '');
                $(vnode.dom).find('input[name=avatarUrl]').val(url.trim());
              });
              m.redraw();
            },
          }),
        ]),
        m('input', {
          type: 'hidden',
          name: 'avatarUrl',
          oncreate: (vvnode) => account.profile && $(vvnode.dom).val(account.profile.avatarUrl)
        }),
        m('.text-input-wrapper', [
          m(Input, {
            name: 'name',
            defaultValue: account.name,
            placeholder: 'Display name',
            fluid: true,
            autocomplete: 'off',
            oncreate: (vvnode) => {
              if (account.profile) $(vvnode.dom).val(account.profile.name);
              $(vvnode.dom).focus();
            },
          }),
          m(Input, {
            name: 'headline',
            defaultValue: account.profile.headline,
            placeholder: 'Headline',
            fluid: true,
            autocomplete: 'off',
            oncreate: (vvnode) => account.profile && $(vvnode.dom).val(account.profile.headline),
          }),
          m(TextArea, {
            name: 'bio',
            defaultValue: account.profile.bio,
            placeholder: 'Enter bio...',
            fluid: true,
            oncreate: (vvnode) => account.profile && $(vvnode.dom).val(account.profile.bio)
          }),
        ]),
        m('.form-bottom', [
          m('.buttons', [
            m(Button, {
              intent: 'primary',
              disabled: vnode.state.saving || vnode.state.uploadsInProgress > 0,
              onclick: (e) => {
                e.preventDefault();
                const data = {
                  bio: `${$(vnode.dom).find('textarea[name=bio]').val()}`,
                  headline: `${$(vnode.dom).find('input[name=headline]').val()}`,
                  name: `${$(vnode.dom).find('input[name=name]').val()}`,
                  avatarUrl: `${$(vnode.dom).find('input[name=avatarUrl]').val()}`,
                };
                vnode.state.saving = true;
                app.profiles.updateProfileForAccount(account, data).then((result) => {
                  vnode.state.saving = false;
                  m.redraw();
                  $(vnode.dom).trigger('modalexit');
                }).catch((error: any) => {
                  vnode.state.saving = false;
                  vnode.state.error = error.responseJSON ? error.responseJSON.error : error.responseText;
                  m.redraw();
                });
              },
              label: 'Save Changes'
            }),
            m(Button, {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              },
              label: 'Cancel'
            }),
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
        ])
      ])
    ]);
  }
};

export default EditProfileModal;
