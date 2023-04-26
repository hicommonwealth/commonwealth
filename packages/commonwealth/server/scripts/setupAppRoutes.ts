import cheerio from 'cheerio';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { DEFAULT_COMMONWEALTH_LOGO } from '../config';
import type { DB } from '../models';
import type { ChainInstance } from '../models/chain';

const log = factory.getLogger(formatFilename(__filename));

const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

function cleanMalformedUrl(str: string) {
  return str.replace(/.*(https:\/\/.*https:\/\/)/, '$1');
}

const decodeTitle = (title: string) => {
  try {
    return decodeURIComponent(title);
  } catch (err) {
    console.error(`Could not decode title: "${title}"`);
    return title;
  }
};

const setupAppRoutes = (
  app,
  models: DB,
  devMiddleware,
  templateFile,
  sendFile
) => {
  if (NO_CLIENT_SERVER) {
    return;
  }
  log.info('setupAppRoutes');
  // Development: serve everything through devMiddleware
  if (DEV) {
    app.get('*', (req, res, next) => {
      req.url = '/build/';
      devMiddleware(req, res, next);
    });
    return;
  }

  // Production: serve SEO-optimized routes where possible
  //
  // Retrieve the default bundle from /build/index.html, and overwrite <meta>
  // tags with data fetched from the backend.
  if (!templateFile) {
    throw new Error('Template not found, cannot start production server');
  }

  const renderWithMetaTags = (res, title, description, author, image) => {
    if (image) {
      image = cleanMalformedUrl(image);
    }

    description =
      description || `${title}: a decentralized community on Commonwealth.im.`;
    const $tmpl = cheerio.load(templateFile);
    $tmpl('meta[name="title"]').attr('content', title);
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
    if (image) {
      $tmpl('meta[property="og:image"]').attr('content', image);
    }

    const metadataHtml: string = $tmpl.html();
    const twitterSafeHtml = metadataHtml.replace(
      /<meta name="twitter:image:src" content="(.*?)">/g,
      '<meta name="twitter:image" content="$1">'
    );

    res.send(twitterSafeHtml);
  };

  app.get('/:scope', async (req, res) => {
    // Retrieve chain
    const scope = req.params.scope;
    const chain = await models.Chain.findOne({ where: { id: scope } });
    const title = chain ? chain.name : 'Commonwealth';
    const description = chain ? chain.description : '';
    const image = chain?.icon_url
      ? chain.icon_url.match(`^(http|https)://`)
        ? chain.icon_url
        : `https://commonwealth.im${chain.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';
    renderWithMetaTags(res, title, description, author, image);
  });

  app.get('/:scope/account/:address', async (req, res) => {
    // Retrieve title, description, and author from the database
    let title, description, author, profileData, image;
    const address = await models.Address.findOne({
      where: { chain: req.params.scope, address: req.params.address },
      include: [models.Profile],
    });
    const profile = await address.getProfile();
    if (address && profile) {
      try {
        title = profileData.name;
        description = profile.bio;
        image = profile.avatar_url;
        author = '';
      } catch (e) {
        title = '';
        description = '';
        image = '';
        author = '';
      }
    } else {
      title = '';
      description = '';
      image = '';
      author = '';
    }
    renderWithMetaTags(res, title, description, author, image);
  });

  const renderThread = async (
    scope: string,
    threadId: string,
    res
  ) => {
    // Retrieve discussions
    const thread = await models.Thread.findOne({
      where: { id: threadId },
      include: [
        {
          model: models.Chain,
          attributes: ['icon_url']
        },
        {
          model: models.Address,
          as: 'Address',
          attributes: ['profile_id'],
          include: [
            {
              model: models.Profile,
              attributes: ['profile_name']
            }
          ]
        },
      ],
    });

    const title = thread ? decodeTitle(thread.title) : '';
    const description = thread ? thread.plaintext : '';
    const image = thread?.Chain?.icon_url
      ? `https://commonwealth.im${thread.Chain.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;

    const author = thread?.Address?.Profile?.profile_name ?
      thread.Address.Profile.profile_name :
      '';

    renderWithMetaTags(res, title, description, author, image);
  };

  const renderProposal = async (
    scope: string,
    res,
    chain?: ChainInstance
  ) => {
    // Retrieve title, description, and author from the database
    chain = chain || (await models.Chain.findOne({ where: { id: scope } }));

    const title = chain ? chain.name : 'Commonwealth';
    const description = '';
    const image = chain
      ? `https://commonwealth.im${chain.icon_url}`
      : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';

    renderWithMetaTags(res, title, description, author, image);
  };

  app.get('/:scope/proposal/:type/:identifier', async (req, res) => {
    const scope = req.params.scope;
    await renderProposal(scope, res);
  });

  app.get('/:scope/discussion/:identifier', async (req, res) => {
    const scope = req.params.scope;
    const threadId = req.params.identifier.split('-')[0];
    if (isNaN(threadId)) {
      return; // don't render because thread ID needs to be a number
    }
    await renderThread(scope, threadId, res);
  });

  app.get('/:scope/proposal/:identifier', async (req, res) => {
    const scope = req.params.scope;
    const chain = await models.Chain.findOne({ where: { id: scope } });

    const proposalTypes = new Set([
      ChainNetwork.Sputnik,
      ChainNetwork.Compound,
      ChainNetwork.Aave
    ]);

    if (!proposalTypes.has(chain?.network) && chain?.base !== ChainBase.CosmosSDK) {
      renderWithMetaTags(res, '', '', '', null);
      return;
    }

    await renderProposal(scope, res, chain);
  });

  app.get('*', (req, res) => {
    log.info(`setupAppRoutes sendFiles ${req.path}`);
    sendFile(res);
  });
};

export default setupAppRoutes;
