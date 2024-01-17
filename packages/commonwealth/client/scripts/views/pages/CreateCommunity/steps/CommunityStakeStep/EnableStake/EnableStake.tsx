import React from 'react';
import { z } from 'zod';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import CreateCommunityHint from '../../../components/CreateCommunityHint';

import './EnableStake.scss';

const validationSchema = z.object({
  namespace: z.string().min(1, 'Namespace is required'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(9, 'Symbol should be maximum 9 characters'),
});

type StakeData = {
  symbol: string;
  namespace: string;
};

interface EnableStakeProps {
  onOptOutEnablingStake: () => void;
  onOptInEnablingStake: ({ namespace, symbol }: StakeData) => void;
  communityStakeData: StakeData;
}

const EnableStake = ({
  onOptOutEnablingStake,
  onOptInEnablingStake,
  communityStakeData,
}: EnableStakeProps) => {
  const handleSubmit = (data: StakeData) => {
    onOptInEnablingStake({
      namespace: data.namespace,
      symbol: data.symbol,
    });
  };

  const getInitialValue = () => {
    return {
      namespace: communityStakeData.namespace,
      symbol: communityStakeData.symbol,
    };
  };

  const renderHint = (className: string) => (
    <CreateCommunityHint
      className={className}
      title="What is a namespace?"
      hint="The namespace is an address that represents your community  on-chain.
          You can purchase additional community namespaces from the admin panel."
    />
  );

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

        {renderHint('mobile')}

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
            onClick={onOptOutEnablingStake}
          />
          <CWButton
            form="communityStakeForm"
            type="submit"
            buttonWidth="wide"
            label="Yes"
          />
        </section>
      </section>

      {renderHint('desktop')}
    </div>
  );
};

export default EnableStake;
