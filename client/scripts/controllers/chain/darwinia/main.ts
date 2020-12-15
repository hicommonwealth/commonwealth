import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import * as darwiniaDefinitions from '@darwinia/types/interfaces/definitions';

import Substrate from '../substrate/main';

class Darwinia extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Darwinia);

    this.signaling.disable();
    this.phragmenElections.disable();
    this.democracyProposals.disable();
    this.democracy.disable();
  }

  public async initApi() {
    const t = Object.values(darwiniaDefinitions)
      .reduce((res, { types }): object => ({ ...res, ...types }), {});
    await super.initApi({
      'types': { ...t }
    });
  }
}

export default Darwinia;
