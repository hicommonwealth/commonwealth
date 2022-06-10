/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/edit_profile_modal.scss';

import app from 'state';
import { Account } from 'models';
import { AvatarUpload } from 'views/components/avatar_upload';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWTextArea } from '../components/component_kit/cw_text_area';

type EditProfileModalAttrs = {
  account: Account<any>;
  refreshCallback: () => void;
};

export class EditProfileModal
  implements m.ClassComponent<EditProfileModalAttrs>
{
  private avatarUrl: string;
  private bio: string;
  private error: string;
  private headline: string;
  private name: string;
  private saving: boolean;

  oninit(vnode) {
    const { account } = vnode.attrs;

    this.avatarUrl = account.profile.avatarUrl;
    this.bio = account.profile.bio;
    this.headline = account.profile.headline;
    this.name = account.profile.name;
  }

  view(vnode) {
    const { account, refreshCallback } = vnode.attrs;

    console.log(this);

    return (
      <div class="EditProfileModal">
        <div class="compact-modal-title">
          <h3>Edit profile</h3>
        </div>
        <div class="compact-modal-body">
          <AvatarUpload
            size="small"
            account={account}
            uploadStartedCallback={() => {
              m.redraw();
            }}
            uploadCompleteCallback={(files) => {
              files.forEach((f) => {
                if (!f.uploadURL) return;
                const url = f.uploadURL.replace(/\?.*/, '');
                this.avatarUrl = url.trim();
              });
              m.redraw();
            }}
          />
          <CWTextInput
            label="Name"
            name="name"
            defaultValue={this.name}
            placeholder="Add your name"
            disabled={account.profile.isOnchain}
            autocomplete="off"
            oninput={(e) => {
              if (account.profile) {
                this.name = e.target.value;
              }
            }}
          />
          <CWTextInput
            label="Headline"
            name="headline"
            defaultValue={this.headline}
            placeholder="Add a headline"
            autocomplete="off"
            oninput={(e) => {
              if (account.profile) {
                this.headline = e.target.value;
              }
            }}
          />
          <CWTextArea
            name="bio"
            label="Bio"
            defaultValue={this.bio}
            placeholder="Add a bio"
            oninput={(e) => {
              if (account.profile) {
                this.bio = e.target.value;
              }
            }}
          />
          <div class="buttons-row">
            <CWButton
              disabled={this.saving}
              onclick={(e) => {
                e.preventDefault();

                const data = {
                  bio: this.bio,
                  headline: this.headline,
                  name: this.name,
                  avatarUrl: this.avatarUrl,
                };

                this.saving = true;

                app.profiles
                  .updateProfileForAccount(account, data)
                  .then(() => {
                    this.saving = false;
                    m.redraw();
                    refreshCallback();
                    $(vnode.dom).trigger('modalexit');
                  })
                  .catch((error: any) => {
                    this.saving = false;
                    this.error = error.responseJSON
                      ? error.responseJSON.error
                      : error.responseText;
                    m.redraw();
                  });
              }}
              label="Save Changes"
            />
            <CWButton
              buttonType="secondary-blue"
              onclick={(e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              }}
              label="Cancel"
            />
          </div>
          <CWValidationText message={this.error} status="failure" />
        </div>
      </div>
    );
  }
}
