import { IProjectBaseFactory, ICuratedProject, IERC20 } from '../../contractTypes';
import { TypedEvent } from '../../contractTypes/commons';
export interface ListenerOptions {
    url: string;
    skipCatchup: boolean;
    contractAddress: string;
}
export declare type RawEvent = TypedEvent<any>;
export declare enum ContractType {
    Factory = 0,
    Project = 1,
    cToken = 2,
    bToken = 3
}
export declare type ProjectApi = {
    project: ICuratedProject;
    isCurated: boolean;
    bToken: IERC20;
    cToken?: IERC20;
};
export declare type Api = {
    factory: IProjectBaseFactory;
    projects: ProjectApi[];
};
export declare enum EntityKind {
    Project = "project"
}
export declare enum EventKind {
    ProjectCreated = "project-created",
    ProjectBacked = "project-backed",
    ProjectCurated = "project-curated",
    ProjectSucceeded = "project-succeeded",
    ProjectFailed = "project-failed",
    ProjectWithdraw = "project-withdraw"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type Balance = string;
export interface IProjectCreated extends IEvent {
    kind: EventKind.ProjectCreated;
    id: Address;
    index: string;
    name: string;
    ipfsHash: string;
    cwUrl: string;
    creator: Address;
    beneficiary: Address;
    acceptedToken: Address;
    curatorFee: Balance;
    threshold: Balance;
    deadline: number;
    fundingAmount: Balance;
}
export interface IProjectBacked extends IEvent {
    kind: EventKind.ProjectBacked;
    id: Address;
    sender: Address;
    token: Address;
    amount: Balance;
}
export interface IProjectCurated extends IEvent {
    kind: EventKind.ProjectCurated;
    id: Address;
    sender: Address;
    token: Address;
    amount: Balance;
}
export interface IProjectSucceeded extends IEvent {
    kind: EventKind.ProjectSucceeded;
    id: Address;
    timestamp: string;
    amount: Balance;
}
export interface IProjectFailed extends IEvent {
    kind: EventKind.ProjectFailed;
    id: Address;
}
export interface IProjectWithdraw extends IEvent {
    kind: EventKind.ProjectWithdraw;
    id: Address;
    sender: Address;
    token: Address;
    amount: Balance;
    withdrawalType: string;
}
export declare type IEventData = IProjectCreated | IProjectBacked | IProjectCurated | IProjectSucceeded | IProjectFailed | IProjectWithdraw;
export declare const EventKinds: EventKind[];
export {};
