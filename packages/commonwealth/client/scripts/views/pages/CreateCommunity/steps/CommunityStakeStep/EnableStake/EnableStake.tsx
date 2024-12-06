import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import Hint from '../../../components/Hint';
import { EnableStakeProps, StakeData } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';
import { validationSchema } from './validations';

import { DOCS_SUBDOMAIN } from '@hicommonwealth/shared';
import './EnableStake.scss';

const EnableStake = ({
  communityStakeData,
  chainId,
  onlyNamespace,
  backButton,
  confirmButton,
}: EnableStakeProps) => {
  const [namespaceError, setNamespaceError] = useState('');

  const { namespaceFactory } = useNamespaceFactory(parseInt(chainId));

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

      confirmButton?.action(data);
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
        <CWText type="h2">
          {onlyNamespace
            ? 'Register a Namespace for your community'
            : 'Do you want to enable community stake?'}
        </CWText>
        <CWText type="b1" className="description">
          {onlyNamespace ? (
            <>
              Registering your Namespace onchain will enable you to utilize
              onchain features on Common such as contests and weighted voting
            </>
          ) : (
            <>
              Community stake allows your community to fundraise via member
              contributions. Community members can make financial contributions
              in exchange for more voting power within the community. The more
              stake a member has, the stronger their vote becomes. The funds are
              stored in a secure community wallet on-chain and can be
              redistributed if members decide to burn their stake.
            </>
          )}
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

        {!onlyNamespace && (
          <CWText className="info" fontWeight="medium">
            Not sure?
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://${DOCS_SUBDOMAIN}/commonwealth/community-overview/community-stake`}
            >
              Learn more about community stake
            </a>
          </CWText>
        )}

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

export default EnableStake;
