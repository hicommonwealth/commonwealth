pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";


contract TimelockMock {
    using SafeMath for uint256;

    event NewAdmin(address indexed newAdmin);
    event NewPendingAdmin(address indexed newPendingAdmin);
    event NewDelay(uint256 indexed newDelay);
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );

    uint256 public constant GRACE_PERIOD = 14 minutes;
    uint256 public constant MINIMUM_DELAY = 2 minutes;
    uint256 public constant MAXIMUM_DELAY = 30 minutes;

    address public admin;
    address public pendingAdmin;
    uint256 public delay;

    mapping(bytes32 => bool) public queuedTransactions;

    constructor(address admin_, uint256 delay_) public {
        require(
            delay_ >= MINIMUM_DELAY,
            "TimelockMock::constructor: Delay must exceed minimum delay."
        );
        require(
            delay_ <= MAXIMUM_DELAY,
            "TimelockMock::setDelay: Delay must not exceed maximum delay."
        );

        admin = admin_;
        delay = delay_;
    }

    function() external payable {}

    function setDelay(uint256 delay_) public {
        require(
            msg.sender == address(this),
            "TimelockMock::setDelay: Call must come from TimelockMock."
        );
        require(
            delay_ >= MINIMUM_DELAY,
            "TimelockMock::setDelay: Delay must exceed minimum delay."
        );
        require(
            delay_ <= MAXIMUM_DELAY,
            "TimelockMock::setDelay: Delay must not exceed maximum delay."
        );
        delay = delay_;

        emit NewDelay(delay);
    }

    function acceptAdmin() public {
        require(
            msg.sender == pendingAdmin,
            "TimelockMock::acceptAdmin: Call must come from pendingAdmin."
        );
        admin = msg.sender;
        pendingAdmin = address(0);

        emit NewAdmin(admin);
    }

    function setPendingAdmin(address pendingAdmin_) public {
        require(
            msg.sender == address(this),
            "TimelockMock::setPendingAdmin: Call must come from TimelockMock."
        );
        pendingAdmin = pendingAdmin_;

        emit NewPendingAdmin(pendingAdmin);
    }

    function queueTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public returns (bytes32) {
        // Remove this check for integration test purposes. We just want the events.
        // require(
        //     msg.sender == admin,
        //     "TimelockMock::queueTransaction: Call must come from admin."
        // );
        require(
            eta >= getBlockTimestamp().add(delay),
            "TimelockMock::queueTransaction: Estimated execution block must satisfy delay."
        );

        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        queuedTransactions[txHash] = true;

        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }

    function cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public {
        // Remove requirement for testing purposes.
        // require(
        //     msg.sender == admin,
        //     "TimelockMock::cancelTransaction: Call must come from admin."
        // );

        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        queuedTransactions[txHash] = false;

        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }

    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public payable returns (bytes memory) {

        // Remove this check for integration test purposes. We just want the events.
        // require(
        //     msg.sender == admin,
        //     "TimelockMock::executeTransaction: Call must come from admin."
        // );

        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        require(
            queuedTransactions[txHash],
            "TimelockMock::executeTransaction: Transaction hasn't been queued."
        );
        // Modify contract again for speeding up testing.
        // require(
        //     getBlockTimestamp() >= eta,
        //     "TimelockMock::executeTransaction: Transaction hasn't surpassed time lock."
        // );
        require(
            getBlockTimestamp() <= eta.add(GRACE_PERIOD),
            "TimelockMock::executeTransaction: Transaction is stale."
        );

        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(
                bytes4(keccak256(bytes(signature))),
                data
            );
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call.value(value)(
            callData
        );
        require(
            success,
            "TimelockMock::executeTransaction: Transaction execution reverted."
        );

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }

    function getBlockTimestamp() internal view returns (uint256) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }
}
