/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChainBase, ChainNetwork, logger } from '@hicommonwealth/core';
import type { CommunityInstance, DB } from '@hicommonwealth/model';
import cheerio from 'cheerio';
import { DEFAULT_COMMONWEALTH_LOGO } from '../config';

const log = logger().getLogger(__filename);

const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

const decodeTitle = (title: string) => {
  try {
    return decodeURIComponent(title);
  } catch (err) {
    console.error(`Could not decode title: "${title}"`);
    return title;
  }
};

const getUrl = (req) => {
  return req.protocol + '://' + req.get('host') + req.originalUrl;
};

const setupAppRoutes = (app, models: DB, templateFile, sendFile) => {
  if (NO_CLIENT_SERVER || DEV) {
    return;
  }
  log.info('setupAppRoutes');

  // Production: serve SEO-optimized routes where possible
  //
  // Retrieve the default bundle from /build/index.html, and overwrite <meta>
  // tags with data fetched from the backend.
  if (!templateFile) {
    throw new Error('Template not found, cannot start production server');
  }

  const renderWithMetaTags = (res, title, description, author, image, url) => {
    description =
      description || `${title}: a decentralized community on Commonwealth.im.`;
    const $tmpl = cheerio.load(templateFile);
    $tmpl('meta[name="title"]').attr('content', title);

    // Cut post body down to 160 characters if too long.
    if (description.length > 160) {
      description = description.substring(0, 160) + '...';
    }

    $tmpl('meta[name="description"]').attr('content', description);
    if (author) {
      $tmpl('meta[name="author"]').attr('content', author);
    } else {
      $tmpl('meta[name="author"]').remove();
    }
    $tmpl('meta[property="og:type"]').attr('content', 'article');
    $tmpl('meta[name="twitter:title"]').attr('content', title);
    $tmpl('meta[name="twitter:description"]').attr('content', description);
    if (image) {
      $tmpl('meta[name="twitter:image"]').attr('content', image);
    }

    $tmpl('meta[property="og:site_name"]').attr('content', 'Commonwealth');
    $tmpl('meta[property="og:title"]').attr('content', title);
    $tmpl('meta[property="og:description"]').attr('content', description);
    $tmpl('meta[property="og:url"]').attr('content', url);
    if (image) {
      $tmpl('meta[property="og:image"]').attr('content', image);
    }

    const metadataHtml: string = $tmpl.html();
    const twitterSafeHtml = metadataHtml.replace(
      /<meta name="twitter:image:src" content="(.*?)">/g,
      '<meta name="twitter:image" content="$1">',
    );

    // Don't cache initial html for too long on CDN so that we do not run into cache invalidation issues
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0',
    );
    res.setHeader('CDN-Cache-Control', 'max-age=10');

    res.send(twitterSafeHtml);
  };

  app.get('/:scope?/overview', renderGeneralPage);

  const renderThread = async (scope: string, threadId: string, req, res) => {
    // Retrieve discussions
    const thread = await models.Thread.findOne({
      where: scope ? { id: threadId, community_id: scope } : { id: threadId },
      include: [
        {
          model: models.Community,
          as: 'Community',
          where: scope ? null : { custom_domain: req.hostname },
          attributes: ['custom_domain', 'icon_url'],
        },
        {
          model: models.Address,
          as: 'Address',
          attributes: ['profile_id'],
          include: [
            {
              model: models.Profile,
              attributes: ['profile_name'],
            },
          ],
        },
      ],
    });

    const title = thread ? decodeTitle(thread.title) : '';
    const description = thread ? thread.plaintext : '';
    const image = thread?.Community?.icon_url
      ? `${thread.Community.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;

    const author = thread?.Address?.Profile?.profile_name
      ? thread.Address.Profile.profile_name
      : '';
    const url = getUrl(req);

    renderWithMetaTags(res, title, description, author, image, url);
  };

  const renderProposal = async (
    scope: string,
    req,
    res,
    community?: CommunityInstance,
  ) => {
    // Retrieve title, description, and author from the database
    community = community || (await getCommunity(req, scope));

    const title = community ? community.name : 'Commonwealth';
    const description = '';
    const image = community?.icon_url
      ? community.icon_url.match(`^(http|https)://`)
        ? community.icon_url
        : `https://commonwealth.im${community.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';
    const url = getUrl(req);

    renderWithMetaTags(res, title, description, author, image, url);
  };

  async function renderGeneralPage(req, res) {
    // Retrieve community
    const scope = req.params.scope;
    const community = await getCommunity(req, scope);
    const title = community ? community.name : 'Commonwealth';
    const description = community ? community.description : '';
    const image = community?.icon_url
      ? community.icon_url.match(`^(http|https)://`)
        ? community.icon_url
        : `https://commonwealth.im${community.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';
    const url = getUrl(req);

    renderWithMetaTags(res, title, description, author, image, url);
  }

  app.get('/:scope?/proposals', async (req, res) => {
    const scope = req.params.scope;
    await renderProposal(scope, req, res);
  });

  app.get('/:scope?/proposal/:type/:identifier', async (req, res) => {
    const scope = req.params.scope;
    await renderProposal(scope, req, res);
  });

  app.get('/:scope?/discussions', renderGeneralPage);

  app.get('/:scope?/discussion/:identifier', async (req, res) => {
    const scope = req.params.scope;
    const threadId = req.params.identifier.split('-')[0];
    if (isNaN(threadId)) {
      return; // don't render because thread ID needs to be a number
    }
    await renderThread(scope, threadId, req, res);
  });

  app.get('/:scope?/proposal/:identifier', async (req, res) => {
    const scope = req.params.scope;
    const community = await getCommunity(req, scope);

    const proposalTypes = new Set([
      ChainNetwork.Sputnik,
      ChainNetwork.Compound,
      ChainNetwork.Aave,
    ]);

    if (
      !proposalTypes.has(community?.network) &&
      community?.base !== ChainBase.CosmosSDK
    ) {
      renderWithMetaTags(res, '', '', '', null, null);
      return;
    }

    await renderProposal(scope, req, res, community);
  });

  async function getCommunity(req, scope: string) {
    return scope
      ? await models.Community.findOne({ where: { id: scope } })
      : await models.Community.findOne({
          where: { custom_domain: req.hostname },
        });
  }

  app.get('/:scope?', renderGeneralPage);

  app.get('*', (req, res) => {
    log.info(`setupAppRoutes sendFiles ${req.path}`);
    sendFile(res);
  });
};

export default setupAppRoutes;
