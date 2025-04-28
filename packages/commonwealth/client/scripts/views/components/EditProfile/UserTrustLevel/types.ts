export type Status = 'Done' | 'Not Started';

export interface VerificationItem {
  label: string;
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
