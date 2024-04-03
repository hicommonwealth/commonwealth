import Contract from 'models/Contract';
import Template from 'models/Template';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import Account from '../../../models/Account';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { User } from '../../components/user/user';
import ViewTemplateModal from '../../modals/view_template_modal';

export const TemplateDisplayTab = ({
  contracts,
  noContractsAlertDisplayed,
  setNoContractsAlertDisplayed,
  templates,
  handleDeleteTemplate,
}: {
  contracts: Contract[];
  noContractsAlertDisplayed: boolean;
  setNoContractsAlertDisplayed: (val: boolean) => void;
  templates: Template[];
  handleDeleteTemplate: (template: Template) => void;
}) => {
  const navigate = useCommonNavigate();

  const [viewTemplateModalOpen, setViewTemplateModalOpen] = useState(false);
  const [mountedTemplate, setMountedTemplate] = useState<Template>(null);

  return (
    <div className="template-display-section">
      <CWModal
        size="medium"
        content={
          <ViewTemplateModal
            template={mountedTemplate}
            onClose={() => {
              setViewTemplateModalOpen(false);
              setMountedTemplate(null);
            }}
          />
        }
        open={viewTemplateModalOpen}
        onClose={() => {
          setViewTemplateModalOpen(false);
          setMountedTemplate(null);
        }}
      />
      {contracts.length === 0 && noContractsAlertDisplayed && (
        <div className="no-contract-alert">
          <div className="information">
            <CWIcon iconName="infoEmpty" />
            <CWText className="info-text">
              Make sure you have connected a contract in order to see compatible
              action templates and to create your own action templates.
            </CWText>
          </div>
          <CWIcon
            iconName="close"
            iconSize="small"
            className="closeIcon"
            onClick={() => {
              setNoContractsAlertDisplayed(false);
            }}
          />
        </div>
      )}
      <div className="Table">
        <div className="table-row dark top">
          <div className="table-column">
            <CWText fontWeight="medium" type="caption" className="ColumnText">
              TEMPLATE NAME
            </CWText>
          </div>
          <div className="table-column">
            <CWText fontWeight="medium" type="caption" className="ColumnText">
              CREATED BY
            </CWText>
          </div>
          <div className="table-column">
            <CWText fontWeight="medium" type="caption" className="ColumnText">
              CREATED IN
            </CWText>
          </div>
        </div>
        {templates.length > 0 ? (
          templates.map((template, index) => {
            const creator: Account = app.chain.accounts.get(template.createdBy);
            return (
              <div className="table-row" key={index}>
                <div className="table-column">
                  <CWText>{template.name}</CWText>
                </div>
                <div className="table-column">
                  <User
                    userAddress={creator.address}
                    userCommunityId={
                      creator.community?.id || creator?.profile?.chain
                    }
                    shouldShowAddressWithDisplayName
                  />
                </div>
                <div className="table-column">
                  <div className="IconGroup">
                    <CWCommunityAvatar
                      community={app.config.chains.getById(
                        template.createdForCommunity,
                      )}
                      size="small"
                    />
                    <CWText type="caption" fontWeight="bold">
                      {
                        app.config.chains.getById(template.createdForCommunity)
                          .name
                      }
                    </CWText>
                  </div>
                </div>
                <div className="table-column">
                  <div className="IconGroup">
                    <PopoverMenu
                      renderTrigger={(onclick) => (
                        <CWIconButton
                          iconName="dots"
                          iconSize="small"
                          onClick={onclick}
                        />
                      )}
                      menuItems={[
                        {
                          label: 'Delete',
                          iconLeft: 'trash',
                          onClick: () => {
                            handleDeleteTemplate(template);
                          },
                        },
                      ]}
                    />
                    <CWIconButton
                      iconName="views"
                      iconSize="small"
                      onClick={() => {
                        setMountedTemplate(template);
                        setViewTemplateModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <CWText type="b1" className="EmptyTemplate">
              You currently have no action templates in your library.
            </CWText>
          </div>
        )}
      </div>
      <CWButton
        className="add-template-btn"
        buttonType="tertiary"
        label="Create template"
        iconLeft="plus"
        onClick={() => navigate('/new/contract_template/blank')}
      />
    </div>
  );
};
