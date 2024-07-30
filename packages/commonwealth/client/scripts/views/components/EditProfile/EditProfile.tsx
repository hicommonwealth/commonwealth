import { useUpdateUserMutation } from 'client/scripts/state/api/user';
import { notifyError } from 'controllers/app/notifications';
import { linkValidationSchema } from 'helpers/formValidations/common';
import getLinkType from 'helpers/linkType';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import MinimumProfile from 'models/MinimumProfile';
import NewProfile from 'models/NewProfile';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import { PageNotFound } from '../../pages/404';
import { AvatarUpload } from '../Avatar';
import { LinksArray, useLinksArray } from '../LinksArray';
import { PreferenceTags, usePreferenceTags } from '../PreferenceTags';
import { UserTrainingCardTypes } from '../UserTrainingSlider/types';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from '../component_kit/cw_cover_image_uploader';
import { CWDivider } from '../component_kit/cw_divider';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../component_kit/new_designs/CWCircleMultiplySpinner';
import { CWForm } from '../component_kit/new_designs/CWForm';
import { CWTag } from '../component_kit/new_designs/CWTag';
import { CWTextInput } from '../component_kit/new_designs/CWTextInput';
import { LinkedAddresses } from '../linked_addresses';
import { ReactQuillEditor } from '../react_quill_editor';
import { deserializeDelta, serializeDelta } from '../react_quill_editor/utils';
import './EditProfile.scss';
import ProfileSection from './Section';
import { editProfileValidation } from './validation';

export type Image = {
  url: string;
  imageBehavior: ImageBehavior;
};

