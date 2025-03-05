import React, { useState } from 'react';

import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError } from 'controllers/app/notifications';
import { weightedVotingValueToLabel } from 'helpers';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useUpdateContestMutation from 'state/api/contests/updateContest';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { SelectList } from 'views/components/component_kit/cw_select_list';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import TokenFinder, { useTokenFinder } from 'views/components/TokenFinder';
import { openConfirmation } from 'views/modals/confirmation_modal';
import CommunityManagementLayout from 'views/pages/CommunityManagement/common/CommunityManagementLayout';

import { BLOG_SUBDOMAIN } from '@hicommonwealth/shared';
import { CONTEST_FAQ_URL } from '../../../utils';
import {
  ContestFeeType,
  ContestFormData,
  ContestFormValidationSubmitValues,
  ContestRecurringType,
  LaunchContestStep,
} from '../../types';
import ContestTopicDescription from './ContestTopicDescription';
import CustomContestTopicOption from './CustomContestTopicOption';
import './DetailsFormStep.scss';
import PayoutRow from './PayoutRow';
import {
  contestDurationOptions,
  createNewTopicOption,
  INITIAL_PERCENTAGE_VALUE,
  initialContestDuration,
  initialPayoutStructure,
  MAX_WINNERS,
  MIN_WINNERS,
  prizePercentageOptions,
} from './utils';
import { detailsFormValidationSchema } from './validation';

interface DetailsFormStepProps {
  contestAddress?: string;
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
  contestFormData: ContestFormData;
  onSetContestFormData: (data: ContestFormData) => void;
  isFarcasterContest: boolean;
}

