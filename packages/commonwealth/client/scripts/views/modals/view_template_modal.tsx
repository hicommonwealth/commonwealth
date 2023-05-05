import React, { useEffect, useState } from 'react';

import Template from 'models/Template';
import 'modals/view_template_modal.scss';
import { CWText } from '../components/component_kit/cw_text';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../components/component_kit/cw_button';
import app from 'state';
import { CWCommunityAvatar } from '../components/component_kit/cw_community_avatar';
import { User } from '../components/user/user';
import { TemplateComponents } from '../pages/view_template/view_template';
import validateType from 'client/scripts/helpers/validateTypes';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { renderDisabledTemplate } from 'helpers/action_template_helpers';

const ViewTemplateModal = ({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) => {
  const creator = app.chain.accounts.get(template.createdBy);

  return (
    <div className="ViewTemplateModal">
      <div className="TopSection">
        <CWText type="h4" fontWeight="bold">
          View Template
        </CWText>
        <CWIcon
          iconName="close"
          iconSize="small"
          className="closeIcon"
          onClick={onClose}
        />
      </div>
      <div className="Body">
        <div className="CreationRow">
          <CWText type="b2">By</CWText>
          <User user={creator} showAddressWithDisplayName />
          <CWText type="b2">•</CWText>
          <CWText type="b2">Created in</CWText>
          <CWCommunityAvatar
            community={app.config.chains.getById(template.createdForCommunity)}
            size="small"
          />
        </div>
        <div className="LabelRow">
          <CWText type="caption" fontWeight="medium" className="labelText">
            Template name
          </CWText>
          <CWText>{template.name}</CWText>
        </div>
        <div className="LabelRow">
          <CWText type="caption" fontWeight="medium" className="labelText">
            Template Action Detail
          </CWText>
          <CWText>{template.description}</CWText>
        </div>
        <div className="BlobContainer">
          <CWText type="caption" fontWeight="medium" className="labelText">
            JSON Blob
          </CWText>
          <pre className="Blob">
            <CWText type="b2">
              {JSON.stringify(JSON.parse(template.template), null, 2)}
            </CWText>
          </pre>
          <CWDivider className="BlobDivider" />
        </div>
        <div className="TemplateDisplay">
          <CWText type="caption" fontWeight="medium" className="labelText">
            Template form preview
          </CWText>
          <div className="Template">
            {renderDisabledTemplate(JSON.parse(template.template).form_fields)}
          </div>
        </div>
      </div>

      <div className="BottomSection">
        <CWButton
          label="Close"
          buttonType="secondary-black"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default ViewTemplateModal;
