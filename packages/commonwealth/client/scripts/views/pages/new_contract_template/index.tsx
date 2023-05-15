import React from 'react';
import 'new_contract_template/new_contract_template_page.scss';
import app from 'state';

import { ChainBase } from 'common-common/src/types';
import CreateContractTemplateForm from './create_contract_template_form';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../Sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { useCommonNavigate } from 'navigation/helpers';

const NewContractTemplatePage = () => {
  const navigate = useCommonNavigate();
  if (!app.contracts || !app.chain) {
    return <PageLoading message="Contract Template" />;
  }

  if (app.chain.base !== ChainBase.Ethereum) {
    return (
      <PageNotFound message="Contract Template Creation Only Available for Ethereum based Chains" />
    );
  }

  return (
    <Sublayout>
      <div className="NewContractTemplatePage">
        <CWBreadcrumbs
          breadcrumbs={[
            { label: 'Contract action templates', path: `/contracts` },
            { label: 'Create a new action template', path: '' },
          ]}
        />
        <CWText type="h3" className="header">
          Create a new action template
        </CWText>
        <div className="CommunityInfo">
          <CWText className="label" type="b2">
            {'Created in'}
          </CWText>
          <CWCommunityAvatar community={app.chain.meta} size="small" />
          <CWText type="b2" fontWeight="medium">
            {app.chain.meta.name}
          </CWText>
        </div>
        <CWDivider className="divider" />
        <CreateContractTemplateForm />
      </div>
    </Sublayout>
  );
};

export default NewContractTemplatePage;
