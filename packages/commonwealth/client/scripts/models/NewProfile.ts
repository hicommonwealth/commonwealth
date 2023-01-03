class NewProfile {
  private _name: string;
  private _email: string;
  private _website: string;
  private _bio: string;
  private _isDefault: boolean;
  private _avatarUrl: string;
  private _slug: string;
  private _socials: string[];

  get name() { return this._name; }
  get email() { return this._email; }
  get website() { return this._website; }
  get bio() { return this._bio; }
  get isDefault() { return this._isDefault; }
  get avatarUrl() { return this._avatarUrl; }
  get slug() { return this._slug; }
  get socials() { return this._socials; }

  constructor({profile_name, email, website, bio, is_default, avatar_url, slug, socials}) {
    this._name = profile_name;
    this._email = email;
    this._website = website;
    this._bio = bio;
    this._isDefault = is_default;
    this._avatarUrl = avatar_url;
    this._slug = slug;
    this._socials = socials;
  }

  public initialize(name, email, website, bio, isDefault, avatarUrl, slug, socials) {
    this._name = name;
    this._email = email;
    this._website = website;
    this._bio = bio;
    this._isDefault = isDefault;
    this._avatarUrl = avatarUrl;
    this._slug = slug;
    this._socials = socials;
  }

  public static fromJSON(json) {
    return new NewProfile(json)
  }
}

export default NewProfile;