import 'modals/edit_profile_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import {
  PROFILE_BIO_MAX_CHARS,
  PROFILE_HEADLINE_MAX_CHARS,
  PROFILE_NAME_MAX_CHARS,
  PROFILE_NAME_MIN_CHARS
} from 'types';
import CharacterLimitedTextInput from '../components/widgets/character_limited_text_input';
import ResizableTextarea from '../components/widgets/resizable_textarea';
import AvatarUpload from '../components/avatar_upload';

const EditProfileModal = {
  view: (vnode) => {
    const account = vnode.attrs;
    const updateProfile = () => {
      const data = {
        bio: `${$(vnode.dom).find('textarea[name=bio]').val()}`,
        headline: `${$(vnode.dom).find('input[name=headline]').val()}`,
        name: `${$(vnode.dom).find('input[name=name]').val()}`,
        avatarUrl: `${$(vnode.dom).find('input[name=avatarUrl]').val()}`,
      };
      vnode.state.error = null;
      if (data.name.length > PROFILE_NAME_MAX_CHARS) {
        vnode.state.error = 'Name exceeds max char length.';
      }
      if (data.name.length < PROFILE_NAME_MIN_CHARS) {
        vnode.state.error = 'Name is below  min char length.';
      }
      if (data.headline.length > PROFILE_HEADLINE_MAX_CHARS) {
        vnode.state.error = 'Headline exceeds max char length.';
      }
      if (data.bio.length > PROFILE_BIO_MAX_CHARS) {
        vnode.state.error = 'Bio exceeds max char length.';
      }

      vnode.state.saving = true;
      if (!vnode.state.error) app.profiles.updateProfileForAccount(account, data)
        .then((result) => {
          vnode.state.saving = false;
          m.redraw();
        }).catch((error: any) => {
          vnode.state.saving = false;
          vnode.state.error = error.responseJSON ? error.responseJSON.error : error.responseText;
          m.redraw();
        });
      else m.redraw();
    };

    return m('.EditProfileModal', [
      m('.header', [
        m('span', 'Edit profile')
      ]),
      m('.cover'),
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
          m(CharacterLimitedTextInput, {
            name: 'name',
            placeholder: 'Display name',
            oncreate: (vvnode) => {
              if (account.profile) $(vvnode.dom).val(account.profile.name);
              $(vvnode.dom).focus();
            },
            limit: 40,
          }),
          m(CharacterLimitedTextInput, {
            name: 'headline',
            placeholder: 'Headline',
            oncreate: (vvnode) => account.profile && $(vvnode.dom).val(account.profile.headline),
            limit: 80,
          }),
          m(ResizableTextarea, {
            name: 'bio',
            placeholder: 'Enter bio...',
            oncreate: (vvnode) => account.profile && $(vvnode.dom).val(account.profile.bio)
            // TODO: character limit
          }),
        ]),
        m('.form-bottom', [
          m('.buttons', [
            m('button.btn.formular-button-primary', {
              class: vnode.state.saving || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
              onclick: (e) => {
                e.preventDefault();
                updateProfile();
                if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
                vnode.state.saving = false;
              }
            }, 'Save Changes'),
            m('button', {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              }
            }, 'Cancel'),
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
        ])
      ])
    ]);
  }
};

export default EditProfileModal;
