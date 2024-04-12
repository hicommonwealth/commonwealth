import React, { useState } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import CommunityManagementLayout from 'views/pages/CommunityManagement/common/CommunityManagementLayout';

import { LaunchContestStep } from '../../ManageContest';
import { detailsFormValidationSchema } from './validation';

import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/cw_cover_image_uploader';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './DetailsFormStep.scss';

interface DetailsFormStepProps {
  contestId?: string;
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
}

export enum ContestFeeType {
  CommunityStake = 'community-stake',
  DirectDeposit = 'direct-deposit',
}

enum ContestReccuringType {
  Yes = 'yes',
  No = 'no',
}

const INITIAL_PERCENTAGE_VALUE = 10;

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

const DetailsFormStep = ({
  contestId,
  onSetLaunchContestStep,
}: DetailsFormStepProps) => {
  const navigate = useCommonNavigate();

  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);
  const [prizePercentage, setPrizePercentage] = useState(
    INITIAL_PERCENTAGE_VALUE,
  );

  const editMode = !!contestId;

  const goBack = () => {
    // TODO distinct if user came from /manage/contests or /contests
    navigate('/manage/contests');
  };

  const handleCancel = () => {
    goBack();
  };

  const handleSubmit = () => {
    if (editMode) {
      // save edit API call
      return goBack();
    }

    onSetLaunchContestStep('SignTransactions');
  };

  const getInitialValues = () => {
    return {
      feeType: ContestFeeType.CommunityStake,
      contestRecurring: ContestReccuringType.Yes,
      prizePercentage,
    };
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
              {/*// TODO add class for header => grey font*/}
              <div>
                <CWText type="h4">Name your contest</CWText>
                <CWText type="b1">
                  We recommend naming your contest if you’re going to have
                  multiple contest
                </CWText>

                <CWTextInput
                  containerClassName="contest-name"
                  name="contestName"
                  hookToForm
                  placeholder="Give your contest a name"
                  fullWidth
                  label="Contest Name"
                />
              </div>

              <div>
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

              <div>
                <CWText type="h4">
                  Use Community Stake fees for contest?{' '}
                </CWText>
                <CWText type="b1">
                  You can fund your contest using the funds generated from the
                  purchase of Community Stake, or you can fund your contest
                  directly via deposit. You can add funds directly to contests
                  at any time.
                </CWText>

                <CWRadioButton
                  label="Use Community Stake fees"
                  value={ContestFeeType.CommunityStake}
                  name="feeType"
                  hookToForm
                  onChange={() => {
                    setValue('contestRecurring', ContestReccuringType.Yes);
                  }}
                />
                <CWRadioButton
                  label="Direct deposit only"
                  value={ContestFeeType.DirectDeposit}
                  name="feeType"
                  hookToForm
                />

                {watch('feeType') === ContestFeeType.DirectDeposit && (
                  <>
                    <CWText>
                      Enter the address of the token you would like to use to
                      fund your contest
                    </CWText>
                    <CWTextInput
                      containerClassName="funding-token-address"
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

              <div>
                <CWText type="h4">Make contest recurring?</CWText>
                <CWText type="b1">
                  The remaining prize pool will roll over week to week until you
                  end the contest.{' '}
                  {watch('feeType') === ContestFeeType.CommunityStake && (
                    <>
                      Contests run using Community Stake funds must be
                      recurring.
                    </>
                  )}
                </CWText>

                <CWRadioButton
                  label="Yes"
                  value={ContestReccuringType.Yes}
                  name="contestRecurring"
                  hookToForm
                />
                <CWRadioButton
                  label="No"
                  value={ContestReccuringType.No}
                  name="contestRecurring"
                  hookToForm
                  disabled={watch('feeType') === ContestFeeType.CommunityStake}
                />

                {watch('contestRecurring') === ContestReccuringType.Yes && (
                  <>
                    <CWText type="h5">
                      How much of the funds would you like to use weekly?
                    </CWText>
                    <CWText type="b1">
                      Tip: smaller prizes makes the contest run longer
                    </CWText>

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
                  </>
                )}
              </div>

              <CWDivider />

              <div>
                <CWText type="h4">Winners & payouts</CWText>
                <CWText type="b1">
                  Set the number of winners and how much of the total prize pool
                  they take. 20% of each prize will be split amongst the voters
                  of the winning content.
                </CWText>
              </div>

              <CWDivider />
              <div>
                <CWText type="h4">Included topics</CWText>
                <CWText type="b1">
                  Select which topics you would like to include in this contest.
                  Only threads posted to these topics will be eligible for the
                  contest prizes.
                </CWText>
              </div>

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
            </>
          )}
        </CWForm>
      </div>
    </CommunityManagementLayout>
  );
};

export default DetailsFormStep;
