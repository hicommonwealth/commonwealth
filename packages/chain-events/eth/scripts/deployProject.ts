import { providers } from 'ethers';
import { CuratedProjectFactory__factory } from '../../src/contractTypes/factories/CuratedProjectFactory__factory';

async function main() {
  const Web3 = (await import('web3')).default;
  // TODO: configure URL based on chain
  const web3Provider = new Web3.providers.WebsocketProvider(
    'http://localhost:8545',
    {
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 10,
        onTimeout: true,
      },
    }
  );
  const provider = new providers.Web3Provider(web3Provider as any);

  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  const acceptedToken = 'acceptedTokenAddr';
  const projectFactoryFactory = new CuratedProjectFactory__factory(signer);
  const projectFactory = await projectFactoryFactory.deploy(
    member,
    [acceptedToken],
    230,
    'toAddress',
    'projectImpIhaveZeroClueWhatThisIs',
    'cwTokenImpSameDeal'
  );

  const newProject = await projectFactory.createProject(
    'projectName',
    'ipfsHash',
    'cwUrl',
    'beneficiaryAddr',
    acceptedToken,
    10000,
    10000,
    170
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
