// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IProjectBaseFactory.sol";

interface IBasicProjectFactory is IProjectBaseFactory {
    function createProject(
        bytes32 _name,
        bytes32 _ipfsHash,
        bytes32 _url,
        address _beneficiary,
        address _acceptedToken,
        uint256 _threshold,
        uint256 _deadline
    ) external returns (address);
}
