import { gql, GraphQLClient, RequestOptions } from 'graphql-request';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  BigInt: { input: any; output: any };
  CanvasConfig: { input: any; output: any };
  DateTime: { input: any; output: any };
  DeploymentMeta: { input: any; output: any };
  DisplayConfig: { input: any; output: any };
  EnvironmentConfig: { input: any; output: any };
  EnvironmentVariables: { input: any; output: any };
  JSON: { input: any; output: any };
  RailpackInfo: { input: any; output: any };
  SerializedTemplateConfig: { input: any; output: any };
  ServiceInstanceLimit: { input: any; output: any };
  SubscriptionPlanLimit: { input: any; output: any };
  TemplateConfig: { input: any; output: any };
  TemplateMetadata: { input: any; output: any };
  TemplateServiceConfig: { input: any; output: any };
  TemplateVolume: { input: any; output: any };
  Upload: { input: any; output: any };
};

export type AccessRule = {
  __typename?: 'AccessRule';
  disallowed?: Maybe<Scalars['String']['output']>;
};

export enum ActiveFeatureFlag {
  CephVolumes = 'CEPH_VOLUMES',
  DefaultToRailpack = 'DEFAULT_TO_RAILPACK',
  PriorityBoarding = 'PRIORITY_BOARDING',
  V3NewProjectPage = 'V3_NEW_PROJECT_PAGE',
}

export enum ActiveServiceFeatureFlag {
  CopyVolumeToEnvironment = 'COPY_VOLUME_TO_ENVIRONMENT',
  NonDestructiveVolumeMigrations = 'NON_DESTRUCTIVE_VOLUME_MIGRATIONS',
  Placeholder = 'PLACEHOLDER',
}

