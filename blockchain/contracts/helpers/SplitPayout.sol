// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SplitPayout
 * @notice Pull-based native-token revenue splitter used by PushCampus courses.
 */
contract SplitPayout is ReentrancyGuard {
    address public immutable membership;
    address public immutable marketplace;

    uint32 public constant TOTAL_BPS = 10_000;

    uint256 public totalReceived;
    uint256 public totalReleased;

    address[] public recipients;
    uint32[] public sharesBps;

    mapping(address => uint256) public released;

    event PaymentReceived(address indexed payer, uint256 amount);
    event PaymentReleased(address indexed to, uint256 amount);

    error InvalidRecipients();
    error InvalidShares();
    error ZeroAddressRecipient();
    error NotRecipient();
    error TransferFailed();
    error ZeroPayment();

    modifier onlyAuthorized() {
        require(
            msg.sender == membership || msg.sender == marketplace,
            "Only membership or marketplace"
        );
        _;
    }

    constructor(
        address membership_,
        address marketplace_,
        address[] memory _recipients,
        uint32[] memory _sharesBps
    ) {
        require(membership_ != address(0), "Membership address zero");
        require(marketplace_ != address(0), "Marketplace address zero");
        if (_recipients.length == 0 || _recipients.length != _sharesBps.length) revert InvalidRecipients();

        uint256 sum = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_recipients[i] == address(0)) revert ZeroAddressRecipient();
            sum += _sharesBps[i];
        }
        if (sum != TOTAL_BPS) revert InvalidShares();

        membership = membership_;
        marketplace = marketplace_;
        recipients = _recipients;
        sharesBps = _sharesBps;
    }

    receive() external payable {
        revert("Direct payments not allowed");
    }

    function recordPayment(address payer) external payable onlyAuthorized {
        if (msg.value == 0) revert ZeroPayment();
        totalReceived += msg.value;
        emit PaymentReceived(payer, msg.value);
    }

    function release(address account) external nonReentrant {
        if (_recipientIndex(account) == type(uint256).max) revert NotRecipient();
        uint256 amount = pending(account);
        require(amount > 0, "Nothing to release");

        released[account] += amount;
        totalReleased += amount;
        (bool success, ) = payable(account).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PaymentReleased(account, amount);
    }

    function recipientCount() external view returns (uint256) {
        return recipients.length;
    }

    function pending(address account) public view returns (uint256) {
        uint256 index = _recipientIndex(account);
        if (index == type(uint256).max) return 0;

        uint256 shareBps = sharesBps[index];
        uint256 totalEarned = (totalReceived * shareBps) / TOTAL_BPS;

        return totalEarned - released[account];
    }

    function _recipientIndex(address account) internal view returns (uint256) {
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == account) {
                return i;
            }
        }
        return type(uint256).max;
    }
}
