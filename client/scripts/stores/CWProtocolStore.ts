import { CWProtocol } from 'models';
import Store from './Store';

class CWProtocolStore<T extends CWProtocol> extends Store<T> {
  private _protocolID: { [ID: string]: T } = {};

  public add(protocol: T) {
    super.add(protocol);
    this._protocolID[protocol.id] = protocol;
    return this;
  }

  public remove(protocol: T) {
    super.remove(protocol);
    delete this._protocolID[protocol.id];
    return this;
  }

  public clear() {
    this._protocolID = {};
  }

  public getByID(ID: string): T {
    if (this._protocolID[ID] === undefined) {
      // throw new Error(`Invalid user: ${address}`);
      return null;
    }
    return this._protocolID[ID];
  }
}

export default CWProtocolStore;
