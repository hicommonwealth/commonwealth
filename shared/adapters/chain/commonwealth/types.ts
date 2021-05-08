export interface ICommonwealthMember {
  // address of the member
  id: string;

  // 0: normal, 1: backer, 2: curator
  memberType: number;
}