export type AdoptionInfo = Node & {
  __typename?: 'AdoptionInfo';
  adoptionLevel?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: Team;
  deltaLevel?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  matchedIcpEmail?: Maybe<Scalars['String']['output']>;
  monthlyEstimatedUsage?: Maybe<Scalars['Float']['output']>;
  numConfigFile: Scalars['Int']['output'];
  numCronSchedule: Scalars['Int']['output'];
  numDeploys: Scalars['Int']['output'];
  numEnvs: Scalars['Int']['output'];
  numFailedDeploys: Scalars['Int']['output'];
  numHealthcheck: Scalars['Int']['output'];
  numIconConfig: Scalars['Int']['output'];
  numRegion: Scalars['Int']['output'];
  numReplicas: Scalars['Int']['output'];
  numRootDirectory: Scalars['Int']['output'];
  numSeats: Scalars['Int']['output'];
  numServices: Scalars['Int']['output'];
  numSupportRequests: Scalars['Int']['output'];
  numVariables: Scalars['Int']['output'];
  numWatchPatterns: Scalars['Int']['output'];
  totalCores?: Maybe<Scalars['Float']['output']>;
  totalDisk?: Maybe<Scalars['Float']['output']>;
  totalNetwork?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** The aggregated usage of a single measurement. */
export type AggregatedUsage = {
  __typename?: 'AggregatedUsage';
  /** The measurement that was aggregated. */
  measurement: MetricMeasurement;
  /** The tags that were used to group the metric. Only the tags that were used in the `groupBy` will be present. */
  tags: MetricTags;
  /** The aggregated value. */
  value: Scalars['Float']['output'];
};

export type AllDomains = {
  __typename?: 'AllDomains';
  customDomains: Array<CustomDomain>;
  serviceDomains: Array<ServiceDomain>;
};

export type ApiToken = Node & {
  __typename?: 'ApiToken';
  displayToken: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  teamId?: Maybe<Scalars['String']['output']>;
};

export type ApiTokenCreateInput = {
  name: Scalars['String']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type BanReasonHistory = Node & {
  __typename?: 'BanReasonHistory';
  actor: User;
  banReason?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
};

export type BaseEnvironmentOverrideInput = {
  baseEnvironmentOverrideId?: InputMaybe<Scalars['String']['input']>;
};

/** The billing period for a customers subscription. */
export type BillingPeriod = {
  __typename?: 'BillingPeriod';
  end: Scalars['DateTime']['output'];
  start: Scalars['DateTime']['output'];
};

export enum Builder {
  Heroku = 'HEROKU',
  Nixpacks = 'NIXPACKS',
  Paketo = 'PAKETO',
  Railpack = 'RAILPACK',
}

export enum CdnProvider {
  DetectedCdnProviderCloudflare = 'DETECTED_CDN_PROVIDER_CLOUDFLARE',
  DetectedCdnProviderUnspecified = 'DETECTED_CDN_PROVIDER_UNSPECIFIED',
  Unrecognized = 'UNRECOGNIZED',
}

export type CertificatePublicData = {
  __typename?: 'CertificatePublicData';
  domainNames: Array<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  fingerprintSha256: Scalars['String']['output'];
  issuedAt?: Maybe<Scalars['DateTime']['output']>;
  keyType: KeyType;
};

export enum CertificateStatus {
  CertificateStatusTypeIssueFailed = 'CERTIFICATE_STATUS_TYPE_ISSUE_FAILED',
  CertificateStatusTypeIssuing = 'CERTIFICATE_STATUS_TYPE_ISSUING',
  CertificateStatusTypeUnspecified = 'CERTIFICATE_STATUS_TYPE_UNSPECIFIED',
  CertificateStatusTypeValid = 'CERTIFICATE_STATUS_TYPE_VALID',
  CertificateStatusTypeValidatingOwnership = 'CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP',
  Unrecognized = 'UNRECOGNIZED',
}

export type CnameCheck = {
  __typename?: 'CnameCheck';
  link?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  status: CnameCheckStatus;
};

export enum CnameCheckStatus {
  Error = 'ERROR',
  Info = 'INFO',
  Invalid = 'INVALID',
  Valid = 'VALID',
  Waiting = 'WAITING',
}

export type Container = Node & {
  __typename?: 'Container';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  environment: Environment;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  migratedAt?: Maybe<Scalars['DateTime']['output']>;
  plugin: Plugin;
  pluginId: Scalars['String']['output'];
};

export type Credit = Node & {
  __typename?: 'Credit';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  customerId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  memo?: Maybe<Scalars['String']['output']>;
  type: CreditType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum CreditType {
  Applied = 'APPLIED',
  Credit = 'CREDIT',
  Debit = 'DEBIT',
  Stripe = 'STRIPE',
  Transfer = 'TRANSFER',
  Waived = 'WAIVED',
}

export type CustomDomain = Domain & {
  __typename?: 'CustomDomain';
  /** @deprecated Use the `status` field instead. */
  cnameCheck: CnameCheck;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain: Scalars['String']['output'];
  edgeId?: Maybe<Scalars['String']['output']>;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  projectId?: Maybe<Scalars['String']['output']>;
  serviceId: Scalars['String']['output'];
  status: CustomDomainStatus;
  targetPort?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type CustomDomainCreateInput = {
  domain: Scalars['String']['input'];
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  targetPort?: InputMaybe<Scalars['Int']['input']>;
};

export type CustomDomainStatus = {
  __typename?: 'CustomDomainStatus';
  cdnProvider?: Maybe<CdnProvider>;
  certificateStatus: CertificateStatus;
  certificates?: Maybe<Array<CertificatePublicData>>;
  dnsRecords: Array<DnsRecords>;
};

export type Customer = Node & {
  __typename?: 'Customer';
  /** The total amount of credits that have been applied during the current billing period. */
  appliedCredits: Scalars['Float']['output'];
  billingEmail?: Maybe<Scalars['String']['output']>;
  billingPeriod: BillingPeriod;
  /** The total amount of unused credits for the customer. */
  creditBalance: Scalars['Float']['output'];
  credits: CustomerCreditsConnection;
  /** The current usage for the customer. This value is cached and may not be up to date. */
  currentUsage: Scalars['Float']['output'];
  defaultPaymentMethod?: Maybe<PaymentMethod>;
  defaultPaymentMethodId?: Maybe<Scalars['String']['output']>;
  hasExhaustedFreePlan: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  invoices: Array<CustomerInvoice>;
  isPrepaying: Scalars['Boolean']['output'];
  isTrialing: Scalars['Boolean']['output'];
  isUsageSubscriber: Scalars['Boolean']['output'];
  isWithdrawingToCredits: Scalars['Boolean']['output'];
  planLimitOverride?: Maybe<PlanLimitOverride>;
  remainingUsageCreditBalance: Scalars['Float']['output'];
  state: SubscriptionState;
  stripeCustomerId: Scalars['String']['output'];
  subscriptions: Array<CustomerSubscription>;
  trialDaysRemaining: Scalars['Int']['output'];
  usageLimit?: Maybe<UsageLimit>;
  workspace: Workspace;
};

export type CustomerCreditsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type CustomerCreditsConnection = {
  __typename?: 'CustomerCreditsConnection';
  edges: Array<CustomerCreditsConnectionEdge>;
  pageInfo: PageInfo;
};

export type CustomerCreditsConnectionEdge = {
  __typename?: 'CustomerCreditsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Credit;
};

export type CustomerInvoice = {
  __typename?: 'CustomerInvoice';
  amountDue: Scalars['Float']['output'];
  amountPaid: Scalars['Float']['output'];
  hostedURL?: Maybe<Scalars['String']['output']>;
  invoiceId: Scalars['String']['output'];
  items: Array<SubscriptionItem>;
  paymentIntentStatus?: Maybe<Scalars['String']['output']>;
  pdfURL?: Maybe<Scalars['String']['output']>;
  periodEnd: Scalars['String']['output'];
  periodStart: Scalars['String']['output'];
  reissuedInvoiceFrom?: Maybe<Scalars['String']['output']>;
  reissuedInvoiceOf?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  subscriptionId?: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type CustomerSubscription = {
  __typename?: 'CustomerSubscription';
  billingCycleAnchor: Scalars['DateTime']['output'];
  cancelAt?: Maybe<Scalars['String']['output']>;
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  couponId?: Maybe<Scalars['String']['output']>;
  discounts: Array<SubscriptionDiscount>;
  id: Scalars['String']['output'];
  items: Array<SubscriptionItem>;
  latestInvoiceId: Scalars['String']['output'];
  nextInvoiceCurrentTotal: Scalars['Int']['output'];
  nextInvoiceDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export enum DnsRecordPurpose {
  DnsRecordPurposeAcmeDns01Challenge = 'DNS_RECORD_PURPOSE_ACME_DNS01_CHALLENGE',
  DnsRecordPurposeTrafficRoute = 'DNS_RECORD_PURPOSE_TRAFFIC_ROUTE',
  DnsRecordPurposeUnspecified = 'DNS_RECORD_PURPOSE_UNSPECIFIED',
  Unrecognized = 'UNRECOGNIZED',
}

export enum DnsRecordStatus {
  DnsRecordStatusPropagated = 'DNS_RECORD_STATUS_PROPAGATED',
  DnsRecordStatusRequiresUpdate = 'DNS_RECORD_STATUS_REQUIRES_UPDATE',
  DnsRecordStatusUnspecified = 'DNS_RECORD_STATUS_UNSPECIFIED',
  Unrecognized = 'UNRECOGNIZED',
}

export enum DnsRecordType {
  DnsRecordTypeA = 'DNS_RECORD_TYPE_A',
  DnsRecordTypeCname = 'DNS_RECORD_TYPE_CNAME',
  DnsRecordTypeNs = 'DNS_RECORD_TYPE_NS',
  DnsRecordTypeUnspecified = 'DNS_RECORD_TYPE_UNSPECIFIED',
  Unrecognized = 'UNRECOGNIZED',
}

export type DnsRecords = {
  __typename?: 'DNSRecords';
  currentValue: Scalars['String']['output'];
  fqdn: Scalars['String']['output'];
  hostlabel: Scalars['String']['output'];
  purpose: DnsRecordPurpose;
  recordType: DnsRecordType;
  requiredValue: Scalars['String']['output'];
  status: DnsRecordStatus;
  zone: Scalars['String']['output'];
};

export type Deployment = Node & {
  __typename?: 'Deployment';
  canRedeploy: Scalars['Boolean']['output'];
  canRollback: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<DeploymentCreator>;
  /** Check if a deployment's instances have all stopped */
  deploymentStopped: Scalars['Boolean']['output'];
  environment: Environment;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  instances: Array<DeploymentDeploymentInstance>;
  meta?: Maybe<Scalars['DeploymentMeta']['output']>;
  projectId: Scalars['String']['output'];
  service: Service;
  serviceId?: Maybe<Scalars['String']['output']>;
  snapshotId?: Maybe<Scalars['String']['output']>;
  sockets: Array<DeploymentSocket>;
  staticUrl?: Maybe<Scalars['String']['output']>;
  status: DeploymentStatus;
  suggestAddServiceDomain: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type DeploymentCreator = {
  __typename?: 'DeploymentCreator';
  avatar?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type DeploymentDeploymentInstance = {
  __typename?: 'DeploymentDeploymentInstance';
  status: DeploymentInstanceStatus;
};

export type DeploymentEvent = Node & {
  __typename?: 'DeploymentEvent';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  payload?: Maybe<DeploymentEventPayload>;
  step: DeploymentEventStep;
};

export type DeploymentEventPayload = {
  __typename?: 'DeploymentEventPayload';
  error?: Maybe<Scalars['String']['output']>;
};

export enum DeploymentEventStep {
  BuildImage = 'BUILD_IMAGE',
  CreateContainer = 'CREATE_CONTAINER',
  DrainInstances = 'DRAIN_INSTANCES',
  Healthcheck = 'HEALTHCHECK',
  MigrateVolumes = 'MIGRATE_VOLUMES',
  PreDeployCommand = 'PRE_DEPLOY_COMMAND',
  PublishImage = 'PUBLISH_IMAGE',
  SnapshotCode = 'SNAPSHOT_CODE',
  WaitForDependencies = 'WAIT_FOR_DEPENDENCIES',
}

export type DeploymentInstanceExecution = Node & {
  __typename?: 'DeploymentInstanceExecution';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deploymentId: Scalars['String']['output'];
  deploymentMeta: Scalars['DeploymentMeta']['output'];
  id: Scalars['ID']['output'];
  status: DeploymentInstanceStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type DeploymentInstanceExecutionCreateInput = {
  serviceInstanceId: Scalars['String']['input'];
};

export type DeploymentInstanceExecutionInput = {
  deploymentId: Scalars['String']['input'];
};

export type DeploymentInstanceExecutionListInput = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export enum DeploymentInstanceStatus {
  Crashed = 'CRASHED',
  Created = 'CREATED',
  Exited = 'EXITED',
  Initializing = 'INITIALIZING',
  Removed = 'REMOVED',
  Removing = 'REMOVING',
  Restarting = 'RESTARTING',
  Running = 'RUNNING',
  Skipped = 'SKIPPED',
  Stopped = 'STOPPED',
}

export type DeploymentListInput = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  serviceId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<DeploymentStatusInput>;
};

export type DeploymentSnapshot = Node & {
  __typename?: 'DeploymentSnapshot';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  variables: Scalars['EnvironmentVariables']['output'];
};

export type DeploymentSocket = {
  __typename?: 'DeploymentSocket';
  ipv6: Scalars['Boolean']['output'];
  port: Scalars['Int']['output'];
  processName: Scalars['String']['output'];
  updatedAt: Scalars['Int']['output'];
};

export enum DeploymentStatus {
  Building = 'BUILDING',
  Crashed = 'CRASHED',
  Deploying = 'DEPLOYING',
  Failed = 'FAILED',
  Initializing = 'INITIALIZING',
  NeedsApproval = 'NEEDS_APPROVAL',
  Queued = 'QUEUED',
  Removed = 'REMOVED',
  Removing = 'REMOVING',
  Skipped = 'SKIPPED',
  Sleeping = 'SLEEPING',
  Success = 'SUCCESS',
  Waiting = 'WAITING',
}

export type DeploymentStatusInput = {
  in?: InputMaybe<Array<DeploymentStatus>>;
  notIn?: InputMaybe<Array<DeploymentStatus>>;
};

export type DeploymentTrigger = Node & {
  __typename?: 'DeploymentTrigger';
  baseEnvironmentOverrideId?: Maybe<Scalars['String']['output']>;
  branch: Scalars['String']['output'];
  checkSuites: Scalars['Boolean']['output'];
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  projectId: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  repository: Scalars['String']['output'];
  serviceId?: Maybe<Scalars['String']['output']>;
  validCheckSuites: Scalars['Int']['output'];
};

export type DeploymentTriggerCreateInput = {
  branch: Scalars['String']['input'];
  checkSuites?: InputMaybe<Scalars['Boolean']['input']>;
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  repository: Scalars['String']['input'];
  rootDirectory?: InputMaybe<Scalars['String']['input']>;
  serviceId: Scalars['String']['input'];
};

export type DeploymentTriggerUpdateInput = {
  branch?: InputMaybe<Scalars['String']['input']>;
  checkSuites?: InputMaybe<Scalars['Boolean']['input']>;
  repository?: InputMaybe<Scalars['String']['input']>;
  rootDirectory?: InputMaybe<Scalars['String']['input']>;
};

export type DockerComposeImport = {
  __typename?: 'DockerComposeImport';
  errors: Array<Scalars['String']['output']>;
  patch?: Maybe<Scalars['EnvironmentConfig']['output']>;
};

export type Domain = {
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain: Scalars['String']['output'];
  edgeId?: Maybe<Scalars['String']['output']>;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  projectId?: Maybe<Scalars['String']['output']>;
  serviceId: Scalars['String']['output'];
  targetPort?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DomainAvailable = {
  __typename?: 'DomainAvailable';
  available: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
};

export type DomainWithStatus = {
  __typename?: 'DomainWithStatus';
  cdnProvider?: Maybe<CdnProvider>;
  certificateStatus: CertificateStatus;
  certificates?: Maybe<Array<CertificatePublicData>>;
  dnsRecords: Array<DnsRecords>;
  domain?: Maybe<Domain>;
};

export type EgressGateway = {
  __typename?: 'EgressGateway';
  ipv4: Scalars['String']['output'];
  region: Scalars['String']['output'];
};

export type EgressGatewayCreateInput = {
  environmentId: Scalars['String']['input'];
  region?: InputMaybe<Scalars['String']['input']>;
  serviceId: Scalars['String']['input'];
};

export type EgressGatewayServiceTargetInput = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type Environment = Node & {
  __typename?: 'Environment';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deploymentTriggers: EnvironmentDeploymentTriggersConnection;
  deployments: EnvironmentDeploymentsConnection;
  id: Scalars['ID']['output'];
  isEphemeral: Scalars['Boolean']['output'];
  meta?: Maybe<EnvironmentMeta>;
  name: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
  serviceInstances: EnvironmentServiceInstancesConnection;
  sourceEnvironment?: Maybe<Environment>;
  unmergedChangesCount?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variables: EnvironmentVariablesConnection;
  volumeInstances: EnvironmentVolumeInstancesConnection;
};

export type EnvironmentDeploymentTriggersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type EnvironmentDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type EnvironmentServiceInstancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type EnvironmentVariablesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type EnvironmentVolumeInstancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type EnvironmentCreateInput = {
  ephemeral?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  /** When committing the changes immediately, skip any initial deployments. */
  skipInitialDeploys?: InputMaybe<Scalars['Boolean']['input']>;
  /** Create the environment with all of the services, volumes, configuration, and variables from this source environment. */
  sourceEnvironmentId?: InputMaybe<Scalars['String']['input']>;
  /** Stage the initial changes for the environment. If false (default), the changes will be committed immediately. */
  stageInitialChanges?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EnvironmentDeploymentTriggersConnection = {
  __typename?: 'EnvironmentDeploymentTriggersConnection';
  edges: Array<EnvironmentDeploymentTriggersConnectionEdge>;
  pageInfo: PageInfo;
};

export type EnvironmentDeploymentTriggersConnectionEdge = {
  __typename?: 'EnvironmentDeploymentTriggersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentTrigger;
};

export type EnvironmentDeploymentsConnection = {
  __typename?: 'EnvironmentDeploymentsConnection';
  edges: Array<EnvironmentDeploymentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type EnvironmentDeploymentsConnectionEdge = {
  __typename?: 'EnvironmentDeploymentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Deployment;
};

export type EnvironmentMeta = {
  __typename?: 'EnvironmentMeta';
  baseBranch?: Maybe<Scalars['String']['output']>;
  branch?: Maybe<Scalars['String']['output']>;
  prCommentId?: Maybe<Scalars['Int']['output']>;
  prNumber?: Maybe<Scalars['Int']['output']>;
  prRepo?: Maybe<Scalars['String']['output']>;
  prTitle?: Maybe<Scalars['String']['output']>;
};

export type EnvironmentRenameInput = {
  name: Scalars['String']['input'];
};

export type EnvironmentServiceInstancesConnection = {
  __typename?: 'EnvironmentServiceInstancesConnection';
  edges: Array<EnvironmentServiceInstancesConnectionEdge>;
  pageInfo: PageInfo;
};

export type EnvironmentServiceInstancesConnectionEdge = {
  __typename?: 'EnvironmentServiceInstancesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ServiceInstance;
};

export type EnvironmentTriggersDeployInput = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type EnvironmentVariablesConnection = {
  __typename?: 'EnvironmentVariablesConnection';
  edges: Array<EnvironmentVariablesConnectionEdge>;
  pageInfo: PageInfo;
};

export type EnvironmentVariablesConnectionEdge = {
  __typename?: 'EnvironmentVariablesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Variable;
};

export type EnvironmentVolumeInstancesConnection = {
  __typename?: 'EnvironmentVolumeInstancesConnection';
  edges: Array<EnvironmentVolumeInstancesConnectionEdge>;
  pageInfo: PageInfo;
};

export type EnvironmentVolumeInstancesConnectionEdge = {
  __typename?: 'EnvironmentVolumeInstancesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: VolumeInstance;
};

/** The estimated usage of a single measurement. */
export type EstimatedUsage = {
  __typename?: 'EstimatedUsage';
  /** The estimated value. */
  estimatedValue: Scalars['Float']['output'];
  /** The measurement that was estimated. */
  measurement: MetricMeasurement;
  projectId: Scalars['String']['output'];
};

export type Event = Node & {
  __typename?: 'Event';
  action: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  environment?: Maybe<Environment>;
  environmentId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  object: Scalars['String']['output'];
  payload?: Maybe<Scalars['JSON']['output']>;
  project: Project;
  projectId: Scalars['String']['output'];
};

export type EventFilterInput = {
  action?: InputMaybe<EventStringListFilter>;
  object?: InputMaybe<EventStringListFilter>;
};

export type EventStringListFilter = {
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ExplicitOwnerInput = {
  /** The ID of the owner */
  id: Scalars['String']['input'];
  /** The type of owner */
  type?: InputMaybe<ResourceOwnerType>;
};

export type ExternalWorkspace = {
  __typename?: 'ExternalWorkspace';
  avatar?: Maybe<Scalars['String']['output']>;
  banReason?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customerState: SubscriptionState;
  discordRole?: Maybe<Scalars['String']['output']>;
  hasBAA: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  isTrialing?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  preferredRegion?: Maybe<Scalars['String']['output']>;
  projects: Array<Project>;
  subscriptionModel: SubscriptionModel;
  supportTierOverride?: Maybe<Scalars['String']['output']>;
  teamId?: Maybe<Scalars['String']['output']>;
};

export type FeatureFlagToggleInput = {
  flag: ActiveFeatureFlag;
};

export type FunctionRuntime = {
  __typename?: 'FunctionRuntime';
  /** The image of the function runtime */
  image: Scalars['String']['output'];
  /** The latest version of the function runtime */
  latestVersion: FunctionRuntimeVersion;
  /** The name of the function runtime */
  name: FunctionRuntimeName;
  /** The versions of the function runtime */
  versions: Array<FunctionRuntimeVersion>;
};

/** Supported function runtime environments */
export enum FunctionRuntimeName {
  Bun = 'bun',
}

export type FunctionRuntimeVersion = {
  __typename?: 'FunctionRuntimeVersion';
  image: Scalars['String']['output'];
  tag: Scalars['String']['output'];
};

export type GitHubAccess = {
  __typename?: 'GitHubAccess';
  hasAccess: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
};

export type GitHubBranch = {
  __typename?: 'GitHubBranch';
  name: Scalars['String']['output'];
};

export type GitHubRepo = {
  __typename?: 'GitHubRepo';
  defaultBranch: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  installationId: Scalars['String']['output'];
  isPrivate: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type GitHubRepoDeployInput = {
  branch?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  repo: Scalars['String']['input'];
};

export type GitHubRepoUpdateInput = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type GitHubRepoWithoutInstallation = {
  __typename?: 'GitHubRepoWithoutInstallation';
  defaultBranch: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isPrivate: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type HerokuApp = {
  __typename?: 'HerokuApp';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type HerokuImportVariablesInput = {
  environmentId: Scalars['String']['input'];
  herokuAppId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

/** The result of a http logs query. */
export type HttpLog = {
  __typename?: 'HttpLog';
  /** The client user agent */
  clientUa: Scalars['String']['output'];
  /** The deployment ID that was requested */
  deploymentId: Scalars['String']['output'];
  /** The deployment instance ID that was requested */
  deploymentInstanceId: Scalars['String']['output'];
  /** The downstream HTTP protocol version */
  downstreamProto: Scalars['String']['output'];
  /** The edge region the client connected to */
  edgeRegion: Scalars['String']['output'];
  /** The requested host */
  host: Scalars['String']['output'];
  /** The http status of the log */
  httpStatus: Scalars['Int']['output'];
  /** The request HTTP method */
  method: Scalars['String']['output'];
  /** The requested path */
  path: Scalars['String']['output'];
  /** The unique request ID */
  requestId: Scalars['String']['output'];
  /** Details about the upstream response */
  responseDetails: Scalars['String']['output'];
  /** Received bytes */
  rxBytes: Scalars['Int']['output'];
  /** The source IP of the request */
  srcIp: Scalars['String']['output'];
  /** The timestamp the log was created */
  timestamp: Scalars['String']['output'];
  /** The total duration the request took */
  totalDuration: Scalars['Int']['output'];
  /** Outgoing bytes */
  txBytes: Scalars['Int']['output'];
  /** The upstream address */
  upstreamAddress: Scalars['String']['output'];
  /** The upstream HTTP protocol version */
  upstreamProto: Scalars['String']['output'];
  /** How long the upstream request took to respond */
  upstreamRqDuration: Scalars['Int']['output'];
};

export type Incident = {
  __typename?: 'Incident';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
  status: IncidentStatus;
  url: Scalars['String']['output'];
};

export enum IncidentStatus {
  Identified = 'IDENTIFIED',
  Investigating = 'INVESTIGATING',
  Monitoring = 'MONITORING',
  Resolved = 'RESOLVED',
}

export type Integration = Node & {
  __typename?: 'Integration';
  config: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  projectId: Scalars['String']['output'];
};

export type IntegrationAuth = Node & {
  __typename?: 'IntegrationAuth';
  id: Scalars['ID']['output'];
  integrations: IntegrationAuthIntegrationsConnection;
  provider: Scalars['String']['output'];
  providerId: Scalars['String']['output'];
};

export type IntegrationAuthIntegrationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type IntegrationAuthIntegrationsConnection = {
  __typename?: 'IntegrationAuthIntegrationsConnection';
  edges: Array<IntegrationAuthIntegrationsConnectionEdge>;
  pageInfo: PageInfo;
};

export type IntegrationAuthIntegrationsConnectionEdge = {
  __typename?: 'IntegrationAuthIntegrationsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Integration;
};

export type IntegrationCreateInput = {
  config: Scalars['JSON']['input'];
  integrationAuthId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type IntegrationUpdateInput = {
  config: Scalars['JSON']['input'];
  integrationAuthId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type InviteCode = Node & {
  __typename?: 'InviteCode';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
  role: ProjectRole;
};

export type JobApplicationCreateInput = {
  email: Scalars['String']['input'];
  jobId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  why: Scalars['String']['input'];
};

export enum KeyType {
  KeyTypeEcdsa = 'KEY_TYPE_ECDSA',
  KeyTypeRsa_2048 = 'KEY_TYPE_RSA_2048',
  KeyTypeRsa_4096 = 'KEY_TYPE_RSA_4096',
  KeyTypeUnspecified = 'KEY_TYPE_UNSPECIFIED',
  Unrecognized = 'UNRECOGNIZED',
}

/** The result of a logs query. */
export type Log = {
  __typename?: 'Log';
  /** The attributes that were parsed from a structured log */
  attributes: Array<LogAttribute>;
  /** The contents of the log message */
  message: Scalars['String']['output'];
  /** The severity of the log message (eg. err) */
  severity?: Maybe<Scalars['String']['output']>;
  /** The tags that were associated with the log */
  tags?: Maybe<LogTags>;
  /** The timestamp of the log message in format RFC3339 (nano) */
  timestamp: Scalars['String']['output'];
};

/** The attributes associated with a structured log */
export type LogAttribute = {
  __typename?: 'LogAttribute';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** The tags associated with a specific log */
export type LogTags = {
  __typename?: 'LogTags';
  deploymentId?: Maybe<Scalars['String']['output']>;
  deploymentInstanceId?: Maybe<Scalars['String']['output']>;
  environmentId?: Maybe<Scalars['String']['output']>;
  pluginId?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  serviceId?: Maybe<Scalars['String']['output']>;
  snapshotId?: Maybe<Scalars['String']['output']>;
};

export type LoginSessionAuthInput = {
  code: Scalars['String']['input'];
  hostname?: InputMaybe<Scalars['String']['input']>;
};

export type Maintenance = {
  __typename?: 'Maintenance';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
  status: MaintenanceStatus;
  url: Scalars['String']['output'];
};

export enum MaintenanceStatus {
  Completed = 'COMPLETED',
  Inprogress = 'INPROGRESS',
  Notstartedyet = 'NOTSTARTEDYET',
}

/** A single sample of a metric. */
export type Metric = {
  __typename?: 'Metric';
  /** The timestamp of the sample. Represented has number of seconds since the Unix epoch. */
  ts: Scalars['Int']['output'];
  /** The value of the sample. */
  value: Scalars['Float']['output'];
};

/** A thing that can be measured on Railway. */
export enum MetricMeasurement {
  BackupUsageGb = 'BACKUP_USAGE_GB',
  CpuLimit = 'CPU_LIMIT',
  CpuUsage = 'CPU_USAGE',
  CpuUsage_2 = 'CPU_USAGE_2',
  DiskUsageGb = 'DISK_USAGE_GB',
  EphemeralDiskUsageGb = 'EPHEMERAL_DISK_USAGE_GB',
  MeasurementUnspecified = 'MEASUREMENT_UNSPECIFIED',
  MemoryLimitGb = 'MEMORY_LIMIT_GB',
  MemoryUsageGb = 'MEMORY_USAGE_GB',
  NetworkRxGb = 'NETWORK_RX_GB',
  NetworkTxGb = 'NETWORK_TX_GB',
  Unrecognized = 'UNRECOGNIZED',
}

/** A property that can be used to group metrics. */
export enum MetricTag {
  DeploymentId = 'DEPLOYMENT_ID',
  DeploymentInstanceId = 'DEPLOYMENT_INSTANCE_ID',
  EnvironmentId = 'ENVIRONMENT_ID',
  HostType = 'HOST_TYPE',
  KeyUnspecified = 'KEY_UNSPECIFIED',
  PluginId = 'PLUGIN_ID',
  ProjectId = 'PROJECT_ID',
  ServiceId = 'SERVICE_ID',
  Unrecognized = 'UNRECOGNIZED',
  VolumeId = 'VOLUME_ID',
}

/** The tags that were used to group the metric. */
export type MetricTags = {
  __typename?: 'MetricTags';
  deploymentId?: Maybe<Scalars['String']['output']>;
  environmentId?: Maybe<Scalars['String']['output']>;
  pluginId?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['String']['output']>;
  serviceId?: Maybe<Scalars['String']['output']>;
  volumeId?: Maybe<Scalars['String']['output']>;
};

/** The result of a metrics query. */
export type MetricsResult = {
  __typename?: 'MetricsResult';
  /** The measurement of the metric. */
  measurement: MetricMeasurement;
  /** The tags that were used to group the metric. Only the tags that were used to by will be present. */
  tags: MetricTags;
  /** The samples of the metric. */
  values: Array<Metric>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Creates a new API token. */
  apiTokenCreate: Scalars['String']['output'];
  /** Deletes an API token. */
  apiTokenDelete: Scalars['Boolean']['output'];
  /** Sets the base environment override for a deployment trigger. */
  baseEnvironmentOverride: Scalars['Boolean']['output'];
  /** Creates a new custom domain. */
  customDomainCreate: CustomDomain;
  /** Deletes a custom domain. */
  customDomainDelete: Scalars['Boolean']['output'];
  /** Updates a custom domain. */
  customDomainUpdate: Scalars['Boolean']['output'];
  /** Create a free plan subscription for a customer */
  customerCreateFreePlanSubscription: Scalars['Boolean']['output'];
  /** Toggle whether a customer is automatically withdrawing to credits */
  customerTogglePayoutsToCredits: Scalars['Boolean']['output'];
  /** Approves a deployment. */
  deploymentApprove: Scalars['Boolean']['output'];
  /** Cancels a deployment. */
  deploymentCancel: Scalars['Boolean']['output'];
  /** Invoke a deployment instance execution. */
  deploymentInstanceExecutionCreate: Scalars['Boolean']['output'];
  /** Redeploys a deployment. */
  deploymentRedeploy: Deployment;
  /** Removes a deployment. */
  deploymentRemove: Scalars['Boolean']['output'];
  /** Restarts a deployment. */
  deploymentRestart: Scalars['Boolean']['output'];
  /** Rolls back to a deployment. */
  deploymentRollback: Scalars['Boolean']['output'];
  /** Stops a deployment. */
  deploymentStop: Scalars['Boolean']['output'];
  /** Creates a deployment trigger. */
  deploymentTriggerCreate: DeploymentTrigger;
  /** Deletes a deployment trigger. */
  deploymentTriggerDelete: Scalars['Boolean']['output'];
  /** Updates a deployment trigger. */
  deploymentTriggerUpdate: DeploymentTrigger;
  /** Create services and volumes from docker compose */
  dockerComposeImport: DockerComposeImport;
  /** Create a new egress gateway association for a service instance */
  egressGatewayAssociationCreate: Array<EgressGateway>;
  /** Clear all egress gateway associations for a service instance */
  egressGatewayAssociationsClear: Scalars['Boolean']['output'];
  /** Change the User's account email if there is a valid change email request. */
  emailChangeConfirm: Scalars['Boolean']['output'];
  /** Initiate an email change request for a user */
  emailChangeInitiate: Scalars['Boolean']['output'];
  /** Creates a new environment. */
  environmentCreate: Environment;
  /** Deletes an environment. */
  environmentDelete: Scalars['Boolean']['output'];
  /** Commit the provided patch to the environment. */
  environmentPatchCommit: Scalars['String']['output'];
  /** Renames an environment. */
  environmentRename: Environment;
  /** Deploys all connected triggers for an environment. */
  environmentTriggersDeploy: Scalars['Boolean']['output'];
  /** Agree to the fair use policy for the currently authenticated user */
  fairUseAgree: Scalars['Boolean']['output'];
  /** Add a feature flag for a user */
  featureFlagAdd: Scalars['Boolean']['output'];
  /** Remove a feature flag for a user */
  featureFlagRemove: Scalars['Boolean']['output'];
  /** Deploys a GitHub repo */
  githubRepoDeploy: Scalars['String']['output'];
  /** Updates a GitHub repo through the linked template */
  githubRepoUpdate: Scalars['Boolean']['output'];
  /** Import variables from a Heroku app into a Railway service. Returns the number of variables imports */
  herokuImportVariables: Scalars['Int']['output'];
  /** Create an integration for a project */
  integrationCreate: Integration;
  /** Delete an integration for a project */
  integrationDelete: Scalars['Boolean']['output'];
  /** Update an integration for a project */
  integrationUpdate: Integration;
  /** Join a project using an invite code */
  inviteCodeUse: Project;
  /** Creates a new job application. */
  jobApplicationCreate: Scalars['Boolean']['output'];
  /** Auth a login session for a user */
  loginSessionAuth: Scalars['Boolean']['output'];
  /** Cancel a login session */
  loginSessionCancel: Scalars['Boolean']['output'];
  /** Get a token for a login session if it exists */
  loginSessionConsume?: Maybe<Scalars['String']['output']>;
  /** Start a CLI login session */
  loginSessionCreate: Scalars['String']['output'];
  /** Verify if a login session is valid */
  loginSessionVerify: Scalars['Boolean']['output'];
  /** Deletes session for current user if it exists */
  logout: Scalars['Boolean']['output'];
  /** Create an observability dashboard */
  observabilityDashboardCreate: Scalars['Boolean']['output'];
  /** Reset an observability dashboard to default dashboard items */
  observabilityDashboardReset: Scalars['Boolean']['output'];
  /** Update an observability dashboard */
  observabilityDashboardUpdate: Scalars['Boolean']['output'];
  /**
   * Creates a new plugin.
   * @deprecated Plugins are deprecated on Railway. Use database templates instead.
   */
  pluginCreate: Plugin;
  /** Deletes a plugin. */
  pluginDelete: Scalars['Boolean']['output'];
  /** Reset envs and container for a plugin in an environment */
  pluginReset: Scalars['Boolean']['output'];
  /** Resets the credentials for a plugin in an environment */
  pluginResetCredentials: Scalars['String']['output'];
  /** Restarts a plugin. */
  pluginRestart: Plugin;
  /** Force start a plugin */
  pluginStart: Scalars['Boolean']['output'];
  /** Updates an existing plugin. */
  pluginUpdate: Plugin;
  /** Create/Updates preferences overrides for a specific resource belonging to a user */
  preferenceOverridesCreateUpdate: Scalars['Boolean']['output'];
  /** Destroy preferences overrides for a specific resource belonging to a user */
  preferenceOverridesDestroyForResource: Scalars['Boolean']['output'];
  /** Update the email preferences for a user */
  preferencesUpdate: Preferences;
  /** Create or get a private network. */
  privateNetworkCreateOrGet: PrivateNetwork;
  /** Create or get a private network endpoint. */
  privateNetworkEndpointCreateOrGet: PrivateNetworkEndpoint;
  /** Delete a private network endpoint. */
  privateNetworkEndpointDelete: Scalars['Boolean']['output'];
  /** Rename a private network endpoint. */
  privateNetworkEndpointRename: Scalars['Boolean']['output'];
  /** Delete all private networks for an environment. */
  privateNetworksForEnvironmentDelete: Scalars['Boolean']['output'];
  /** Claims a project. */
  projectClaim: Project;
  /** Creates a new project. */
  projectCreate: Project;
  /** Deletes a project. */
  projectDelete: Scalars['Boolean']['output'];
  /** Accept a project invitation using the invite code */
  projectInvitationAccept: ProjectPermission;
  /** Create an invitation for a project */
  projectInvitationCreate: ProjectInvitation;
  /** Delete an invitation for a project */
  projectInvitationDelete: Scalars['Boolean']['output'];
  /** Resend an invitation for a project */
  projectInvitationResend: ProjectInvitation;
  /** Invite a user by email to a project */
  projectInviteUser: Scalars['Boolean']['output'];
  /** Leave project as currently authenticated user */
  projectLeave: Scalars['Boolean']['output'];
  /** Remove user from a project */
  projectMemberRemove: Array<ProjectMember>;
  /** Change the role for a user within a project */
  projectMemberUpdate: ProjectMember;
  /** Deletes a project with a 48 hour grace period. */
  projectScheduleDelete: Scalars['Boolean']['output'];
  /** Cancel scheduled deletion of a project */
  projectScheduleDeleteCancel: Scalars['Boolean']['output'];
  /** Force delete a scheduled deletion of a project (skips the grace period) */
  projectScheduleDeleteForce: Scalars['Boolean']['output'];
  /** Create a token for a project that has access to a specific environment */
  projectTokenCreate: Scalars['String']['output'];
  /** Delete a project token */
  projectTokenDelete: Scalars['Boolean']['output'];
  /** Confirm the transfer of project ownership */
  projectTransferConfirm: Scalars['Boolean']['output'];
  /** Initiate the transfer of project ownership */
  projectTransferInitiate: Scalars['Boolean']['output'];
  /** Transfer a project to a team */
  projectTransferToTeam: Scalars['Boolean']['output'];
  /** Updates a project. */
  projectUpdate: Project;
  /** Deletes a ProviderAuth. */
  providerAuthRemove: Scalars['Boolean']['output'];
  /** Generates a new set of recovery codes for the authenticated user. */
  recoveryCodeGenerate: RecoveryCodes;
  /** Validates a recovery code. */
  recoveryCodeValidate: Scalars['Boolean']['output'];
  /** Updates the ReferralInfo for the authenticated user. */
  referralInfoUpdate: ReferralInfo;
  /** Send a notification email to user when bounty is won */
  sendBountyWonEmail: Scalars['Boolean']['output'];
  /** Send a community thread notification email */
  sendCommunityThreadNotificationEmail: Scalars['Boolean']['output'];
  /** Send an email to welcome a user to our community */
  sendCommunityWelcomeEmail: Scalars['Boolean']['output'];
  /** Send a new bounty question email */
  sendNewBountyEmail: Scalars['Boolean']['output'];
  /** Send a question moved to bounty email */
  sendQuestionMovedToBountyEmail: Scalars['Boolean']['output'];
  /** Connect a service to a source */
  serviceConnect: Service;
  /** Creates a new service. */
  serviceCreate: Service;
  /** Deletes a service. */
  serviceDelete: Scalars['Boolean']['output'];
  /** Disconnect a service from a repo */
  serviceDisconnect: Service;
  /** Creates a new service domain. */
  serviceDomainCreate: ServiceDomain;
  /** Deletes a service domain. */
  serviceDomainDelete: Scalars['Boolean']['output'];
  /** Updates a service domain. */
  serviceDomainUpdate: Scalars['Boolean']['output'];
  /**
   * Duplicate a service, including its configuration, variables, and volumes.
   * @deprecated This API route is used only by the CLI. We plan to remove it in a future version. Please use the UI to duplicate services.
   */
  serviceDuplicate: Service;
  /** Add a feature flag for a service */
  serviceFeatureFlagAdd: Scalars['Boolean']['output'];
  /** Remove a feature flag for a service */
  serviceFeatureFlagRemove: Scalars['Boolean']['output'];
  /** Deploy a service instance */
  serviceInstanceDeploy: Scalars['Boolean']['output'];
  /** Deploy a service instance. Returns a deployment ID */
  serviceInstanceDeployV2: Scalars['String']['output'];
  /** Update the resource limits for a service instance */
  serviceInstanceLimitsUpdate: Scalars['Boolean']['output'];
  /** Redeploy a service instance */
  serviceInstanceRedeploy: Scalars['Boolean']['output'];
  /** Update a service instance */
  serviceInstanceUpdate: Scalars['Boolean']['output'];
  /** Remove the upstream URL from all service instances for this service */
  serviceRemoveUpstreamUrl: Service;
  /** Updates a service. */
  serviceUpdate: Service;
  /** Deletes a session. */
  sessionDelete: Scalars['Boolean']['output'];
  /** Configure a shared variable. */
  sharedVariableConfigure: Variable;
  /**
   * Creates a new TCP proxy for a service instance.
   * @deprecated Use staged changes and apply them. Creating a TCP proxy with this endpoint requires you to redeploy the service for it to be active.
   */
  tcpProxyCreate: TcpProxy;
  /** Deletes a TCP proxy by id */
  tcpProxyDelete: Scalars['Boolean']['output'];
  /** Bulk transfer projects from user to team */
  teamBulkProjectTransfer: Scalars['Boolean']['output'];
  /** Create a team and subscribe to the Pro plan */
  teamCreateAndSubscribe: TeamCreateAndSubscribeResponse;
  /** Get an invite code for a team and role */
  teamInviteCodeCreate: Scalars['String']['output'];
  /** Use an invite code to join a team */
  teamInviteCodeUse: Team;
  /** Leave a team */
  teamLeave: Scalars['Boolean']['output'];
  /** Changes a user team permissions. */
  teamPermissionChange: Scalars['Boolean']['output'];
  /** Create a new team trusted domain for this team */
  teamTrustedDomainCreate: Scalars['Boolean']['output'];
  /** Delete a team trusted domain */
  teamTrustedDomainDelete: Scalars['Boolean']['output'];
  /** Invite a user by email to a team */
  teamUserInvite: Scalars['Boolean']['output'];
  /** Remove a user from a team */
  teamUserRemove: Scalars['Boolean']['output'];
  /** Duplicates an existing template */
  templateClone: Template;
  /** Deletes a template. */
  templateDelete: Scalars['Boolean']['output'];
  /**
   * Deploys a template.
   * @deprecated Deprecated in favor of templateDeployV2
   */
  templateDeploy: TemplateDeployPayload;
  /** Deploys a template using the serialized template config */
  templateDeployV2: TemplateDeployPayload;
  /** Generate a template for a project */
  templateGenerate: Template;
  /** Nullify the community thread slug for a template, if one is found with the provided slug */
  templateMaybeUnsetCommunityThreadSlug: Scalars['Boolean']['output'];
  /** Publishes a template. */
  templatePublish: Template;
  /** Ejects a service from the template and creates a new repo in the provided org. */
  templateServiceSourceEject: Scalars['Boolean']['output'];
  /** Unpublishes a template. */
  templateUnpublish: Scalars['Boolean']['output'];
  /** Setup 2FA authorization for authenticated user. */
  twoFactorInfoCreate: RecoveryCodes;
  /** Deletes the TwoFactorInfo for the authenticated user. */
  twoFactorInfoDelete: Scalars['Boolean']['output'];
  /** Generates the 2FA app secret for the authenticated user. */
  twoFactorInfoSecret: TwoFactorInfoSecret;
  /** Validates the token for a 2FA action or for a login request. */
  twoFactorInfoValidate: Scalars['Boolean']['output'];
  /** Generate a Slack channel for a team */
  upsertSlackChannelForTeam: Scalars['Boolean']['output'];
  /** Remove the usage limit for a customer */
  usageLimitRemove: Scalars['Boolean']['output'];
  /** Set the usage limit for a customer */
  usageLimitSet: Scalars['Boolean']['output'];
  /** Unsubscribe from the Beta program. */
  userBetaLeave: Scalars['Boolean']['output'];
  /** Delete the currently authenticated user */
  userDelete: Scalars['Boolean']['output'];
  /** Disconnect your Railway account from Discord. */
  userDiscordDisconnect: Scalars['Boolean']['output'];
  /** Remove a flag on the user. */
  userFlagsRemove: Scalars['Boolean']['output'];
  /** Set flags on the authenticated user. */
  userFlagsSet: Scalars['Boolean']['output'];
  /** Updates the profile for the authenticated user */
  userProfileUpdate: Scalars['Boolean']['output'];
  /** Disconnect your Railway account from Slack. */
  userSlackDisconnect: Scalars['Boolean']['output'];
  /** Update date of TermsAgreedOn */
  userTermsUpdate?: Maybe<User>;
  /** Update currently logged in user */
  userUpdate?: Maybe<User>;
  /** Upserts a collection of variables. */
  variableCollectionUpsert: Scalars['Boolean']['output'];
  /** Deletes a variable. */
  variableDelete: Scalars['Boolean']['output'];
  /** Upserts a variable. */
  variableUpsert: Scalars['Boolean']['output'];
  /** Create a persistent volume in a project */
  volumeCreate: Volume;
  /** Delete a persistent volume in a project */
  volumeDelete: Scalars['Boolean']['output'];
  /** Create backup of a volume instance */
  volumeInstanceBackupCreate: WorkflowId;
  /** Deletes volume instance backup */
  volumeInstanceBackupDelete: WorkflowId;
  /** Removes backup expiration date */
  volumeInstanceBackupLock: Scalars['Boolean']['output'];
  /** Restore a volume instance from a backup */
  volumeInstanceBackupRestore: WorkflowId;
  /** Manage schedule for backups of a volume instance */
  volumeInstanceBackupScheduleUpdate: Scalars['Boolean']['output'];
  /** Update a volume instance. If no environmentId is provided, all volume instances for the volume will be updated. */
  volumeInstanceUpdate: Scalars['Boolean']['output'];
  /** Update a persistent volume in a project */
  volumeUpdate: Volume;
  /** Create a webhook on a project */
  webhookCreate: ProjectWebhook;
  /** Delete a webhook from a project */
  webhookDelete: Scalars['Boolean']['output'];
  /** Update a webhook on a project */
  webhookUpdate: ProjectWebhook;
  /** Delete a workspace and all data associated with it */
  workspaceDelete: Scalars['Boolean']['output'];
  /** Leave a workspace */
  workspaceLeave: Scalars['Boolean']['output'];
  /** Update a workspace by id */
  workspaceUpdate: Scalars['Boolean']['output'];
  /** Generate a Slack channel for a workspace */
  workspaceUpsertSlackChannel: Scalars['Boolean']['output'];
};

export type MutationApiTokenCreateArgs = {
  input: ApiTokenCreateInput;
};

export type MutationApiTokenDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationBaseEnvironmentOverrideArgs = {
  id: Scalars['String']['input'];
  input: BaseEnvironmentOverrideInput;
};

export type MutationCustomDomainCreateArgs = {
  input: CustomDomainCreateInput;
};

export type MutationCustomDomainDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationCustomDomainUpdateArgs = {
  environmentId: Scalars['String']['input'];
  id: Scalars['String']['input'];
  targetPort?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationCustomerCreateFreePlanSubscriptionArgs = {
  id: Scalars['String']['input'];
};

export type MutationCustomerTogglePayoutsToCreditsArgs = {
  customerId: Scalars['String']['input'];
  input: CustomerTogglePayoutsToCreditsInput;
};

export type MutationDeploymentApproveArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentCancelArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentInstanceExecutionCreateArgs = {
  input: DeploymentInstanceExecutionCreateInput;
};

export type MutationDeploymentRedeployArgs = {
  id: Scalars['String']['input'];
  usePreviousImageTag?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationDeploymentRemoveArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentRestartArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentRollbackArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentStopArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentTriggerCreateArgs = {
  input: DeploymentTriggerCreateInput;
};

export type MutationDeploymentTriggerDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeploymentTriggerUpdateArgs = {
  id: Scalars['String']['input'];
  input: DeploymentTriggerUpdateInput;
};

export type MutationDockerComposeImportArgs = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  skipStagingPatch?: InputMaybe<Scalars['Boolean']['input']>;
  yaml: Scalars['String']['input'];
};

export type MutationEgressGatewayAssociationCreateArgs = {
  input: EgressGatewayCreateInput;
};

export type MutationEgressGatewayAssociationsClearArgs = {
  input: EgressGatewayServiceTargetInput;
};

export type MutationEmailChangeConfirmArgs = {
  nonce: Scalars['String']['input'];
};

export type MutationEmailChangeInitiateArgs = {
  newEmail: Scalars['String']['input'];
};

export type MutationEnvironmentCreateArgs = {
  input: EnvironmentCreateInput;
};

export type MutationEnvironmentDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationEnvironmentPatchCommitArgs = {
  commitMessage?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  patch?: InputMaybe<Scalars['EnvironmentConfig']['input']>;
};

export type MutationEnvironmentRenameArgs = {
  id: Scalars['String']['input'];
  input: EnvironmentRenameInput;
};

export type MutationEnvironmentTriggersDeployArgs = {
  input: EnvironmentTriggersDeployInput;
};

export type MutationFairUseAgreeArgs = {
  agree: Scalars['Boolean']['input'];
};

export type MutationFeatureFlagAddArgs = {
  input: FeatureFlagToggleInput;
};

export type MutationFeatureFlagRemoveArgs = {
  input: FeatureFlagToggleInput;
};

export type MutationGithubRepoDeployArgs = {
  input: GitHubRepoDeployInput;
};

export type MutationGithubRepoUpdateArgs = {
  input: GitHubRepoUpdateInput;
};

export type MutationHerokuImportVariablesArgs = {
  input: HerokuImportVariablesInput;
};

export type MutationIntegrationCreateArgs = {
  input: IntegrationCreateInput;
};

export type MutationIntegrationDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationIntegrationUpdateArgs = {
  id: Scalars['String']['input'];
  input: IntegrationUpdateInput;
};

export type MutationInviteCodeUseArgs = {
  code: Scalars['String']['input'];
};

export type MutationJobApplicationCreateArgs = {
  input: JobApplicationCreateInput;
  resume: Scalars['Upload']['input'];
};

export type MutationLoginSessionAuthArgs = {
  input: LoginSessionAuthInput;
};

export type MutationLoginSessionCancelArgs = {
  code: Scalars['String']['input'];
};

export type MutationLoginSessionConsumeArgs = {
  code: Scalars['String']['input'];
};

export type MutationLoginSessionVerifyArgs = {
  code: Scalars['String']['input'];
};

export type MutationObservabilityDashboardCreateArgs = {
  input: ObservabilityDashboardCreateInput;
};

export type MutationObservabilityDashboardResetArgs = {
  id: Scalars['String']['input'];
};

export type MutationObservabilityDashboardUpdateArgs = {
  id: Scalars['String']['input'];
  input: Array<ObservabilityDashboardUpdateInput>;
};

export type MutationPluginCreateArgs = {
  input: PluginCreateInput;
};

export type MutationPluginDeleteArgs = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};

export type MutationPluginResetArgs = {
  id: Scalars['String']['input'];
  input: ResetPluginInput;
};

export type MutationPluginResetCredentialsArgs = {
  id: Scalars['String']['input'];
  input: ResetPluginCredentialsInput;
};

export type MutationPluginRestartArgs = {
  id: Scalars['String']['input'];
  input: PluginRestartInput;
};

export type MutationPluginStartArgs = {
  id: Scalars['String']['input'];
  input: PluginRestartInput;
};

export type MutationPluginUpdateArgs = {
  id: Scalars['String']['input'];
  input: PluginUpdateInput;
};

export type MutationPreferenceOverridesCreateUpdateArgs = {
  input: PreferenceOverridesCreateUpdateData;
};

export type MutationPreferenceOverridesDestroyForResourceArgs = {
  input: PreferenceOverridesDestroyData;
};

export type MutationPreferencesUpdateArgs = {
  input: PreferencesUpdateData;
};

export type MutationPrivateNetworkCreateOrGetArgs = {
  input: PrivateNetworkCreateOrGetInput;
};

export type MutationPrivateNetworkEndpointCreateOrGetArgs = {
  input: PrivateNetworkEndpointCreateOrGetInput;
};

export type MutationPrivateNetworkEndpointDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationPrivateNetworkEndpointRenameArgs = {
  dnsName: Scalars['String']['input'];
  id: Scalars['String']['input'];
  privateNetworkId: Scalars['String']['input'];
};

export type MutationPrivateNetworksForEnvironmentDeleteArgs = {
  environmentId: Scalars['String']['input'];
};

export type MutationProjectClaimArgs = {
  id: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type MutationProjectCreateArgs = {
  input: ProjectCreateInput;
};

export type MutationProjectDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectInvitationAcceptArgs = {
  code: Scalars['String']['input'];
};

export type MutationProjectInvitationCreateArgs = {
  id: Scalars['String']['input'];
  input: ProjectInvitee;
};

export type MutationProjectInvitationDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectInvitationResendArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectInviteUserArgs = {
  id: Scalars['String']['input'];
  input: ProjectInviteUserInput;
};

export type MutationProjectLeaveArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectMemberRemoveArgs = {
  input: ProjectMemberRemoveInput;
};

export type MutationProjectMemberUpdateArgs = {
  input: ProjectMemberUpdateInput;
};

export type MutationProjectScheduleDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectScheduleDeleteCancelArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectScheduleDeleteForceArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectTokenCreateArgs = {
  input: ProjectTokenCreateInput;
};

export type MutationProjectTokenDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationProjectTransferConfirmArgs = {
  input: ProjectTransferConfirmInput;
};

export type MutationProjectTransferInitiateArgs = {
  input: ProjectTransferInitiateInput;
};

export type MutationProjectTransferToTeamArgs = {
  id: Scalars['String']['input'];
  input: ProjectTransferToTeamInput;
};

export type MutationProjectUpdateArgs = {
  id: Scalars['String']['input'];
  input: ProjectUpdateInput;
};

export type MutationProviderAuthRemoveArgs = {
  id: Scalars['String']['input'];
};

export type MutationRecoveryCodeValidateArgs = {
  input: RecoveryCodeValidateInput;
};

export type MutationReferralInfoUpdateArgs = {
  input: ReferralInfoUpdateInput;
};

export type MutationSendBountyWonEmailArgs = {
  input: SendBountyWonEmailInput;
};

export type MutationSendCommunityThreadNotificationEmailArgs = {
  input: SendCommunityThreadNotificationEmailInput;
};

export type MutationSendCommunityWelcomeEmailArgs = {
  input: SendCommunityWelcomeEmailInput;
};

export type MutationSendNewBountyEmailArgs = {
  input: SendNewBountyEmailInput;
};

export type MutationSendQuestionMovedToBountyEmailArgs = {
  input: SendQuestionMovedToBountyEmailInput;
};

export type MutationServiceConnectArgs = {
  id: Scalars['String']['input'];
  input: ServiceConnectInput;
};

export type MutationServiceCreateArgs = {
  input: ServiceCreateInput;
};

export type MutationServiceDeleteArgs = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};

export type MutationServiceDisconnectArgs = {
  id: Scalars['String']['input'];
};

export type MutationServiceDomainCreateArgs = {
  input: ServiceDomainCreateInput;
};

export type MutationServiceDomainDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationServiceDomainUpdateArgs = {
  input: ServiceDomainUpdateInput;
};

export type MutationServiceDuplicateArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type MutationServiceFeatureFlagAddArgs = {
  input: ServiceFeatureFlagToggleInput;
};

export type MutationServiceFeatureFlagRemoveArgs = {
  input: ServiceFeatureFlagToggleInput;
};

export type MutationServiceInstanceDeployArgs = {
  commitSha?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  latestCommit?: InputMaybe<Scalars['Boolean']['input']>;
  serviceId: Scalars['String']['input'];
};

export type MutationServiceInstanceDeployV2Args = {
  commitSha?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type MutationServiceInstanceLimitsUpdateArgs = {
  input: ServiceInstanceLimitsUpdateInput;
};

export type MutationServiceInstanceRedeployArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type MutationServiceInstanceUpdateArgs = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  input: ServiceInstanceUpdateInput;
  serviceId: Scalars['String']['input'];
};

export type MutationServiceRemoveUpstreamUrlArgs = {
  id: Scalars['String']['input'];
};

export type MutationServiceUpdateArgs = {
  id: Scalars['String']['input'];
  input: ServiceUpdateInput;
};

export type MutationSessionDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationSharedVariableConfigureArgs = {
  input: SharedVariableConfigureInput;
};

export type MutationTcpProxyCreateArgs = {
  input: TcpProxyCreateInput;
};

export type MutationTcpProxyDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationTeamBulkProjectTransferArgs = {
  input: TeamBulkProjectTransferInput;
};

export type MutationTeamCreateAndSubscribeArgs = {
  input: TeamCreateAndSubscribeInput;
};

export type MutationTeamInviteCodeCreateArgs = {
  id: Scalars['String']['input'];
  input: TeamInviteCodeCreateInput;
};

export type MutationTeamInviteCodeUseArgs = {
  code: Scalars['String']['input'];
};

export type MutationTeamLeaveArgs = {
  id: Scalars['String']['input'];
};

export type MutationTeamPermissionChangeArgs = {
  input: TeamPermissionChangeInput;
};

export type MutationTeamTrustedDomainCreateArgs = {
  input: TeamTrustedDomainCreateInput;
};

export type MutationTeamTrustedDomainDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationTeamUserInviteArgs = {
  id: Scalars['String']['input'];
  input: TeamUserInviteInput;
};

export type MutationTeamUserRemoveArgs = {
  id: Scalars['String']['input'];
  input: TeamUserRemoveInput;
};

export type MutationTemplateCloneArgs = {
  input: TemplateCloneInput;
};

export type MutationTemplateDeleteArgs = {
  id: Scalars['String']['input'];
  input: TemplateDeleteInput;
};

export type MutationTemplateDeployArgs = {
  input: TemplateDeployInput;
};

export type MutationTemplateDeployV2Args = {
  input: TemplateDeployV2Input;
};

export type MutationTemplateGenerateArgs = {
  input: TemplateGenerateInput;
};

export type MutationTemplateMaybeUnsetCommunityThreadSlugArgs = {
  communityThreadSlug: Scalars['String']['input'];
};

export type MutationTemplatePublishArgs = {
  id: Scalars['String']['input'];
  input: TemplatePublishInput;
};

export type MutationTemplateServiceSourceEjectArgs = {
  input: TemplateServiceSourceEjectInput;
};

export type MutationTemplateUnpublishArgs = {
  id: Scalars['String']['input'];
};

export type MutationTwoFactorInfoCreateArgs = {
  input: TwoFactorInfoCreateInput;
};

export type MutationTwoFactorInfoValidateArgs = {
  input: TwoFactorInfoValidateInput;
};

export type MutationUpsertSlackChannelForTeamArgs = {
  teamId: Scalars['String']['input'];
};

export type MutationUsageLimitRemoveArgs = {
  input: UsageLimitRemoveInput;
};

export type MutationUsageLimitSetArgs = {
  input: UsageLimitSetInput;
};

export type MutationUserFlagsRemoveArgs = {
  input: UserFlagsRemoveInput;
};

export type MutationUserFlagsSetArgs = {
  input: UserFlagsSetInput;
};

export type MutationUserProfileUpdateArgs = {
  input: UserProfileUpdateInput;
};

export type MutationUserUpdateArgs = {
  input: UserUpdateInput;
};

export type MutationVariableCollectionUpsertArgs = {
  input: VariableCollectionUpsertInput;
};

export type MutationVariableDeleteArgs = {
  input: VariableDeleteInput;
};

export type MutationVariableUpsertArgs = {
  input: VariableUpsertInput;
};

export type MutationVolumeCreateArgs = {
  input: VolumeCreateInput;
};

export type MutationVolumeDeleteArgs = {
  volumeId: Scalars['String']['input'];
};

export type MutationVolumeInstanceBackupCreateArgs = {
  volumeInstanceId: Scalars['String']['input'];
};

export type MutationVolumeInstanceBackupDeleteArgs = {
  volumeInstanceBackupId: Scalars['String']['input'];
  volumeInstanceId: Scalars['String']['input'];
};

export type MutationVolumeInstanceBackupLockArgs = {
  volumeInstanceBackupId: Scalars['String']['input'];
  volumeInstanceId: Scalars['String']['input'];
};

export type MutationVolumeInstanceBackupRestoreArgs = {
  volumeInstanceBackupId: Scalars['String']['input'];
  volumeInstanceId: Scalars['String']['input'];
};

export type MutationVolumeInstanceBackupScheduleUpdateArgs = {
  kinds: Array<VolumeInstanceBackupScheduleKind>;
  volumeInstanceId: Scalars['String']['input'];
};

export type MutationVolumeInstanceUpdateArgs = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  input: VolumeInstanceUpdateInput;
  volumeId: Scalars['String']['input'];
};

export type MutationVolumeUpdateArgs = {
  input: VolumeUpdateInput;
  volumeId: Scalars['String']['input'];
};

export type MutationWebhookCreateArgs = {
  input: WebhookCreateInput;
};

export type MutationWebhookDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationWebhookUpdateArgs = {
  id: Scalars['String']['input'];
  input: WebhookUpdateInput;
};

export type MutationWorkspaceDeleteArgs = {
  id: Scalars['String']['input'];
};

export type MutationWorkspaceLeaveArgs = {
  id: Scalars['String']['input'];
};

export type MutationWorkspaceUpdateArgs = {
  id: Scalars['String']['input'];
  input: WorkspaceUpdateInput;
};

export type MutationWorkspaceUpsertSlackChannelArgs = {
  id: Scalars['String']['input'];
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type ObservabilityDashboard = Node & {
  __typename?: 'ObservabilityDashboard';
  id: Scalars['ID']['output'];
  items: Array<ObservabilityDashboardItemInstance>;
};

export type ObservabilityDashboardCreateInput = {
  environmentId: Scalars['String']['input'];
  /** If no items are provided, a default dashboard will be created. */
  items?: InputMaybe<Array<ObservabilityDashboardUpdateInput>>;
};

export type ObservabilityDashboardItem = Node & {
  __typename?: 'ObservabilityDashboardItem';
  config: ObservabilityDashboardItemConfig;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: ObservabilityDashboardItemType;
};

export type ObservabilityDashboardItemConfig = {
  __typename?: 'ObservabilityDashboardItemConfig';
  logsFilter?: Maybe<Scalars['String']['output']>;
  measurements?: Maybe<Array<MetricMeasurement>>;
  projectUsageProperties?: Maybe<Array<ProjectUsageProperty>>;
  resourceIds?: Maybe<Array<Scalars['String']['output']>>;
};

export type ObservabilityDashboardItemConfigInput = {
  logsFilter?: InputMaybe<Scalars['String']['input']>;
  measurements?: InputMaybe<Array<MetricMeasurement>>;
  projectUsageProperties?: InputMaybe<Array<ProjectUsageProperty>>;
  resourceIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ObservabilityDashboardItemCreateInput = {
  config: ObservabilityDashboardItemConfigInput;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  type: ObservabilityDashboardItemType;
};

export type ObservabilityDashboardItemInstance = Node & {
  __typename?: 'ObservabilityDashboardItemInstance';
  dashboardItem: ObservabilityDashboardItem;
  displayConfig: Scalars['DisplayConfig']['output'];
  id: Scalars['ID']['output'];
};

export enum ObservabilityDashboardItemType {
  ProjectUsageItem = 'PROJECT_USAGE_ITEM',
  ServiceLogsItem = 'SERVICE_LOGS_ITEM',
  ServiceMetricsItem = 'SERVICE_METRICS_ITEM',
  VolumeMetricsItem = 'VOLUME_METRICS_ITEM',
}

export type ObservabilityDashboardUpdateInput = {
  dashboardItem: ObservabilityDashboardItemCreateInput;
  displayConfig: Scalars['DisplayConfig']['input'];
  id: Scalars['String']['input'];
};

export type OverrideInput = {
  enabled: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  resource: Scalars['String']['input'];
  resourceId: Scalars['String']['input'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentMethod = {
  __typename?: 'PaymentMethod';
  card?: Maybe<PaymentMethodCard>;
  id: Scalars['String']['output'];
};

export type PaymentMethodCard = {
  __typename?: 'PaymentMethodCard';
  brand: Scalars['String']['output'];
  country?: Maybe<Scalars['String']['output']>;
  last4: Scalars['String']['output'];
};

export type PlanLimitOverride = Node & {
  __typename?: 'PlanLimitOverride';
  config: Scalars['SubscriptionPlanLimit']['output'];
  id: Scalars['ID']['output'];
};

export type PlatformStatus = {
  __typename?: 'PlatformStatus';
  incident?: Maybe<Incident>;
  isStable: Scalars['Boolean']['output'];
  maintenance?: Maybe<Maintenance>;
};

export type Plugin = Node & {
  __typename?: 'Plugin';
  containers: PluginContainersConnection;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deprecatedAt?: Maybe<Scalars['DateTime']['output']>;
  friendlyName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  logsEnabled: Scalars['Boolean']['output'];
  migrationDatabaseServiceId?: Maybe<Scalars['String']['output']>;
  name: PluginType;
  project: Project;
  status: PluginStatus;
  variables: PluginVariablesConnection;
};

export type PluginContainersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type PluginVariablesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type PluginContainersConnection = {
  __typename?: 'PluginContainersConnection';
  edges: Array<PluginContainersConnectionEdge>;
  pageInfo: PageInfo;
};

export type PluginContainersConnectionEdge = {
  __typename?: 'PluginContainersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Container;
};

export type PluginCreateInput = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  friendlyName?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type PluginRestartInput = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
};

export enum PluginStatus {
  Deprecated = 'DEPRECATED',
  Locked = 'LOCKED',
  Removed = 'REMOVED',
  Running = 'RUNNING',
  Stopped = 'STOPPED',
}

export enum PluginType {
  Mongodb = 'mongodb',
  Mysql = 'mysql',
  Postgresql = 'postgresql',
  Redis = 'redis',
}

export type PluginUpdateInput = {
  friendlyName: Scalars['String']['input'];
};

export type PluginVariablesConnection = {
  __typename?: 'PluginVariablesConnection';
  edges: Array<PluginVariablesConnectionEdge>;
  pageInfo: PageInfo;
};

export type PluginVariablesConnectionEdge = {
  __typename?: 'PluginVariablesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Variable;
};

export type PreferenceOverride = Node & {
  __typename?: 'PreferenceOverride';
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
  resourceId: Scalars['String']['output'];
};

export type PreferenceOverridesCreateUpdateData = {
  overrides: Array<OverrideInput>;
};

export type PreferenceOverridesDestroyData = {
  resource: Scalars['String']['input'];
  resourceId: Scalars['String']['input'];
};

export type Preferences = Node & {
  __typename?: 'Preferences';
  buildFailedEmail: Scalars['Boolean']['output'];
  changelogEmail: Scalars['Boolean']['output'];
  communityEmail: Scalars['Boolean']['output'];
  deployCrashedEmail: Scalars['Boolean']['output'];
  ephemeralEnvironmentEmail: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  marketingEmail: Scalars['Boolean']['output'];
  preferenceOverrides?: Maybe<Array<PreferenceOverride>>;
  subprocessorUpdatesEmail: Scalars['Boolean']['output'];
  usageEmail: Scalars['Boolean']['output'];
};

export type PreferencesUpdateData = {
  buildFailedEmail?: InputMaybe<Scalars['Boolean']['input']>;
  changelogEmail?: InputMaybe<Scalars['Boolean']['input']>;
  communityEmail?: InputMaybe<Scalars['Boolean']['input']>;
  deployCrashedEmail?: InputMaybe<Scalars['Boolean']['input']>;
  ephemeralEnvironmentEmail?: InputMaybe<Scalars['Boolean']['input']>;
  marketingEmail?: InputMaybe<Scalars['Boolean']['input']>;
  subprocessorUpdatesEmail?: InputMaybe<Scalars['Boolean']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  usageEmail?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PrivateNetwork = {
  __typename?: 'PrivateNetwork';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dnsName: Scalars['String']['output'];
  environmentId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  networkId: Scalars['BigInt']['output'];
  projectId: Scalars['String']['output'];
  publicId: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
};

export type PrivateNetworkCreateOrGetInput = {
  environmentId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type PrivateNetworkEndpoint = {
  __typename?: 'PrivateNetworkEndpoint';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dnsName: Scalars['String']['output'];
  privateIps: Array<Scalars['String']['output']>;
  publicId: Scalars['String']['output'];
  serviceInstanceId: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
};

export type PrivateNetworkEndpointCreateOrGetInput = {
  environmentId: Scalars['String']['input'];
  privateNetworkId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  serviceName: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type Project = Node & {
  __typename?: 'Project';
  baseEnvironment?: Maybe<Environment>;
  baseEnvironmentId?: Maybe<Scalars['String']['output']>;
  botPrEnvironments: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deploymentTriggers: ProjectDeploymentTriggersConnection;
  deployments: ProjectDeploymentsConnection;
  description?: Maybe<Scalars['String']['output']>;
  environments: ProjectEnvironmentsConnection;
  expiredAt?: Maybe<Scalars['DateTime']['output']>;
  groups: ProjectGroupsConnection;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  isTempProject: Scalars['Boolean']['output'];
  members: Array<ProjectMember>;
  name: Scalars['String']['output'];
  plugins: ProjectPluginsConnection;
  prDeploys: Scalars['Boolean']['output'];
  projectPermissions: ProjectProjectPermissionsConnection;
  services: ProjectServicesConnection;
  subscriptionPlanLimit: Scalars['SubscriptionPlanLimit']['output'];
  subscriptionType: SubscriptionPlanType;
  team?: Maybe<Team>;
  teamId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  volumes: ProjectVolumesConnection;
  webhooks: ProjectWebhooksConnection;
};

export type ProjectDeploymentTriggersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectEnvironmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectGroupsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectPluginsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectProjectPermissionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectServicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectVolumesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectWebhooksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProjectCreateInput = {
  defaultEnvironmentName?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  plugins?: InputMaybe<Array<Scalars['String']['input']>>;
  prDeploys?: InputMaybe<Scalars['Boolean']['input']>;
  repo?: InputMaybe<ProjectCreateRepo>;
  runtime?: InputMaybe<PublicRuntime>;
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectCreateRepo = {
  branch: Scalars['String']['input'];
  fullRepoName: Scalars['String']['input'];
};

export type ProjectDeploymentTriggersConnection = {
  __typename?: 'ProjectDeploymentTriggersConnection';
  edges: Array<ProjectDeploymentTriggersConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectDeploymentTriggersConnectionEdge = {
  __typename?: 'ProjectDeploymentTriggersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentTrigger;
};

export type ProjectDeploymentsConnection = {
  __typename?: 'ProjectDeploymentsConnection';
  edges: Array<ProjectDeploymentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectDeploymentsConnectionEdge = {
  __typename?: 'ProjectDeploymentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Deployment;
};

export type ProjectEnvironmentsConnection = {
  __typename?: 'ProjectEnvironmentsConnection';
  edges: Array<ProjectEnvironmentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectEnvironmentsConnectionEdge = {
  __typename?: 'ProjectEnvironmentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Environment;
};

export type ProjectGroupsConnection = {
  __typename?: 'ProjectGroupsConnection';
  edges: Array<ProjectGroupsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectGroupsConnectionEdge = {
  __typename?: 'ProjectGroupsConnectionEdge';
  cursor: Scalars['String']['output'];
};

export type ProjectInvitation = {
  __typename?: 'ProjectInvitation';
  email: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  inviter?: Maybe<ProjectInvitationInviter>;
  isExpired: Scalars['Boolean']['output'];
  project: PublicProjectInformation;
};

export type ProjectInvitationInviter = {
  __typename?: 'ProjectInvitationInviter';
  email: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type ProjectInviteUserInput = {
  email: Scalars['String']['input'];
  link: Scalars['String']['input'];
};

export type ProjectInvitee = {
  email: Scalars['String']['input'];
  role: ProjectRole;
};

export type ProjectMember = {
  __typename?: 'ProjectMember';
  avatar?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  role: ProjectRole;
};

export type ProjectMemberRemoveInput = {
  projectId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ProjectMemberUpdateInput = {
  projectId: Scalars['String']['input'];
  role: ProjectRole;
  userId: Scalars['String']['input'];
};

export type ProjectPermission = Node & {
  __typename?: 'ProjectPermission';
  id: Scalars['ID']['output'];
  projectId: Scalars['String']['output'];
  role: ProjectRole;
  userId: Scalars['String']['output'];
};

export type ProjectPluginsConnection = {
  __typename?: 'ProjectPluginsConnection';
  edges: Array<ProjectPluginsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectPluginsConnectionEdge = {
  __typename?: 'ProjectPluginsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Plugin;
};

export type ProjectProjectPermissionsConnection = {
  __typename?: 'ProjectProjectPermissionsConnection';
  edges: Array<ProjectProjectPermissionsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectProjectPermissionsConnectionEdge = {
  __typename?: 'ProjectProjectPermissionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ProjectPermission;
};

export type ProjectResourceAccess = {
  __typename?: 'ProjectResourceAccess';
  customDomain: AccessRule;
  databaseDeployment: AccessRule;
  deployment: AccessRule;
  environment: AccessRule;
  plugin: AccessRule;
};

export enum ProjectRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Viewer = 'VIEWER',
}

export type ProjectServicesConnection = {
  __typename?: 'ProjectServicesConnection';
  edges: Array<ProjectServicesConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectServicesConnectionEdge = {
  __typename?: 'ProjectServicesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Service;
};

export type ProjectToken = Node & {
  __typename?: 'ProjectToken';
  createdAt: Scalars['DateTime']['output'];
  displayToken: Scalars['String']['output'];
  environment: Environment;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
};

export type ProjectTokenCreateInput = {
  environmentId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type ProjectTransferConfirmInput = {
  destinationWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  ownershipTransferId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type ProjectTransferInitiateInput = {
  memberId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type ProjectTransferToTeamInput = {
  teamId: Scalars['String']['input'];
};

export type ProjectUpdateInput = {
  baseEnvironmentId?: InputMaybe<Scalars['String']['input']>;
  /** Enable/disable pull request environments for PRs created by bots */
  botPrEnvironments?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  prDeploys?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ProjectUsageProperty {
  BackupUsage = 'BACKUP_USAGE',
  CpuUsage = 'CPU_USAGE',
  CurrentUsage = 'CURRENT_USAGE',
  DiskUsage = 'DISK_USAGE',
  EstimatedUsage = 'ESTIMATED_USAGE',
  MemoryUsage = 'MEMORY_USAGE',
  NetworkUsage = 'NETWORK_USAGE',
}

export type ProjectVolumesConnection = {
  __typename?: 'ProjectVolumesConnection';
  edges: Array<ProjectVolumesConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectVolumesConnectionEdge = {
  __typename?: 'ProjectVolumesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Volume;
};

export type ProjectWebhook = Node & {
  __typename?: 'ProjectWebhook';
  filters?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['ID']['output'];
  lastStatus?: Maybe<Scalars['Int']['output']>;
  projectId: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type ProjectWebhooksConnection = {
  __typename?: 'ProjectWebhooksConnection';
  edges: Array<ProjectWebhooksConnectionEdge>;
  pageInfo: PageInfo;
};

export type ProjectWebhooksConnectionEdge = {
  __typename?: 'ProjectWebhooksConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ProjectWebhook;
};

export type ProviderAuth = Node & {
  __typename?: 'ProviderAuth';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  provider: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type PublicProjectInformation = {
  __typename?: 'PublicProjectInformation';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type PublicProjectInvitation = InviteCode | ProjectInvitation;

export enum PublicRuntime {
  Legacy = 'LEGACY',
  Unspecified = 'UNSPECIFIED',
  V2 = 'V2',
}

export type PublicStats = {
  __typename?: 'PublicStats';
  totalDeploymentsLastMonth: Scalars['Int']['output'];
  totalLogsLastMonth: Scalars['BigInt']['output'];
  totalProjects: Scalars['Int']['output'];
  totalRequestsLastMonth: Scalars['BigInt']['output'];
  totalServices: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Get all volume instances for a given volume */
  adminVolumeInstancesForVolume: Array<VolumeInstance>;
  /** Gets all API tokens for the authenticated user. */
  apiTokens: QueryApiTokensConnection;
  /** Fetch logs for a build */
  buildLogs: Array<Log>;
  /** Gets the image URL for a Notion image block */
  changelogBlockImage: Scalars['String']['output'];
  /** Fetch details for a custom domain */
  customDomain: CustomDomain;
  /** Checks if a custom domain is available. */
  customDomainAvailable: DomainAvailable;
  /** Find a single deployment */
  deployment: Deployment;
  /** Get the deployment events for a deployment */
  deploymentEvents: QueryDeploymentEventsConnection;
  /** Get the deployment instance executions for a deployment. */
  deploymentInstanceExecutions: QueryDeploymentInstanceExecutionsConnection;
  /** Fetch logs for a deployment */
  deploymentLogs: Array<Log>;
  /** Find a single DeploymentSnapshot */
  deploymentSnapshot?: Maybe<DeploymentSnapshot>;
  /** All deployment triggers. */
  deploymentTriggers: QueryDeploymentTriggersConnection;
  /** Get all deployments */
  deployments: QueryDeploymentsConnection;
  /**
   * Domain with status
   * @deprecated Use the `status` field within the `domain` query instead
   */
  domainStatus: DomainWithStatus;
  /** All domains for a service instance */
  domains: AllDomains;
  /** All egress gateways assigned to a service instance */
  egressGateways: Array<EgressGateway>;
  /** Find a single environment */
  environment: Environment;
  /** Fetch logs for a project environment. Build logs are excluded unless a snapshot ID is explicitly provided in the filter */
  environmentLogs: Array<Log>;
  /** Get the patches for an environment */
  environmentPatches: QueryEnvironmentPatchesConnection;
  /** Gets all environments for a project. */
  environments: QueryEnvironmentsConnection;
  /** Get the estimated total cost of the project at the end of the current billing cycle. If no `startDate` is provided, the usage for the current billing period of the project owner is returned. */
  estimatedUsage: Array<EstimatedUsage>;
  /** Gets the events for a project. */
  events: QueryEventsConnection;
  /** Get the workspaces the user doesn't belong to, but needs access (like when invited to a project) */
  externalWorkspaces: Array<ExternalWorkspace>;
  /** Get information about a specific function runtime */
  functionRuntime: FunctionRuntime;
  /** List available function runtimes */
  functionRuntimes: Array<FunctionRuntime>;
  /** Checks if user has access to GitHub repository */
  gitHubRepoAccessAvailable: GitHubAccess;
  /** Check if a repo name is available */
  githubIsRepoNameAvailable: Scalars['Boolean']['output'];
  /** Checks if user has access to GitHub repository */
  githubRepo: GitHubRepoWithoutInstallation;
  /** Get branches for a GitHub repo that the authenticated user has access to */
  githubRepoBranches: Array<GitHubBranch>;
  /** Get a list of repos for a user that Railway has access to */
  githubRepos: Array<GitHubRepo>;
  /** Get a list of scopes the user has installed the installation to */
  githubWritableScopes: Array<Scalars['String']['output']>;
  /** Get the Herokus apps for the current user */
  herokuApps: Array<HerokuApp>;
  /** Fetch HTTP logs for a deployment */
  httpLogs: Array<HttpLog>;
  /** Get an integration auth by provider providerId */
  integrationAuth: IntegrationAuth;
  /** Get all integration auths for a user */
  integrationAuths: QueryIntegrationAuthsConnection;
  /** Get all integrations for a project */
  integrations: QueryIntegrationsConnection;
  /** Get an invite code by the code */
  inviteCode: InviteCode;
  /** Gets the authenticated user. */
  me: User;
  /** Get metrics for a project, environment, and service */
  metrics: Array<MetricsResult>;
  node?: Maybe<Node>;
  nodes: Array<Maybe<Node>>;
  /** Get all observability dashboards for an environment */
  observabilityDashboards: QueryObservabilityDashboardsConnection;
  /** Get the current status of the platform */
  platformStatus: PlatformStatus;
  /** Get a plugin by ID. */
  plugin: Plugin;
  /** Fetch logs for a plugin */
  pluginLogs: Array<Log>;
  /** Get the email preferences for a user */
  preferences: Preferences;
  /** Get a private network endpoint for a service instance. */
  privateNetworkEndpoint?: Maybe<PrivateNetworkEndpoint>;
  /** Check if an endpoint name is available. */
  privateNetworkEndpointNameAvailable: Scalars['Boolean']['output'];
  /** List private networks for an environment. */
  privateNetworks: Array<PrivateNetwork>;
  /** Get a project by ID */
  project: Project;
  /** Get a project invitation by code */
  projectInvitation: PublicProjectInvitation;
  /** Get invitations for a project */
  projectInvitations: Array<ProjectInvitation>;
  /** Get an invite code for a project for a specifc role */
  projectInviteCode: InviteCode;
  /** Gets users who belong to a project along with their role */
  projectMembers: Array<ProjectMember>;
  /** Get resource access rules for project-specific actions */
  projectResourceAccess: ProjectResourceAccess;
  /** Get a single project token by the value in the header */
  projectToken: ProjectToken;
  /** Get all project tokens for a project */
  projectTokens: QueryProjectTokensConnection;
  /** Gets all projects for a user or a team. */
  projects: QueryProjectsConnection;
  /** Get public Railway stats. */
  publicStats: PublicStats;
  /** Gets the ReferralInfo for the authenticated user. */
  referralInfo: ReferralInfo;
  /** List available regions */
  regions: Array<Region>;
  /** Get resource access for the current user or team */
  resourceAccess: ResourceAccess;
  /** Get a service by ID */
  service: Service;
  /** Checks if a service domain is available */
  serviceDomainAvailable: DomainAvailable;
  /** Get a service instance belonging to a service and environment */
  serviceInstance: ServiceInstance;
  /** Check if the upstream repo for a service has an update available */
  serviceInstanceIsUpdatable: Scalars['Boolean']['output'];
  /** Get the resource limits for a service instance */
  serviceInstanceLimitOverride: Scalars['ServiceInstanceLimit']['output'];
  /** Get the resource limits for a service instance */
  serviceInstanceLimits: Scalars['ServiceInstanceLimit']['output'];
  /** Gets all sessions for authenticated user. */
  sessions: QuerySessionsConnection;
  /** All TCP proxies for a service instance */
  tcpProxies: Array<TcpProxy>;
  /** Find a team by ID */
  team: Team;
  /** Find a team by invite code */
  teamByCode: Team;
  /** Get all templates for a team. */
  teamTemplates: QueryTeamTemplatesConnection;
  /** Get all team trusted domains */
  teamTrustedDomains: QueryTeamTrustedDomainsConnection;
  /** Get a template by code or GitHub owner and repo. */
  template: Template;
  /** Get the source template for a project. */
  templateSourceForProject?: Maybe<Template>;
  /** Get all published templates. */
  templates: QueryTemplatesConnection;
  /** Count all published templates. */
  templatesCount: Scalars['Int']['output'];
  /** Gets the TwoFactorInfo for the authenticated user. */
  twoFactorInfo: TwoFactorInfo;
  /** Get the usage for a single project or all projects for a user/team. If no `projectId` or `teamId` is provided, the usage for the current user is returned. If no `startDate` is provided, the usage for the current billing period of the project owner is returned. */
  usage: Array<AggregatedUsage>;
  /** Get the user id corresponding to a Discord id */
  userIdForDiscordId: Scalars['String']['output'];
  /** Get the user id corresponding to a Slack id */
  userIdForSlackId?: Maybe<Scalars['String']['output']>;
  /**
   * Get the total kickback earnings for a user.
   * @deprecated This field is deprecated and will be removed in future versions.
   */
  userKickbackEarnings: UserKickbackEarnings;
  /** Get the public profile for a user */
  userProfile: UserProfileResponse;
  /**
   * Get all templates for the current user.
   * @deprecated Users don't have personal templates anymore, they belong to their team now
   */
  userTemplates: QueryUserTemplatesConnection;
  /** All variables by pluginId or serviceId. If neither are provided, all shared variables are returned. */
  variables: Scalars['EnvironmentVariables']['output'];
  /** All rendered variables that are required for a service deployment. */
  variablesForServiceDeployment: Scalars['EnvironmentVariables']['output'];
  /** Get information about the user's Vercel accounts */
  vercelInfo: VercelInfo;
  /** Get a single volume instance by id */
  volumeInstance: VolumeInstance;
  /** List backups of a volume instance */
  volumeInstanceBackupList: Array<VolumeInstanceBackup>;
  /** List backups schedules of a volume instance */
  volumeInstanceBackupScheduleList: Array<VolumeInstanceBackupSchedule>;
  /** Get all webhooks for a project */
  webhooks: QueryWebhooksConnection;
  /** Gets the status of a workflow */
  workflowStatus: WorkflowResult;
  /** Get the workspace */
  workspace: Workspace;
};

export type QueryAdminVolumeInstancesForVolumeArgs = {
  volumeId: Scalars['String']['input'];
};

export type QueryApiTokensArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryBuildLogsArgs = {
  deploymentId: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryChangelogBlockImageArgs = {
  id: Scalars['String']['input'];
};

export type QueryCustomDomainArgs = {
  id: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type QueryCustomDomainAvailableArgs = {
  domain: Scalars['String']['input'];
};

export type QueryDeploymentArgs = {
  id: Scalars['String']['input'];
};

export type QueryDeploymentEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDeploymentInstanceExecutionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input: DeploymentInstanceExecutionListInput;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDeploymentLogsArgs = {
  deploymentId: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryDeploymentSnapshotArgs = {
  deploymentId: Scalars['String']['input'];
};

export type QueryDeploymentTriggersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input: DeploymentListInput;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDomainStatusArgs = {
  id: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type QueryDomainsArgs = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryEgressGatewaysArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryEnvironmentArgs = {
  id: Scalars['String']['input'];
};

export type QueryEnvironmentLogsArgs = {
  afterDate?: InputMaybe<Scalars['String']['input']>;
  afterLimit?: InputMaybe<Scalars['Int']['input']>;
  anchorDate?: InputMaybe<Scalars['String']['input']>;
  beforeDate?: InputMaybe<Scalars['String']['input']>;
  beforeLimit?: InputMaybe<Scalars['Int']['input']>;
  environmentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
};

export type QueryEnvironmentPatchesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryEnvironmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isEphemeral?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
};

export type QueryEstimatedUsageArgs = {
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  measurements: Array<MetricMeasurement>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  environmentId?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EventFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
};

export type QueryExternalWorkspacesArgs = {
  projectId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFunctionRuntimeArgs = {
  name: FunctionRuntimeName;
};

export type QueryGitHubRepoAccessAvailableArgs = {
  fullRepoName: Scalars['String']['input'];
};

export type QueryGithubIsRepoNameAvailableArgs = {
  fullRepoName: Scalars['String']['input'];
};

export type QueryGithubRepoArgs = {
  fullRepoName: Scalars['String']['input'];
};

export type QueryGithubRepoBranchesArgs = {
  owner: Scalars['String']['input'];
  repo: Scalars['String']['input'];
};

export type QueryHttpLogsArgs = {
  afterDate?: InputMaybe<Scalars['String']['input']>;
  afterLimit?: InputMaybe<Scalars['Int']['input']>;
  anchorDate?: InputMaybe<Scalars['String']['input']>;
  beforeDate?: InputMaybe<Scalars['String']['input']>;
  beforeLimit?: InputMaybe<Scalars['Int']['input']>;
  deploymentId: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type QueryIntegrationAuthArgs = {
  provider: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};

export type QueryIntegrationAuthsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryIntegrationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
};

export type QueryInviteCodeArgs = {
  code: Scalars['String']['input'];
};

export type QueryMetricsArgs = {
  averagingWindowSeconds?: InputMaybe<Scalars['Int']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  environmentId?: InputMaybe<Scalars['String']['input']>;
  groupBy?: InputMaybe<Array<MetricTag>>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  measurements: Array<MetricMeasurement>;
  pluginId?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  sampleRateSeconds?: InputMaybe<Scalars['Int']['input']>;
  serviceId?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['DateTime']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
  volumeId?: InputMaybe<Scalars['String']['input']>;
  volumeInstanceExternalId?: InputMaybe<Scalars['String']['input']>;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};

export type QueryNodesArgs = {
  ids: Array<Scalars['ID']['input']>;
};

export type QueryObservabilityDashboardsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPluginArgs = {
  id: Scalars['String']['input'];
};

export type QueryPluginLogsArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  environmentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  pluginId: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryPreferencesArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};

export type QueryPrivateNetworkEndpointArgs = {
  environmentId: Scalars['String']['input'];
  privateNetworkId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryPrivateNetworkEndpointNameAvailableArgs = {
  environmentId: Scalars['String']['input'];
  prefix: Scalars['String']['input'];
  privateNetworkId: Scalars['String']['input'];
};

export type QueryPrivateNetworksArgs = {
  environmentId: Scalars['String']['input'];
};

export type QueryProjectArgs = {
  id: Scalars['String']['input'];
};

export type QueryProjectInvitationArgs = {
  code: Scalars['String']['input'];
};

export type QueryProjectInvitationsArgs = {
  id: Scalars['String']['input'];
};

export type QueryProjectInviteCodeArgs = {
  projectId: Scalars['String']['input'];
  role: ProjectRole;
};

export type QueryProjectMembersArgs = {
  projectId: Scalars['String']['input'];
};

export type QueryProjectResourceAccessArgs = {
  projectId: Scalars['String']['input'];
};

export type QueryProjectTokensArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
};

export type QueryProjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryReferralInfoArgs = {
  workspaceId: Scalars['String']['input'];
};

export type QueryRegionsArgs = {
  projectId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryResourceAccessArgs = {
  explicitResourceOwner: ExplicitOwnerInput;
};

export type QueryServiceArgs = {
  id: Scalars['String']['input'];
};

export type QueryServiceDomainAvailableArgs = {
  domain: Scalars['String']['input'];
};

export type QueryServiceInstanceArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryServiceInstanceIsUpdatableArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryServiceInstanceLimitOverrideArgs = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryServiceInstanceLimitsArgs = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QuerySessionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryTcpProxiesArgs = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryTeamArgs = {
  id: Scalars['String']['input'];
};

export type QueryTeamByCodeArgs = {
  code: Scalars['String']['input'];
};

export type QueryTeamTemplatesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  teamId: Scalars['String']['input'];
};

export type QueryTeamTrustedDomainsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  teamId: Scalars['String']['input'];
};

export type QueryTemplateArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Scalars['String']['input']>;
  repo?: InputMaybe<Scalars['String']['input']>;
};

export type QueryTemplateSourceForProjectArgs = {
  projectId: Scalars['String']['input'];
};

export type QueryTemplatesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  recommended?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryUsageArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  groupBy?: InputMaybe<Array<MetricTag>>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  measurements: Array<MetricMeasurement>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryUserIdForDiscordIdArgs = {
  discordId: Scalars['String']['input'];
};

export type QueryUserIdForSlackIdArgs = {
  slackId: Scalars['String']['input'];
};

export type QueryUserKickbackEarningsArgs = {
  userId: Scalars['String']['input'];
};

export type QueryUserProfileArgs = {
  username: Scalars['String']['input'];
};

export type QueryUserTemplatesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryVariablesArgs = {
  environmentId: Scalars['String']['input'];
  pluginId?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  serviceId?: InputMaybe<Scalars['String']['input']>;
  unrendered?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryVariablesForServiceDeploymentArgs = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type QueryVolumeInstanceArgs = {
  id: Scalars['String']['input'];
};

export type QueryVolumeInstanceBackupListArgs = {
  volumeInstanceId: Scalars['String']['input'];
};

export type QueryVolumeInstanceBackupScheduleListArgs = {
  volumeInstanceId: Scalars['String']['input'];
};

export type QueryWebhooksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['String']['input'];
};

export type QueryWorkflowStatusArgs = {
  workflowId: Scalars['String']['input'];
};

export type QueryWorkspaceArgs = {
  workspaceId: Scalars['String']['input'];
};

export type QueryApiTokensConnection = {
  __typename?: 'QueryApiTokensConnection';
  edges: Array<QueryApiTokensConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryApiTokensConnectionEdge = {
  __typename?: 'QueryApiTokensConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ApiToken;
};

export type QueryDeploymentEventsConnection = {
  __typename?: 'QueryDeploymentEventsConnection';
  edges: Array<QueryDeploymentEventsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryDeploymentEventsConnectionEdge = {
  __typename?: 'QueryDeploymentEventsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentEvent;
};

export type QueryDeploymentInstanceExecutionsConnection = {
  __typename?: 'QueryDeploymentInstanceExecutionsConnection';
  edges: Array<QueryDeploymentInstanceExecutionsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryDeploymentInstanceExecutionsConnectionEdge = {
  __typename?: 'QueryDeploymentInstanceExecutionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentInstanceExecution;
};

export type QueryDeploymentTriggersConnection = {
  __typename?: 'QueryDeploymentTriggersConnection';
  edges: Array<QueryDeploymentTriggersConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryDeploymentTriggersConnectionEdge = {
  __typename?: 'QueryDeploymentTriggersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentTrigger;
};

export type QueryDeploymentsConnection = {
  __typename?: 'QueryDeploymentsConnection';
  edges: Array<QueryDeploymentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryDeploymentsConnectionEdge = {
  __typename?: 'QueryDeploymentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Deployment;
};

export type QueryEnvironmentPatchesConnection = {
  __typename?: 'QueryEnvironmentPatchesConnection';
  edges: Array<QueryEnvironmentPatchesConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryEnvironmentPatchesConnectionEdge = {
  __typename?: 'QueryEnvironmentPatchesConnectionEdge';
  cursor: Scalars['String']['output'];
};

export type QueryEnvironmentsConnection = {
  __typename?: 'QueryEnvironmentsConnection';
  edges: Array<QueryEnvironmentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryEnvironmentsConnectionEdge = {
  __typename?: 'QueryEnvironmentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Environment;
};

export type QueryEventsConnection = {
  __typename?: 'QueryEventsConnection';
  edges: Array<QueryEventsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryEventsConnectionEdge = {
  __typename?: 'QueryEventsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Event;
};

export type QueryIntegrationAuthsConnection = {
  __typename?: 'QueryIntegrationAuthsConnection';
  edges: Array<QueryIntegrationAuthsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryIntegrationAuthsConnectionEdge = {
  __typename?: 'QueryIntegrationAuthsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: IntegrationAuth;
};

export type QueryIntegrationsConnection = {
  __typename?: 'QueryIntegrationsConnection';
  edges: Array<QueryIntegrationsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryIntegrationsConnectionEdge = {
  __typename?: 'QueryIntegrationsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Integration;
};

export type QueryObservabilityDashboardsConnection = {
  __typename?: 'QueryObservabilityDashboardsConnection';
  edges: Array<QueryObservabilityDashboardsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryObservabilityDashboardsConnectionEdge = {
  __typename?: 'QueryObservabilityDashboardsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ObservabilityDashboard;
};

export type QueryProjectTokensConnection = {
  __typename?: 'QueryProjectTokensConnection';
  edges: Array<QueryProjectTokensConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryProjectTokensConnectionEdge = {
  __typename?: 'QueryProjectTokensConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ProjectToken;
};

export type QueryProjectsConnection = {
  __typename?: 'QueryProjectsConnection';
  edges: Array<QueryProjectsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryProjectsConnectionEdge = {
  __typename?: 'QueryProjectsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Project;
};

export type QuerySessionsConnection = {
  __typename?: 'QuerySessionsConnection';
  edges: Array<QuerySessionsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QuerySessionsConnectionEdge = {
  __typename?: 'QuerySessionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Session;
};

export type QueryTeamTemplatesConnection = {
  __typename?: 'QueryTeamTemplatesConnection';
  edges: Array<QueryTeamTemplatesConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryTeamTemplatesConnectionEdge = {
  __typename?: 'QueryTeamTemplatesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Template;
};

export type QueryTeamTrustedDomainsConnection = {
  __typename?: 'QueryTeamTrustedDomainsConnection';
  edges: Array<QueryTeamTrustedDomainsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryTeamTrustedDomainsConnectionEdge = {
  __typename?: 'QueryTeamTrustedDomainsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: TeamTrustedDomain;
};

export type QueryTemplatesConnection = {
  __typename?: 'QueryTemplatesConnection';
  edges: Array<QueryTemplatesConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryTemplatesConnectionEdge = {
  __typename?: 'QueryTemplatesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Template;
};

export type QueryUserTemplatesConnection = {
  __typename?: 'QueryUserTemplatesConnection';
  edges: Array<QueryUserTemplatesConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryUserTemplatesConnectionEdge = {
  __typename?: 'QueryUserTemplatesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Template;
};

export type QueryWebhooksConnection = {
  __typename?: 'QueryWebhooksConnection';
  edges: Array<QueryWebhooksConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryWebhooksConnectionEdge = {
  __typename?: 'QueryWebhooksConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ProjectWebhook;
};

export type RecoveryCodeValidateInput = {
  code: Scalars['String']['input'];
  twoFactorLinkingKey?: InputMaybe<Scalars['String']['input']>;
};

export type RecoveryCodes = {
  __typename?: 'RecoveryCodes';
  recoveryCodes: Array<Scalars['String']['output']>;
};

export type ReferralInfo = Node & {
  __typename?: 'ReferralInfo';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  referralStats: ReferralStats;
  status: Scalars['String']['output'];
};

export type ReferralInfoUpdateInput = {
  code: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type ReferralStats = {
  __typename?: 'ReferralStats';
  credited: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
};

export enum ReferralStatus {
  RefereeCredited = 'REFEREE_CREDITED',
  ReferrerCredited = 'REFERRER_CREDITED',
  Registered = 'REGISTERED',
}

export type ReferralUser = {
  __typename?: 'ReferralUser';
  code: Scalars['String']['output'];
  id: Scalars['String']['output'];
  status: ReferralStatus;
};

export type RefundRequest = Node & {
  __typename?: 'RefundRequest';
  amount: Scalars['Int']['output'];
  decision?: Maybe<RefundRequestDecisionEnum>;
  id: Scalars['ID']['output'];
  invoiceId: Scalars['String']['output'];
  plainThreadId?: Maybe<Scalars['String']['output']>;
  reason: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
  workspace: Workspace;
};

/** Possible decisions for a RefundRequest */
export enum RefundRequestDecisionEnum {
  AutoRefunded = 'AUTO_REFUNDED',
  AutoRejected = 'AUTO_REJECTED',
  ManuallyRefunded = 'MANUALLY_REFUNDED',
}

export type Region = {
  __typename?: 'Region';
  /** Region country */
  country: Scalars['String']['output'];
  deploymentConstraints?: Maybe<RegionDeploymentConstraints>;
  location: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Region is on Railway Metal */
  railwayMetal?: Maybe<Scalars['Boolean']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  teamId?: Maybe<Scalars['String']['output']>;
};

export type RegionDeploymentConstraints = {
  __typename?: 'RegionDeploymentConstraints';
  /** Admin only region */
  adminOnly?: Maybe<Scalars['Boolean']['output']>;
  runtimeExclusivity?: Maybe<Array<Scalars['String']['output']>>;
  /** Staging only region */
  stagingOnly?: Maybe<Scalars['Boolean']['output']>;
};

export enum RegistrationStatus {
  Onboarded = 'ONBOARDED',
  Registered = 'REGISTERED',
  Waitlisted = 'WAITLISTED',
}

/** Private Docker registry credentials. Only available for Pro plan deployments. */
export type RegistryCredentialsInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type ReissuedInvoice = Node & {
  __typename?: 'ReissuedInvoice';
  id: Scalars['ID']['output'];
  originalInvoiceId: Scalars['String']['output'];
  reissuedInvoiceId?: Maybe<Scalars['String']['output']>;
  workspace: Workspace;
  workspaceId: Scalars['String']['output'];
};

export enum ReplicateVolumeInstanceSnapshotStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Initiated = 'INITIATED',
  Transferring = 'TRANSFERRING',
  Unrecognized = 'UNRECOGNIZED',
}

/** The status of a volume instance replication */
export enum ReplicateVolumeInstanceStatus {
  Completed = 'COMPLETED',
  Error = 'ERROR',
  Queued = 'QUEUED',
  TransferringOffline = 'TRANSFERRING_OFFLINE',
  TransferringOnline = 'TRANSFERRING_ONLINE',
}

export type ResetPluginCredentialsInput = {
  environmentId: Scalars['String']['input'];
};

export type ResetPluginInput = {
  environmentId: Scalars['String']['input'];
};

export type ResourceAccess = {
  __typename?: 'ResourceAccess';
  deployment: AccessRule;
  project: AccessRule;
};

export enum ResourceOwnerType {
  Team = 'TEAM',
}

export enum RestartPolicyType {
  Always = 'ALWAYS',
  Never = 'NEVER',
  OnFailure = 'ON_FAILURE',
}

export type SendBountyWonEmailInput = {
  bountyAmount: Scalars['Float']['input'];
  threadTitle: Scalars['String']['input'];
  threadUrl: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  workspaceName: Scalars['String']['input'];
};

export type SendCommunityThreadNotificationEmailInput = {
  postEntryContent?: InputMaybe<Scalars['String']['input']>;
  threadTitle: Scalars['String']['input'];
  threadUrl: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};

export type SendCommunityWelcomeEmailInput = {
  userId: Scalars['String']['input'];
};

export type SendNewBountyEmailInput = {
  threadTitle: Scalars['String']['input'];
  threadUrl: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};

export type SendQuestionMovedToBountyEmailInput = {
  threadTitle: Scalars['String']['input'];
  threadUrl: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type Service = Node & {
  __typename?: 'Service';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deployments: ServiceDeploymentsConnection;
  featureFlags: Array<ActiveServiceFeatureFlag>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
  repoTriggers: ServiceRepoTriggersConnection;
  serviceInstances: ServiceServiceInstancesConnection;
  templateServiceId?: Maybe<Scalars['String']['output']>;
  templateThreadSlug?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ServiceDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ServiceRepoTriggersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ServiceServiceInstancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ServiceConnectInput = {
  /** The branch to connect to. e.g. 'main' */
  branch?: InputMaybe<Scalars['String']['input']>;
  /** Name of the Dockerhub or GHCR image to connect this service to. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** The full name of the repo to connect to. e.g. 'railwayapp/starters' */
  repo?: InputMaybe<Scalars['String']['input']>;
};

export type ServiceCreateInput = {
  branch?: InputMaybe<Scalars['String']['input']>;
  /** Environment ID. If the specified environment is a fork, the service will only be created in it. Otherwise it will created in all environments that are not forks of other environments */
  environmentId?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  registryCredentials?: InputMaybe<RegistryCredentialsInput>;
  source?: InputMaybe<ServiceSourceInput>;
  templateServiceId?: InputMaybe<Scalars['String']['input']>;
  variables?: InputMaybe<Scalars['EnvironmentVariables']['input']>;
};

export type ServiceDeploymentsConnection = {
  __typename?: 'ServiceDeploymentsConnection';
  edges: Array<ServiceDeploymentsConnectionEdge>;
  pageInfo: PageInfo;
};

export type ServiceDeploymentsConnectionEdge = {
  __typename?: 'ServiceDeploymentsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Deployment;
};

export type ServiceDomain = Domain & {
  __typename?: 'ServiceDomain';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain: Scalars['String']['output'];
  edgeId?: Maybe<Scalars['String']['output']>;
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  projectId?: Maybe<Scalars['String']['output']>;
  serviceId: Scalars['String']['output'];
  suffix?: Maybe<Scalars['String']['output']>;
  targetPort?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ServiceDomainCreateInput = {
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
  targetPort?: InputMaybe<Scalars['Int']['input']>;
};

export type ServiceDomainUpdateInput = {
  domain: Scalars['String']['input'];
  environmentId: Scalars['String']['input'];
  serviceDomainId?: InputMaybe<Scalars['String']['input']>;
  serviceId: Scalars['String']['input'];
  targetPort?: InputMaybe<Scalars['Int']['input']>;
};

export type ServiceFeatureFlagToggleInput = {
  flag: ActiveServiceFeatureFlag;
  serviceId: Scalars['String']['input'];
};

export type ServiceInstance = Node & {
  __typename?: 'ServiceInstance';
  buildCommand?: Maybe<Scalars['String']['output']>;
  builder: Builder;
  createdAt: Scalars['DateTime']['output'];
  cronSchedule?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domains: AllDomains;
  environmentId: Scalars['String']['output'];
  healthcheckPath?: Maybe<Scalars['String']['output']>;
  healthcheckTimeout?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isUpdatable: Scalars['Boolean']['output'];
  latestDeployment?: Maybe<Deployment>;
  nextCronRunAt?: Maybe<Scalars['DateTime']['output']>;
  nixpacksPlan?: Maybe<Scalars['JSON']['output']>;
  numReplicas?: Maybe<Scalars['Int']['output']>;
  preDeployCommand?: Maybe<Scalars['JSON']['output']>;
  railpackInfo?: Maybe<Scalars['RailpackInfo']['output']>;
  railwayConfigFile?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  restartPolicyMaxRetries: Scalars['Int']['output'];
  restartPolicyType: RestartPolicyType;
  rootDirectory?: Maybe<Scalars['String']['output']>;
  serviceId: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  sleepApplication?: Maybe<Scalars['Boolean']['output']>;
  source?: Maybe<ServiceSource>;
  startCommand?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  upstreamUrl?: Maybe<Scalars['String']['output']>;
  watchPatterns: Array<Scalars['String']['output']>;
};

export type ServiceInstanceLimitsUpdateInput = {
  environmentId: Scalars['String']['input'];
  /** Amount of memory in GB to allocate to the service instance */
  memoryGB?: InputMaybe<Scalars['Float']['input']>;
  serviceId: Scalars['String']['input'];
  /** Number of vCPUs to allocate to the service instance */
  vCPUs?: InputMaybe<Scalars['Float']['input']>;
};

export type ServiceInstanceUpdateInput = {
  buildCommand?: InputMaybe<Scalars['String']['input']>;
  builder?: InputMaybe<Builder>;
  cronSchedule?: InputMaybe<Scalars['String']['input']>;
  healthcheckPath?: InputMaybe<Scalars['String']['input']>;
  healthcheckTimeout?: InputMaybe<Scalars['Int']['input']>;
  multiRegionConfig?: InputMaybe<Scalars['JSON']['input']>;
  nixpacksPlan?: InputMaybe<Scalars['JSON']['input']>;
  numReplicas?: InputMaybe<Scalars['Int']['input']>;
  preDeployCommand?: InputMaybe<Array<Scalars['String']['input']>>;
  railwayConfigFile?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  registryCredentials?: InputMaybe<RegistryCredentialsInput>;
  restartPolicyMaxRetries?: InputMaybe<Scalars['Int']['input']>;
  restartPolicyType?: InputMaybe<RestartPolicyType>;
  rootDirectory?: InputMaybe<Scalars['String']['input']>;
  sleepApplication?: InputMaybe<Scalars['Boolean']['input']>;
  source?: InputMaybe<ServiceSourceInput>;
  startCommand?: InputMaybe<Scalars['String']['input']>;
  watchPatterns?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ServiceRepoTriggersConnection = {
  __typename?: 'ServiceRepoTriggersConnection';
  edges: Array<ServiceRepoTriggersConnectionEdge>;
  pageInfo: PageInfo;
};

export type ServiceRepoTriggersConnectionEdge = {
  __typename?: 'ServiceRepoTriggersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: DeploymentTrigger;
};

export type ServiceServiceInstancesConnection = {
  __typename?: 'ServiceServiceInstancesConnection';
  edges: Array<ServiceServiceInstancesConnectionEdge>;
  pageInfo: PageInfo;
};

export type ServiceServiceInstancesConnectionEdge = {
  __typename?: 'ServiceServiceInstancesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ServiceInstance;
};

export type ServiceSource = {
  __typename?: 'ServiceSource';
  image?: Maybe<Scalars['String']['output']>;
  repo?: Maybe<Scalars['String']['output']>;
};

export type ServiceSourceInput = {
  image?: InputMaybe<Scalars['String']['input']>;
  repo?: InputMaybe<Scalars['String']['input']>;
};

export type ServiceUpdateInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Session = Node & {
  __typename?: 'Session';
  createdAt: Scalars['DateTime']['output'];
  expiredAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isCurrent: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  type: SessionType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum SessionType {
  Browser = 'BROWSER',
  Cli = 'CLI',
  Forums = 'FORUMS',
}

export type SharedVariableConfigureInput = {
  disabledServiceIds: Array<Scalars['String']['input']>;
  enabledServiceIds: Array<Scalars['String']['input']>;
  environmentId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
};

export type SimilarTemplate = {
  __typename?: 'SimilarTemplate';
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<TemplateCreator>;
  deploys: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  health?: Maybe<Scalars['Float']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  teamId?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Stream logs for a build */
  buildLogs: Array<Log>;
  /** Subscribe to updates for a specific deployment */
  deployment: Deployment;
  /** Subscribe to deployment events for a specific deployment */
  deploymentEvents: DeploymentEvent;
  /** Subscribe to deployment instance executions for a specific deployment */
  deploymentInstanceExecutions: DeploymentInstanceExecution;
  /** Stream logs for a deployment */
  deploymentLogs: Array<Log>;
  /** Stream logs for a project environment */
  environmentLogs: Array<Log>;
  /** Stream HTTP logs for a deployment */
  httpLogs: Array<HttpLog>;
  /** Stream logs for a plugin */
  pluginLogs: Array<Log>;
  /** Subscribe to migration progress updates for a volume */
  replicationProgress: VolumeReplicationProgressUpdate;
};

export type SubscriptionBuildLogsArgs = {
  deploymentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionDeploymentArgs = {
  id: Scalars['String']['input'];
};

export type SubscriptionDeploymentEventsArgs = {
  id: Scalars['String']['input'];
};

export type SubscriptionDeploymentInstanceExecutionsArgs = {
  input: DeploymentInstanceExecutionInput;
};

export type SubscriptionDeploymentLogsArgs = {
  deploymentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionEnvironmentLogsArgs = {
  afterDate?: InputMaybe<Scalars['String']['input']>;
  afterLimit?: InputMaybe<Scalars['Int']['input']>;
  anchorDate?: InputMaybe<Scalars['String']['input']>;
  beforeDate?: InputMaybe<Scalars['String']['input']>;
  beforeLimit?: InputMaybe<Scalars['Int']['input']>;
  environmentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionHttpLogsArgs = {
  afterDate?: InputMaybe<Scalars['String']['input']>;
  afterLimit?: InputMaybe<Scalars['Int']['input']>;
  anchorDate?: InputMaybe<Scalars['String']['input']>;
  beforeDate?: InputMaybe<Scalars['String']['input']>;
  beforeLimit?: InputMaybe<Scalars['Int']['input']>;
  deploymentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionPluginLogsArgs = {
  environmentId: Scalars['String']['input'];
  filter?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  pluginId: Scalars['String']['input'];
};

export type SubscriptionReplicationProgressArgs = {
  volumeInstanceId: Scalars['String']['input'];
};

export type SubscriptionDiscount = {
  __typename?: 'SubscriptionDiscount';
  couponId: Scalars['String']['output'];
};

export type SubscriptionItem = {
  __typename?: 'SubscriptionItem';
  itemId: Scalars['String']['output'];
  priceId: Scalars['String']['output'];
  productId: Scalars['String']['output'];
  quantity?: Maybe<Scalars['BigInt']['output']>;
};

export enum SubscriptionModel {
  Free = 'FREE',
  Team = 'TEAM',
  User = 'USER',
}

export enum SubscriptionPlanType {
  Free = 'free',
  Hobby = 'hobby',
  Pro = 'pro',
  Trial = 'trial',
}

export enum SubscriptionState {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Inactive = 'INACTIVE',
  PastDue = 'PAST_DUE',
  Unpaid = 'UNPAID',
}

export enum SupportTierOverride {
  BusinessClass = 'BUSINESS_CLASS',
  BusinessClassTrial = 'BUSINESS_CLASS_TRIAL',
}

export type TcpProxy = {
  __typename?: 'TCPProxy';
  applicationPort: Scalars['Int']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain: Scalars['String']['output'];
  environmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  proxyPort: Scalars['Int']['output'];
  serviceId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type TcpProxyCreateInput = {
  applicationPort: Scalars['Int']['input'];
  environmentId: Scalars['String']['input'];
  serviceId: Scalars['String']['input'];
};

export type Team = Node & {
  __typename?: 'Team';
  adoptionHistory: Array<AdoptionInfo>;
  adoptionLevel: Scalars['Float']['output'];
  /** @deprecated This property is not part of Teams anymore, go through the Workspace to access it */
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** @deprecated Access the customer through the workspace */
  customer: Customer;
  id: Scalars['ID']['output'];
  members: Array<TeamMember>;
  /** @deprecated This property is not part of Teams anymore, go through the Workspace to access it */
  name: Scalars['String']['output'];
  /** @deprecated This property is not part of Teams anymore, go through the Workspace to access it */
  preferredRegion?: Maybe<Scalars['String']['output']>;
  projects: TeamProjectsConnection;
  /** @deprecated This property is not part of Teams anymore, go through the Workspace to access it */
  slackChannelId?: Maybe<Scalars['String']['output']>;
  /** @deprecated This property is not part of Teams anymore, go through the Workspace to access it */
  supportTierOverride?: Maybe<SupportTierOverride>;
  teamPermissions: Array<TeamPermission>;
  updatedAt: Scalars['DateTime']['output'];
  workspace: Workspace;
};

export type TeamProjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type TeamBulkProjectTransferInput = {
  projectIds: Array<Scalars['String']['input']>;
  teamId: Scalars['String']['input'];
};

export type TeamCreateAndSubscribeInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  paymentMethodId: Scalars['String']['input'];
};

export type TeamCreateAndSubscribeResponse = {
  __typename?: 'TeamCreateAndSubscribeResponse';
  customerId: Scalars['String']['output'];
  paymentIntent?: Maybe<Scalars['JSON']['output']>;
  teamId: Scalars['String']['output'];
};

export type TeamInviteCodeCreateInput = {
  role: Scalars['String']['input'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  avatar?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  /** Only retrieved if requested by an admin */
  featureFlags?: Maybe<Array<ActiveFeatureFlag>>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  role: TeamRole;
};

export type TeamPermission = Node & {
  __typename?: 'TeamPermission';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  role: TeamRole;
  teamId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type TeamPermissionChangeInput = {
  role: TeamRole;
  teamId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type TeamProjectsConnection = {
  __typename?: 'TeamProjectsConnection';
  edges: Array<TeamProjectsConnectionEdge>;
  pageInfo: PageInfo;
};

export type TeamProjectsConnectionEdge = {
  __typename?: 'TeamProjectsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Project;
};

export enum TeamRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Viewer = 'VIEWER',
}

export type TeamTrustedDomain = Node & {
  __typename?: 'TeamTrustedDomain';
  domainName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  teamId: Scalars['String']['output'];
  teamRole: Scalars['String']['output'];
  verificationData: TrustedDomainVerificationData;
  verificationType: Scalars['String']['output'];
};

export type TeamTrustedDomainCreateInput = {
  domainName: Scalars['String']['input'];
  teamId: Scalars['String']['input'];
  teamRole: Scalars['String']['input'];
};

export type TeamUserInviteInput = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type TeamUserRemoveInput = {
  userId: Scalars['String']['input'];
};

export type Template = Node & {
  __typename?: 'Template';
  activeProjects: Scalars['Int']['output'];
  canvasConfig?: Maybe<Scalars['CanvasConfig']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  communityThreadSlug?: Maybe<Scalars['String']['output']>;
  config: Scalars['TemplateConfig']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<TemplateCreator>;
  demoProjectId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  guides?: Maybe<TemplateGuide>;
  health?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  isApproved: Scalars['Boolean']['output'];
  isV2Template: Scalars['Boolean']['output'];
  languages?: Maybe<Array<Scalars['String']['output']>>;
  /** @deprecated Deprecated in favor of listing the fields individually. */
  metadata: Scalars['TemplateMetadata']['output'];
  name: Scalars['String']['output'];
  projects: Scalars['Int']['output'];
  readme?: Maybe<Scalars['String']['output']>;
  serializedConfig?: Maybe<Scalars['SerializedTemplateConfig']['output']>;
  services: TemplateServicesConnection;
  similarTemplates: Array<SimilarTemplate>;
  status: TemplateStatus;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  teamId?: Maybe<Scalars['String']['output']>;
  totalPayout: Scalars['Float']['output'];
};

export type TemplateServicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type TemplateCloneInput = {
  code: Scalars['String']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type TemplateCreator = {
  __typename?: 'TemplateCreator';
  avatar?: Maybe<Scalars['String']['output']>;
  hasPublicProfile: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type TemplateDeleteInput = {
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type TemplateDeployInput = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  services: Array<TemplateDeployService>;
  teamId: Scalars['String']['input'];
  templateCode?: InputMaybe<Scalars['String']['input']>;
};

export type TemplateDeployPayload = {
  __typename?: 'TemplateDeployPayload';
  projectId: Scalars['String']['output'];
  workflowId?: Maybe<Scalars['String']['output']>;
};

export type TemplateDeployService = {
  commit?: InputMaybe<Scalars['String']['input']>;
  hasDomain?: InputMaybe<Scalars['Boolean']['input']>;
  healthcheckPath?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Scalars['String']['input']>;
  preDeployCommand?: InputMaybe<Array<Scalars['String']['input']>>;
  rootDirectory?: InputMaybe<Scalars['String']['input']>;
  serviceIcon?: InputMaybe<Scalars['String']['input']>;
  serviceName: Scalars['String']['input'];
  startCommand?: InputMaybe<Scalars['String']['input']>;
  tcpProxyApplicationPort?: InputMaybe<Scalars['Int']['input']>;
  template: Scalars['String']['input'];
  variables?: InputMaybe<Scalars['EnvironmentVariables']['input']>;
  volumes?: InputMaybe<Array<Scalars['TemplateVolume']['input']>>;
};

export type TemplateDeployV2Input = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  serializedConfig: Scalars['SerializedTemplateConfig']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
  templateId: Scalars['String']['input'];
};

export type TemplateGenerateInput = {
  environmentId?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['String']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type TemplateGuide = {
  __typename?: 'TemplateGuide';
  post?: Maybe<Scalars['String']['output']>;
  video?: Maybe<Scalars['String']['output']>;
};

export type TemplatePublishInput = {
  category: Scalars['String']['input'];
  demoProjectId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  readme: Scalars['String']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type TemplateService = Node & {
  __typename?: 'TemplateService';
  config: Scalars['TemplateServiceConfig']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  templateId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TemplateServiceSourceEjectInput = {
  projectId: Scalars['String']['input'];
  repoName: Scalars['String']['input'];
  repoOwner: Scalars['String']['input'];
  /** Provide multiple serviceIds when ejecting services from a monorepo. */
  serviceIds: Array<Scalars['String']['input']>;
  upstreamUrl: Scalars['String']['input'];
};

export type TemplateServicesConnection = {
  __typename?: 'TemplateServicesConnection';
  edges: Array<TemplateServicesConnectionEdge>;
  pageInfo: PageInfo;
};

export type TemplateServicesConnectionEdge = {
  __typename?: 'TemplateServicesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: TemplateService;
};

export enum TemplateStatus {
  Hidden = 'HIDDEN',
  Published = 'PUBLISHED',
  Unpublished = 'UNPUBLISHED',
}

export type TrustedDomainVerificationData = {
  __typename?: 'TrustedDomainVerificationData';
  domainMatch?: Maybe<Domain>;
  domainStatus?: Maybe<CustomDomainStatus>;
};

export type TwoFactorInfo = {
  __typename?: 'TwoFactorInfo';
  hasRecoveryCodes: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
};

export type TwoFactorInfoCreateInput = {
  token: Scalars['String']['input'];
};

export type TwoFactorInfoSecret = {
  __typename?: 'TwoFactorInfoSecret';
  secret: Scalars['String']['output'];
  uri: Scalars['String']['output'];
};

export type TwoFactorInfoValidateInput = {
  token: Scalars['String']['input'];
  twoFactorLinkingKey?: InputMaybe<Scalars['String']['input']>;
};

export type UsageAnomaly = Node & {
  __typename?: 'UsageAnomaly';
  actedOn?: Maybe<Scalars['DateTime']['output']>;
  action?: Maybe<UsageAnomalyAction>;
  actorId?: Maybe<Scalars['String']['output']>;
  flaggedAt: Scalars['DateTime']['output'];
  flaggedFor: UsageAnomalyFlagReason;
  id: Scalars['ID']['output'];
};

/** Possible actions for a UsageAnomaly. */
export enum UsageAnomalyAction {
  Allowed = 'ALLOWED',
  Autobanned = 'AUTOBANNED',
  Banned = 'BANNED',
}

/** Possible flag reasons for a UsageAnomaly. */
export enum UsageAnomalyFlagReason {
  HighCpuUsage = 'HIGH_CPU_USAGE',
  HighDiskUsage = 'HIGH_DISK_USAGE',
  HighNetworkUsage = 'HIGH_NETWORK_USAGE',
}

export type UsageLimit = Node & {
  __typename?: 'UsageLimit';
  customerId: Scalars['String']['output'];
  hardLimit?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isOverLimit: Scalars['Boolean']['output'];
  softLimit: Scalars['Int']['output'];
};

export type UsageLimitRemoveInput = {
  customerId: Scalars['String']['input'];
};

export type UsageLimitSetInput = {
  customerId: Scalars['String']['input'];
  hardLimitDollars?: InputMaybe<Scalars['Int']['input']>;
  softLimitDollars: Scalars['Int']['input'];
};

export type User = Node & {
  __typename?: 'User';
  agreedFairUse: Scalars['Boolean']['output'];
  avatar?: Maybe<Scalars['String']['output']>;
  banReason?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  featureFlags: Array<ActiveFeatureFlag>;
  flags: Array<UserFlag>;
  has2FA: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isAdmin: Scalars['Boolean']['output'];
  isConductor: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  lastLogin: Scalars['DateTime']['output'];
  name?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<UserProfile>;
  /** @deprecated This field will not return anything anymore, go through the workspace's projects */
  projects: UserProjectsConnection;
  providerAuths: UserProviderAuthsConnection;
  registrationStatus: RegistrationStatus;
  riskLevel?: Maybe<Scalars['Float']['output']>;
  /** @deprecated Use the workspaces relation to access the teams */
  teams: UserTeamsConnection;
  termsAgreedOn?: Maybe<Scalars['DateTime']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use user.workspaces instead, no user are associated to a workspace */
  workspace?: Maybe<Workspace>;
  /** Workspaces user is member of */
  workspaces: Array<Workspace>;
};

export type UserProjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserProviderAuthsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserTeamsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export enum UserFlag {
  Beta = 'BETA',
}

export type UserFlagsRemoveInput = {
  flags: Array<UserFlag>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UserFlagsSetInput = {
  flags: Array<UserFlag>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UserKickbackEarnings = {
  __typename?: 'UserKickbackEarnings';
  total_amount: Scalars['Float']['output'];
};

export type UserProfile = {
  __typename?: 'UserProfile';
  bio?: Maybe<Scalars['String']['output']>;
  isPublic: Scalars['Boolean']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type UserProfileResponse = {
  __typename?: 'UserProfileResponse';
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customerId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isTrialing?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  profile: UserProfile;
  /** Gets all public projects for a user. */
  publicProjects: UserProfileResponsePublicProjectsConnection;
  /** @deprecated There are no personal templates anymore, they all belong to a workspace */
  publishedTemplates: Array<SimilarTemplate>;
  state?: Maybe<Scalars['String']['output']>;
  totalDeploys: Scalars['Int']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type UserProfileResponsePublicProjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserProfileResponsePublicProjectsConnection = {
  __typename?: 'UserProfileResponsePublicProjectsConnection';
  edges: Array<UserProfileResponsePublicProjectsConnectionEdge>;
  pageInfo: PageInfo;
};

export type UserProfileResponsePublicProjectsConnectionEdge = {
  __typename?: 'UserProfileResponsePublicProjectsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Project;
};

export type UserProfileUpdateInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  isPublic: Scalars['Boolean']['input'];
  website?: InputMaybe<Scalars['String']['input']>;
};

export type UserProjectsConnection = {
  __typename?: 'UserProjectsConnection';
  edges: Array<UserProjectsConnectionEdge>;
  pageInfo: PageInfo;
};

export type UserProjectsConnectionEdge = {
  __typename?: 'UserProjectsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Project;
};

export type UserProviderAuthsConnection = {
  __typename?: 'UserProviderAuthsConnection';
  edges: Array<UserProviderAuthsConnectionEdge>;
  pageInfo: PageInfo;
};

export type UserProviderAuthsConnectionEdge = {
  __typename?: 'UserProviderAuthsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: ProviderAuth;
};

export type UserTeamsConnection = {
  __typename?: 'UserTeamsConnection';
  edges: Array<UserTeamsConnectionEdge>;
  pageInfo: PageInfo;
};

export type UserTeamsConnectionEdge = {
  __typename?: 'UserTeamsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Team;
};

export type UserUpdateInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type Variable = Node & {
  __typename?: 'Variable';
  createdAt: Scalars['DateTime']['output'];
  environment: Environment;
  environmentId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isSealed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  plugin: Plugin;
  pluginId?: Maybe<Scalars['String']['output']>;
  references: Array<Scalars['String']['output']>;
  service: Service;
  serviceId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type VariableCollectionUpsertInput = {
  environmentId: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  /** When set to true, removes all existing variables before upserting the new collection. */
  replace?: InputMaybe<Scalars['Boolean']['input']>;
  serviceId?: InputMaybe<Scalars['String']['input']>;
  variables: Scalars['EnvironmentVariables']['input'];
};

export type VariableDeleteInput = {
  environmentId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId?: InputMaybe<Scalars['String']['input']>;
};

export type VariableUpsertInput = {
  environmentId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  serviceId?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type VercelAccount = {
  __typename?: 'VercelAccount';
  id: Scalars['String']['output'];
  integrationAuthId: Scalars['String']['output'];
  isUser: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  projects: Array<VercelProject>;
  slug?: Maybe<Scalars['String']['output']>;
};

export type VercelInfo = {
  __typename?: 'VercelInfo';
  accounts: Array<VercelAccount>;
};

export type VercelProject = {
  __typename?: 'VercelProject';
  accountId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Volume = Node & {
  __typename?: 'Volume';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['String']['output'];
  volumeInstances: VolumeVolumeInstancesConnection;
};

export type VolumeVolumeInstancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type VolumeCreateInput = {
  /** The environment to deploy the volume instances into. If `null`, the volume will not be deployed to any environment. `undefined` will deploy to all environments. */
  environmentId?: InputMaybe<Scalars['String']['input']>;
  /** The path in the container to mount the volume to */
  mountPath: Scalars['String']['input'];
  /** The project to create the volume in */
  projectId: Scalars['String']['input'];
  /** The service to attach the volume to. If not provided, the volume will be disconnected. */
  serviceId?: InputMaybe<Scalars['String']['input']>;
};

export type VolumeInstance = Node & {
  __typename?: 'VolumeInstance';
  createdAt: Scalars['DateTime']['output'];
  currentSizeMB: Scalars['Float']['output'];
  environment: Environment;
  environmentId: Scalars['String']['output'];
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mountPath: Scalars['String']['output'];
  region?: Maybe<Scalars['String']['output']>;
  service: Service;
  serviceId?: Maybe<Scalars['String']['output']>;
  sizeMB: Scalars['Int']['output'];
  state?: Maybe<VolumeState>;
  type: VolumeInstanceType;
  volume: Volume;
  volumeId: Scalars['String']['output'];
};

export type VolumeInstanceBackup = {
  __typename?: 'VolumeInstanceBackup';
  createdAt: Scalars['DateTime']['output'];
  creatorId?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  externalId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  referencedMB?: Maybe<Scalars['Int']['output']>;
  usedMB?: Maybe<Scalars['Int']['output']>;
};

export type VolumeInstanceBackupSchedule = Node & {
  __typename?: 'VolumeInstanceBackupSchedule';
  createdAt: Scalars['DateTime']['output'];
  cron: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: VolumeInstanceBackupScheduleKind;
  name: Scalars['String']['output'];
  retentionSeconds?: Maybe<Scalars['Int']['output']>;
};

export enum VolumeInstanceBackupScheduleKind {
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  Weekly = 'WEEKLY',
}

export type VolumeInstanceReplicationProgress = {
  __typename?: 'VolumeInstanceReplicationProgress';
  bytesTransferred: Scalars['BigInt']['output'];
  percentComplete: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
  transferRateMbps?: Maybe<Scalars['Float']['output']>;
};

export enum VolumeInstanceType {
  Cloud = 'CLOUD',
  Metal = 'METAL',
}

export type VolumeInstanceUpdateInput = {
  /** The mount path of the volume instance. If not provided, the mount path will not be updated. */
  mountPath?: InputMaybe<Scalars['String']['input']>;
  /** The service to attach the volume to. If not provided, the volume will be disconnected. */
  serviceId?: InputMaybe<Scalars['String']['input']>;
  /** The state of the volume instance. If not provided, the state will not be updated. */
  state?: InputMaybe<VolumeState>;
  /** The type of the volume instance. If not provided, the type will not be updated. */
  type?: InputMaybe<VolumeInstanceType>;
};

export type VolumeReplicationProgressUpdate = {
  __typename?: 'VolumeReplicationProgressUpdate';
  currentSnapshot: VolumeSnapshotReplicationProgressUpdate;
  destExternalId: Scalars['String']['output'];
  destRegion?: Maybe<Scalars['String']['output']>;
  destStackerId?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  estimatedTimeRemainingMs?: Maybe<Scalars['BigInt']['output']>;
  history: Array<VolumeInstanceReplicationProgress>;
  nbSnapshots: Scalars['Int']['output'];
  offlineBytesTransferred: Scalars['BigInt']['output'];
  offlineTotalBytes: Scalars['BigInt']['output'];
  onlineBytesTransferred: Scalars['BigInt']['output'];
  onlineTotalBytes: Scalars['BigInt']['output'];
  percentComplete: Scalars['Float']['output'];
  snapshotsSizes: Array<Scalars['BigInt']['output']>;
  srcExternalId: Scalars['String']['output'];
  srcRegion?: Maybe<Scalars['String']['output']>;
  srcStackerId?: Maybe<Scalars['String']['output']>;
  status: ReplicateVolumeInstanceStatus;
  transferRateMbps?: Maybe<Scalars['Float']['output']>;
};

export type VolumeSnapshotReplicationProgressUpdate = {
  __typename?: 'VolumeSnapshotReplicationProgressUpdate';
  bytesTransferred: Scalars['BigInt']['output'];
  compressedBytesTransferred: Scalars['BigInt']['output'];
  compressedTransferRateMbps?: Maybe<Scalars['Float']['output']>;
  elapsedMs: Scalars['Int']['output'];
  error?: Maybe<Scalars['String']['output']>;
  estimatedTimeRemainingMs?: Maybe<Scalars['BigInt']['output']>;
  index: Scalars['Int']['output'];
  percentComplete: Scalars['Float']['output'];
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: ReplicateVolumeInstanceSnapshotStatus;
  totalBytes: Scalars['BigInt']['output'];
  transferRateMbps?: Maybe<Scalars['Float']['output']>;
};

export enum VolumeState {
  Deleted = 'DELETED',
  Deleting = 'DELETING',
  Error = 'ERROR',
  Migrating = 'MIGRATING',
  MigrationPending = 'MIGRATION_PENDING',
  Ready = 'READY',
  Restoring = 'RESTORING',
  Updating = 'UPDATING',
}

export type VolumeUpdateInput = {
  /** The name of the volume */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type VolumeVolumeInstancesConnection = {
  __typename?: 'VolumeVolumeInstancesConnection';
  edges: Array<VolumeVolumeInstancesConnectionEdge>;
  pageInfo: PageInfo;
};

export type VolumeVolumeInstancesConnectionEdge = {
  __typename?: 'VolumeVolumeInstancesConnectionEdge';
  cursor: Scalars['String']['output'];
  node: VolumeInstance;
};

export type WebhookCreateInput = {
  filters?: InputMaybe<Array<Scalars['String']['input']>>;
  projectId: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type WebhookUpdateInput = {
  filters?: InputMaybe<Array<Scalars['String']['input']>>;
  url: Scalars['String']['input'];
};

export type Withdrawal = Node & {
  __typename?: 'Withdrawal';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  customerId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: WithdrawalStatusType;
  updatedAt: Scalars['DateTime']['output'];
  withdrawalAccountId: Scalars['String']['output'];
};

export type WithdrawalAccount = Node & {
  __typename?: 'WithdrawalAccount';
  customerId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  platform: WithdrawalPlatformTypes;
  platformDetails: Scalars['String']['output'];
};

export enum WithdrawalPlatformTypes {
  Bmac = 'BMAC',
  Github = 'GITHUB',
  Paypal = 'PAYPAL',
}

export enum WithdrawalStatusType {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
}

export type WorkflowId = {
  __typename?: 'WorkflowId';
  workflowId?: Maybe<Scalars['String']['output']>;
};

export type WorkflowResult = {
  __typename?: 'WorkflowResult';
  error?: Maybe<Scalars['String']['output']>;
  status: WorkflowStatus;
};

export enum WorkflowStatus {
  Complete = 'Complete',
  Error = 'Error',
  NotFound = 'NotFound',
  Running = 'Running',
}

export type Workspace = Node & {
  __typename?: 'Workspace';
  avatar?: Maybe<Scalars['String']['output']>;
  banReason?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customer: Customer;
  discordRole?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  preferredRegion?: Maybe<Scalars['String']['output']>;
  referredUsers: Array<ReferralUser>;
  slackChannelId?: Maybe<Scalars['String']['output']>;
  subscriptionModel: SubscriptionModel;
  supportTierOverride?: Maybe<SupportTierOverride>;
  team?: Maybe<Team>;
};

export type WorkspaceUpdateInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  preferredRegion?: InputMaybe<Scalars['String']['input']>;
};

export type CustomerTogglePayoutsToCreditsInput = {
  isWithdrawingToCredits: Scalars['Boolean']['input'];
};

export const DeploymentDocument = gql`
  query deployment($id: String!) {
    deployment(id: $id) {
      status
      staticUrl
      service {
        name
      }
    }
  }
`;
export const EnvironmentsDocument = gql`
  query environments($projectId: String!) {
    environments(projectId: $projectId) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;
export const EnvironmentCreateDocument = gql`
  mutation environmentCreate($input: EnvironmentCreateInput!) {
    environmentCreate(input: $input) {
      id
      name
      projectId
    }
  }
`;
export const EnvironmentDocument = gql`
  query environment($id: String!) {
    environment(id: $id) {
      serviceInstances {
        edges {
          node {
            serviceId
            serviceName
          }
        }
      }
    }
  }
`;
export const ServiceInstanceUpdateDocument = gql`
  mutation serviceInstanceUpdate(
    $serviceId: String!
    $environmentId: String
    $input: ServiceInstanceUpdateInput!
  ) {
    serviceInstanceUpdate(
      serviceId: $serviceId
      environmentId: $environmentId
      input: $input
    )
  }
`;
export const ServiceInstanceDeployV2Document = gql`
  mutation serviceInstanceDeployV2(
    $serviceId: String!
    $environmentId: String!
  ) {
    serviceInstanceDeployV2(
      serviceId: $serviceId
      environmentId: $environmentId
    )
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    deployment(
      variables: DeploymentQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<DeploymentQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeploymentQuery>({
            document: DeploymentDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'deployment',
        'query',
        variables,
      );
    },
    environments(
      variables: EnvironmentsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<EnvironmentsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<EnvironmentsQuery>({
            document: EnvironmentsDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'environments',
        'query',
        variables,
      );
    },
    environmentCreate(
      variables: EnvironmentCreateMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<EnvironmentCreateMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<EnvironmentCreateMutation>({
            document: EnvironmentCreateDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'environmentCreate',
        'mutation',
        variables,
      );
    },
    environment(
      variables: EnvironmentQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<EnvironmentQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<EnvironmentQuery>({
            document: EnvironmentDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'environment',
        'query',
        variables,
      );
    },
    serviceInstanceUpdate(
      variables: ServiceInstanceUpdateMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<ServiceInstanceUpdateMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ServiceInstanceUpdateMutation>({
            document: ServiceInstanceUpdateDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'serviceInstanceUpdate',
        'mutation',
        variables,
      );
    },
    serviceInstanceDeployV2(
      variables: ServiceInstanceDeployV2MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<ServiceInstanceDeployV2Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ServiceInstanceDeployV2Mutation>({
            document: ServiceInstanceDeployV2Document,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'serviceInstanceDeployV2',
        'mutation',
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
export type DeploymentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type DeploymentQuery = {
  __typename?: 'Query';
  deployment: {
    __typename?: 'Deployment';
    status: DeploymentStatus;
    staticUrl?: string | null;
    service: { __typename?: 'Service'; name: string };
  };
};

export type EnvironmentsQueryVariables = Exact<{
  projectId: Scalars['String']['input'];
}>;

export type EnvironmentsQuery = {
  __typename?: 'Query';
  environments: {
    __typename?: 'QueryEnvironmentsConnection';
    edges: Array<{
      __typename?: 'QueryEnvironmentsConnectionEdge';
      node: { __typename?: 'Environment'; id: string; name: string };
    }>;
  };
};

export type EnvironmentCreateMutationVariables = Exact<{
  input: EnvironmentCreateInput;
}>;

export type EnvironmentCreateMutation = {
  __typename?: 'Mutation';
  environmentCreate: {
    __typename?: 'Environment';
    id: string;
    name: string;
    projectId: string;
  };
};

export type EnvironmentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type EnvironmentQuery = {
  __typename?: 'Query';
  environment: {
    __typename?: 'Environment';
    serviceInstances: {
      __typename?: 'EnvironmentServiceInstancesConnection';
      edges: Array<{
        __typename?: 'EnvironmentServiceInstancesConnectionEdge';
        node: {
          __typename?: 'ServiceInstance';
          serviceId: string;
          serviceName: string;
        };
      }>;
    };
  };
};

export type ServiceInstanceUpdateMutationVariables = Exact<{
  serviceId: Scalars['String']['input'];
  environmentId?: InputMaybe<Scalars['String']['input']>;
  input: ServiceInstanceUpdateInput;
}>;

export type ServiceInstanceUpdateMutation = {
  __typename?: 'Mutation';
  serviceInstanceUpdate: boolean;
};

export type ServiceInstanceDeployV2MutationVariables = Exact<{
  serviceId: Scalars['String']['input'];
  environmentId: Scalars['String']['input'];
}>;

export type ServiceInstanceDeployV2Mutation = {
  __typename?: 'Mutation';
  serviceInstanceDeployV2: string;
};
