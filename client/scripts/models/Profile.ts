import m from 'mithril';
import jdenticon from 'jdenticon';

class Profile {
  private _name: string;
  private _headline: string;
  private _bio: string;
  private _avatarUrl: string;
  private _initialized: boolean;
  private _judgements: { [registrar: string]: string } = {};
  private _isOnchain = false;
  private _lastActive: Date;
  private _isCouncillor = false;
  private _isValidator = false;
  private _isEmpty = false;
  private _isNameInvalid = false;
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
  get isEmpty() { return this._isEmpty; }
  get isNameInvalid() { return this._isNameInvalid; }

  public readonly chain: string;
  public readonly address: string;

  constructor(chain: string, address: string) {
    this.chain = chain;
    this.address = address;
  }

  public initializeEmpty() {
    this._initialized = true;
    this._isEmpty = true;
  }

  // When the user updates their name locally, mark it invalid for the duration
  // of the session, so we can fall-back to the identity loaded from chain.
  public invalidateName() {
    // only applies to onchain names
    if (!this._isOnchain) return;
    this._isNameInvalid = true;
  }

  public initializeWithChain(name, headline, bio, avatarUrl, judgements, lastActive, isCouncillor = false, isValidator = false) {
    this._initialized = true;
    this._isEmpty = false;
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
    this._isEmpty = false;
    this._name = name;
    this._headline = headline;
    this._bio = bio;
    this._avatarUrl = avatarUrl;
    this._lastActive = lastActive;
    this._isCouncillor = isCouncillor;
    this._isValidator = isValidator;
  }

  // this.name() is only the user-set name, and will be blank if the
  // user has not set an name (from within Commonwealth or by
  // registering an on-chain identity)
  //
  // this.displayName() is the user-set name or the address, and
  // this.displayNameWithAddress() is the user-set name with the address,
  // or just the address if the user has not set a name.
  get displayName() : string {
    if (!this._initialized) return 'Loading...';
    return this.name || 'Anonymous';
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
        style: `width: ${size}px; height: ${size}px;`,
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
