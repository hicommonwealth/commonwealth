import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';
import _ from 'underscore';

import 'components/edit_profile.scss';

import app from 'state';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { notifyError } from 'controllers/app/notifications';
import {
  NewProfile as Profile,
  Account,
  AddressInfo,
  MinimumProfile,
} from '../../models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { AvatarUpload } from '../components/avatar_upload';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWForm } from '../components/component_kit/cw_form';
import { CWFormSection } from '../components/component_kit/cw_form_section';
import { CWSocials } from '../components/component_kit/cw_socials';
import type { ImageBehavior } from '../components/component_kit/cw_cover_image_uploader';
import { CWCoverImageUploader } from '../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../pages/404';
import { LinkedAddresses } from './linked_addresses';

enum EditProfileError {
  None,
  NoProfileFound,
}

const NoProfileFoundError = 'No profile found';

type EditNewProfileProps = {
  profileId: string;
};

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

const EditProfileComponent = (props: EditNewProfileProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<EditProfileError>(
    EditProfileError.None
  );
  const [loading, setLoading] = useState(true);
  const [socials, setSocials] = useState<string[]>();
  const [profile, setProfile] = useState<Profile>();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState();
  const [bio, setBio] = useState();
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [isOwner, setIsOwner] = useState();
  const [backgroundImage, setBackgroundImage] = useState<Image>();
  const [displayNameValid, setDisplayNameValid] = useState(true);
  const backgroundImageRef = useRef<Image>();
  backgroundImageRef.current = backgroundImage;

  const getProfile = async (query: string) => {
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId: query,
        jwt: app.user.jwt,
      });

      setProfile(new Profile(result.profile));
      setName(result.profile.profile_name || '');
      setEmail(result.profile.email || '');
      setSocials(result.profile.socials);
      setAvatarUrl(result.profile.avatar_url);
      setBackgroundImage(result.profile.background_image);
      setAddresses(
        result.addresses.map(
          (a) =>
            new AddressInfo(
              a.id,
              a.address,
              a.chain,
              a.keytype,
              a.wallet_id,
              a.ghost_address
            )
        )
      );
      setIsOwner(result.isOwner);
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON?.error === NoProfileFoundError
      ) {
        setError(EditProfileError.NoProfileFound);
      }
    }
    setLoading(false);
  };

  const updateProfile = async (profileUpdate: any) => {
    try {
      const { result } = await $.post(`${app.serverUrl()}/updateProfile/v2`, {
        profileId: profile.id,
        ...profileUpdate,
        jwt: app.user.jwt,
      });

      if (result?.status === 'Success') {
        setTimeout(() => {
          // refresh profiles in store
          addresses.forEach((a) => {
            app.newProfiles.updateProfileForAccount(
              a.address,
              profileUpdate
            );
          });
          setLoading(false);
          navigate(`/profile/id/${profile.id}`);
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        setLoading(false);
        notifyError(err.responseJSON?.error || 'Something went wrong.');
      }, 1500);
    }
  };

  const checkForUpdates = () => {
    const profileUpdate: any = {};

    if (!_.isEqual(name, profile?.name) && name !== '')
      profileUpdate.name = name;

    if (!_.isEqual(email, profile?.email) && email !== '')
      profileUpdate.email = email;

    // if (!_.isEqual(this.bio.textContentsAsString, this.profile?.bio))
    //   this.profileUpdate.bio = this.bio.textContentsAsString;

    if (!_.isEqual(avatarUrl, profile?.avatarUrl))
      profileUpdate.avatarUrl = avatarUrl;

    if (!_.isEqual(socials, profile?.socials))
      profileUpdate.socials = JSON.stringify(socials);

    if (!_.isEqual(backgroundImageRef.current, profile?.backgroundImage))
      profileUpdate.backgroundImage = JSON.stringify(
        backgroundImageRef.current
      );

    if (Object.keys(profileUpdate)?.length > 0) {
      updateProfile(profileUpdate);
    } else {
      setTimeout(() => {
        setLoading(false);
        navigate(`/profile/id/${profile.id}`);
      }, 1500);
    }
  };

  const handleSaveProfile = () => {
    setLoading(true);
    if (!name) {
      setDisplayNameValid(false);
      notifyError('Please fill all required fields.');
      setLoading(false);
      return;
    }

    checkForUpdates();
  };

  React.useEffect(() => {
    if (!app.isLoggedIn()) {
      navigate(`/profile/id/${props.profileId}`);
    }

    if (props.profileId) {
      getProfile(props.profileId);
    }
  }, []);

  if (loading) {
    return (
      <div className="EditProfile full-height">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );
  }

  if (error === EditProfileError.NoProfileFound) {
    return <PageNotFound message="We cannot find profile." />;
  }

  if (error === EditProfileError.None) {
    if (!isOwner) {
      navigate(`/profile/id/${props.profileId}`);
    }

    // need to create an account to pass to AvatarUpload to see last upload
    // not the best solution because address is not always available
    // should refactor AvatarUpload to make it work with new profiles
    let account: Account | null;
    if (addresses?.length > 0) {
      const oldProfile = new MinimumProfile(
        addresses[0].chain.name,
        addresses[0].address
      );

      oldProfile.initialize(
        name,
        addresses[0].address,
        avatarUrl,
        profile.id,
        addresses[0].chain.name,
        null
      );

      account = new Account({
        chain: addresses[0].chain,
        address: addresses[0].address,
        profile: oldProfile,
      });
    } else {
      account = null;
    }

    return (
      <div className="EditProfile">
        <CWForm
          title="Edit Profile"
          description="Add or change your general info and customize your profile."
          actions={
            <div className="buttons-container">
              <div className="buttons">
                <CWButton
                  label="Cancel"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      navigate(`/profile/id/${profile.id}`);
                    }, 1000);
                  }}
                  className="save-button"
                  buttonType="secondary-black"
                />
                <CWButton
                  label="Save"
                  onClick={() => handleSaveProfile()}
                  className="save-button"
                  buttonType="primary-black"
                />
              </div>
            </div>
          }
        >
          <CWFormSection
            title="General Info"
            description="Let your community and others get to know you by sharing a bit about yourself."
          >
            <div className="profile-image-section">
              <CWText type="caption" fontWeight="medium">
                Profile image
              </CWText>
              <CWText type="caption" className="description">
                Select an image from your files to upload
              </CWText>
              <div className="image-upload">
                <AvatarUpload
                  scope="user"
                  account={account}
                  uploadCompleteCallback={(files) => {
                    files.forEach((f) => {
                      if (!f.data.result) return;
                      const url = f.data.result.replace(/\?.*/, '').trim();
                      setAvatarUrl(url);
                    });
                  }}
                />
              </div>
            </div>
            <div className="info-section">
              <CWTextInput
                name="name-form-field"
                inputValidationFn={(val: string) => {
                  if (val.match(/[^A-Za-z0-9]/)) {
                    return ['failure', 'Must enter characters A-Z, 0-9'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label={
                  <>
                    <CWText type="caption" className="display-name-label">
                      Display name
                    </CWText>
                    <div className="blue-star">*</div>
                  </>
                }
                value={name}
                placeholder="display name"
                onInput={(e) => {
                setDisplayNameValid(true);
                  setName(e.target.value);
                }}
                inputClassName={displayNameValid ? '' : 'failure'}
                manualStatusMessage={displayNameValid ? '' : 'No input'}
                manualValidationStatus={
                  displayNameValid ? 'success' : 'failure'
                }
              />
              <CWTextInput
                name="email-form-field"
                inputValidationFn={(val: string) => {
                  if (!val.match(/\S+@\S+\.\S+/)) {
                    return ['failure', 'Must enter valid email'];
                  } else {
                    return ['success', 'Input validated'];
                  }
                }}
                label="Email"
                value={email}
                placeholder="email"
                onInput={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div className="bio-section">
              <CWText type="caption">Bio</CWText>
              <QuillEditorComponent
                contentsDoc={profile?.bio}
                oncreateBind={(state: QuillEditor) => {
                  setBio(state);
                }}
                editorNamespace={`${document.location.pathname}-bio`}
                imageUploader
              />
            </div>
            <CWDivider />
            <div className="socials-section">
              <CWText type="caption">Social links</CWText>
              <CWSocials
                socials={profile?.socials}
                handleInputChange={(e) => {
                  setSocials(e);
                }}
              />
            </div>
          </CWFormSection>
          <CWFormSection
            title="Personalize Your Profile"
            description="Express yourself through imagery."
          >
            <CWText fontWeight="medium">Image upload</CWText>
            <CWText type="caption" className="description">Add a background image.</CWText>
            <CWCoverImageUploader
              uploadCompleteCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setBackgroundImage({
                  url,
                  imageBehavior,
                });
              }}
              generatedImageCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                setBackgroundImage({
                  url,
                  imageBehavior,
                });
              }}
              enableGenerativeAI
              defaultImageUrl={backgroundImage?.url}
              defaultImageBehavior={backgroundImage?.imageBehavior}
            />
          </CWFormSection>
          <CWFormSection
              title="Linked addresses"
              description="Manage your addresses."
            >
              <LinkedAddresses
                addresses={addresses}
                profile={profile}
                refreshProfiles={(address: string) => {
                  getProfile(props.profileId);
                  app.user.removeAddress(addresses.find(a => a.address === address));
                }}
              />
              <CWText type="caption" fontWeight="medium">Link new addresses via the profile dropdown menu</CWText>
            </CWFormSection>
        </CWForm>
      </div>
    );
  }
};

export default EditProfileComponent;
