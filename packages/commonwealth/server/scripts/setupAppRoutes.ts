import cheerio from 'cheerio';
import fs from 'fs';
import { DB } from '../models';
import { DEFAULT_COMMONWEALTH_LOGO } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase, ChainNetwork, ProposalType } from 'common-common/src/types';
import { ChainInstance } from '../models/chain';

const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const DEV = process.env.NODE_ENV !== 'production';

const log = factory.getLogger(formatFilename(__filename));

function cleanMalformedUrl(str: string) {
  return str.replace(/.*(https:\/\/.*https:\/\/)/, '$1');
}

const setupAppRoutes = (app, models: DB, devMiddleware) => {
    if (NO_CLIENT_SERVER) {
      return;
    }
    log.info('setupAppRoutes');
    if (DEV) {
      // Development: serve everything through devMiddleware
      if (!process.env.EXTERNAL_WEBPACK) {
        app.get('*', (req, res, next) => {
          req.url = '/build/';
          devMiddleware(req, res, next);
        });
      }
      return;
    }

    const templateFile = (() => {
      try {
        return fs.readFileSync('./build/index.html');
      } catch (e) {
        console.error(`Failed to read template file: ${e.message}`);
      }
    })();

    const renderWithMetaTags = (res, title, description, author, image) => {
      if (image) {
        image = cleanMalformedUrl(image);
      }

      description = description || `${title}: a decentralized community on Commonwealth.im.`;
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

    app.get('/:scope', async (req, res, next) => {
      // Retrieve chain
      const scope = req.params.scope;
      const chain = await models.Chain.findOne({ where: { id: scope } });
      const title = chain ? chain.name : 'Commonwealth';
      const description = chain ? chain.description : '';
      const image = chain?.icon_url ? (chain.icon_url.match(`^(http|https)://`) ?
        chain.icon_url : `https://commonwealth.im${chain.icon_url}`) : DEFAULT_COMMONWEALTH_LOGO;
      const author = '';
      renderWithMetaTags(res, title, description, author, image);
    });

    app.get('/:scope/account/:address', async (req, res, next) => {
      // Retrieve title, description, and author from the database
      let title, description, author, profileData, image;
      const address = await models.Address.findOne({
        where: { chain: req.params.scope, address: req.params.address },
        include: [models.OffchainProfile],
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
      chain?: ChainInstance,
    ) => {
      // Retrieve title, description, and author from the database
      let title, description, author, image;
      chain = chain || (await models.Chain.findOne({ where: { id: scope } }));

      if (proposalType === 'discussion' && proposalId !== null) {
        // Retrieve discussions
        const proposal = await models.Thread.findOne({
          where: { id: proposalId },
          include: [{
            model: models.Chain,
          }, {
            model: models.Address,
            as: 'Address',
            include: [models.OffchainProfile]
          }],
        });
        title = proposal ? decodeURIComponent(proposal.title) : '';
        description = proposal ? proposal.plaintext : '';
        image = chain ? `https://commonwealth.im${chain.icon_url}` : DEFAULT_COMMONWEALTH_LOGO;
        try {
          const profileData = proposal && proposal.Address && proposal.Address.OffchainProfile
            ? JSON.parse(proposal.Address.OffchainProfile.data) : '';
          author = profileData.name;
        } catch (e) {
          author = '';
        }
      } else {
        title = chain ? chain.name : 'Commonwealth';
        description = '';
        image = chain ? `https://commonwealth.im${chain.icon_url}` : DEFAULT_COMMONWEALTH_LOGO;
        author = '';
      }
      renderWithMetaTags(res, title, description, author, image);
    };

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
      const chain = await models.Chain.findOne({ where: { id: scope } });

      // derive proposal type from scope if possible
      let proposalType;
      if (chain?.base === ChainBase.CosmosSDK) {
        proposalType = ProposalType.CosmosProposal;
      } else if (chain?.network === ChainNetwork.Sputnik) {
        proposalType = ProposalType.SputnikProposal;
      } else if (chain?.network === ChainNetwork.Moloch) {
        proposalType = ProposalType.MolochProposal;
      } else if (chain?.network === ChainNetwork.Compound) {
        proposalType = ProposalType.CompoundProposal;
      } else if (chain?.network === ChainNetwork.Aave) {
        proposalType = ProposalType.AaveProposal;
      } else {
        renderWithMetaTags(res, '', '', '', null);
        return;
      }

      await renderProposal(scope, proposalType, proposalId, res, chain);
    });

    app.get('*', (req, res, next) => {
      res.sendFile(`${__dirname}/build/index.html`);
    });
  }
;


export default setupAppRoutes;
