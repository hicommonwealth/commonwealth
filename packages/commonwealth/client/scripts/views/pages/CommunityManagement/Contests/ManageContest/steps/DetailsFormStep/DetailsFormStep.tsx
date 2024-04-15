import moment from 'moment';
import React, { useEffect, useState } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import NumberSelector from 'views/components/NumberSelector';
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
import CommunityManagementLayout from 'views/pages/CommunityManagement/common/CommunityManagementLayout';

import * as colors from '../../../../../../../../styles/mixins/colors.scss';
import { LaunchContestStep } from '../../ManageContest';
import { detailsFormValidationSchema } from './validation';

import './DetailsFormStep.scss';

interface DetailsFormStepProps {
  contestId?: string;
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
}

export enum ContestFeeType {
  CommunityStake = 'community-stake',
  DirectDeposit = 'direct-deposit',
}

enum ContestRecurringType {
  Yes = 'yes',
  No = 'no',
}

const INITIAL_PERCENTAGE_VALUE = 10;
const MAX_WINNERS = 10;
const MIN_WINNERS = 1;

const prizePercentageOptions = [
  {
    label: '10%',
    value: INITIAL_PERCENTAGE_VALUE,
  },
  {
    label: '20%',
    value: 20,
  },
  {
    label: '30%',
    value: 30,
  },
  {
    label: '40%',
    value: 40,
  },
  {
    label: '50%',
    value: 50,
  },
];

const initialPayoutStructure = [60, 25, 15];

const getPrizeColor = (index: number) => {
  if (index === 0) {
    return colors['yellow-500'];
  }

  if (index === 1) {
    return colors['neutral-100'];
  }

  if (index === 2) {
    return colors['yellow-600'];
  }

  return '#000';
};

