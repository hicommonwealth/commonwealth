export type BackParams = {
  amount: string | number;
};

export type WithdrawBackParams = {
  donate: boolean;
};

export type SnapshotVoteParams = {
  vote: number;
};

export type CreateProjectParams = {
  //Threadname
  name: string;
  //Thread URL
  url: string;
  //Form data
  amountToFund: number;
  //Calc from form data?
  deadline: number;
  //form data
  donationWallet: string;
  //From thread data
  farcasterId: number;
  //form data
  minBacking: number;
};
