import React from 'react';

import 'modals/edit_profile_modal.scss';

import app from 'state';
import type { Account } from 'models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { AvatarUpload } from 'views/components/avatar_upload';

type EditProfileModalProps = {
  account: Account;
  onModalClose: () => void;
  refreshCallback?: () => void;
};

export const EditProfileModal = (props: EditProfileModalProps) => {
  const { account, onModalClose, refreshCallback } = props;

  const [avatarUrl, setAvatarUrl] = React.useState<string>(
    account.profile.avatarUrl
  );
  const [bio, setBio] = React.useState<string>(account.profile.bio);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [headline, setHeadline] = React.useState<string>(
    account.profile.headline
  );
  const [name, setName] = React.useState<string>(account.profile.name);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const avatarUpload = (
    <AvatarUpload
      scope="user"
      account={account}
      uploadCompleteCallback={(files) => {
        files.forEach((f) => {
          if (!f.uploadURL) return;
          const url = f.uploadURL.replace(/\?.*/, '').trim();
          setAvatarUrl(url);
        });
      }}
    />
  );

  return (
    <div className="EditProfileModal">
      <div className="compact-modal-title">
        <h3>Edit profile</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        {avatarUpload}
        <CWTextInput
          label="Name"
          name="name"
          value={name}
          placeholder="Add your name"
          disabled={account.profile.isOnchain}
          autoComplete="off"
          onInput={(e) => {
            if (account.profile) {
              setName(e.target.value);
            }
          }}
        />
        <CWTextInput
          label="Headline"
          name="headline"
          value={headline}
          placeholder="Add a headline"
          autoComplete="off"
          onInput={(e) => {
            if (account.profile) {
              setHeadline(e.target.value);
            }
          }}
        />
        <CWTextArea
          name="bio"
          label="Bio"
          value={bio}
          placeholder="Add a bio"
          onInput={(e) => {
            if (account.profile) {
              setBio(e.target.value);
            }
          }}
        />
        <div className="buttons-row">
          <CWButton
            buttonType="secondary-blue"
            onClick={(e) => {
              e.preventDefault();
              onModalClose();
            }}
            label="Cancel"
          />
          <CWButton
            disabled={isSaving}
            onClick={(e) => {
              e.preventDefault();

              const data = {
                bio: bio,
                headline: headline,
                name: name,
                avatarUrl: avatarUrl,
              };

              setIsSaving(true);

              app.newProfiles
                .updateProfileForAccount(account, data)
                .then(() => {
                  setIsSaving(false);
                  refreshCallback?.();
                  onModalClose();
                })
                .catch((error: any) => {
                  setIsSaving(false);
                  setErrorMsg(
                    error.responseJSON
                      ? error.responseJSON.error
                      : error.responseText
                  );
                });
            }}
            label="Save Changes"
          />
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
    </div>
  );
};
