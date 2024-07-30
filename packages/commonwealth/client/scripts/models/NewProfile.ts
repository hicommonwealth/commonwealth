import { Image, UserProfile } from '@hicommonwealth/schemas';
import { z } from 'zod';

class NewProfile {
  private _userId: number;
  private _name: string;
  private _email: string;
  private _website: string;
  private _bio: string;
  private _avatarUrl: string;
  private _slug: string;
  private _socials: string[];
  private _isOwner: boolean;
  private _backgroundImage: z.infer<typeof Image>;

  get userId() {
    return this._userId;
  }

  get name() {
    return this._name;
  }

  get email() {
    return this._email;
  }

  get website() {
    return this._website;
  }

  get bio() {
    return this._bio;
  }

  get avatarUrl() {
    return this._avatarUrl;
  }

  get slug() {
    return this._slug;
  }

  get socials() {
    return this._socials;
  }

  get isOwner() {
    return this._isOwner;
  }

  get backgroundImage() {
    return this._backgroundImage;
  }

  constructor({
    userId,
    isOwner,
    name,
    email,
    website,
    bio,
    avatar_url,
    slug,
    socials,
    background_image,
  }: z.infer<typeof UserProfile> & { userId: number; isOwner: boolean }) {
    this._userId = userId;
    this._isOwner = isOwner;
    this._name = name!;
    this._email = email!;
    this._website = website!;
    this._bio = bio!;
    this._avatarUrl = avatar_url!;
    this._slug = slug!;
    this._socials = socials!;
    this._backgroundImage = background_image ?? { url: '', imageBehavior: '' };
  }

  public static fromJSON(json) {
    return new NewProfile(json);
  }
}

export default NewProfile;
