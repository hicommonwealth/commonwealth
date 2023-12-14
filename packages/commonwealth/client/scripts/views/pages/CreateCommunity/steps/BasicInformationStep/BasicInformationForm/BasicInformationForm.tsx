import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'utils';
import { ZodError } from 'zod';

import { ChainBase } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import useCreateCommunityMutation from 'state/api/communities/createCommunity';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { openConfirmation } from 'views/modals/confirmation_modal';

import {
  POLYGON_ETH_CHAIN_ID,
  chainTypes,
  existingCommunityNames,
} from './constants';
import {
  BasicInformationFormProps,
  FormSubmitValues,
  SocialLinkField,
} from './types';
import {
  basicInformationFormValidationSchema,
  socialLinkValidation,
} from './validation';

import './BasicInformationForm.scss';

const ETHEREUM_MAINNET_ID = '1';
const OSMOSIS_ID = 'osmosis';

const BasicInformationForm = ({
  selectedAddress,
  selectedCommunity,
  onSubmit,
  onCancel,
}: BasicInformationFormProps) => {
  const [communityName, setCommunityName] = useState('');
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinkField[]>([
    {
      value: '',
      error: '',
    },
  ]);
  const isCommunityNameTaken = existingCommunityNames.find(
    (name) => name === communityName.trim().toLowerCase(),
  );

  const communityId = slugifyPreserveDashes(communityName.toLowerCase());

  const {
    mutateAsync: createCommunityMutation,
    isLoading: createCommunityLoading,
  } = useCreateCommunityMutation();

  const getChainOptions = () => {
    // Since we are treating polygon as an ecosystem, we will only have a single option, which will be
    // preselected and further input's will be disabled
    if (selectedCommunity.type === CommunityType.Polygon) {
      return chainTypes
        .filter((chainType) => chainType.value === POLYGON_ETH_CHAIN_ID)
        .map((chainType) => ({
          label: chainType.label,
          value: `${chainType.value}`,
        }));
    }

    if (selectedCommunity.type === CommunityType.Solana) {
      return chainTypes
        .filter((chainType) => chainType.chainBase === CommunityType.Solana)
        .map((chainType) => ({
          label: chainType.label,
          value: `${chainType.value}`,
        }));
    }

    return chainTypes
      .filter(
        (chainType) =>
          chainType.chainBase ===
          (selectedCommunity.type === CommunityType.Cosmos
            ? CommunityType.Cosmos
            : CommunityType.Ethereum),
      )
      .map((chainType) => ({
        label: chainType.label,
        value: `${chainType.value}`,
      }));
  };

  const getInitialValue = () => ({
    ...(selectedCommunity.type === CommunityType.Polygon && {
      chain: getChainOptions()?.[0],
    }),
    ...(selectedCommunity.type === CommunityType.Solana && {
      chain: getChainOptions()?.[0],
    }),
    ...(selectedCommunity.type === CommunityType.Ethereum && {
      chain: getChainOptions()?.find((o) => o.value === ETHEREUM_MAINNET_ID),
    }),
    ...(selectedCommunity.type === CommunityType.Cosmos && {
      chain: getChainOptions()?.find((o) => o.value === OSMOSIS_ID),
    }),
  });

  const addLink = () => {
    setSocialLinks((socialLink) => [
      ...(socialLink || []),
      { value: '', error: '' },
    ]);
  };

  const removeLinkAtIndex = (index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks.splice(index, 1);
    setSocialLinks([...updatedSocialLinks]);
  };

  const validateSocialLinks = (): boolean => {
    const updatedSocialLinks = [...socialLinks];
    socialLinks.map((link, index) => {
      try {
        if (link.value.trim() !== '') {
          socialLinkValidation.parse(link.value);
        }

        updatedSocialLinks[index] = {
          ...updatedSocialLinks[index],
          error: '',
        };
      } catch (e: any) {
        const zodError = e as ZodError;
        updatedSocialLinks[index] = {
          ...updatedSocialLinks[index],
          error: zodError.errors[0].message,
        };
      }
    });

    setSocialLinks([...updatedSocialLinks]);

    return !!updatedSocialLinks.find((socialLink) => socialLink.error);
  };

  const updateAndValidateSocialLinkAtIndex = (value: string, index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks[index] = {
      ...updatedSocialLinks[index],
      value,
    };
    try {
      if (updatedSocialLinks[index].value.trim() !== '') {
        socialLinkValidation.parse(updatedSocialLinks[index].value);
      }

      updatedSocialLinks[index] = {
        ...updatedSocialLinks[index],
        error: '',
      };
    } catch (e: any) {
      const zodError = e as ZodError;
      updatedSocialLinks[index] = {
        ...updatedSocialLinks[index],
        error: zodError.errors[0].message,
      };
    }
    setSocialLinks([...updatedSocialLinks]);
  };

  const handleSubmit = async (values: FormSubmitValues) => {
    const hasLinksError = validateSocialLinks();
    if (isCommunityNameTaken || hasLinksError) return;
    values.links = socialLinks.map((link) => link.value).filter(Boolean);

    const selectedChainNode = chainTypes.find(
      (chain) => String(chain.value) === values.chain.value,
    );

    try {
      await createCommunityMutation({
        id: communityId,
        name: values.communityName,
        chainBase: selectedCommunity.chainBase,
        description: values.communityDescription,
        iconUrl: values.communityProfileImageURL,
        socialLinks: values.links,
        ...(selectedCommunity.chainBase === ChainBase.Ethereum && {
          ethChainId: values.chain.value,
        }),
        ...(selectedCommunity.chainBase === ChainBase.CosmosSDK && {
          cosmosChainId: values.chain.value,
        }),
        nodeUrl: selectedChainNode.nodeUrl,
        altWalletUrl: selectedChainNode.altWalletUrl,
        userAddress: selectedAddress.address,
        bech32Prefix: selectedCommunity.type === 'cosmos' ? 'osmo' : null,
      });
      onSubmit(communityId);
    } catch (err) {
      notifyError(err.response?.data?.error);
      console.log(err);
    }
  };

  const handleCancel = () => {
    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: 'Your details will not be saved. Cancel create community?',
      buttons: [
        {
          label: 'Yes, cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: onCancel,
        },
        {
          label: 'No, continue',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <CWForm
      validationSchema={basicInformationFormValidationSchema}
      onSubmit={handleSubmit}
      className="BasicInformationForm"
      initialValues={getInitialValue()}
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

      <CWSelectList
        name="chain"
        hookToForm
        isClearable={false}
        label="Select chain"
        placeholder="Select chain"
        isDisabled={
          selectedCommunity.type === CommunityType.Polygon ||
          selectedCommunity.type === CommunityType.Solana
        }
        options={getChainOptions()}
      />

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
      />

      <CWCoverImageUploader
        subheaderText="Community Profile Image (Accepts JPG and PNG files)"
        uploadCompleteCallback={console.log}
        canSelectImageBehaviour={false}
        showUploadAndGenerateText
        onImageProcessStatusChange={setIsProcessingProfileImage}
        name="communityProfileImageURL"
        hookToForm
        defaultImageBehaviour={ImageBehavior.Circle}
        enableGenerativeAI
      />

      <section className="header">
        <CWText type="h4">
          Community Links{' '}
          <CWText type="b1" className="optional-label">
            &#40;Optional&#41;
          </CWText>
        </CWText>
        <CWText type="b1" className="description">
          Add your Discord, Twitter (X), Telegram, Website, etc.
        </CWText>
      </section>

      {/* Social links */}
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
                updateAndValidateSocialLinkAtIndex(socialLink.value, index)
              }
              onFocus={() =>
                updateAndValidateSocialLinkAtIndex(socialLink.value, index)
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

      {/* Action buttons */}
      <section className="action-buttons">
        <CWButton
          type="button"
          label="Cancel"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={handleCancel}
        />
        <CWButton
          type="submit"
          buttonWidth="wide"
          label="Launch Community"
          disabled={createCommunityLoading || isProcessingProfileImage}
        />
      </section>
    </CWForm>
  );
};

export default BasicInformationForm;
