# Feature Support By Chain

## EVM Chains

| Chain Name          | Community Stake | Community Stake <br/> Txns UI | Contests | Chain Event <br/> Notifications | ERC20 & ERC1155 <br/> & ERC721 Gating | Proposal<br/> Viewing/Voting |
|---------------------|-----------------|-------------------------------|----------|---------------------------------|---------------------------------------|------------------------------|
| Ethereum            | 🟡              | 🟡                            | 🟡       | ✅                               | ✅                                     | ❌                            |
| Polygon PoS         | 🟡              | 🟡                            | 🟡       | ✅                               | ✅                                     | ❌                            |
| Arbitrum            | 🟡              | 🟡                            | 🟡       | ✅                               | ✅                                     | ❌                            |
| Optimism            | 🟡              | 🟡                            | 🟡       | ✅                               | ✅                                     | ❌                            |
| Base                | ✅               | ✅                             | ✅        | ✅                               | ✅                                     | ❌                            |
| ZKsync              | 🟡              | 🟡                            | 🟡       | ✅                               | ✅                                     | ❌                            |
| Blast               | ✅               | ❌                             | ❌        | ❌                               | ✅                                     | ❌                            |
| Any other EVM chain | 🟡              | ❌                             | ❌        | ❌                               | ✅                                     | ❌                            |

## Legend

✅: Fully supported in production.

🟡: Adding support would require some engineering effort but is generally feasible.

❌: Adding support is not feasible or desirable from an engineering perspective.

## Notes

- Only mainnet chains are listed. The engineering effort required to support a feature on mainnet is assumed to be the
  same for the equivalent testnets.