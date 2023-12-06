import React, { useState } from 'react';
import { CWCoverImageUploader } from 'views/components/component_kit/cw_cover_image_uploader';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { z } from 'zod';
import './BasicInformationForm.scss';

const BasicInformationForm = () => {
  const [socialLinks, setSocialLinks] = useState<any[]>([0]);

  const addLink = () => {
    setSocialLinks((x) => [...(x || []), x?.length || 1]);
  };

  const removeLinkAtIndex = (index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks.splice(index, 1);
    setSocialLinks([...updatedSocialLinks]);
  };

  return (
    <CWForm
      validationSchema={z.object({})} // TODO: add proper validation
      onSubmit={console.log} // TODO: connect api
      className="BasicInformationForm"
    >
      <section className="header">
        <CWText type="h2">Tell us about your community</CWText>
        <CWText type="b1" className="description">
          Let’s start with some basic information about your community
        </CWText>
      </section>

      {/* Form fields */}
      <CWTextInput
        label="Community Name"
        placeholder="Name your community"
        fullWidth
      />

      <CWSelectList
        isClearable={false}
        label="Select chain"
        placeholder="Select chain"
        options={[{ label: 'Solana', value: 'solana' }]}
      />

      <CWTextInput
        label="Community URL"
        placeholder="URL will appear when you name your community"
        fullWidth
        disabled
      />

      <CWTextArea
        label="Community Description"
        placeholder="Enter a description of your community or project"
      />

      {/* TODO: update image uploader styles and add upload button and handle preview related changes */}
      <CWCoverImageUploader
        subheaderText="Community Profile Image (Accepts JPG and PNG files)"
        uploadCompleteCallback={console.log}
        canSelectImageBehaviour={false}
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
            />
            <CWIconButton
              iconButtonTheme="neutral"
              iconName="trash"
              iconSize="large"
              onClick={() => removeLinkAtIndex(index)}
            />
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
        />
        <CWButton type="submit" buttonWidth="wide" label="Next" />
      </section>
    </CWForm>
  );
};

export default BasicInformationForm;
