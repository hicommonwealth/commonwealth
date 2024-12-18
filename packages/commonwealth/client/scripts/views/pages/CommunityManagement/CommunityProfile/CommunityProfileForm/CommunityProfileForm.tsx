import { DefaultPage } from '@hicommonwealth/shared';
import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { linkValidationSchema } from 'helpers/formValidations/common';
import { getLinkType, isLinkValid } from 'helpers/link';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import app from 'state';
import {
  useEditCommunityBannerMutation,
  useEditCommunityTagsMutation,
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import {
  PreferenceTags,
  usePreferenceTags,
} from 'views/components/PreferenceTags';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import ErrorPage from '../../../error';
import './CommunityProfileForm.scss';
import { FormSubmitValues } from './types';
import { communityProfileValidationSchema } from './validation';

const CommunityProfileForm = () => {
  // `formKey` remounts the CWForm with new community default values after a
  // successful update, using the updated formKey.
  const [formKey, setFormKey] = useState(1);
  const [nameFieldDisabledState, setNameFieldDisabledState] = useState({
    isDisabled: true,
    canDisable: true,
  });
  const [isCustomStagesEnabled, setIsCustomStagesEnabled] = useState<boolean>();
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLinks, setInitialLinks] = useState<
    {
      value: string;
      canUpdate: boolean;
      canDelete: boolean;
      error: string;
    }[]
  >([]);

  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isCommunityLoading } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
    });

  const { mutateAsync: editBanner } = useEditCommunityBannerMutation();
  const { mutateAsync: editTags } = useEditCommunityTagsMutation();
  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: community?.id || '',
  });

  const {
    isLoadingTags,
    preferenceTags,
    setPreferenceTags,
    toggleTagFromSelection,
  } = usePreferenceTags();

  const {
    links,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: initialLinks,
    linkValidation: linkValidationSchema.required,
  });

  const updatePreferenceTags = useCallback(() => {
    const updatedTags = [...preferenceTags].map((tag) => ({
      ...tag,
      isSelected: !!(community?.CommunityTags || []).find(
        (t) => t.tag_id === tag.item.id,
      ),
    }));
    setPreferenceTags(updatedTags);
  }, [preferenceTags, setPreferenceTags, community]);

  useRunOnceOnCondition({
    callback: () => {
      setIsCustomStagesEnabled(community?.stages_enabled);

      const linksFromCommunity = (community?.social_links || [])
        .filter((x) => x)
        .map((link) => ({
          value: link || '',
          canUpdate: true,
          canDelete: true,
          error: '',
        }));
      setLinks(linksFromCommunity);
      setInitialLinks(linksFromCommunity);

      preferenceTags?.length > 0 && updatePreferenceTags();
    },
    shouldRun:
      !isCommunityLoading &&
      !!community &&
      preferenceTags?.length > 0 &&
      !isLoadingTags,
  });

  const communityIdForUrl = slugifyPreserveDashes(
    community?.id?.toLowerCase() || '',
  );

  const onSubmit = async (values: FormSubmitValues) => {
    if (
      !community?.id ||
      isSubmitting ||
      (links.filter((x) => x.value).length > 0 ? !areLinksValid() : false)
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      await editTags({
        communityId: community.id,
        tagIds: preferenceTags
          .filter((pt) => pt.isSelected)
          .map((pt) => pt.item.id),
      });

      await editBanner({
        communityId: community.id,
        bannerText: values.communityBanner ?? '',
      });

      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community.id,
          name: values.communityName,
          description: values.communityDescription,
          socialLinks: links.map((link) => link.value.trim()),
          stagesEnabled: values.hasStagesEnabled,
          customStages: values.customStages
            ? JSON.parse(values.customStages)
            : [],
          iconUrl: values.communityProfileImageURL,
          defaultOverview: values.defaultPage === DefaultPage.Overview,
        }),
      );

      setNameFieldDisabledState({
        isDisabled: true,
        canDisable: true,
      });
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
    } catch {
      notifyError('Failed to update community!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCommunityLoading || isLoadingTags) {
    return <CWCircleMultiplySpinner />;
  }

  if (!community) {
    return (
      <div className="m-auto">
        <ErrorPage message="Failed to load community info" />
      </div>
    );
  }

  return (
    <CWForm
      key={formKey}
      className="CommunityProfileForm"
      initialValues={{
        communityName: community.name || '',
        communityDescription: community.description || '',
        communityProfileImageURL: community.icon_url || '',
        defaultPage: community?.default_summary_view
          ? DefaultPage.Overview
          : DefaultPage.Discussions,
        hasStagesEnabled: !!community.stages_enabled,
        customStages:
          (community?.custom_stages || []).length > 0
            ? JSON.stringify(community?.custom_stages || [])
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
                    e?.target?.value?.trim() === community?.name?.trim(),
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
              value={`${window.location.origin}/${communityIdForUrl}`}
            />

            <CWTextInput
              disabled
              fullWidth
              label="Community Namespace"
              placeholder="Community Namespace"
              value={community?.namespace || ''}
            />
            <CWTextInput
              disabled
              fullWidth
              label="Community Symbol"
              placeholder="Community Symbol"
              value={community?.default_symbol || ''}
            />

            <CWTextArea
              charCount={250}
              hookToForm
              name="communityDescription"
              label="Community Description"
              placeholder="Enter a description of your community or project"
            />
            <CWImageInput
              hookToForm
              withAIImageGeneration
              name="communityProfileImageURL"
              canSelectImageBehavior={false}
              imageBehavior={ImageBehavior.Circle}
              onImageProcessingChange={({ isGenerating, isUploading }) =>
                setIsProcessingProfileImage(isGenerating || isUploading)
              }
              label="Community Profile Image (Accepts JPG and PNG files)"
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
                  link.value && isLinkValid(link.value) ? (
                    <CWTag
                      label={getLinkType(link.value) || 'website'}
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
                Tags &nbsp;<CWText type="b1">(select up to 4)</CWText>
              </CWText>
              <CWText type="b1">
                Tags help new members find your community
              </CWText>
            </div>

            <div className="controls">
              <PreferenceTags
                preferenceTags={preferenceTags}
                onTagClick={toggleTagFromSelection}
                maxSelectableTags={4}
              />
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
                (community?.CommunityTags || []).length ===
                  preferenceTags.filter(({ isSelected }) => isSelected)
                    .length &&
                links.filter((x) => x.value).length ===
                  (community?.social_links || []).length &&
                links.every((x) =>
                  (community?.social_links || []).includes(x.value.trim()),
                )
              }
              onClick={() => {
                reset();
                setNameFieldDisabledState({
                  isDisabled: true,
                  canDisable: true,
                });
                setLinks(initialLinks);

                // TODO: this reset state is a bit buggy for the tags section, update this
                // when api is updated to use newer tags schema
                // this reset selected preference tags to original state
                updatePreferenceTags();
              }}
            />
            <CWButton
              label="Save changes"
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
