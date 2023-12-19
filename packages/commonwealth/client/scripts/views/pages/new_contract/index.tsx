/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChainBase } from '@hicommonwealth/core';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/new_contract/new_contract_page.scss';
import React from 'react';
import app from 'state';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import AddContractAndAbiForm from './add_contract_and_abi_form';

const NewContractPage = () => {
  const navigate = useCommonNavigate();
  // Payable functions are not supported in this implementation
  if (!app.contracts || !app.chain) {
    return <PageLoading message="General Contract" />;
  }

  if (app.chain.base !== ChainBase.Ethereum) {
    return (
      <PageNotFound message="Contract ABI UI Generator Only Available for Ethereum based Chains" />
    );
  }

  return (
    <div className="NewContractPage">
      <CWBreadcrumbs
        breadcrumbs={[
          { label: 'Contract action templates', path: `/contracts` },
          { label: 'Add contract and ABI', path: '' },
        ]}
      />
      <CWText type="h3" className="header">
        Add contract and ABI
      </CWText>
      <CWText className="subheader" type="b1">
        Add contracts and their corresponding ABI files to your community.
      </CWText>
      <CWDivider className="divider" />
      <AddContractAndAbiForm />
    </div>
  );
};

export default NewContractPage;
