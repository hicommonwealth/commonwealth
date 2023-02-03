/* @jsx jsx */

import 'pages/new_contract/new_contract_page.scss';
import app from 'state';
import { ClassComponent, jsx } from 'mithrilInterop';
import { ChainBase } from 'common-common/src/types';
import AddContractAndAbiForm from './add_contract_and_abi_form';
import PageNotFound from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';

class NewContractPage extends ClassComponent {
  view(vnode) {
    // Payable functions are not supported in this implementation
    if (!app.contracts || !app.chain) {
      return <PageLoading message="General Contract" />;
    }

    if (app.chain.base !== ChainBase.Ethereum) {
      return (
        <PageNotFound message="Contract ABI UI Generator Only Available for Ethereum based Chains" />
      );
    }

    const scope = vnode.attrs.scope;

    return (
      <Sublayout>
        <div className="NewContractPage">
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Contracts', path: `${scope}/contracts` },
              { label: 'Add Contract and ABI', path: '' },
            ]}
          />
          <CWText type="h3" className="header">
            Add Contract and ABI
          </CWText>
          <CWText className="subheader" type="b1">
            Add contracts and their corresponding ABI files to your community.
          </CWText>
          <CWDivider className="divider" />
          <AddContractAndAbiForm />
        </div>
      </Sublayout>
    );
  }
}

export default NewContractPage;