const EditProfile = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const user = useUserStore();
  const [profile, setProfile] = useState<NewProfile>();
  const [avatarUrl, setAvatarUrl] = useState();
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [account, setAccount] = useState<Account>();
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [backgroundImageBehaviour, setBackgroundImageBehaviour] =
    useState<ImageBehavior>();

  const {
    areLinksValid,
    links,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    setLinks,
  } = useLinksArray({
    initialLinks: [],
    linkValidation: linkValidationSchema.optional,
  });

  const { preferenceTags, setPreferenceTags, toggleTagFromSelection } =
    usePreferenceTags();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { mutateAsync: updateUser, isLoading: isUpdatingProfile } =
    useUpdateUserMutation({
      addressesWithChainsToUpdate: addresses?.map((a) => ({
        address: a.address,
        chain: a.community.id,
      })),
    });

  const {
    data,
    isLoading: isLoadingProfile,
    error,
    refetch,
  } = useFetchProfileByIdQuery({
    apiCallEnabled: isLoggedIn,
    shouldFetchSelfProfile: true,
  });

  useEffect(() => {
    if (isLoadingProfile) return;

    if (error) {
      setProfile(undefined);
      setAvatarUrl(undefined);
      setPreferenceTags([]);
      setAddresses([]);
      return;
    }

    if (data) {
      setProfile(
        new NewProfile({
          ...data.profile,
          userId: data.userId,
          isOwner: data.userId === user.id,
        }),
      );
      // @ts-expect-error <StrictNullChecks/>
      setAvatarUrl(data.profile.avatar_url);
      setPreferenceTags((tags) =>
        [...(tags || [])].map((t) => ({
          ...t,
          isSelected: !!data.tags.find((pt) => pt.id === t.item.id),
        })),
      );
      setLinks(
        (data.profile?.socials || []).map((link) => ({
          value: link,
          canUpdate: true,
          canDelete: true,
        })),
      );
      setAddresses(
        // @ts-expect-error <StrictNullChecks/>
        data.addresses.map((a) => {
          try {
            return new AddressInfo({
              userId: a.user_id!,
              id: a.id!,
              address: a.address,
              communityId: a.community_id!,
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
  }, [data, isLoadingProfile, error, setPreferenceTags, setLinks, user.id]);

  useEffect(() => {
    // need to create an account to pass to AvatarUpload to see last upload
    // not the best solution because address is not always available
    // should refactor AvatarUpload to make it work with new profiles
    // @ts-expect-error <StrictNullChecks/>
    if (addresses?.length > 0) {
      const address = addresses![0];
      const oldProfile = new MinimumProfile(
        address.address,
        address.community.name,
      );

      oldProfile.initialize(
        profile!.userId,
        profile!.name,
        address.address,
        avatarUrl!,
        address.community.name,
        null,
      );

      setAccount(
        new Account({
          community: address.community,
          address: address.address,
          profile: oldProfile,
          ignoreProfile: false,
        }),
      );
    } else {
      // @ts-expect-error <StrictNullChecks/>
      setAccount(null);
    }
  }, [addresses, avatarUrl, profile]);

  if (isLoadingProfile || isUpdatingProfile) {
    return (
      <div className="EditProfile full-height">
        <div className="loading-spinner">
          <CWCircleMultiplySpinner />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <PageNotFound message="We cannot find profile." />;
  }

  if (!error && profile) {
    const handleSubmit = (values: z.infer<typeof editProfileValidation>) => {
      if (links.filter((x) => x.value).length > 0 ? !areLinksValid() : false) {
        return;
      }

      // TODO: fix and add avatarUrl when saving - https://github.com/hicommonwealth/commonwealth/issues/8151
      const backgroundImage = values.backgroundImg.trim()
        ? JSON.stringify({
            url: values.backgroundImg.trim(),
            imageBehavior: backgroundImageBehaviour,
          })
        : null;

      const updates = {
        id: user.id.toString(),
        profile: {
          name: values.username.trim(),
          email: values.email.trim(),
          bio: serializeDelta(values.bio).trim(),
          background_image: backgroundImage && JSON.parse(backgroundImage),
          avatar_url: avatarUrl,
          socials: (links || [])
            .filter((l) => l.value.trim())
            .map((l) => l.value.trim()),
        },
        tag_ids: preferenceTags
          .filter((tag) => tag.isSelected)
          .map((tag) => tag.item.id),
      };

      updateUser(updates)
        .then(() => {
          navigate(`/profile/id/${user.id}`);

          if (links?.length > 0) {
            markTrainingActionAsComplete(
              UserTrainingCardTypes.FinishProfile,
              user.id,
            );
          }
        })
        .catch((err) => {
          notifyError(err?.response?.data?.error || 'Something went wrong.');
        });
    };

    const actionButtons = (
      <div className="buttons-container">
        <div className="buttons">
          <CWButton
            type="button"
            label="Cancel"
            buttonType="secondary"
            buttonWidth="wide"
            disabled={isUploadingProfileImage || isUploadingCoverImage}
            onClick={() => navigate(`/profile/id/${user.id}`)}
          />
          <CWButton
            type="submit"
            label="Save"
            buttonType="primary"
            buttonWidth="wide"
            disabled={isUploadingProfileImage || isUploadingCoverImage}
          />
        </div>
      </div>
    );

    return (
      <CWPageLayout>
        <div className="EditProfile">
          <CWForm
            initialValues={{
              username: data?.profile?.name || '',
              email: data?.profile?.email || '',
              backgroundImg: data?.profile?.background_image?.url || '',
              bio: deserializeDelta(data?.profile?.bio ?? ''),
            }}
            onSubmit={handleSubmit}
            validationSchema={editProfileValidation}
          >
            <div>
              <div>
                <CWText type="h3" fontWeight="medium">
                  Edit Profile
                </CWText>
                <CWText type="b1">
                  Add or change your general info and customize your profile.
                </CWText>
              </div>
              {actionButtons}
            </div>
            <CWDivider />
            <ProfileSection
              title="General Info"
              description="Let your community and others get to know you by sharing a bit about yourself."
              className="input-controls"
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
              <CWTextInput
                fullWidth
                placeholder="Enter your user name"
                label="Username"
                // TODO: unique username like in PersonalInformationStep?
                // TODO: username generator like in PersonalInformationStep?
                name="username"
                hookToForm
              />
              <CWTextInput
                fullWidth
                placeholder="Add an email address"
                label="Email"
                name="email"
                hookToForm
              />
              <ReactQuillEditor
                label="Bio"
                className="editor"
                hookToForm
                name="bio"
              />
              <CWDivider />
              <LinksArray
                label="Social links"
                addLinkButtonCTA="+ Add social link"
                links={links.map((link) => ({
                  ...link,
                  customElementAfterLink:
                    link.value && getLinkType(link.value, 'website') ? (
                      <CWTag
                        label={getLinkType(link.value, 'website')}
                        type="group"
                        classNames="link-type"
                      />
                    ) : (
                      <></>
                    ),
                }))}
                onLinkAdd={onLinkAdd}
                onLinkUpdatedAtIndex={onLinkUpdatedAtIndex}
                onLinkRemovedAtIndex={onLinkRemovedAtIndex}
                canAddLinks={links.length <= 5}
              />
            </ProfileSection>
            <ProfileSection
              title="Personalize Your Profile"
              description="Express yourself through imagery."
            >
              <CWText fontWeight="medium">Add a background image </CWText>
              {/* TODO: add option to remove existing image */}
              <CWCoverImageUploader
                name="backgroundImg"
                hookToForm
                enableGenerativeAI
                showUploadAndGenerateText
                defaultImageBehaviour={
                  (data?.profile?.background_image
                    ?.imageBehavior as ImageBehavior) || ImageBehavior.Fill
                }
                onImageProcessStatusChange={setIsUploadingCoverImage}
                onImageBehaviourChange={setBackgroundImageBehaviour}
              />
            </ProfileSection>
            <ProfileSection
              title="Linked addresses"
              description="Manage your addresses."
            >
              <LinkedAddresses
                // @ts-expect-error <StrictNullChecks/>
                addresses={addresses}
                profile={profile}
                refreshProfiles={(addressInfo) => {
                  refetch().catch(console.error);
                  user.setData({
                    addresses: [...user.addresses].filter(
                      (addr) =>
                        addr.community.id !== addressInfo.community.id &&
                        addr.address !== addressInfo.address,
                    ),
                  });
                }}
              />
              <CWText type="caption" fontWeight="medium">
                Link new addresses via the profile dropdown menu within a
                community
              </CWText>
            </ProfileSection>
            <ProfileSection
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
            </ProfileSection>
            {actionButtons}
          </CWForm>
        </div>
      </CWPageLayout>
    );
  }
};

export default EditProfile;
