// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-governance/token/ERC20/utils/SafeERC20.sol';

import '../interfaces/IStrategy.sol';
import '../interfaces/IYearnVault.sol';

contract YearnStrategy is IStrategy {
    using SafeERC20 for IERC20;

    /// @notice deposit token
    address public immutable override token;

    /// @notice vault token (receipt token) balance of the collective
    mapping(address => uint256) public override balanceOf;

    IYearnVault public immutable vault;

    constructor(address _token, address _vault) {
        require(_token != address(0), 'YFS: INVALID_TOKEN');
        require(_vault != address(0), 'YFS: INVALID_VAULT');

        token = _token;
        vault = IYearnVault(_vault);
    }

    /// @notice deposit to the vault
    /// @param _amount backing amount on collective
    function deposit(uint256 _amount) external override returns (bool) {
        IERC20(token).safeApprove(address(vault), _amount);
        balanceOf[msg.sender] += vault.deposit(_amount);

        return true;
    }

    /// @notice withdraw token to the backer
    /// @param _backer backer address
    /// @param _backedAmount backed amount to withdraw
    function redeem(address _backer, uint256 _backedAmount) external override returns (bool) {
        require(balanceOf[msg.sender] > 0, 'ZERO BALANCE');

        uint256 _maxShares = (_backedAmount * (10**vault.decimals())) / vault.pricePerShare();
        if (_maxShares > balanceOf[msg.sender]) {
            _maxShares = balanceOf[msg.sender];
        }

        balanceOf[msg.sender] -= _maxShares;

        vault.withdraw(_maxShares, _backer);

        return true;
    }

    /// @notice withdraw benefit to the beneficiary
    /// @param _beneficiary beneficiary address
    /// @param _backedAmount total backed amount to the collective
    function withdraw(address _beneficiary, uint256 _backedAmount)
        external
        override
        returns (bool)
    {
        require(balanceOf[msg.sender] > 0, 'ZERO BALANCE');

        uint256 _maxShares = (_backedAmount * (10**vault.decimals())) / vault.pricePerShare();

        if (balanceOf[msg.sender] <= _maxShares) {
            return false;
        }

        vault.withdraw(balanceOf[msg.sender] - _maxShares, _beneficiary);

        balanceOf[msg.sender] = _maxShares;

        return true;
    }

    /// @notice withdraw all to update the strategy on collective
    /// @param _recipient new strategy address
    function withdrawAll(address _recipient) external override {
        vault.withdraw(balanceOf[msg.sender], _recipient);

        balanceOf[msg.sender] = 0;
    }

    /// @notice withdrawable amount
    function withdrawableQueue() external view override returns (uint256) {
        return vault.withdrawableQueue(address(this));
    }
}
