pragma solidity ^0.5.3;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GuildBank2 is Ownable {
    using SafeMath for uint256;

    event Withdrawal(address indexed receiver, address indexed tokenAddress, uint256 amount);

    function withdraw(address receiver, uint256 shares, uint256 totalShares, IERC20[] memory _approvedTokens) public onlyOwner returns (bool) {
        for (uint256 i=0; i < _approvedTokens.length; i++) {
            uint256 amount = _approvedTokens[i].balanceOf(address(this)).mul(shares).div(totalShares);
            emit Withdrawal(receiver, address(_approvedTokens[i]), amount);
            return _approvedTokens[i].transfer(receiver, amount);
        }
    }

    function withdrawToken(IERC20 token, address receiver, uint256 amount) public onlyOwner returns (bool) {
        emit Withdrawal(receiver, address(token), amount);
        return token.transfer(receiver, amount);
    }
}