pragma solidity 0.8.7;

import "@openzeppelin/contracts-governance/token/ERC1155/ERC1155.sol";

contract ERC1155Mintable is ERC1155 {
  constructor () public ERC1155 ("cwTest uri") { }

  function mint(address to,
        uint256 id,
        uint256 amount,
        bytes memory data) public {
    _mint(to, id, amount, data);
  }
}