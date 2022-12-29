import $ from 'jquery';
import _ from 'lodash';

import app from 'state';

export class StableDiffusionController {
  public async generateImage(description: string, communityId: string) {
    try {
      const res = await $.post(`${app.serverUrl()}/generateImage`, {
        description,
        chainId: communityId,
        jwt: app.user.jwt,
      });

      return res.imageUrl;
    } catch (e) {
      console.log(e);
    }
  }
}
