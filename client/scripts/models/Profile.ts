import m from 'mithril';
import jdenticon from 'jdenticon';

import { formatAddressShort } from '../../../shared/utils';

class Profile {
  private _name: string;
  private _headline: string;
  private _bio: string;
  private _avatarUrl: string;
  private _initialized: boolean;
  private _judgements: { [registrar: string]: string } = {};
  private _isOnchain: boolean = false;
  private _lastActive: Date;
  private _isCouncillor: boolean = false;
  private _isValidator: boolean = false;
  get name() { return this._name; }
  get headline() { return this._headline; }
  get bio() { return this._bio; }
  get avatarUrl() { return this._avatarUrl; }
  get initialized() { return this._initialized; }
  get judgements() { return this._judgements; }
  get isOnchain() { return this._isOnchain; }
  get lastActive() { return this._lastActive; }
  get isCouncillor() { return this._isCouncillor; }
  get isValidator() { return this._isValidator; }

  public readonly chain: string;
  public readonly address: string;

  constructor(chain: string, address: string) {
    this.chain = chain;
    this.address = address;
  }

  public initializeEmpty() {
    this._initialized = true;
  }

  public initializeWithChain(name, headline, bio, avatarUrl, judgements, lastActive, isCouncillor = false, isValidator = false) {
    this._initialized = true;
    this._isOnchain = true;
    this._name = name;
    this._headline = headline;
    this._bio = bio;
    this._avatarUrl = avatarUrl;
    this._judgements = judgements;
    this._lastActive = lastActive;
    this._isCouncillor = isCouncillor;
    this._isValidator = isValidator;
  }

  public initialize(name, headline, bio, avatarUrl, lastActive, isCouncillor = false, isValidator = false) {
    this._initialized = true;
    this._name = name;
    this._headline = headline;
    this._bio = bio;
    this._avatarUrl = avatarUrl;
    this._lastActive = lastActive;
    this._isCouncillor = isCouncillor;
    this._isValidator = isValidator;
  }

  get displayName() : string {
    if (!this._initialized) return 'Loading...';
    return this.name || formatAddressShort(this.address, this.chain);
  }

  public getAvatar(size: number) {
    if (this.avatarUrl) {
      return m('.avatar-image', {
        style: `width: ${size}px; height: ${size}px; background-image: url('${this.avatarUrl}'); `
          + 'background-size: cover; border-radius: 9999px',
      });
    } else {
      const html = jdenticon.toSvg(this.address, size);
      return m('svg.Jdenticon', {
        width: size,
        height: size,
        'data-address': this.address.toString(),
        oncreate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        },
        onupdate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        }
      });
    }
  }

  public static getSVGAvatar(address, size) {
    return jdenticon.toSvg(address, size);
  }
}

export default Profile;
