import { AppError } from '@hicommonwealth/core';
import { CommunityAttributes } from '@hicommonwealth/model';
import axios from 'axios';
import { z } from 'zod';
import { ServerCommunitiesController } from '../server_communities_controller';

export const UpdateCustomDomainSchema = z.object({
  community_id: z.string(),
  custom_domain: z.string().optional(),
});

export type UpdateCustomDomainOptions = z.infer<
  typeof UpdateCustomDomainSchema
>;
export type UpdateCustomDomainResult = CommunityAttributes & {
  dns_target?: string;
};

// TODO: better handling of environments (e.g. how to replicate on local env?)

// NOTE: only governance + proposal templates use the web3 API on the client, which would involve
//   alchemy configuration, so we will omit that as those features are unused -- but we may want to
//   support it in the future, esp if stake/contests hit mainnet?
export async function __updateCustomDomain(
  this: ServerCommunitiesController,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { community_id, custom_domain }: UpdateCustomDomainOptions,
): Promise<UpdateCustomDomainResult> {
  const isRemoval = !custom_domain;
  const community = await this.models.Community.findOne({
    where: {
      id: community_id,
    },
  });

  if (!community) {
    throw new AppError('Community not found!');
  }

  if (isRemoval) {
    if (!community.custom_domain) {
      throw new AppError('community does not have a custom domain to remove!');
    }
    const domainHostname = community.custom_domain
      .replace('https://', '')
      .replace('http://', '');

    const herokuResponse = await axios.delete(
      `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/domains/${domainHostname}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.heroku+json; version=3',
        },
      },
    );
    if (herokuResponse.status !== 200) {
      throw new AppError('Failed to delete custom domain from heroku');
    }

    // Cannot clean up magic whitelist programmatically

    community.custom_domain = null;
    await community.save();
    return community.toJSON();
  } else {
    // e.g. abc.xyz.com, no https:// or dangling paths or params
    const validCustomDomainUrl = new RegExp(
      '^(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}$',
    );
    if (!validCustomDomainUrl.test(custom_domain)) {
      throw new AppError('Invalid custom domain URL');
    }

    const magicLinkResponse = await axios.post(
      'https://api.magic.link/v1/api/magic_client/domain/allowlist/add',
      {
        // TODO: new key, ensure declared in PR
        target_client_id: process.env.MAGIC_CLIENT_ID,
        domain: custom_domain,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Magic-Secret-Key': process.env.MAGIC_API_KEY,
        },
      },
    );
    if (magicLinkResponse.status !== 200) {
      throw new AppError('Failed to add custom domain to magic link');
    }

    const herokuResponse = await axios.post(
      `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/domains`,
      {
        hostname: custom_domain,
        sni_endpoint: null,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.heroku+json; version=3',
        },
      },
    );
    if (herokuResponse.status !== 200) {
      throw new AppError('Failed to add custom domain to heroku');
    }
    const dnsTarget = herokuResponse.data.cname;

    community.custom_domain = custom_domain;
    await community.save();
    return { ...community.toJSON(), dns_target: dnsTarget };
  }
}