const DetailsFormStep = ({
  contestAddress,
  onSetLaunchContestStep,
  contestFormData,
  onSetContestFormData,
  isFarcasterContest,
}: DetailsFormStepProps) => {
  const navigate = useCommonNavigate();
  const farcasterContestEnabled = useFlag('farcasterContest');

  const [payoutStructure, setPayoutStructure] = useState<
    ContestFormData['payoutStructure']
  >(contestFormData?.payoutStructure || initialPayoutStructure);
  const [prizePercentage, setPrizePercentage] = useState<
    ContestFormData['prizePercentage']
  >(contestFormData?.prizePercentage || INITIAL_PERCENTAGE_VALUE);
  const [contestDuration, setContestDuration] = useState<number | undefined>(
    contestFormData?.contestDuration || initialContestDuration,
  );

  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [voteWeightMultiplier, setVoteWeightMultiplier] = useState(1);

  const { mutateAsync: updateContest } = useUpdateContestMutation();

  const {
    tokenValue,
    setTokenValue,
    getTokenError,
    debouncedTokenValue,
    tokenMetadata,
    tokenMetadataLoading,
  } = useTokenFinder({
    nodeEthChainId: app.chain.meta.ChainNode?.eth_chain_id || 0,
    initialTokenValue: contestFormData?.fundingTokenAddress,
  });

  const communityId = app.activeChainId() || '';
  const { data: topicsData } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const editMode = !!contestAddress;
  const payoutRowError = payoutStructure.some((payout) => payout < 1);
  const totalPayoutPercentage = payoutStructure.reduce(
    (acc, val) => acc + val,
    0,
  );
  const totalPayoutPercentageError = totalPayoutPercentage !== 100;

  const weightedTopics = (topicsData || [])
    .filter((t) => t?.weighted_voting)
    .map((t) => ({
      value: t.id,
      label: t.name,
      weightedVoting: t.weighted_voting,
      helpText: weightedVotingValueToLabel(t.weighted_voting!),
      tokenAddress: t.token_address,
    }));

  const getInitialValues = () => {
    return {
      contestName: contestFormData?.contestName,
      contestTopic: weightedTopics.find(
        (t) => t.value === contestFormData?.contestTopic?.value,
      ),
      contestDescription: contestFormData?.contestDescription,
      contestImage: contestFormData?.contestImage,
      feeType:
        contestFormData?.feeType ||
        (isFarcasterContest
          ? ContestFeeType.DirectDeposit
          : ContestFeeType.CommunityStake),
      fundingTokenAddress: contestFormData?.fundingTokenAddress,
      contestRecurring:
        contestFormData?.contestRecurring ||
        (isFarcasterContest
          ? ContestRecurringType.No
          : ContestRecurringType.Yes),
    };
  };

  const handleAddWinner = () => {
    setPayoutStructure((prevState) => [...prevState, 0]);
  };

  const handleRemoveWinner = () => {
    setPayoutStructure((prevState) => [...prevState.slice(0, -1)]);
  };

  const goBack = () => {
    navigate('/manage/contests');
  };

  const handleCancel = () => {
    openConfirmation({
      title: 'You have unsaved changes',
      description:
        'Are you sure you want to exit? Your contest will not be launched and your changes will not be saved.',
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: 'Exit',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: goBack,
        },
      ],
    });
  };

  const schema = detailsFormValidationSchema(isFarcasterContest);

  const handleSubmit = async (values: ContestFormValidationSubmitValues) => {
    if (totalPayoutPercentageError || payoutRowError) {
      return;
    }

    const selectedTopic = (weightedTopics || []).find(
      (t) => t.value === values?.contestTopic?.value,
    );
    const feeType =
      farcasterContestEnabled && isFarcasterContest
        ? ContestFeeType.DirectDeposit
        : selectedTopic?.weightedVoting === TopicWeightedVoting.ERC20
          ? ContestFeeType.DirectDeposit
          : ContestFeeType.CommunityStake;

    const contestRecurring =
      farcasterContestEnabled && isFarcasterContest
        ? ContestRecurringType.No
        : selectedTopic?.weightedVoting === TopicWeightedVoting.ERC20
          ? ContestRecurringType.No
          : ContestRecurringType.Yes;

    const formData: ContestFormData = {
      contestName: values.contestName,
      contestDescription: values.contestDescription,
      contestImage: values.contestImage,
      fundingTokenAddress: values.fundingTokenAddress,
      contestTopic: selectedTopic!,
      contestRecurring,
      feeType,
      prizePercentage,
      payoutStructure,
      contestDuration,
      isFarcasterContest,
      voteWeightMultiplier,
    };

    if (editMode) {
      try {
        await updateContest({
          community_id: app.activeChainId() || '',
          contest_address: contestAddress,
          name: values.contestName,
          image_url: values.contestImage,
          description: values.contestDescription,
        });

        goBack();
      } catch (error) {
        console.log(error);
        notifyError('Failed to edit contest');
      }
    } else {
      onSetContestFormData(formData);
      onSetLaunchContestStep('SignTransactions');
    }
  };

  return (
    <CommunityManagementLayout
      title={editMode ? 'Edit your contest' : 'Launch a Contest'}
      description={
        editMode ? (
          <>
            <CWText className="contest-description">
              Your contest is live and the smart contract settings cannot be
              changed. <a href={BLOG_SUBDOMAIN}>Learn more</a>
            </CWText>
          </>
        ) : (
          <>
            <CWText className="contest-description">
              Launch a contest using the funds from your community wallet to
              create engagement incentives.{' '}
              <CWText fontWeight="medium">
                Contests can be anywhere from 1 to 7 days in duration.
              </CWText>{' '}
              <a
                href={CONTEST_FAQ_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Learn more
              </a>
            </CWText>
          </>
        )
      }
      featureHint={{
        title: 'How do I fund my contest?',
        description:
          'Contests can be funded directly using any token that is on the same chain as your community.',
      }}
    >
      <div className="DetailsFormStep">
        <CWForm
          validationSchema={schema}
          onSubmit={handleSubmit}
          initialValues={getInitialValues()}
          onErrors={(err) => console.warn('FORM ERRORS: ', err)}
        >
          {({ watch, setValue }) => (
            <>
              {!isFarcasterContest && (
                <div className="contest-section contest-section-topic">
                  <CWText type="h4">Choose a topic</CWText>
                  <CWText type="b1">
                    Choose a topic for the contest to live in. Only threads
                    posted to this topic will be part of the contest.
                  </CWText>

                  <CWSelectList
                    hookToForm
                    name="contestTopic"
                    placeholder="Select topic"
                    isClearable={false}
                    isSearchable={false}
                    options={[...weightedTopics, createNewTopicOption]}
                    isDisabled={editMode}
                    components={{
                      Option: (originalProps) =>
                        CustomContestTopicOption({
                          originalProps,
                        }),
                    }}
                    onChange={(t) => {
                      if (t?.value === 'create-new') {
                        return navigate('/manage/topics');
                      }

                      if (t?.weightedVoting === TopicWeightedVoting.ERC20) {
                        const token = topicsData?.find(
                          (topic) => topic.id === t.value,
                        )?.token_address;
                        setTokenValue(token || '');
                        setValue('feeType', ContestFeeType.DirectDeposit);
                        setValue('contestRecurring', ContestRecurringType.No);
                      } else {
                        setValue('feeType', ContestFeeType.CommunityStake);
                        setValue('contestRecurring', ContestRecurringType.Yes);
                      }
                    }}
                  />
                  <ContestTopicDescription
                    topic={watch('contestTopic')}
                    topicsData={topicsData}
                  />
                </div>
              )}

              <div className="contest-section contest-section-name">
                <CWText type="h4">Name your contest</CWText>
                <CWText type="b1">
                  We recommend naming your contest if you&apos;re going to have
                  multiple contest
                </CWText>
                <CWTextInput
                  containerClassName="contest-name-input"
                  name="contestName"
                  hookToForm
                  placeholder="Give your contest a name"
                  fullWidth
                  label="Contest Name"
                />
              </div>

              {farcasterContestEnabled && isFarcasterContest && (
                <div className="contest-section contest-section-description">
                  <CWText type="h4">
                    Describe your contest<CWText type="b1"> (optional)</CWText>
                  </CWText>
                  <CWText type="b1">
                    Give your contest a short description to entice users to
                    enter
                  </CWText>
                  <CWTextArea
                    hookToForm
                    name="contestDescription"
                    placeholder="Enter contest description"
                  />
                </div>
              )}

              <div className="contest-section contest-section-image">
                <CWText type="h4">
                  Featured image<CWText type="b1">(optional)</CWText>
                </CWText>
                <CWText type="b1">
                  Set an image to entice users to your contest (1920x1080 jpg or
                  png)
                </CWText>
                <CWImageInput
                  canSelectImageBehavior={false}
                  onImageProcessingChange={({ isGenerating, isUploading }) =>
                    setIsProcessingProfileImage(isGenerating || isUploading)
                  }
                  name="contestImage"
                  hookToForm
                  imageBehavior={ImageBehavior.Fill}
                  withAIImageGeneration
                />
              </div>

              <CWDivider />

              {weightedTopics.find(
                (t) => t.value === watch('contestTopic')?.value,
              )?.weightedVoting === TopicWeightedVoting.ERC20 ? (
                <>
                  <div className="contest-section contest-section-funding">
                    <CWText type="h4">Contest Funding</CWText>
                    <CWText type="b1">
                      Enter the token address to set as your funding method.
                    </CWText>
                  </div>

                  <CWText type="h4">Token address</CWText>

                  <TokenFinder
                    debouncedTokenValue={debouncedTokenValue}
                    tokenMetadataLoading={tokenMetadataLoading}
                    tokenMetadata={tokenMetadata}
                    tokenValue={
                      editMode
                        ? contestFormData?.fundingTokenAddress || ''
                        : tokenValue
                    }
                    setTokenValue={setTokenValue}
                    tokenError={getTokenError(
                      watch('contestRecurring') === ContestRecurringType.No,
                    )}
                    containerClassName="funding-token-address-input"
                    name="fundingTokenAddress"
                    hookToForm
                    placeholder="Enter funding token address"
                    fullWidth
                    label="Token Address"
                    disabled={editMode}
                  />
                </>
              ) : weightedTopics.find(
                  (t) => t.value === watch('contestTopic')?.value,
                )?.weightedVoting === TopicWeightedVoting.Stake ? (
                <>
                  <div className="contest-section contest-section-funding">
                    <CWText type="h4">Contest Funding</CWText>
                    <CWText type="b1">
                      Set the amount of community stake you want to allocate for
                      your contest.
                    </CWText>

                    <div className="prize-subsection">
                      <CWText type="h5">
                        How much of the funds would you like to use weekly?
                      </CWText>
                      <CWText type="b1">
                        All community stake funded contests are recurring
                        weekly.
                        <br />
                        Tip: smaller prizes makes the contest run longer
                      </CWText>
                      <div className="percentage-buttons">
                        {prizePercentageOptions.map(({ value, label }) => (
                          <CWButton
                            disabled={editMode}
                            type="button"
                            key={value}
                            label={label}
                            buttonHeight="sm"
                            onClick={() => setPrizePercentage(value)}
                            buttonType={
                              prizePercentage === value
                                ? 'primary'
                                : 'secondary'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : isFarcasterContest ? (
                <div className="contest-section contest-section-farcaster-token">
                  <CWText type="h4">Primary token</CWText>
                  <CWText type="b1">
                    Enter a token to fund the contest and for weighting upvotes
                    on the contest.
                  </CWText>
                  <TokenFinder
                    debouncedTokenValue={debouncedTokenValue}
                    tokenMetadataLoading={tokenMetadataLoading}
                    tokenMetadata={tokenMetadata}
                    setTokenValue={setTokenValue}
                    tokenValue={
                      editMode
                        ? contestFormData?.fundingTokenAddress || ''
                        : tokenValue
                    }
                    containerClassName="token-input"
                    disabled={editMode}
                    fullWidth
                    placeholder="Enter funding token address"
                    tokenError={getTokenError(
                      watch('contestRecurring') === ContestRecurringType.No,
                    )}
                    hookToForm
                    name="fundingTokenAddress"
                  />

                  <CWText type="h5">Vote weight voteWeightMultiplier</CWText>

                  <div className="input-row">
                    <CWText type="b1" className="description">
                      1 token is equal to
                    </CWText>
                    <CWTextInput
                      type="number"
                      min={1}
                      defaultValue={1}
                      isCompact
                      value={voteWeightMultiplier}
                      onInput={(e) =>
                        setVoteWeightMultiplier(Number(e.target.value))
                      }
                    />
                    <CWText type="b1" className="description">
                      votes.
                    </CWText>
                  </div>
                  <CWText type="b1" className="description">
                    Vote weight per token held by the user will be{' '}
                    {voteWeightMultiplier || 0}.
                  </CWText>
                </div>
              ) : (
                <></>
              )}

              <div className="contest-section contest-section-duration">
                <div>
                  <CWText type="h4">Contest duration</CWText>
                  <CWText type="b1">
                    How long would you like your contest to run?
                  </CWText>
                </div>

                <SelectList
                  isSearchable={false}
                  options={contestDurationOptions}
                  defaultValue={contestDurationOptions.find(
                    (o) => o.value === contestDuration,
                  )}
                  onChange={(newValue) => {
                    setContestDuration(newValue?.value);
                  }}
                  isDisabled={editMode}
                />
              </div>

              <CWDivider />

              <div className="contest-section contest-section-payout">
                <CWText type="h4">Winners & payouts</CWText>
                <CWText type="b1" className="winners-description">
                  Set the number of winners and allocate the proportion of
                  prizes for them.
                </CWText>
                <div className="payout-container">
                  {payoutStructure.map((payoutNumber, index) => (
                    <PayoutRow
                      key={index}
                      index={index}
                      payoutNumber={payoutNumber}
                      payoutStructure={payoutStructure}
                      onSetPayoutStructure={setPayoutStructure}
                      disabled={editMode}
                    />
                  ))}
                </div>
                <div className="payout-summary">
                  <div className="payout-total">
                    <CWText type="h4">Total = </CWText>
                    <CWText type="h3" className="total-percentage">
                      {totalPayoutPercentage}%
                    </CWText>
                  </div>
                  <MessageRow
                    hasFeedback={totalPayoutPercentageError}
                    validationStatus="failure"
                    statusMessage="Total prize must equal 100%"
                  />
                </div>
                <div className="payout-buttons">
                  <CWButton
                    label="Remove Winner"
                    buttonType="secondary"
                    buttonHeight="sm"
                    disabled={
                      editMode || payoutStructure.length === MIN_WINNERS
                    }
                    type="button"
                    onClick={handleRemoveWinner}
                  />
                  <CWButton
                    label="Add Winner"
                    buttonHeight="sm"
                    disabled={
                      editMode || payoutStructure.length === MAX_WINNERS
                    }
                    type="button"
                    onClick={handleAddWinner}
                  />
                </div>
              </div>

              <div className="cta-buttons">
                <CWButton
                  label="Cancel"
                  buttonType="secondary"
                  onClick={handleCancel}
                  type="button"
                />
                <CWButton
                  label={editMode ? 'Save changes' : 'Save & continue'}
                  type="submit"
                  disabled={
                    isProcessingProfileImage ||
                    !!getTokenError(
                      watch('contestRecurring') === ContestRecurringType.No,
                    )
                  }
                />
              </div>
            </>
          )}
        </CWForm>
      </div>
    </CommunityManagementLayout>
  );
};

export default DetailsFormStep;
