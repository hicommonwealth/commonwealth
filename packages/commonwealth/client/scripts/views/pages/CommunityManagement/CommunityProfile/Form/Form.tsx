import { DefaultPage } from '@hicommonwealth/core';
import getLinkType from 'helpers/linkType';
import React from 'react';
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
import './Form.scss';
import {
  communityProfileValidationSchema,
  linkValidationSchema,
} from './validation';

const Form = () => {
  const { links, onLinkAdd, onLinkRemovedAtIndex, onLinkUpdatedAtIndex } =
    useLinksArray({
      initialLinks: [
        {
          value: '',
          canUpdate: true,
          canDelete: false,
          error: '',
        },
      ],
      linkValidation: linkValidationSchema,
    });

  return (
    <CWForm
      className="Form"
      validationSchema={communityProfileValidationSchema}
    >
      <section className="base-section">
        <CWTextInput
          fullWidth
          hookToForm
          name="communityName"
          label="Community Name"
          placeholder="Community Name"
          iconRight={
            <CWIcon weight="fill" className="lock-icon" iconName="lockedNew" />
          }
        />
        <CWTextInput
          disabled
          fullWidth
          label="Community URL"
          placeholder="Community URL"
        />
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
        />
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
          <CWText type="b1">Tags help new members find your community</CWText>
        </div>

        <div className="controls">
          <CWButton type="button" label="DeFi" buttonWidth="narrow" />
          <CWButton type="button" label="DAO" buttonWidth="narrow" />
        </div>
      </section>

      <section className="stages-section">
        <div className="header">
          <CWText type="h4">Stages</CWText>
          <CWText type="b1">
            <p>
              Show proposal progress on threads
              <CWToggle hookToForm size="large" name="hasStagesEnabled" />
            </p>
          </CWText>
        </div>

        <CWTextInput
          label="Custom stages"
          placeholder="[“Stage 1”, “Stage 2”]"
          name="customStages"
          fullWidth
          hookToForm
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
          <CWText type="b1">Select the landing page for your community</CWText>
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
        />
        <CWButton
          label="Save Changes"
          buttonWidth="narrow"
          buttonType="primary"
          type="submit"
        />
      </section>
    </CWForm>
  );
};

export default Form;
