import * as CommonwealthTypes from 'chain-events/src/chains/commonwealth/types';
import BN from 'bn.js';
import { Project, AddressInfo } from 'models';

export class CWParticipant {
  public get backingEvents(): CommonwealthTypes.IProjectBacked[] {
    return this.project.backEvents.filter(
      (event) => event.sender === this.address
    );
  }

  public get curatingEvents(): CommonwealthTypes.IProjectCurated[] {
    return this.project.curateEvents.filter(
      (event) => event.sender === this.address
    );
  }

  public get addressInfo(): AddressInfo {
    console.log(
      new AddressInfo(null, this.address, this.project.chainId || 'ethereum')
    );
    return new AddressInfo(
      null,
      this.address,
      this.project.chainId || 'ethereum'
    );
  }

  constructor(
    public readonly project: Project,
    public readonly address: string,
    public readonly amount: BN
  ) {}
}
