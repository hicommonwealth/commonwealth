import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import _ from 'underscore';
import type { DeltaStatic } from 'quill';

import 'components/edit_profile.scss';

import app from 'state';
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
import {
  createDeltaFromText,
  getTextFromDelta,
  ReactQuillEditor,
} from './react_quill_editor';

enum EditProfileError {
  None,
  NoProfileFound,
  NotLoggedIn,
}

const NoProfileFoundError = 'No profile found';

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

const EditProfileComponent = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<EditProfileError>(EditProfileError.None);
  const [loading, setLoading] = useState(true);
  const [socials, setSocials] = useState<string[]>();
  const [profile, setProfile] = useState<Profile>();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState();
  const [bio, setBio] = React.useState<DeltaStatic>(createDeltaFromText(''));
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [displayNameValid, setDisplayNameValid] = useState(true);
  const [account, setAccount] = useState<Account>();
  const backgroundImageRef = useRef<Image>();

  const getProfile = async () => {
    try {
      const response = await axios.get(`${app.serverUrl()}/profile/v2`, {
        params: {
          jwt: app.user.jwt,
        }
      });

      setProfile(new Profile(response.data.result.profile));
      setName(response.data.result.profile.profile_name || '');
      setEmail(response.data.result.profile.email || '');
      setSocials(response.data.result.profile.socials);
      setAvatarUrl(response.data.result.profile.avatar_url);
      setBio(response.data.result.profile.bio);
      backgroundImageRef.current = response.data.result.profile.background_image;
      setAddresses(
        response.data.result.addresses.map((a) => {
          try {
            return new AddressInfo(
              a.id,
              a.address,
              a.chain,
              a.keytype,
              a.wallet_id,
              a.ghost_address
            );
          } catch (err) {
            console.error(`Could not return AddressInfo: "${err}"`);
            return null;
          }
        })
      );
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
      const response = await axios.post(`${app.serverUrl()}/updateProfile/v2`, {
        profileId: profile.id,
        ...profileUpdate,
        jwt: app.user.jwt,
      });

      if (response.data.status === 'Success') {
        setTimeout(() => {
          // refresh profiles in store
          addresses.forEach((a) => {
            app.newProfiles.updateProfileForAccount(a.address, profileUpdate);
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

    if (!_.isEqual(email, profile?.email)) profileUpdate.email = email;

    if (!_.isEqual(getTextFromDelta(bio), profile?.bio)) {
      profileUpdate.bio = getTextFromDelta(bio) || '';
    }

    if (!_.isEqual(avatarUrl, profile?.avatarUrl))
      profileUpdate.avatarUrl = avatarUrl;

    if (!_.isEqual(socials, profile?.socials))
      profileUpdate.socials = JSON.stringify(socials);

    if (!_.isEqual(backgroundImageRef, profile?.backgroundImage))
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

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    // need to create an account to pass to AvatarUpload to see last upload
    // not the best solution because address is not always available
    // should refactor AvatarUpload to make it work with new profiles
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

      setAccount(new Account({
        chain: addresses[0].chain,
        address: addresses[0].address,
        profile: oldProfile,
      }));
    } else {
      setAccount(null);
    }
  }, [addresses, avatarUrl, name, profile]);

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
              <ReactQuillEditor
                className="editor"
                contentDelta={bio}
                setContentDelta={setBio}
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
            <CWText type="caption" className="description">
              Add a background image.
            </CWText>
            <CWCoverImageUploader
              uploadCompleteCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                backgroundImageRef.current = {
                  url,
                  imageBehavior,
                };
              }}
              generatedImageCallback={(
                url: string,
                imageBehavior: ImageBehavior
              ) => {
                backgroundImageRef.current = {
                  url,
                  imageBehavior,
                };
              }}
              enableGenerativeAI
              defaultImageUrl={backgroundImageRef.current?.url}
              defaultImageBehavior={backgroundImageRef.current?.imageBehavior}
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
                getProfile();
                app.user.removeAddress(
                  addresses.find((a) => a.address === address)
                );
              }}
            />
            <CWText type="caption" fontWeight="medium">
              Link new addresses via the profile dropdown menu
            </CWText>
          </CWFormSection>
        </CWForm>
      </div>
    );
  }
};

export default EditProfileComponent;
