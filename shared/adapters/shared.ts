import { Observable } from 'rxjs';

/// An object with an identifier.
export interface IIdentifiable {
  identifier: string;
}

/// An object with an identifier and a completion flag.
export interface ICompletable extends IIdentifiable {
  completed: boolean;
}

/// An adapter which can be used to subscribe to proposal creation and state
/// changes, including completion.
export abstract class ProposalAdapter<ApiT, ConstructionT extends IIdentifiable, StateT extends ICompletable> {
  public abstract subscribeNew(api: ApiT, optionalArg?): Observable<ConstructionT[]>;
  public abstract subscribeState(api: ApiT, proposal: ConstructionT, optionalArg?): Observable<StateT>;
}
