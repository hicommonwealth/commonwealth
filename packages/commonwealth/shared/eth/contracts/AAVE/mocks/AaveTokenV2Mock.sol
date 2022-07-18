import {AaveTokenV2} from '@aave/aave-token/contracts/token/AaveTokenV2.sol';

contract AaveTokenV2Mock is AaveTokenV2 {
  function mint(address minter, uint256 amount) external {
    _mint(minter, amount);
  }
}
