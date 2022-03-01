// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/presets/ERC20PresetMinterPauser.sol';

contract MockERC20 is ERC20PresetMinterPauser {
    constructor(string memory _tokenName, string memory _tokenSymbol)
        ERC20PresetMinterPauser(_tokenName, _tokenSymbol)
    {}
}
