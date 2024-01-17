import { DefaultPage } from '@hicommonwealth/core';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { featureFlags } from 'helpers/feature-flags';
import getLinkType from 'helpers/linkType';
import React, { useState } from 'react';
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
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { getCommunityTags } from '../../../manage_community/helpers';
import './Form.scss';
import { CommunityTags, FormSubmitValues } from './types';
import {
  communityProfileValidationSchema,
  linkValidationSchema,
} from './validation';

const Form = () => {
  const communityTagOptions: CommunityTags[] = ['DeFi', 'DAO'];
  const community = app.config.chains.getById(app.activeChainId());

  const [formKey, setFormKey] = useState(1);
  const [nameFieldDisabledState, setNameFieldDisabledState] = useState({
    isDisabled: true,
    canDisable: true,
  });
  const [currentCommunityTags, setCurrentCommunityTags] = useState(
    Object.entries(getCommunityTags(community.id))
      .filter(({ 1: value }) => value)
      .map(({ 0: key }) => key) as CommunityTags[],
  );
  const [isCustomStagesEnabled, setIsCustomStagesEnabled] = useState(
    community.stagesEnabled,
  );
  const [selectedCommunityTags, setSelectedCommunityTags] =
    useState<CommunityTags[]>(currentCommunityTags);
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLinks, setInitialLinks] = useState(
    community.socialLinks.length > 0
      ? community.socialLinks.map((link) => ({
          value: link,
          canUpdate: true,
          canDelete: true,
          error: '',
        }))
      : [
          {
            value: '',
            canUpdate: true,
            canDelete: false,
            error: '',
          },
        ],
  );

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
    if (isSubmitting || !areLinksValid()) return;

    try {
      setIsSubmitting(true);

      await editTags({
        communityId: community.id,
        selectedTags: {
          DAO: selectedCommunityTags.includes('DAO'),
          DeFi: selectedCommunityTags.includes('DeFi'),
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
        customStages: values.customStages,
        iconUrl: values.communityProfileImageURL,
        defaultOverview: values.defaultPage === DefaultPage.Overview,
      });

      setNameFieldDisabledState({
        isDisabled: true,
        canDisable: true,
      });
      setCurrentCommunityTags([...selectedCommunityTags]);
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
      className="Form"
      initialValues={{
        communityName: community.name,
        communityDescription: community.description,
        communityProfileImageURL: community.iconUrl,
        defaultPage: community.defaultOverview
          ? DefaultPage.Overview
          : DefaultPage.Discussions,
        hasStagesEnabled: community.stagesEnabled,
        customStages: community.customStages || '',
        communityBanner: community.communityBanner || '',
      }}
      validationSchema={communityProfileValidationSchema}
      onSubmit={onSubmit}
    >
      {({ formState, reset, getValues: getFormValues }) => (
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
              value={`${window.location.origin}/${
                getFormValues?.()?.['communityName'] || community.id
              }`}
            />
            {featureFlags.isCommunityStakesEnabled && (
              <>
                <CWTextInput
                  disabled
                  fullWidth
                  label="Community Namespace"
                  placeholder="Community Namespace"
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
                Add your Discord, Twitter (X), Telegram, Github, Website, etc.
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
            />
          </section>

          <section className="tags-section">
            <div className="header">
              <CWText type="h4">Tags</CWText>
              <CWText type="b1">
                Tags help new members find your community
              </CWText>
            </div>

            <div className="controls">
              {communityTagOptions.map((option) => (
                <CWButton
                  key={option}
                  type="button"
                  label={option}
                  buttonWidth="narrow"
                  buttonType={
                    selectedCommunityTags.includes(option)
                      ? 'primary'
                      : 'secondary'
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedCommunityTags((prevTags) =>
                      prevTags.includes(option)
                        ? [...prevTags].filter((tag) => tag !== option)
                        : [...prevTags, option],
                    );
                  }}
                />
              ))}
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
                currentCommunityTags.length === selectedCommunityTags.length &&
                links.length === (community.socialLinks || []).length
              }
              onClick={() => {
                reset();
                setLinks(initialLinks);
                setSelectedCommunityTags(currentCommunityTags);
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

export default Form;
