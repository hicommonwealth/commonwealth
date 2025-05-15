import { Coin } from 'adapters/currency';
import BN from 'bn.js';
import { getChainDecimals } from 'client/scripts/controllers/app/webWallets/utils';
import app from 'state';

interface VoteOption {
  label: string;
  percentage: string;
  results: string;
}

const formatDate = (isoString: string | undefined) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString();
};

export const getTimelineEvents = (proposalData) => {
  let submitTime, votingStartTime, votingEndTime;

  if (
    proposalData?.submitTime &&
    proposalData?.votingStartTime &&
    proposalData?.votingEndTime
  ) {
    submitTime = proposalData.submitTime;
    votingStartTime = proposalData.votingStartTime;
    votingEndTime = proposalData.votingEndTime;
  } else if (proposalData?.id && proposalData?.body) {
    submitTime = proposalData?.start
      ? new Date(proposalData.start * 1000).toISOString()
      : undefined;
    votingStartTime = submitTime;
    votingEndTime = proposalData?.end
      ? new Date(proposalData.end * 1000).toISOString()
      : undefined;
  }

  return [
    {
      date: formatDate(submitTime),
      title: 'Proposal Published',
      type: 'past',
      iconName: 'plusCirclePhosphor',
    },
    {
      date: formatDate(votingStartTime),
      title: 'Voting Begins',
      type: 'active',
      iconName: 'play',
    },
    {
      date: formatDate(votingEndTime),
      title: 'Voting Ends',
      type: 'coming',
      iconName: 'infoEmpty',
    },
  ];
};

export const getCombinedBarColor = (label: string, index: number) => {
  const negativeLabels = ['No', 'No with Veto'];

  if (index === 0) return '#78A824';
  if (negativeLabels.includes(label)) return '#D63200';
  return '#666666';
};

export const formatVoteCount = (number) => {
  if (number >= 1_000_000) {
    return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (number >= 1_000) {
    return (number / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    return number.toString();
  }
};

const formatCurrency = (n: BN) => {
  const decimals = new BN(10).pow(
    new BN(getChainDecimals(app.chain.id || '', app.chain.meta.base) || 6),
  );
  const denom = app.chain.meta?.default_symbol;
  const coin = new Coin(denom, n, false, decimals);
  return coin.format();
};

const getPct = (n: BN, voteTotal: BN) => {
  if (voteTotal.isZero()) return '0';
  return (n.muln(10_000).div(voteTotal)?.toNumber() / 100).toFixed(2);
};

export const getVoteOptions = (
  yes: BN,
  no: BN,
  abstain: BN,
  noWithVeto: BN,
) => {
  const voteTotal = yes.add(no).add(abstain).add(noWithVeto);

  return [
    {
      label: 'Yes',
      percentage: getPct(yes, voteTotal),
      results: formatCurrency(yes),
    },
    {
      label: 'No',
      percentage: getPct(no, voteTotal),
      results: formatCurrency(no),
    },
    {
      label: 'Abstain',
      percentage: getPct(abstain, voteTotal),
      results: formatCurrency(abstain),
    },
    {
      label: 'No with Veto',
      percentage: getPct(noWithVeto, voteTotal),
      results: formatCurrency(noWithVeto),
    },
  ] as VoteOption[];
};
