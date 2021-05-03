import cheerio from 'cheerio';
import { DEFAULT_COMMONWEALTH_LOGO } from '../config';

const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

const setupAppRoutes = (app, models, devMiddleware, templateFile, sendFile) => {
  if (NO_CLIENT_SERVER) {
    return;
  }

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
    const $tmpl = cheerio.load(templateFile);
    $tmpl('meta[name="title"]').attr('content', title);
    $tmpl('meta[name="description"]').attr('content', description);
    $tmpl('meta[name="author"]').attr('content', author);

    $tmpl('meta[name="twitter:title"]').attr('content', title);
    $tmpl('meta[name="twitter:description"]').attr('content', description);
    if (image) {
      $tmpl('meta[name="twitter:image:src"]').attr('content', image);
    }

    $tmpl('meta[property="og:site_name"]').attr('content', 'Commonwealth');
    $tmpl('meta[property="og:title"]').attr('content', title);
    $tmpl('meta[property="og:description"]').attr('content', description);
    if (image) {
      $tmpl('meta[property="og:image"]').attr('content', image);
      // $tmpl('meta[property="og:image:width"]').attr('content', 707);
      // $tmpl('meta[property="og:image:height"]').attr('content', 1000);
    }
    res.send($tmpl.html());
  };

  app.get('/:scope', async (req, res, next) => {
    // Retrieve chain or community
    const scope = req.params.scope;
    const chain = await models.Chain.findOne({ where: { id: scope } });
    const community = await models.OffchainCommunity.findOne({ where: { id: scope, privacyEnabled: false } });
    const title = chain ? chain.name : community ? community.name : 'Commonwealth';
    const description = chain ? chain.description : community ? community.description : '';
    const image = chain ? `https://commonwealth.im${chain.icon_url}` : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';
    renderWithMetaTags(res, title, description, author, image);
  });

  app.get('/:scope/account/:address', async (req, res, next) => {
    // Retrieve title, description, and author from the database
    let title, description, author, profileData, image;
    const address = await models.Address.findOne({
      where: { chain: req.params.scope, address: req.params.address },
      include: [ models.OffchainProfile ],
    });
    if (address && address.OffchainProfile) {
      try {
        profileData = JSON.parse(address.OffchainProfile.data);
        title = profileData.name;
        description = profileData.headline;
        image = profileData.avatarUrl;
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

  app.get('/:scope/proposal/:type/:identifier', async (req, res, next) => {
    const scope = req.params.scope;
    const proposalType = req.params.type;
    const proposalId = parseInt(req.params.identifier.split('-')[0], 10);

    // Retrieve title, description, and author from the database
    let title, description, author, image;
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(proposalId)) {
      renderWithMetaTags(res, '', '', '', null);
      return;
    }

    const chain = await models.Chain.findOne({ where: { id: scope } });
    const community = await models.OffchainCommunity.findOne({ where: { id: scope, privacyEnabled: false } });

    if (proposalType === 'discussion' && proposalId !== null) {
      // Retrieve offchain discussion
      const chainProposal = await models.OffchainThread.findOne({
        where: { id: proposalId, community: null },
        include: [{
          model: models.Chain,
        }, {
          model: models.Address,
          as: 'Address',
          include: [ models.OffchainProfile ]
        }],
      });
      const communityProposal = await models.OffchainThread.findOne({
        where: { id: proposalId },
        include: [{
          model: models.OffchainCommunity,
          where: { privacyEnabled: false },
        }, {
          model: models.Address,
          as: 'Address',
          include: [ models.OffchainProfile ]
        }],
      });
      const proposal = chainProposal || communityProposal;
      title = proposal ? decodeURIComponent(proposal.title) : '';
      description = proposal ? proposal.plaintext : '';
      image = chain ? `https://commonwealth.im${chain.icon_url}` : community ? `https://commonwealth.im${community.iconUrl}` : DEFAULT_COMMONWEALTH_LOGO;
      try {
        const profileData = proposal && proposal.Address && proposal.Address.OffchainProfile
          ? JSON.parse(proposal.Address.OffchainProfile.data) : '';
        author = profileData.name;
      } catch (e) {
        author = '';
      }
    } else {
      title = chain ? chain.name : community ? community.name : 'Commonwealth';
      description = '';
      image = chain ? `https://commonwealth.im${chain.icon_url}` : community ? `https://commonwealth.im${community.iconUrl}` : DEFAULT_COMMONWEALTH_LOGO;
      author = '';
    }
    renderWithMetaTags(res, title, description, author, image);
  });

  //  CWP
  // app.get('/:scope/project/:identifier', async (req, res, next) => {
  // });

  app.get('*', (req, res, next) => {
    sendFile(res);
  });
};

export default setupAppRoutes;
