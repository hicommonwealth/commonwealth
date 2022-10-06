// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './IProjectBaseFactory.sol';

interface ICuratedProjectFactory is IProjectBaseFactory {
    function setCmnProjTokenImpl(address _cmnProjTokenImpl) external;

    function createProject(
        bytes32 _name,
        bytes32 _ipfsHash,
        bytes32 _url,
        address _beneficiary,
        address _acceptedToken,
        uint256 _threshold,
        uint256 _deadline,
        uint8 _curatorFee
    ) external returns (address);
}
