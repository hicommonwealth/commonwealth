// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './external/token/ERC20Burnable.sol';
import './external/token/ERC20.sol';

////////////////////////////////////////////////////////////////////////////////////////////
/// @title CWToken
/// @author @ace-contributor, @eratos
/// @notice ?? more accurate description
////////////////////////////////////////////////////////////////////////////////////////////

contract CWToken is ERC20, ERC20Burnable {
    /// @dev Ethereum address
    address internal constant ETH_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    address internal minter;
    bool internal initialized = false;

    /// @notice initialize
    function initialize(address _token, bool _isBToken, address _minter) external {
        require(_token != address(0), 'CWT: INVALID_TOKEN');
        require(!initialized, "CWT: ALREADY_INITIALIZED");

        string memory tokenName = string(
            abi.encodePacked(
                'CW ',
                _isBToken ? 'B' : 'C',
                _token == ETH_ADDRESS ? 'Ethereum' : ERC20(_token).name(),
                ' Token'
            )
        );

        string memory tokenSymbol = string(
            abi.encodePacked(
                _isBToken ? 'B' : 'C',
                _token == ETH_ADDRESS ? 'ETH' : ERC20(_token).symbol()
            )
        );

        uint8 tokenDecimals = _token == ETH_ADDRESS ? 18 : ERC20(_token).decimals();

        minter = _minter;

        initializeERC20(tokenName, tokenSymbol, tokenDecimals);

        initialized = true;
    }

    /// @notice mint
    function mint(address _owner, uint256 _amount) external {
        require(initialized, "CWT: TOKEN_UNINITIALIZED");
        require(msg.sender == minter, "CWT: UNAUTHORIZED_MINT");
        _mint(_owner, _amount);
    }
}
