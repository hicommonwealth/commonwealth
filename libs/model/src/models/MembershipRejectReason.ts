export type MembershipRejectReason =
  | {
      message: string;
      requirement: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        rule: string;
      };
    }[]
  | null;