const DetailsFormStep = ({
  contestId,
  onSetLaunchContestStep,
}: DetailsFormStepProps) => {
  const navigate = useCommonNavigate();

  const [payoutStructure, setPayoutStructure] = useState<number[]>(
    initialPayoutStructure,
  );
  const [prizePercentage, setPrizePercentage] = useState(
    INITIAL_PERCENTAGE_VALUE,
  );
  const [toggledTopicList, setToggledTopicList] = useState<
    {
      name: string;
      id: number;
      checked: boolean;
    }[]
  >([]);
  const [allTopicsToggled, setAllTopicsToggled] = useState(true);
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const editMode = !!contestId;

  const totalPayoutPercentage = payoutStructure.reduce(
    (acc, val) => acc + val,
    0,
  );
  const totalPayoutPercentageError = totalPayoutPercentage !== 100;
  const payoutRowError = payoutStructure.some((payout) => payout < 1);
  const topicsEnabledError = toggledTopicList.every(({ checked }) => !checked);

  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  useEffect(() => {
    if (topics && toggledTopicList.length === 0) {
      const mappedTopics = topics.map((topic) => ({
        name: topic.name,
        id: topic.id,
        checked: true,
      }));
      setToggledTopicList(mappedTopics);
    }
  }, [toggledTopicList.length, topics]);

  const goBack = () => {
    // TODO distinct if user came from /manage/contests or /contests
    navigate('/manage/contests');
  };

  const handleCancel = () => {
    goBack();
  };

  const handleSubmit = () => {
    if (totalPayoutPercentageError || payoutRowError || topicsEnabledError) {
      return;
    }

    if (editMode) {
      // save edit API call
      return goBack();
    }

    onSetLaunchContestStep('SignTransactions');
  };

  const getInitialValues = () => {
    return {
      feeType: ContestFeeType.CommunityStake,
      contestRecurring: ContestRecurringType.Yes,
      prizePercentage,
    };
  };

  const handleAddWinner = () => {
    setPayoutStructure((prevState) => [...prevState, 0]);
  };

  const handleRemoveWinner = () => {
    setPayoutStructure((prevState) => [...prevState.slice(0, -1)]);
  };

  const sortedTopics = [...topics]?.sort((a, b) => {
    if (!a.order || !b.order) {
      return 1;
    }

    return a.order - b.order;
  });

  const handleToggleAllTopics = () => {
    const mappedTopics = sortedTopics?.map((topic) => ({
      ...topic,
      checked: !allTopicsToggled,
    }));
    setToggledTopicList(mappedTopics);
    setAllTopicsToggled((prevState) => !prevState);
  };

  return (
    <CommunityManagementLayout
      title="Launch a contest"
      description={
        <CWText className="contest-description">
          Launch a contest using the funds from your community wallet to create
          engagement incentives.{' '}
          <CWText fontWeight="medium">Contests last 7 days</CWText> in
          blockchain time. <a href="https://blog.commonwealth.im">Learn more</a>
        </CWText>
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
                    onChange={() =>
                      setValue('contestRecurring', ContestRecurringType.Yes)
                    }
                  />
                  <CWRadioButton
                    label="Direct deposit only"
                    value={ContestFeeType.DirectDeposit}
                    name="feeType"
                    hookToForm
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
                  />
                  <CWRadioButton
                    label="No"
                    value={ContestRecurringType.No}
                    name="contestRecurring"
                    hookToForm
                    disabled={
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
                          type="button"
                          key={value}
                          label={label}
                          buttonHeight="sm"
                          buttonType={
                            prizePercentage === value ? 'primary' : 'secondary'
                          }
                          onClick={() => setPrizePercentage(value)}
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
                    <>
                      <div className="payout-row" key={index}>
                        <div className="left-side">
                          <div
                            className="color-square"
                            style={{ backgroundColor: getPrizeColor(index) }}
                          ></div>
                          <CWText type="h5">
                            {moment.localeData().ordinal(index + 1)} Prize
                          </CWText>
                        </div>
                        <div className="right-side">
                          <NumberSelector
                            value={payoutNumber + '%'}
                            key={index}
                            onInput={(e) => {
                              let value = e.target.value;

                              if (!value.includes('%')) {
                                value = value.slice(0, value.length - 1);
                              } else {
                                value = value.replace(/%/g, '');
                              }

                              if (isNaN(Number(value))) {
                                return;
                              }

                              const newPayoutStructure = [
                                ...payoutStructure.slice(0, index),
                                Number(value),
                                ...payoutStructure.slice(index + 1),
                              ];
                              setPayoutStructure(newPayoutStructure);
                            }}
                            minusDisabled={payoutStructure[index] === 0}
                            onMinusClick={() => {
                              const updatedPayoutStructure = [
                                ...payoutStructure,
                              ];
                              updatedPayoutStructure[index] -= 1;
                              setPayoutStructure(updatedPayoutStructure);
                            }}
                            onPlusClick={() => {
                              const updatedPayoutStructure = [
                                ...payoutStructure,
                              ];
                              updatedPayoutStructure[index] += 1;
                              setPayoutStructure(updatedPayoutStructure);
                            }}
                          />
                        </div>
                      </div>
                      <MessageRow
                        hasFeedback={payoutNumber < 1}
                        validationStatus="failure"
                        statusMessage="Prize must be greater than 0%"
                      />
                    </>
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
                    disabled={payoutStructure.length === MIN_WINNERS}
                    type="button"
                    onClick={handleRemoveWinner}
                  />
                  <CWButton
                    label="Add Winner"
                    buttonHeight="sm"
                    disabled={payoutStructure.length === MAX_WINNERS}
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
                    sortedTopics.map((topic) => {
                      return (
                        <div key={topic.id} className="list-row">
                          <CWText>{topic.name}</CWText>
                          <CWToggle
                            checked={
                              toggledTopicList.find((t) => t.id === topic.id)
                                .checked
                            }
                            size="small"
                            onChange={() =>
                              setToggledTopicList((prevState) => {
                                const isChecked = prevState.find(
                                  (t) => t.id === topic.id,
                                ).checked;

                                return prevState.map((t) => {
                                  if (t.id === topic.id) {
                                    return {
                                      ...t,
                                      checked: !isChecked,
                                    };
                                  }
                                  return t;
                                });
                              })
                            }
                          />
                        </div>
                      );
                    })}
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
