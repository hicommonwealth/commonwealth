import axios from 'axios';
import 'components/edit_profile.scss';
import { notifyError } from 'controllers/app/notifications';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import app from 'state';
import { useUpdateProfileByAddressMutation } from 'state/api/profiles';
import _ from 'underscore';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { z } from 'zod';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import MinimumProfile from '../../models/MinimumProfile';
import NewProfile from '../../models/NewProfile';
import { PageNotFound } from '../pages/404';
import { AvatarUpload } from './Avatar';
import type { ImageBehavior } from './component_kit/cw_cover_image_uploader';
import { CWCoverImageUploader } from './component_kit/cw_cover_image_uploader';
import { CWDivider } from './component_kit/cw_divider';
import { CWForm } from './component_kit/cw_form';
import { CWFormSection } from './component_kit/cw_form_section';
import { CWSocials } from './component_kit/cw_socials';
import { CWText } from './component_kit/cw_text';
import { CWTextInput } from './component_kit/cw_text_input';
import CWCircleMultiplySpinner from './component_kit/new_designs/CWCircleMultiplySpinner';
import { LinkedAddresses } from './linked_addresses';
import { ReactQuillEditor, createDeltaFromText } from './react_quill_editor';
import { deserializeDelta, serializeDelta } from './react_quill_editor/utils';

enum EditProfileError {
  None,
  NoProfileFound,
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
  const [profile, setProfile] = useState<NewProfile>();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState();
  const [bio, setBio] = React.useState<DeltaStatic>(createDeltaFromText(''));
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [displayNameValid, setDisplayNameValid] = useState(true);
  const [account, setAccount] = useState<Account>();
  const backgroundImageRef = useRef<Image>();

  const { mutateAsync: updateProfile } = useUpdateProfileByAddressMutation({
    addressesWithChainsToUpdate: addresses?.map((a) => ({
      address: a.address,
      chain: a.community.id,
    })),
  });

  const getProfile = async () => {
    try {
      const response = await axios.get(`${app.serverUrl()}/profile/v2`, {
        params: {
          jwt: app.user.jwt,
        },
      });

      setProfile(new NewProfile(response.data.result.profile));
      setName(response.data.result.profile.profile_name || '');
      setEmail(response.data.result.profile.email || '');
      setSocials(response.data.result.profile.socials);
      setAvatarUrl(response.data.result.profile.avatar_url);
      setBio(deserializeDelta(response.data.result.profile.bio));
      backgroundImageRef.current =
        response.data.result.profile.background_image;
      setAddresses(
        response.data.result.addresses.map((a) => {
          try {
            return new AddressInfo({
              id: a.id,
              address: a.address,
              communityId: a.community_id,
              keytype: a.keytype,
              walletId: a.wallet_id,
              walletSsoSource: a.wallet_sso_source,
              ghostAddress: a.ghost_address,
            });
          } catch (err) {
            console.error(`Could not return AddressInfo: "${err}"`);
            return null;
          }
        }),
      );
    } catch (err) {
      if (
        err.response?.data?.status === 500 &&
        err.response?.data?.error === NoProfileFoundError
      ) {
        setError(EditProfileError.NoProfileFound);
      }
    }
    setLoading(false);
  };

  const checkForUpdates = () => {
    const profileUpdate: any = {};

    if (!_.isEqual(name, profile?.name) && name !== '')
      profileUpdate.name = name;

    if (!_.isEqual(email, profile?.email)) profileUpdate.email = email;

    profileUpdate.bio = serializeDelta(bio);

    if (!_.isEqual(avatarUrl, profile?.avatarUrl))
      profileUpdate.avatarUrl = avatarUrl;

    if (!_.isEqual(socials, profile?.socials))
      profileUpdate.socials = JSON.stringify(socials);

    if (!_.isEqual(backgroundImageRef, profile?.backgroundImage))
      profileUpdate.backgroundImage = JSON.stringify(
        backgroundImageRef.current,
      );

    if (Object.keys(profileUpdate)?.length > 0) {
      updateProfile({
        ...profileUpdate,
        profileId: profile.id,
        address: app.user.activeAccount?.address,
        chain: app.user.activeAccount?.community,
      })
        .then(() => {
          navigate(`/profile/id/${profile.id}`);
        })
        .catch((err) => {
          notifyError(err?.response?.data?.error || 'Something went wrong.');
        });
    } else {
      setTimeout(() => {
        navigate(`/profile/id/${profile.id}`);
      }, 1500);
    }

    setLoading(false);
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
        addresses[0].community.name,
        addresses[0].address,
      );

      oldProfile.initialize(
        name,
        addresses[0].address,
        avatarUrl,
        profile.id,
        addresses[0].community.name,
        null,
      );

      setAccount(
        new Account({
          community: addresses[0].community,
          address: addresses[0].address,
          profile: oldProfile,
          ignoreProfile: false,
        }),
      );
    } else {
      setAccount(null);
    }
  }, [addresses, avatarUrl, name, profile]);

  if (loading) {
    return (
      <div className="EditProfile full-height">
        <div className="loading-spinner">
          <CWCircleMultiplySpinner />
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
                  buttonType="secondary"
                />
                <CWButton
                  label="Save"
                  onClick={() => handleSaveProfile()}
                  className="save-button"
                  buttonType="primary"
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
                      if (!f.uploadURL) return;
                      const url = f.uploadURL.replace(/\?.*/, '').trim();
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
                  try {
                    z.string().email().parse(val.trim());
                    return ['success', 'Input validated'];
                  } catch {
                    return ['failure', 'Must enter valid email'];
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
                imageBehavior: ImageBehavior,
              ) => {
                backgroundImageRef.current = {
                  url,
                  imageBehavior,
                };
              }}
              generatedImageCallback={(
                url: string,
                imageBehavior: ImageBehavior,
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
                  addresses.find((a) => a.address === address),
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
