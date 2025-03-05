import { ThresholdData } from './protocol';

export const Roles = ['admin', 'moderator', 'member'] as const;
export type Role = (typeof Roles)[number];

export type AddressRole = {
  address: string;
  role: Role;
};

export enum DefaultPage {
  Discussions = 'default_all_discussions_view',
  Overview = 'default_summary_view',
  Homepage = 'homepage',
}

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';

export enum NodeHealth {
  Failed = 'failed',
  Healthy = 'healthy',
}

export type AllowlistData = {
  allow: string[];
};

export type Requirement =
  | {
      rule: 'threshold';
      data: ThresholdData;
    }
  | {
      rule: 'allow';
      data: AllowlistData;
    };

export enum ContentType {
  Thread = 'thread',
  Comment = 'comment',
}

export const DynamicTemplate = {
  ImmediateEmailNotification: 'd-3f30558a95664528a2427b40292fec51',
  BatchNotifications: 'd-468624f3c2d7434c86ae0ed0e1d2227e',
  SignIn: 'd-db52815b5f8647549d1fe6aa703d7274',
  SignUp: 'd-2b00abbf123e4b5981784d17151e86be',
  UpdateEmail: 'd-a0c28546fecc49fb80a3ba9e535bff48',
  VerifyAddress: 'd-292c161f1aec4d0e98a0bf8d6d8e42c2',
  EmailDigest: 'd-a4f27421ce5a41d29dca7625d2136cc3',
};

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
  Template = 'template',
}

export type Link = {
  source: LinkSource;
  identifier: string;
  title?: string;
};

// These are meant to be static and Common focused
// i.e. these should not change even if the underlying Twitter account changes
export enum TwitterBotName {
  MomBot = 'MomBot',
  ContestBot = 'ContestBot',
}
