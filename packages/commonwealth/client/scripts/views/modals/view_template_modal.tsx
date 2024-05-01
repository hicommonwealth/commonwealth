import React from 'react';

import { renderDisabledTemplate } from '../../helpers/action_template_helpers';
import Template from '../../models/Template';
import app from '../../state';
import { CWCommunityAvatar } from '../components/component_kit/cw_community_avatar';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { User } from '../components/user/user';

import '../../../styles/modals/view_template_modal.scss';
import Account from '../../models/Account';

const ViewTemplateModal = ({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) => {
  const creator: Account = template?.createdBy
    ? app.chain.accounts.get(template?.createdBy)
    : null;

  return (
    <div className="ViewTemplateModal">
      <CWModalHeader label="View template" onModalClose={onClose} />
      <CWModalBody>
        <div className="CreationRow">
          <CWText type="b2">By</CWText>
          <User
            userAddress={creator?.address}
            userCommunityId={creator?.community?.id || creator?.profile?.chain}
            shouldShowAsDeleted={
              !creator?.address &&
              !(creator?.community?.id || creator?.profile?.chain)
            }
            shouldShowAddressWithDisplayName
          />
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
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Close"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
      </CWModalFooter>
    </div>
  );
};

export default ViewTemplateModal;
