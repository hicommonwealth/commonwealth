import React from 'react';

import moment from 'moment';
import app from 'state';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import {
  displayOptions,
  ManageContractTemplateModalProps,
} from 'views/modals/manage_contract_template_modal';

import 'pages/contracts/contract_template_card.scss';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { User } from '../../components/user/user';

type ContractTemplateCardProps = {
  contractId: number;
  id: number;
  title: string;
  displayName: string;
  nickname: string;
  slug: string;
  display: string;
  cctmd_id: number;
  cct_id: number;
  enabledBy: string;
  enabledAt: Date;
  onUpdateSuccess: () => void;
  handleShowModal: (
    templateId: number,
    cct_id: number,
    template: Omit<
      ManageContractTemplateModalProps['template'],
      'id' | 'title'
    >,
  ) => void;
};

interface InfoOrder {
  key: keyof ContractTemplateCardProps;
  label: string;
}

const infosOrder: InfoOrder[] = [
  { key: 'nickname', label: 'Action details' },
  { key: 'slug', label: 'Slug' },
  { key: 'display', label: 'Display' },
  { key: 'enabledBy', label: 'Enabled by' },
];

const parseDisplayOption = (displayOption: string) => {
  return displayOptions.find((option) => option.value === displayOption)?.label;
};

export const ContractTemplateCard = ({
  title,
  contractId,
  cctmd_id,
  id: templateId,
  cct_id,
  handleShowModal,
  onUpdateSuccess,
  ...templateInfo
}: ContractTemplateCardProps) => {
  const handleEditTemplate = async () => {
    handleShowModal(templateId, cct_id, templateInfo);
  };

  const handleDeleteTemplate = () => {
    openConfirmation({
      title: 'Delete Action',
      description: (
        <>
          Deleting this action is permanent. Are you sure you want to proceed?
        </>
      ),
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            await app.contracts.deleteCommunityContractTemplate({
              contract_id: contractId,
              template_id: templateId,
              cctmd_id,
            });
            onUpdateSuccess();
          },
        },
        {
          label: 'Cancel',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const enabler = templateInfo?.enabledBy
    ? app.chain.accounts.get(templateInfo?.enabledBy)
    : null;
  const enabledOn = moment(templateInfo.enabledAt).format('MM/DD/YY');

  return (
    <CWCard fullWidth className="ContractTemplateCard">
      <div className="header">
        <CWText type="h5" className="title">
          {title}
        </CWText>
        <PopoverMenu
          renderTrigger={(onclick) => (
            <CWIconButton iconName="dotsVertical" onClick={onclick} />
          )}
          menuItems={[
            {
              label: 'Edit Template',
              iconLeft: 'write',
              onClick: handleEditTemplate,
            },
            {
              label: 'Delete',
              iconLeft: 'trash',
              onClick: handleDeleteTemplate,
            },
          ]}
        />
      </div>
      <div className="contract-info-container">
        {infosOrder.map((info) => {
          if (!templateInfo[info.key]) {
            return null;
          }

          if (info.key === 'enabledBy')
            return (
              <div className="info-row" key={info.label}>
                <CWText type="b2" className="row-label">
                  {info.label}
                </CWText>
                <div className="enabledby-row">
                  <User
                    userAddress={enabler?.address}
                    userCommunityId={
                      enabler?.community?.id || enabler?.profile?.chain
                    }
                    shouldShowAsDeleted={
                      !enabler?.address &&
                      !(enabler?.community?.id || enabler?.profile?.chain)
                    }
                    shouldShowAddressWithDisplayName
                  />
                  <div className="text-group">
                    <CWText type="caption">on</CWText>
                    <CWText type="caption" fontWeight="medium">
                      {enabledOn}
                    </CWText>
                  </div>
                  <div className="text-group">
                    <CWText type="caption">for</CWText>
                    <CWCommunityAvatar
                      community={app.chain.meta}
                      size="small"
                    />
                    <CWText type="caption" fontWeight="medium">
                      {app.chain.meta.name}
                    </CWText>
                  </div>
                </div>
              </div>
            );

          return (
            <div className="info-row" key={info.label}>
              <CWText type="b2" className="row-label">
                {info.label}
              </CWText>
              <CWText type="b2" className="row-value">
                {info.key === 'display'
                  ? parseDisplayOption(templateInfo.display)
                  : templateInfo[info.key]}
              </CWText>
            </div>
          );
        })}
      </div>
    </CWCard>
  );
};
