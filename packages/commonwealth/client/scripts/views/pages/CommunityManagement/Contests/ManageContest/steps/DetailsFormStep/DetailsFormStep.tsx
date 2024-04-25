import React, { useEffect, useState } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { openConfirmation } from 'views/modals/confirmation_modal';
import CommunityManagementLayout from 'views/pages/CommunityManagement/common/CommunityManagementLayout';

import {
  ContestFeeType,
  ContestFormData,
  ContestFormValidationSubmitValues,
  ContestRecurringType,
  LaunchContestStep,
} from '../../types';
import PayoutRow from './PayoutRow';
import {
  INITIAL_PERCENTAGE_VALUE,
  MAX_WINNERS,
  MIN_WINNERS,
  initialPayoutStructure,
  prizePercentageOptions,
} from './utils';
import { detailsFormValidationSchema } from './validation';

import './DetailsFormStep.scss';

interface DetailsFormStepProps {
  contestAddress?: string;
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
  contestFormData: ContestFormData;
  onSetContestFormData: (data: ContestFormData) => void;
}

const DetailsFormStep = ({
  contestAddress,
  onSetLaunchContestStep,
  contestFormData,
  onSetContestFormData,
}: DetailsFormStepProps) => {
  const navigate = useCommonNavigate();

  const [payoutStructure, setPayoutStructure] = useState<
    ContestFormData['payoutStructure']
  >(contestFormData?.payoutStructure || initialPayoutStructure);
  const [prizePercentage, setPrizePercentage] = useState<
    ContestFormData['prizePercentage']
  >(contestFormData?.prizePercentage || INITIAL_PERCENTAGE_VALUE);
  const [toggledTopicList, setToggledTopicList] = useState<
    ContestFormData['toggledTopicList']
  >(contestFormData?.toggledTopicList || []);

  const [allTopicsToggled, setAllTopicsToggled] = useState(
    contestFormData?.toggledTopicList?.every(({ checked }) => checked),
  );
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const { data: topicsData } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const editMode = !!contestAddress;
  const payoutRowError = payoutStructure.some((payout) => payout < 1);
  const topicsEnabledError = toggledTopicList.every(({ checked }) => !checked);
  const totalPayoutPercentage = payoutStructure.reduce(
    (acc, val) => acc + val,
    0,
  );
  const totalPayoutPercentageError = totalPayoutPercentage !== 100;

  const sortedTopics = [...topicsData]?.sort((a, b) => {
    if (!a.order || !b.order) {
      return 1;
    }

    // if order is not defined, push topic to the end of the list
    return a.order - b.order;
  });

  // we need separate state to handle topic toggling
  useEffect(() => {
    if (topicsData) {
      const mappedTopics = topicsData.map(({ name, id }) => ({
        name,
        id,
        checked: contestFormData
          ? !!contestFormData?.toggledTopicList?.find((t) => t.id === id)
              ?.checked
          : true,
      }));
      setToggledTopicList(mappedTopics);
      setAllTopicsToggled(mappedTopics.every(({ checked }) => checked));
    }
  }, [contestFormData, topicsData]);

  const getInitialValues = () => {
    return {
      contestName: contestFormData?.contestName,
      contestImage: contestFormData?.contestImage,
      feeType: contestFormData?.feeType || ContestFeeType.CommunityStake,
      fundingTokenAddress: contestFormData?.fundingTokenAddress,
      contestRecurring:
        contestFormData?.contestRecurring || ContestRecurringType.Yes,
    };
  };

  const handleAddWinner = () => {
    setPayoutStructure((prevState) => [...prevState, 0]);
  };

  const handleRemoveWinner = () => {
    setPayoutStructure((prevState) => [...prevState.slice(0, -1)]);
  };

  const handleToggleTopic = (topicId: number) => {
    const isChecked = toggledTopicList.find(
      (topic) => topic.id === topicId,
    )?.checked;

    const mappedTopics = toggledTopicList.map((topic) => {
      if (topic.id === topicId) {
        return {
          ...topic,
          checked: !isChecked,
        };
      }
      return topic;
    });

    const allChecked = mappedTopics.every(({ checked }) => checked);
    setToggledTopicList(mappedTopics);
    setAllTopicsToggled(allChecked);
  };
  const handleToggleAllTopics = () => {
    const mappedTopics = toggledTopicList?.map((topic) => ({
      name: topic.name,
      id: topic.id,
      checked: !allTopicsToggled,
    }));
    setToggledTopicList(mappedTopics);
    setAllTopicsToggled((prevState) => !prevState);
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

  const handleSubmit = (values: ContestFormValidationSubmitValues) => {
    if (totalPayoutPercentageError || payoutRowError || topicsEnabledError) {
      return;
    }

    const formData: ContestFormData = {
      contestName: values.contestName,
      contestImage: values.contestImage,
      feeType: values.feeType,
      fundingTokenAddress: values.fundingTokenAddress,
      contestRecurring: values.contestRecurring,
      prizePercentage,
      payoutStructure,
      toggledTopicList,
    };

    if (editMode) {
      // TODO save edit API call
      goBack();
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
              changed. <a href="https://blog.commonwealth.im">Learn more</a>
            </CWText>
          </>
        ) : (
          <>
            <CWText className="contest-description">
              Launch a contest using the funds from your community wallet to
              create engagement incentives.{' '}
              <CWText fontWeight="medium">Contests last 7 days</CWText> in
              blockchain time.{' '}
              <a href="https://blog.commonwealth.im">Learn more</a>
            </CWText>
          </>
        )
      }
      featureHint={{
        title: 'How do I fund my contest?',
        description:
          'Contests are funded when community members purchase stake in the community. ' +
          'Each transaction includes a small contribution to the community pool that can be used to fund contests.',
      }}
    >
      <div className="DetailsFormStep">
        <CWForm
          validationSchema={detailsFormValidationSchema}
          onSubmit={handleSubmit}
          initialValues={getInitialValues()}
        >
          {({ watch, setValue }) => (
            <>
              <div className="contest-section contest-section-name">
                <CWText type="h4">Name your contest</CWText>
                <CWText type="b1">
                  We recommend naming your contest if you’re going to have
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

              <div className="contest-section contest-section-image">
                <CWText type="h4">
                  Featured image<CWText type="b1"> (optional)</CWText>
                </CWText>
                <CWText type="b1">
                  Set an image to entice users to your contest (1920x1080 jpg or
                  png)
                </CWText>
                <CWCoverImageUploader
                  uploadCompleteCallback={console.log}
                  canSelectImageBehaviour={false}
                  showUploadAndGenerateText
                  onImageProcessStatusChange={setIsProcessingProfileImage}
                  name="contestImage"
                  hookToForm
                  defaultImageBehaviour={ImageBehavior.Fill}
                  enableGenerativeAI
                />
              </div>

              <CWDivider />

              <div className="contest-section contest-section-fee">
                <CWText type="h4">Use Community Stake fees for contest?</CWText>
                <CWText type="b1">
                  You can fund your contest using the funds generated from the
                  purchase of Community Stake, or you can fund your contest
                  directly via deposit. You can add funds directly to contests
                  at any time.
                </CWText>
                <div className="radio-row">
                  <CWRadioButton
                    label="Use Community Stake fees"
                    value={ContestFeeType.CommunityStake}
                    name="feeType"
                    hookToForm
                    disabled={editMode}
                    onChange={() =>
                      setValue('contestRecurring', ContestRecurringType.Yes)
                    }
                  />
                  <CWRadioButton
                    label="Direct deposit only"
                    value={ContestFeeType.DirectDeposit}
                    name="feeType"
                    hookToForm
                    disabled={editMode}
                  />
                </div>
                {watch('feeType') === ContestFeeType.DirectDeposit && (
                  <>
                    <CWText className="funding-token-address-description">
                      Enter the address of the token you would like to use to
                      fund your contest
                    </CWText>
                    <CWTextInput
                      containerClassName="funding-token-address-input"
                      name="fundingTokenAddress"
                      hookToForm
                      placeholder="Enter funding token address"
                      fullWidth
                      label="Token Address"
                      disabled={editMode}
                    />
                  </>
                )}
              </div>

              <CWDivider />

              <div className="contest-section contest-section-recurring">
                <CWText type="h4">Make contest recurring?</CWText>
                <CWText type="b1">
                  The remaining prize pool will roll over week to week until you
                  end the contest.
                  <br />
                  {watch('contestRecurring') === ContestRecurringType.Yes && (
                    <>
                      Contests run using Community Stake funds must be
                      recurring.
                    </>
                  )}
                </CWText>
                <div className="radio-row">
                  <CWRadioButton
                    label="Yes"
                    value={ContestRecurringType.Yes}
                    name="contestRecurring"
                    hookToForm
                    disabled={editMode}
                  />
                  <CWRadioButton
                    label="No"
                    value={ContestRecurringType.No}
                    name="contestRecurring"
                    hookToForm
                    disabled={
                      editMode ||
                      watch('feeType') === ContestFeeType.CommunityStake
                    }
                  />
                </div>
                {watch('contestRecurring') === ContestRecurringType.Yes && (
                  <div className="prize-subsection">
                    <CWText type="h5">
                      How much of the funds would you like to use weekly?
                    </CWText>
                    <CWText type="b1">
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
                            prizePercentage === value ? 'primary' : 'secondary'
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <CWDivider />

              <div className="contest-section contest-section-payout">
                <CWText type="h4">Winners & payouts</CWText>
                <CWText type="b1" className="winners-description">
                  Set the number of winners and how much of the total prize pool
                  they take{' '}
                  <CWText fontWeight="medium">20% of each prize</CWText> will be
                  split amongst the voters of the winning content.
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

              <CWDivider />

              <div className="contest-section contest-section-topics">
                <CWText type="h4">Included topics</CWText>
                <CWText type="b1">
                  Select which topics you would like to include in this contest.
                  Only threads posted to these topics will be eligible for the
                  contest prizes.
                </CWText>
                <div className="topics-list">
                  <div className="list-header">
                    <CWText>Topic</CWText>
                    <CWText>Eligible</CWText>
                  </div>
                  {toggledTopicList.length &&
                    sortedTopics.map((topic) => (
                      <div key={topic.id} className="list-row">
                        <CWText>{topic.name}</CWText>
                        <CWToggle
                          checked={
                            toggledTopicList.find((t) => t.id === topic.id)
                              ?.checked
                          }
                          size="small"
                          onChange={() => handleToggleTopic(topic.id)}
                        />
                      </div>
                    ))}
                  <div className="list-footer">
                    <CWText>All</CWText>
                    <CWToggle
                      checked={allTopicsToggled}
                      size="small"
                      onChange={handleToggleAllTopics}
                    />
                  </div>
                  <MessageRow
                    hasFeedback={topicsEnabledError}
                    validationStatus="failure"
                    statusMessage="Must include one or more topics"
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
                  disabled={isProcessingProfileImage}
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
