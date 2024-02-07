pragma solidity ^0.8.0;

import "@openzeppelin/contracts-governance/token/ERC721/ERC721.sol";

contract ERC721Mintable is ERC721 {
  constructor () public ERC721 ("cwTest", "CWT") { }

  function mint(uint256 tokenId) public {
    _safeMint(msg.sender, tokenId);
  }
}
