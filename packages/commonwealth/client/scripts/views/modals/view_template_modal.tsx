import React from 'react';

import { renderDisabledTemplate } from 'helpers/action_template_helpers';
import 'modals/view_template_modal.scss';
import Template from 'models/Template';
import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCommunityAvatar } from '../components/component_kit/cw_community_avatar';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { User } from '../components/user/user';

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
          View template
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
          <User
            userAddress={creator.address}
            userChainId={creator.chain?.id || creator?.profile?.chain}
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
