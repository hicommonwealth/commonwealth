// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../DataTypes.sol';
import "./IProjectBase.sol";

interface IBasicProject is IProjectBase {
    function backers(address backer) external view returns (uint256);

    function initialize(
        DataTypes.ProjectMetaData memory _metaData,
        uint256 _threshold,
        uint256 _deadline,
        uint256 _protocolFee,
        address _protocolFeeTo,
        address _acceptedToken,
        address _beneficiary
    ) external returns (bool);
}
