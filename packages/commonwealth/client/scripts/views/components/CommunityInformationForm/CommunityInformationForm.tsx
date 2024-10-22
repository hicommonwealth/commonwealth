import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'utils';

import { useFetchConfigurationQuery } from 'state/api/configuration';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/CWCoverImageUploader';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './CommunityInformationForm.scss';
import {
  BASE_ID,
  BLAST_ID,
  ETHEREUM_MAINNET_ID,
  OSMOSIS_ID,
  POLYGON_ETH_CHAIN_ID,
  alphabeticallyStakeWiseSortedChains as sortedChains,
} from './constants';
import {
  CommunityInformationFormProps,
  CommunityInformationFormSubmitValues,
} from './types';
import useSocialLinks from './useSocialLinks';
import {
  baseCommunityInformationFormValidationSchema,
  communityChainValidation,
} from './validation';

const CommunityInformationForm = ({
  onSubmit,
  onCancel,
  onWatch,
  withChainsConfig,
  withSocialLinks = false,
  initialValues,
  isCreatingCommunity,
  submitBtnLabel,
}: CommunityInformationFormProps) => {
  const [communityName, setCommunityName] = useState(
    initialValues?.communityName || '',
  );
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const {
    socialLinks,
    addLink,
    removeLinkAtIndex,
    validateSocialLinks,
    updateAndValidateSocialLinkAtIndex,
  } = useSocialLinks();

  const { data: configurationData } = useFetchConfigurationQuery();

  const communityId = slugifyPreserveDashes(communityName.toLowerCase());
  const isCommunityNameTaken = !!configurationData?.redirects?.[communityId];

  const validation = withChainsConfig
    ? baseCommunityInformationFormValidationSchema.merge(
        communityChainValidation,
      )
    : baseCommunityInformationFormValidationSchema;

  const getChainOptions = () => {
    const mappedChainValue = (chainType) => ({
      helpText: chainType.hasStakeEnabled ? 'Community Stake' : '',
      label: chainType.label,
      value: `${chainType.value}`,
    });

    // Since we are treating polygon as an ecosystem, we will only have a single option, which will be
    // preselected and further input's will be disabled
    if (withChainsConfig?.community?.type === CommunityType.Polygon) {
      return sortedChains
        .filter((chainType) => chainType.value === POLYGON_ETH_CHAIN_ID)
        .map(mappedChainValue);
    }

    if (withChainsConfig?.community?.type === CommunityType.Solana) {
      return sortedChains
        .filter((chainType) => chainType.chainBase === CommunityType.Solana)
        .map(mappedChainValue);
    }

    return sortedChains
      .filter(
        (chainType) =>
          chainType.chainBase ===
          (withChainsConfig?.community?.type === CommunityType.Cosmos
            ? CommunityType.Cosmos
            : CommunityType.Ethereum),
      )
      .map(mappedChainValue);
  };

  const getInitialValue = () => {
    return {
      ...(initialValues || {}),
      ...(withChainsConfig && {
        chain: (() => {
          const options = getChainOptions();

          switch (withChainsConfig.community.type) {
            case CommunityType.Base:
              return options?.find((o) => o.value === BASE_ID);
            case CommunityType.Ethereum:
              return options?.find((o) => o.value === ETHEREUM_MAINNET_ID);
            case CommunityType.Cosmos:
              return options?.find((o) => o.value === OSMOSIS_ID);
            case CommunityType.Blast:
              return options?.find((o) => o.value === BLAST_ID);
            case CommunityType.Polygon:
            case CommunityType.Solana:
              return options?.[0];
          }
        })(),
      }),
    };
  };

  const handleSubmit = async (values: CommunityInformationFormSubmitValues) => {
    const hasLinksError = validateSocialLinks();

    if (isCommunityNameTaken || hasLinksError) return;
    // @ts-expect-error StrictNullChecks
    values.links = socialLinks.map((link) => link.value).filter(Boolean);

    await onSubmit({ ...values, communityId }).catch(console.error);
  };

  return (
    <CWForm
      validationSchema={validation}
      onSubmit={handleSubmit}
      className="CommunityInformationForm"
      initialValues={getInitialValue()}
      onWatch={onWatch}
    >
      {/* Form fields */}
      <CWTextInput
        name="communityName"
        hookToForm
        label="Community Name"
        placeholder="Name your community"
        fullWidth
        onInput={(e) => setCommunityName(e.target.value?.trim())}
        customError={
          isCommunityNameTaken ? 'Community name is already taken' : ''
        }
      />

      {withChainsConfig && (
        <CWSelectList
          name="chain"
          hookToForm
          isClearable={false}
          label="Select chain"
          placeholder="Select chain"
          isDisabled={
            withChainsConfig.community.type === CommunityType.Polygon ||
            withChainsConfig.community.type === CommunityType.Solana
          }
          options={getChainOptions()}
        />
      )}

      <CWTextInput
        label="Community URL"
        placeholder="URL will appear when you name your community"
        fullWidth
        disabled
        value={communityName ? `${window.location.origin}/${communityId}` : ''}
      />

      <CWTextArea
        name="communityDescription"
        hookToForm
        label="Community Description"
        placeholder="Enter a description of your community or project"
        charCount={250}
      />

      <CWCoverImageUploader
        label="Community Profile Image (Accepts JPG and PNG files)"
        canSelectImageBehavior={false}
        onImageProcessingChange={({ isGenerating, isUploading }) =>
          setIsProcessingProfileImage(isGenerating || isUploading)
        }
        name="communityProfileImageURL"
        hookToForm
        imageBehavior={ImageBehavior.Circle}
        withAIImageGeneration
      />

      {withSocialLinks ? (
        <>
          <section className="header">
            <CWText type="h4">
              Community Links{' '}
              <CWText type="b1" className="optional-label">
                &#40;Optional&#41;
              </CWText>
            </CWText>
            <CWText type="b1" className="description">
              Add your Discord, X (Twitter), Telegram, Website, etc.
            </CWText>
          </section>

          <section className="social-links">
            <CWText type="caption">Social Links</CWText>

            {socialLinks.map((socialLink, index) => (
              <div className="link-input-container" key={index}>
                <CWTextInput
                  containerClassName="w-full"
                  placeholder="https://example.com"
                  fullWidth
                  value={socialLink.value}
                  customError={socialLink.error}
                  onInput={(e) =>
                    updateAndValidateSocialLinkAtIndex(
                      e.target.value?.trim(),
                      index,
                    )
                  }
                  onBlur={() =>
                    updateAndValidateSocialLinkAtIndex(
                      socialLink.value || '',
                      index,
                    )
                  }
                  onFocus={() =>
                    updateAndValidateSocialLinkAtIndex(
                      socialLink.value || '',
                      index,
                    )
                  }
                />
                <CWIconButton
                  iconButtonTheme="neutral"
                  iconName="trash"
                  iconSize="large"
                  onClick={() => removeLinkAtIndex(index)}
                  disabled={socialLinks.length === 1}
                />
              </div>
            ))}

            <button type="button" className="add-link-button" onClick={addLink}>
              + Add social link
            </button>
          </section>
        </>
      ) : (
        <></>
      )}

      {/* Action buttons */}
      <section className="action-buttons">
        <CWButton
          type="button"
          label="Cancel"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={onCancel}
        />
        <CWButton
          type="submit"
          buttonWidth="wide"
          label={submitBtnLabel}
          disabled={isCreatingCommunity || isProcessingProfileImage}
        />
      </section>
    </CWForm>
  );
};

export default CommunityInformationForm;
