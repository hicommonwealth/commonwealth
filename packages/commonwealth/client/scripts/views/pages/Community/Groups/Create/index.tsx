import React from 'react';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWRadioButton } from 'views/components/component_kit/cw_radio_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import TopicGatingHelpMessage from '../TopicGatingHelpMessage';
import './index.scss';

const CreateCommunityGroupPage = () => {
  return (
    <div className="CreateCommunityGroupPage">
      {/* TODO: add breadcrum here as a separate div when that ticket is done */}

      {/* Form header */}
      <div className="header-row">
        <CWText type="h2" fontWeight="semiBold" className="header-text">
          Create a group
        </CWText>
        <CWText type="b2">
          Create attributes-based groups for gating topics within your community
        </CWText>
      </div>

      {/* Basic information section */}
      <section className="form-section">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          Basic information
        </CWText>
        <CWTextInput label="Group name" placeholder="Group name" />
        <CWTextArea
          label="Description"
          placeholder="Add a description for your group"
        />
      </section>

      <CWDivider />

      {/* Requirements section */}
      <section className="form-section">
        <div className="header-row">
          <CWText type="h3" fontWeight="semiBold" className="header-text">
            Requirements
          </CWText>
          <CWText type="b2">Add requirements for access to gated topics</CWText>
        </div>

        {/* Sub-section: Necessary requirements */}
        <section className="form-section">
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="header-row header-text"
          >
            Necessary requirements
          </CWText>

          <div>
            <CWRadioButton value="All requirements must be satisfied" />
            {/* TODO: this is a tag input */}
            <CWRadioButton value="At least _ # of all requirements" />
          </div>

          <CWButton label="Add requirement" iconLeft="plus" />
        </section>

        {/* Sub-section: Gated topics */}
        <section className="form-section">
          <div className="header-row">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              Gated topic(s)
            </CWText>
            <CWText type="b2">
              Add topics to gate to auto-lock it for group members who satisfy
              the requirements above
            </CWText>
          </div>

          {/* TODO: this is a tag input */}
          <CWTextInput label="Topcis" placeholder="Type in topic name" />
        </section>
      </section>

      <TopicGatingHelpMessage />

      {/* Form action buttons */}
      <div className="action-buttons">
        <CWButton label="Back" />
        <CWButton label="Create group" buttonType="primary-black" />
      </div>
    </div>
  );
};

export default CreateCommunityGroupPage;
