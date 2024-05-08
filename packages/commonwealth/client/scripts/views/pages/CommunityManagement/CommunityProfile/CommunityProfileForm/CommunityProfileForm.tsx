import { DefaultPage } from '@hicommonwealth/shared';
import {
  PreferenceTags,
  usePreferenceTags,
} from 'client/scripts/views/components/PreferenceTags';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import getLinkType from 'helpers/linkType';
import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import app from 'state';
import {
  useEditCommunityBannerMutation,
  useEditCommunityTagsMutation,
} from 'state/api/communities';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { useFlag } from '../../../../../hooks/useFlag';
import './CommunityProfileForm.scss';
import { getCommunityTags } from './helpers';
import { CommunityTags, FormSubmitValues } from './types';
import {
  communityProfileValidationSchema,
  linkValidationSchema,
} from './validation';

const CommunityProfileForm = () => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const communityStakeEnabled = useFlag('communityStake');
  const communityTagOptions: CommunityTags[] = ['DeFi', 'DAO'];
  const community = app.config.chains.getById(app.activeChainId());

  const [communityId] = useState(
    slugifyPreserveDashes(community.id.toLowerCase()),
  );
  // `formKey` remounts the CWForm with new community default values after a
  // successful update, using the updated formKey.
  const [formKey, setFormKey] = useState(1);
  const [nameFieldDisabledState, setNameFieldDisabledState] = useState({
    isDisabled: true,
    canDisable: true,
  });
  const [currentCommunityTags, setCurrentCommunityTags] = useState(
    Object.entries(getCommunityTags(community.id))
      .filter(({ 1: value }) => value)
      .map(({ 0: key }, index) => ({ id: index, tag: key })),
  );
  const [isCustomStagesEnabled, setIsCustomStagesEnabled] = useState(
    community.stagesEnabled,
  );
  const [selectedCommunityTags, setSelectedCommunityTags] =
    useState(currentCommunityTags);
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLinks, setInitialLinks] = useState(
    (community.socialLinks || []).map((link) => ({
      value: link,
      canUpdate: true,
      canDelete: true,
      error: '',
    })),
  );
  const { selectedTags, setSelectedTags, toggleTagFromSelection } =
    usePreferenceTags({
      initialSelectedTag: currentCommunityTags,
    });

  const {
    links,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: initialLinks,
    linkValidation: linkValidationSchema,
  });

  const { mutateAsync: editBanner } = useEditCommunityBannerMutation();
  const { mutateAsync: editTags } = useEditCommunityTagsMutation();

  const onSubmit = async (values: FormSubmitValues) => {
    if (
      isSubmitting ||
      (links.filter((x) => x.value).length > 0 ? !areLinksValid() : false)
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      await editTags({
        communityId: community.id,
        selectedTags: {
          ...(userOnboardingEnabled
            ? {
                // TODO: build and implement api to support other new tags
                DAO: !!selectedTags.find(({ item }) => item.tag === 'DAO'),
                DeFi: !!selectedTags.find(({ item }) => item.tag === 'DeFi'),
              }
            : {
                DAO: !!selectedCommunityTags.find(({ tag }) => tag === 'DAO'),
                DeFi: !!selectedCommunityTags.find(({ tag }) => tag === 'DeFi'),
              }),
        },
      });

      await editBanner({
        communityId: community.id,
        bannerText: values.communityBanner,
      });

      await community.updateChainData({
        name: values.communityName,
        description: values.communityDescription,
        social_links: links.map((link) => link.value.trim()),
        stagesEnabled: values.hasStagesEnabled,
        customStages: values.customStages
          ? JSON.parse(values.customStages)
          : [],
        iconUrl: values.communityProfileImageURL,
        defaultOverview: values.defaultPage === DefaultPage.Overview,
      });

      setNameFieldDisabledState({
        isDisabled: true,
        canDisable: true,
      });
      setCurrentCommunityTags(
        userOnboardingEnabled
          ? [
              ...selectedTags
                .filter(({ isSelected }) => isSelected)
                .map(({ item }) => ({ ...item })),
            ]
          : [...selectedCommunityTags],
      );
      const updatedLinks = links.map((link) => ({
        value: link.value.trim(),
        canUpdate: true,
        canDelete: true,
        error: '',
      }));
      setLinks(updatedLinks);
      setInitialLinks(updatedLinks);
      setFormKey((key) => key + 1);

      notifySuccess('Community updated!');
      app.sidebarRedraw.emit('redraw');
    } catch {
      notifyError('Failed to update community!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CWForm
      key={formKey}
      className="CommunityProfileForm"
      initialValues={{
        communityName: community.name,
        communityDescription: community.description,
        communityProfileImageURL: community.iconUrl,
        defaultPage: community.defaultOverview
          ? DefaultPage.Overview
          : DefaultPage.Discussions,
        hasStagesEnabled: community.stagesEnabled,
        customStages:
          community.customStages.length > 0
            ? JSON.stringify(community.customStages)
            : '',
        communityBanner: community.communityBanner || '',
      }}
      validationSchema={communityProfileValidationSchema}
      onSubmit={onSubmit}
    >
      {({ formState, reset }) => (
        <>
          <section className="base-section">
            <CWTextInput
              fullWidth
              hookToForm
              name="communityName"
              label="Community Name"
              placeholder="Community Name"
              disabled={nameFieldDisabledState.isDisabled}
              onInput={(e) => {
                setNameFieldDisabledState((prevVal) => ({
                  ...prevVal,
                  canDisable:
                    e?.target?.value?.trim() === community.name.trim(),
                }));
              }}
              iconRight={
                <CWIcon
                  weight="fill"
                  className="lock-icon"
                  iconName={
                    nameFieldDisabledState.isDisabled
                      ? 'lockedNew'
                      : 'lockOpenNew'
                  }
                  disabled={!nameFieldDisabledState.canDisable}
                  onClick={() => {
                    if (nameFieldDisabledState.canDisable) {
                      setNameFieldDisabledState((prevVal) => ({
                        ...prevVal,
                        isDisabled: !prevVal.isDisabled,
                      }));
                    }
                  }}
                />
              }
            />
            <CWTextInput
              disabled
              fullWidth
              label="Community URL"
              placeholder="Community URL"
              value={`${window.location.origin}/${communityId}`}
            />
            {communityStakeEnabled && (
              <>
                <CWTextInput
                  disabled
                  fullWidth
                  label="Community Namespace"
                  placeholder="Community Namespace"
                  value={community.namespace}
                />
                <CWTextInput
                  disabled
                  fullWidth
                  label="Community Symbol"
                  placeholder="Community Symbol"
                  value={community.default_symbol || ''}
                />
              </>
            )}
            <CWTextArea
              hookToForm
              name="communityDescription"
              label="Community Description"
              placeholder="Enter a description of your community or project"
            />
            <CWCoverImageUploader
              hookToForm
              enableGenerativeAI
              showUploadAndGenerateText
              name="communityProfileImageURL"
              canSelectImageBehaviour={false}
              uploadCompleteCallback={console.log}
              defaultImageBehaviour={ImageBehavior.Circle}
              onImageProcessStatusChange={setIsProcessingProfileImage}
              subheaderText="Community Profile Image (Accepts JPG and PNG files)"
            />
          </section>

          <section className="links-section">
            <div className="header">
              <CWText type="h4">Links</CWText>
              <CWText type="b1">
                Add your Discord, X (Twitter), Telegram, Github, Website, etc.
              </CWText>
            </div>
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
                    ''
                  ),
              }))}
              onLinkAdd={onLinkAdd}
              onLinkUpdatedAtIndex={onLinkUpdatedAtIndex}
              onLinkRemovedAtIndex={onLinkRemovedAtIndex}
              canAddLinks={links.length <= 5}
            />
          </section>

          <section className="tags-section">
            <div className="header">
              <CWText type="h4">
                Tags
                {userOnboardingEnabled ? (
                  <>
                    &nbsp;<CWText type="b1">(select up to 4)</CWText>
                  </>
                ) : (
                  <></>
                )}
              </CWText>
              <CWText type="b1">
                Tags help new members find your community
              </CWText>
            </div>

            <div className="controls">
              {userOnboardingEnabled ? (
                <PreferenceTags
                  selectedTags={selectedTags}
                  onTagClick={toggleTagFromSelection}
                  maxSelectableTags={4}
                />
              ) : (
                communityTagOptions.map((option) => (
                  <CWButton
                    key={option}
                    type="button"
                    label={option}
                    buttonWidth="narrow"
                    buttonType={
                      selectedCommunityTags.find(({ tag }) => tag === option)
                        ? 'primary'
                        : 'secondary'
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCommunityTags((prevTags) =>
                        !!prevTags.find(({ tag }) => tag === option)
                          ? [...prevTags].filter(({ tag }) => tag !== option)
                          : [...prevTags, { id: 1, tag: option }],
                      );
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="stages-section">
            <div className="header">
              <CWText type="h4">Stages</CWText>
              <CWText type="b1">
                <p>
                  Show proposal progress on threads
                  <CWToggle
                    hookToForm
                    size="large"
                    name="hasStagesEnabled"
                    onChange={(e) => setIsCustomStagesEnabled(e.target.checked)}
                  />
                </p>
              </CWText>
            </div>

            <CWTextInput
              label="Custom stages"
              placeholder="[“Stage 1”, “Stage 2”]"
              name="customStages"
              fullWidth
              hookToForm
              disabled={!isCustomStagesEnabled}
            />
          </section>

          <section className="banner-section">
            <div className="header">
              <CWText type="h4">Banner</CWText>
              <CWText type="b1">
                Display a message across the top of your community
              </CWText>
            </div>

            <CWTextInput
              label="Banner"
              placeholder="Enter text to create a banner"
              name="communityBanner"
              fullWidth
              hookToForm
            />
          </section>

          <section className="default-page-section">
            <div className="header">
              <CWText type="h4">Default page</CWText>
              <CWText type="b1">
                Select the landing page for your community
              </CWText>
            </div>

            <div className="controls">
              <CWRadioButton
                label="Discussions"
                value={DefaultPage.Discussions}
                name="defaultPage"
                hookToForm
              />
              <CWRadioButton
                label="Overview"
                value={DefaultPage.Overview}
                name="defaultPage"
                hookToForm
              />
            </div>
          </section>

          <section className="action-buttons">
            <CWButton
              label="Revert Changes"
              buttonWidth="narrow"
              buttonType="tertiary"
              type="button"
              disabled={
                !formState.isDirty &&
                (userOnboardingEnabled
                  ? currentCommunityTags.length ===
                    selectedTags.filter(({ isSelected }) => isSelected).length
                  : currentCommunityTags.length ===
                    selectedCommunityTags.length) &&
                links.filter((x) => x.value).length ===
                  (community.socialLinks || []).length &&
                links.every((x) =>
                  (community.socialLinks || []).includes(x.value.trim()),
                )
              }
              onClick={() => {
                reset();
                setNameFieldDisabledState({
                  isDisabled: true,
                  canDisable: true,
                });
                setLinks(initialLinks);
                if (userOnboardingEnabled) {
                  setSelectedTags(
                    [...selectedTags].map(({ item }) => ({
                      isSelected: !!currentCommunityTags.find(
                        (t) => t.tag === item.tag,
                      ),
                      item: item,
                    })),
                  );
                } else {
                  setSelectedCommunityTags(currentCommunityTags);
                }
              }}
            />
            <CWButton
              label="Save Changes"
              buttonWidth="narrow"
              buttonType="primary"
              type="submit"
              disabled={isProcessingProfileImage}
            />
          </section>
        </>
      )}
    </CWForm>
  );
};

export default CommunityProfileForm;
