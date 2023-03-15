import { render } from 'mithrilInterop';
import jdenticon from 'jdenticon';

import {
  CWAvatar,
  CWJdenticon,
} from '../views/components/component_kit/cw_avatar';

class MinimumProfile {
  private _name: string;
  private _address: string;
  private _avatarUrl: string;
  private _id: number;
  private _chain: string;
  private _lastActive: Date;
  private _initialized: boolean;

  get name() {
    if (!this._initialized) return 'Loading...';
    return this._name || 'Anonymous';
  }

  get address() {
    return this._address;
  }

  get avatarUrl() {
    return this._avatarUrl;
  }

  get id() {
    return this._id;
  }

  get lastActive() {
    return this._lastActive;
  }

  get chain() {
    return this._chain;
  }

  get initialized() {
    return this._initialized;
  }

  constructor(address, chain) {
    this._address = address;
    this._chain = chain;
  }

  public initialize(name, address, avatarUrl, id, chain, lastActive) {
    this._name = name;
    this._address = address;
    this._avatarUrl = avatarUrl;
    this._id = id;
    this._chain = chain;
    this._lastActive = lastActive;
    this._initialized = true;
  }

  get displayName(): string {
    if (!this._initialized) return 'Loading...';
    return this.name || 'Anonymous';
  }

  public static fromJSON(json) {
    return new MinimumProfile(json.address, json.chain);
  }

  public getAvatar(size: number) {
    return this.avatarUrl
      ? render(CWAvatar, { avatarUrl: this.avatarUrl, size })
      : render(CWJdenticon, { address: this.id, size });
  }

  public static getSVGAvatar(address, size) {
    return jdenticon.toSvg(address, size);
  }
}

export default MinimumProfile;
