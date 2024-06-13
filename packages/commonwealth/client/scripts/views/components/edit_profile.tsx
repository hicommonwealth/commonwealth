import { useFlag } from 'client/scripts/hooks/useFlag';
import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import 'components/edit_profile.scss';
import { notifyError } from 'controllers/app/notifications';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import app from 'state';
import {
  useFetchProfileByIdQuery,
  useUpdateProfileByAddressMutation,
} from 'state/api/profiles';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import _ from 'underscore';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import MinimumProfile from '../../models/MinimumProfile';
import NewProfile from '../../models/NewProfile';
import { PageNotFound } from '../pages/404';
import { AvatarUpload } from './Avatar';
import { PreferenceTags, usePreferenceTags } from './PreferenceTags';
import { UserTrainingCardTypes } from './UserTrainingSlider/types';
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

// const NoProfileFoundError = 'No profile found';

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

const EditProfileComponent = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorCode, setErrorCode] = useState<EditProfileError>(
    EditProfileError.None,
  );
  const [socials, setSocials] = useState<string[]>();
  const [profile, setProfile] = useState<NewProfile>();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState();
  const [bio, setBio] = React.useState<DeltaStatic>(createDeltaFromText(''));
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [displayNameValid, setDisplayNameValid] = useState(true);
  const [account, setAccount] = useState<Account>();
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const backgroundImageRef = useRef<Image>();

  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useUpdateProfileByAddressMutation({
      addressesWithChainsToUpdate: addresses?.map((a) => ({
        address: a.address,
        chain: a.community.id,
      })),
    });

  const { preferenceTags, setPreferenceTags, toggleTagFromSelection } =
    usePreferenceTags();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const {
    data,
    isLoading: isLoadingProfile,
    error,
    refetch,
  } = useFetchProfileByIdQuery({
    apiCallEnabled: isLoggedIn,
    shouldFetchSelfProfile: true,
  });

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
        // @ts-expect-error <StrictNullChecks/>
        profileId: profile.id,
        address: app.user.activeAccount?.address,
        chain: app.user.activeAccount?.community,
        tagIds: preferenceTags
          .filter((tag) => tag.isSelected)
          .map((tag) => tag.item.id),
      })
        .then(() => {
          // @ts-expect-error <StrictNullChecks/>
          navigate(`/profile/id/${profile.id}`);

          // @ts-expect-error <StrictNullChecks/>
          if (userOnboardingEnabled && socials?.length > 0) {
            markTrainingActionAsComplete(
              UserTrainingCardTypes.FinishProfile,
              // @ts-expect-error <StrictNullChecks/>
              profile.id,
            );
          }
        })
        .catch((err) => {
          notifyError(err?.response?.data?.error || 'Something went wrong.');
        });
    } else {
      setTimeout(() => {
        // @ts-expect-error <StrictNullChecks/>
        navigate(`/profile/id/${profile.id}`);
      }, 1500);
    }
  };

  const handleSaveProfile = () => {
    if (!name) {
      setDisplayNameValid(false);
      notifyError('Please fill all required fields.');
      return;
    }

    checkForUpdates();
  };

  useEffect(() => {
    if (isLoadingProfile) return;

    if (error) {
      setErrorCode(EditProfileError.NoProfileFound);
      setProfile(undefined);
      setName('');
      setEmail('');
      setSocials([]);
      setAvatarUrl(undefined);
      setPreferenceTags([]);
      setBio(deserializeDelta(data.profile.bio));
      setAddresses([]);
      return;
    }

    if (data) {
      setErrorCode(EditProfileError.None);
      setProfile(new NewProfile(data.profile));
      setName(data.profile.profile_name || '');
      setEmail(data.profile.email || '');
      setSocials(data.profile.socials);
      setAvatarUrl(data.profile.avatar_url);
      const profileTags = data.tags;
      setPreferenceTags((tags) =>
        [...(tags || [])].map((t) => ({
          ...t,
          isSelected: !!profileTags.find((pt) => pt.id === t.item.id),
        })),
      );
      setBio(deserializeDelta(data.profile.bio));
      backgroundImageRef.current = data.profile.background_image;
      setAddresses(
        data.addresses.map((a) => {
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
      return;
    }
  }, [data, isLoadingProfile, error, setPreferenceTags]);

  useEffect(() => {
    // need to create an account to pass to AvatarUpload to see last upload
    // not the best solution because address is not always available
    // should refactor AvatarUpload to make it work with new profiles
    // @ts-expect-error <StrictNullChecks/>
    if (addresses?.length > 0) {
      const oldProfile = new MinimumProfile(
        // @ts-expect-error <StrictNullChecks/>
        addresses[0].community.name,
        // @ts-expect-error <StrictNullChecks/>
        addresses[0].address,
      );

      oldProfile.initialize(
        name,
        // @ts-expect-error <StrictNullChecks/>
        addresses[0].address,
        avatarUrl,
        // @ts-expect-error <StrictNullChecks/>
        profile.id,
        // @ts-expect-error <StrictNullChecks/>
        addresses[0].community.name,
        null,
      );

      setAccount(
        new Account({
          // @ts-expect-error <StrictNullChecks/>
          community: addresses[0].community,
          // @ts-expect-error <StrictNullChecks/>
          address: addresses[0].address,
          profile: oldProfile,
          ignoreProfile: false,
        }),
      );
    } else {
      // @ts-expect-error <StrictNullChecks/>
      setAccount(null);
    }
  }, [addresses, avatarUrl, name, profile]);

  if (isLoadingProfile || isUpdatingProfile) {
    return (
      <div className="EditProfile full-height">
        <div className="loading-spinner">
          <CWCircleMultiplySpinner />
        </div>
      </div>
    );
  }

  if (errorCode === EditProfileError.NoProfileFound) {
    return <PageNotFound message="We cannot find profile." />;
  }

  if (errorCode === EditProfileError.None) {
    return (
      <CWPageLayout>
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
                      setTimeout(() => {
                        // @ts-expect-error <StrictNullChecks/>
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
                    disabled={isUploadingProfileImage || isUploadingCoverImage}
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
                    uploadStartedCallback={() =>
                      setIsUploadingProfileImage(true)
                    }
                    uploadCompleteCallback={(files) => {
                      setIsUploadingProfileImage(false);
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
                  // @ts-expect-error <StrictNullChecks/>
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
                onImageProcessStatusChange={setIsUploadingCoverImage}
              />
            </CWFormSection>
            <CWFormSection
              title="Linked addresses"
              description="Manage your addresses."
            >
              <LinkedAddresses
                // @ts-expect-error <StrictNullChecks/>
                addresses={addresses}
                // @ts-expect-error <StrictNullChecks/>
                profile={profile}
                refreshProfiles={(address: string) => {
                  refetch().catch(console.error);
                  app.user.removeAddress(
                    // @ts-expect-error <StrictNullChecks/>
                    addresses.find((a) => a.address === address),
                  );
                }}
              />
              <CWText type="caption" fontWeight="medium">
                Link new addresses via the profile dropdown menu
              </CWText>
            </CWFormSection>
            {userOnboardingEnabled && (
              <CWFormSection
                title="Preferences"
                description="Set your preferences to enhance your experience"
              >
                <div className="preferences-header">
                  <CWText type="h4" fontWeight="semiBold">
                    What are you interested in?
                  </CWText>
                  <CWText type="h5">(Select all that apply)</CWText>
                </div>
                <PreferenceTags
                  preferenceTags={preferenceTags}
                  onTagClick={toggleTagFromSelection}
                />
              </CWFormSection>
            )}
          </CWForm>
        </div>
      </CWPageLayout>
    );
  }
};

export default EditProfileComponent;
