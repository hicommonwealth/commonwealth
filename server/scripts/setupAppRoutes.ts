import cheerio from 'cheerio';
import { DB } from '../database';
import { DEFAULT_COMMONWEALTH_LOGO } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { ChainBase, ChainNetwork, ProposalType } from '../../shared/types';
import { CommunityInstance } from '../models/community';

const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

const log = factory.getLogger(formatFilename(__filename));

const setupAppRoutes = (app, models: DB, devMiddleware, templateFile, sendFile) => {
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
    description = description || `${title}: a decentralized community on Commonwealth.im.`;
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
    // Retrieve chain
    const scope = req.params.scope;
    const community = await models.Community.findOne({ where: { id: scope } });
    const title = community ? community.name :  'Commonwealth';
    const description = community ? community.description : '';
    const image = community?.icon_url ? (community.icon_url.match(`^(http|https)://`) ?
    community.icon_url : `https://commonwealth.im${community.icon_url}`) : DEFAULT_COMMONWEALTH_LOGO;
    const author = '';
    renderWithMetaTags(res, title, description, author, image);
  });

  app.get('/:scope/account/:address', async (req, res, next) => {
    // Retrieve title, description, and author from the database
    let title, description, author, profileData, image;
    const address = await models.Address.findOne({
      where: { community_id: req.params.scope, address: req.params.address },
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

  const renderProposal = async (
    scope: string,
    proposalType: string,
    proposalId: string,
    res,
    community?: CommunityInstance,
  ) => {
    // Retrieve title, description, and author from the database
    let title, description, author, image;
    community = community || (await models.Community.findOne({ where: { id: scope } }));

    if (proposalType === 'discussion' && proposalId !== null) {
      // Retrieve offchain discussion
      const proposal = await models.Thread.findOne({
        where: { id: proposalId },
        include: [{
          model: models.Community,
        }, {
          model: models.Address,
          as: 'Address',
          include: [ models.OffchainProfile ]
        }],
      });
      title = proposal ? decodeURIComponent(proposal.title) : '';
      description = proposal ? proposal.plaintext : '';
      image = community ? `https://commonwealth.im${community.icon_url}` : DEFAULT_COMMONWEALTH_LOGO;
      try {
        const profileData = proposal && proposal.Address && proposal.Address.OffchainProfile
          ? JSON.parse(proposal.Address.OffchainProfile.data) : '';
        author = profileData.name;
      } catch (e) {
        author = '';
      }
    } else {
      title = community ? community.name : 'Commonwealth';
      description = '';
      image = community ? `https://commonwealth.im${community.icon_url}` : DEFAULT_COMMONWEALTH_LOGO;
      author = '';
    }
    renderWithMetaTags(res, title, description, author, image);
  }

  app.get('/:scope/proposal/:type/:identifier', async (req, res, next) => {
    const scope = req.params.scope;
    const proposalType = req.params.type;
    const proposalId = req.params.identifier.split('-')[0];
    await renderProposal(scope, proposalType, proposalId, res);
  });

  app.get('/:scope/discussion/:identifier', async (req, res, next) => {
    const scope = req.params.scope;
    const proposalType = ProposalType.Thread;
    const proposalId = req.params.identifier.split('-')[0];
    await renderProposal(scope, proposalType, proposalId, res);
  });

  app.get('/:scope/proposal/:identifier', async (req, res, next) => {
    const scope = req.params.scope;
    const proposalId = req.params.identifier.split('-')[0];
    const community = await models.Community.findOne({ where: { id: scope } });

    // derive proposal type from scope if possible
    let proposalType;
    if (community.base === ChainBase.CosmosSDK) {
      proposalType = ProposalType.CosmosProposal;
    } else if (community.network === ChainNetwork.Sputnik) {
      proposalType = ProposalType.SputnikProposal;
    } else if (community.network === ChainNetwork.Moloch) {
      proposalType = ProposalType.MolochProposal;
    } else if (community.network === ChainNetwork.Compound) {
      proposalType = ProposalType.CompoundProposal;
    } else if (community.network === ChainNetwork.Aave) {
      proposalType = ProposalType.AaveProposal;
    } else {
      renderWithMetaTags(res, '', '', '', null);
      return;
    }

    await renderProposal(scope, proposalType, proposalId, res, community);
  });

  app.get('*', (req, res, next) => {
    log.info(`setupAppRoutes sendFiles ${req.path}`);
    sendFile(res);
  });
};

export default setupAppRoutes;
