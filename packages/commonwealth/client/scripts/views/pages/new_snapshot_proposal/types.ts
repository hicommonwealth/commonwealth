// TODO Graham 7-20-22: Reconcile against NewThreadForm
export type ThreadForm = {
  body: string;
  choices: Array<string>;
  end: number;
  metadata: {
    network?: string;
    strategies?: Array<{
      name: string;
      params: any;
    }>;
  };
  name: string;
  range: string;
  snapshot: number;
  start: number;
  type: string;
};

export enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank!',
  NoTitle = 'Title cannot be blank!',
  NoChoices = 'Choices cannot be blank!',
  NoStartDate = 'Start Date cannot be blank!',
  NoEndDate = 'End Date cannot be blank!',
  SomethingWentWrong = 'Something went wrong!',
}
