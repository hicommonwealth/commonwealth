import React, { useState } from 'react';

import { useNamespaceFactory } from 'client/scripts/views/pages/CreateCommunity/steps/CommunityOnchainTransactions';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import Hint from '../../../components/Hint';
import { NamespaceData } from '../types';
import { validationSchema } from './validations';

import './ConfirmNamespaceData.scss';

interface ConfirmNamespaceDataProps {
  communityNamespaceData: NamespaceData;
  chainId: string;
  backButton?: {
    label: string;
    action: () => void;
  };
  confirmButton?: {
    label: string;
    action: (data: NamespaceData) => void;
  };
}

const ConfirmNamespaceData = ({
  communityNamespaceData,
  chainId,
  backButton,
  confirmButton,
}: ConfirmNamespaceDataProps) => {
  const [namespaceError, setNamespaceError] = useState('');

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));

  const clearNamespaceError = () => {
    setNamespaceError('');
  };

  const handleSubmit = async (data: NamespaceData) => {
    try {
      clearNamespaceError();

      const isNamespaceAvailable =
        await namespaceFactory.checkNamespaceReservation(data.namespace);

      if (!isNamespaceAvailable) {
        return setNamespaceError('Namespace already exists');
      }

      confirmButton?.action(data);
    } catch (err) {
      console.log(err);
    }
  };

  const getInitialValue = () => {
    return {
      namespace: communityNamespaceData.namespace,
      symbol: communityNamespaceData.symbol,
    };
  };

  return (
    <div className="ConfirmNamespaceData">
      <section className="header">
        <CWText type="h2">Community Namespace and Symbol</CWText>
        <CWText type="b1" className="description">
          Before diving into onchain transactions, make sure your community
          registers a namespace. This essential step unlocks powerful onchain
          features on Common (including contests, weighted voting, and more)
          giving your community the tools to thrive in a decentralized
          ecosystem.
        </CWText>
        <CWText type="b1" className="description">
          Namespace and symbol must be unique on Common. Edit below.
        </CWText>

        <Hint className="mobile" />

        <CWForm
          id="communityStakeForm"
          className="form"
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          initialValues={getInitialValue()}
        >
          <CWTextInput
            rightTextAddon=".common.xyz"
            name="namespace"
            hookToForm
            label="Community Namespace"
            placeholder="namespace"
            fullWidth
            customError={namespaceError}
            onChange={clearNamespaceError}
          />

          <CWTextInput
            name="symbol"
            hookToForm
            label="Community Symbol"
            placeholder="COMM"
            fullWidth
          />
        </CWForm>

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label={backButton?.label}
            buttonWidth="wide"
            buttonType="secondary"
            onClick={backButton?.action}
          />
          <CWButton
            form="communityStakeForm"
            type="submit"
            buttonWidth="wide"
            label={confirmButton?.label}
          />
        </section>
      </section>

      <Hint className="desktop" />
    </div>
  );
};

export default ConfirmNamespaceData;
