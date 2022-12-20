/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';
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
  account: Account;
  refreshCallback: () => void;
};

export class EditProfileModal extends ClassComponent<EditProfileModalAttrs> {
  private avatarUrl: string;
  private bio: string;
  private error: string;
  private headline: string;
  private name: string;
  private saving: boolean;

  oninit(vnode: ResultNode<EditProfileModalAttrs>) {
    const { account } = vnode.attrs;

    this.avatarUrl = account.profile.avatarUrl;
    this.bio = account.profile.bio;
    this.headline = account.profile.headline;
    this.name = account.profile.name;
  }

  view(vnode: ResultNode<EditProfileModalAttrs>) {
    const { account, refreshCallback } = vnode.attrs;

    return (
      <div class="EditProfileModal">
        <div class="compact-modal-title">
          <h3>Edit profile</h3>
        </div>
        <div class="compact-modal-body">
          <AvatarUpload
            scope="user"
            account={account}
            uploadStartedCallback={() => {
              redraw();
            }}
            uploadCompleteCallback={(files) => {
              files.forEach((f) => {
                if (!f.uploadURL) return;
                const url = f.uploadURL.replace(/\?.*/, '');
                this.avatarUrl = url.trim();
              });
              redraw();
            }}
          />
          <CWTextInput
            label="Name"
            name="name"
            value={this.name}
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
            value={this.headline}
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
            value={this.bio}
            placeholder="Add a bio"
            oninput={(e) => {
              if (account.profile) {
                this.bio = e.target.value;
              }
            }}
          />
          <div class="buttons-row">
            <CWButton
              buttonType="secondary-blue"
              onclick={(e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              }}
              label="Cancel"
            />
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
                    redraw();
                    refreshCallback();
                    $(vnode.dom).trigger('modalexit');
                  })
                  .catch((error: any) => {
                    this.saving = false;
                    this.error = error.responseJSON
                      ? error.responseJSON.error
                      : error.responseText;
                    redraw();
                  });
              }}
              label="Save Changes"
            />
          </div>
          {this.error && (
            <CWValidationText message={this.error} status="failure" />
          )}
        </div>
      </div>
    );
  }
}
