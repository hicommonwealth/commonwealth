import { ValidChains } from '@hicommonwealth/evm-protocols';
import colors from '../../../../../../../styles/mixins/colors.module.scss';

export const INITIAL_PERCENTAGE_VALUE = 10;
export const MAX_WINNERS = 10;
export const MIN_WINNERS = 1;

export const prizePercentageOptions = [
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

export const initialPayoutStructure = [60, 25, 15];

export const getPrizeColor = (index: number) => {
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

export const DAY_IN_SECONDS = 24 * 60 * 60;

export const contestDurationOptions = Array.from({ length: 7 }, (_, i) => {
  const days = i + 1;
  return {
    label: `${days} Day${days > 1 ? 's' : ''}`,
    value: days * DAY_IN_SECONDS,
  };
});

export const initialContestDuration = contestDurationOptions[6].value;

export const createNewTopicOption = {
  value: 'create-new',
  label: 'Create new topic',
  helpText: '',
  weightedVoting: null,
};

export const getChainName = (chainId: number): string => {
  return (
    Object.entries(ValidChains).find(([_, value]) => value === chainId)?.[0] ??
    'Unknown'
  );
};
