import * as colors from '../../../../../../../../styles/mixins/colors.scss';

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
