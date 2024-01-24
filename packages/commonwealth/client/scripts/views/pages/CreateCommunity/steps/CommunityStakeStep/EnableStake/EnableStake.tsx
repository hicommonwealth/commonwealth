import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import Hint from '../../../components/Hint';
import useNamespaceFactory from '../useNamespaceFactory';
import { EnableStakeProps, StakeData } from './types';
import { validationSchema } from './validations';

import './EnableStake.scss';

const EnableStake = ({
  goToSuccessStep,
  onOptInEnablingStake,
  communityStakeData,
}: EnableStakeProps) => {
  const [namespaceError, setNamespaceError] = useState('');

  const { namespaceFactory } = useNamespaceFactory();

  const clearNamespaceError = () => {
    setNamespaceError('');
  };

  const handleSubmit = async (data: StakeData) => {
    try {
      clearNamespaceError();

      const isNamespaceAvailable =
        await namespaceFactory.checkNamespaceReservation(data.namespace);

      if (!isNamespaceAvailable) {
        return setNamespaceError('Namespace already exists');
      }

      onOptInEnablingStake({
        namespace: data.namespace,
        symbol: data.symbol,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const getInitialValue = () => {
    return {
      namespace: communityStakeData.namespace,
      symbol: communityStakeData.symbol,
    };
  };

  return (
    <div className="EnableStake">
      <section className="header">
        <CWText type="h2">Do you want to enable community stake?</CWText>
        <CWText type="b1" className="description">
          Community stake allows your community to fundraise via member
          contributions. Community members can make financial contributions in
          exchange for more voting power within the community. The more stake a
          member has, the stronger their vote becomes. The funds are stored in a
          secure community wallet on-chain and can be redistributed if members
          decide to burn their stake.
        </CWText>

        <Hint className="mobile" />

        <CWText type="b1" className="description">
          Namespace and symbol must be unique on Common. Edit below.
        </CWText>

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

        <CWText className="info" fontWeight="medium">
          Not sure?
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://commonwealth.im"
          >
            Learn more about community stake
          </a>
        </CWText>

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="No"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={goToSuccessStep}
          />
          <CWButton
            form="communityStakeForm"
            type="submit"
            buttonWidth="wide"
            label="Yes"
          />
        </section>
      </section>

      <Hint className="desktop" />
    </div>
  );
};

export default EnableStake;
