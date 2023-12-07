import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'utils';
import { CWCoverImageUploader } from 'views/components/component_kit/cw_cover_image_uploader';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { chainTypes } from 'views/pages/Community/common/constants';
import { ZodError } from 'zod';
import './BasicInformationForm.scss';
import { POLOGON_CHAIN_OPTION, existingCommunityNames } from './constants';
import {
  BasicInformationFormProps,
  FormSubmitValues,
  SocialLinkField,
} from './types';
import {
  basicInformationFormValidationSchema,
  socialLinkValidation,
} from './validation';

const BasicInformationForm = ({
  chainEcosystem,
  onSubmit,
  onCancel,
}: BasicInformationFormProps) => {
  const [communityName, setCommunityName] = useState('');
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinkField[]>([
    {
      value: '',
      error: '',
    },
  ]);
  const isCommunityNameTaken = existingCommunityNames.find(
    (name) => name === communityName.trim().toLowerCase(),
  );

  const getChainOptions = () => {
    // Since we are treating polygon as an ecosystem, we will only have a single option, which will be
    // preselected and further input's will be disabled
    if (chainEcosystem === 'polygon') {
      return [POLOGON_CHAIN_OPTION];
    }

    return chainTypes
      .filter(
        (x) =>
          x.chainBase === (chainEcosystem === 'cosmos' ? 'cosmos' : 'ethereum'),
      )
      .map((chainType) => ({
        label: chainType.label,
        value: `${chainType.value}`,
      }));
  };

  const addLink = () => {
    setSocialLinks((x) => [...(x || []), { value: '', error: '' }]);
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
        const schema = socialLinkValidation;
        if (link.value.trim() !== '') {
          schema.parse(link.value);
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

    return !!updatedSocialLinks.find((x) => x.error);
  };

  const updateAndValidateSocialLinkAtIndex = (value: string, index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks[index] = {
      ...updatedSocialLinks[index],
      value,
    };
    try {
      const schema = socialLinkValidation;
      if (updatedSocialLinks[index].value.trim() !== '') {
        schema.parse(updatedSocialLinks[index].value);
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

    await onSubmit(values);
  };

  return (
    <CWForm
      validationSchema={basicInformationFormValidationSchema}
      onSubmit={handleSubmit}
      className="BasicInformationForm"
      initialValues={{
        ...(chainEcosystem === 'polygon' && { chain: POLOGON_CHAIN_OPTION }),
      }}
    >
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let’s start with some basic information about your community
        </CWText>
      </section>

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
        isDisabled={chainEcosystem === 'polygon'}
        options={getChainOptions()}
      />

      <CWTextInput
        label="Community URL"
        placeholder="URL will appear when you name your community"
        fullWidth
        disabled
        value={
          communityName
            ? `${window.location.origin}/${slugifyPreserveDashes(
                communityName.toLowerCase(),
              )}`
            : ''
        }
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
        showUploadImageButton
        onUploadStatusChange={setIsUploadingProfileImage}
        name="communityProfileImageURL"
        hookToForm
      />

      <section className="header">
        <CWText type="h4">Community Links</CWText>
        <CWText type="b1" className="description">
          Add your Discord, Twitter (X), Telegram, Website, etc.
        </CWText>
      </section>

      {/* Social links */}
      <section className="social-links">
        <CWText type="caption">Social Links</CWText>

        {socialLinks.map((x, index) => (
          <div className="link-input-container" key={index}>
            <CWTextInput
              containerClassName="w-full"
              placeholder="https://example.com"
              fullWidth
              value={x.value}
              customError={x.error}
              onInput={(e) =>
                updateAndValidateSocialLinkAtIndex(
                  e.target.value?.trim(),
                  index,
                )
              }
              onBlur={() => updateAndValidateSocialLinkAtIndex(x.value, index)}
              onFocus={() => updateAndValidateSocialLinkAtIndex(x.value, index)}
            />
            {index > 0 && (
              <CWIconButton
                iconButtonTheme="neutral"
                iconName="trash"
                iconSize="large"
                onClick={() => removeLinkAtIndex(index)}
              />
            )}
          </div>
        ))}

        <button type="button" className="add-link-button" onClick={addLink}>
          + Add social link
        </button>
      </section>

      {/* Intentional: for extra space */}
      <div />

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
          label="Next"
          disabled={isUploadingProfileImage}
        />
      </section>
    </CWForm>
  );
};

export default BasicInformationForm;
