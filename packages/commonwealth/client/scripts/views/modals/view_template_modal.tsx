import React from 'react';
import { X } from '@phosphor-icons/react';

import Template from 'models/Template';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import app from 'state';
import { CWCommunityAvatar } from '../components/component_kit/cw_community_avatar';
import { User } from '../components/user/user';
import { CWDivider } from '../components/component_kit/cw_divider';
import { renderDisabledTemplate } from 'helpers/action_template_helpers';

import 'modals/view_template_modal.scss';

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
      <div className="compact-modal-title">
        <CWText className="title-text" type="h4">
          View template
        </CWText>
        <X className="close-icon" onClick={onClose} size={24} />
      </div>
      <div className="compact-modal-body">
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
            Template action detail
          </CWText>
          <CWText>{template.description}</CWText>
        </div>
        <div className="BlobContainer">
          <CWText type="caption" fontWeight="medium" className="labelText">
            JSON blob
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
      <div className="compact-modal-footer">
        <CWButton
          label="Close"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default ViewTemplateModal;
