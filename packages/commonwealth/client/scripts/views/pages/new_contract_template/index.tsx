/* @jsx m */

import 'pages/new_contract_template/new_contract_template_page.scss';
import app from 'state';
import m from 'mithril';
import ClassComponent from 'class_component';

import { ChainBase } from 'common-common/src/types';
import CreateContractTemplateForm from './create_contract_template_form';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';

class NewContractTemplatePage extends ClassComponent {
  view(vnode) {
    if (!app.contracts || !app.chain) {
      return <PageLoading title="Contract Template" />;
    }

    if (app.chain.base !== ChainBase.Ethereum) {
      return (
        <PageNotFound content="Contract Template Creation Only Available for Ethereum based Chains" />
      );
    }

    const scope = vnode.attrs.scope;

    return (
      <Sublayout>
        <div class="NewContractTemplatePage">
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Contracts', path: `${scope}/contracts` },
              { label: 'Create a New Template', path: '' },
            ]}
          />
          <CWText type="h3" className="header">
            Create a New Template
          </CWText>
          <CWText className="subheader" type="b1">
            Create a new template for your community to use.
          </CWText>
          <CWDivider className="divider" />
          <CreateContractTemplateForm />
        </div>
      </Sublayout>
    );
  }
}

export default NewContractTemplatePage;
