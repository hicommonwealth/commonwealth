export type Status = 'Done' | 'Not Started';

export enum VerificationItemType {
  VERIFY_COMMUNITY = 'VERIFY_COMMUNITY',
  VERIFY_DOMAIN = 'VERIFY_DOMAIN',
}

export interface VerificationItem {
  label: string;
  type: VerificationItemType;
  status: Status;
}

export interface VerificationLevel {
  level: number;
  title: string;
  description: string;
  status: Status;
  color: string;
  items?: VerificationItem[];
  redirect?: boolean;
}
