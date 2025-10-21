// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, eaddress, euint256, externalEaddress, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract PrivateTransfer is SepoliaConfig {
    string public name;
    event WithdrawalExecuted(address indexed receiver, uint256 indexed amount);
    struct Withdrawal {
        eaddress receiver;
        euint256 amount;
    }
    struct Vault {
        bool isPublished;
        euint256 transferType;
        euint256 balance;
        eaddress passwordAddress;
        eaddress depositor;
        eaddress allowAddress;
        Withdrawal[] withdrawal;
    }
    struct TemWithdraw {
        bool withdrawing;
        uint256 password;
        uint256 amount;
    }
    struct TemDeposit {
        euint256 balance;
        euint256 transferType;
        eaddress passwordAddress;
        eaddress depositor;
        eaddress allowAddress;
    }
    mapping(uint256 => TemDeposit) private temDepositList;

    mapping(uint256 => TemWithdraw) private temWithdrawList;

    mapping(uint256 => Vault) private depositList;

    constructor(string memory _name) {
        name = _name;
    }

    function withdraw(externalEuint256 _password, externalEuint256 _amount, bytes memory inputProof) external {
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 amount = FHE.fromExternal(_amount, inputProof);
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(password);
        handles[1] = FHE.toBytes32(amount);
        FHE.requestDecryption(handles, this.perWithdrawDecryption.selector);
    }

    function deposit(
        externalEuint256 _password,
        externalEuint256 _transferType,
        externalEaddress _passwordAddress,
        externalEaddress _allowAddress,
        bytes memory inputProof
    ) external payable {
        require(msg.value > 0, "value zero");
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 transferType = FHE.fromExternal(_transferType, inputProof);
        euint256 amount = FHE.asEuint256(msg.value);
        eaddress passwordAddress = FHE.fromExternal(_passwordAddress, inputProof);
        eaddress allowAddress = FHE.fromExternal(_allowAddress, inputProof);
        eaddress depositor = FHE.asEaddress(msg.sender);
        FHE.allowThis(transferType);
        FHE.allowThis(password);
        FHE.allowThis(amount);
        FHE.allowThis(passwordAddress);
        FHE.allowThis(allowAddress);
        FHE.allowThis(depositor);
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(password);
        handles[1] = FHE.toBytes32(passwordAddress);
        uint256 requestId = FHE.requestDecryption(handles, this.depositDecryption.selector);
        temDepositList[requestId] = TemDeposit({
            transferType: transferType,
            balance: amount,
            passwordAddress: passwordAddress,
            depositor: depositor,
            allowAddress: allowAddress
        });
    }

    function perWithdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        (uint256 password, uint256 amount) = abi.decode(cleartexts, (uint256, uint256));
        require(amount > 0, "transfer: amount zero");
        require(depositList[password].isPublished, "transfer: transfer not published");
        bytes32[] memory handles = new bytes32[](4);
        handles[0] = FHE.toBytes32(depositList[password].balance);
        handles[1] = FHE.toBytes32(depositList[password].transferType);
        handles[2] = FHE.toBytes32(depositList[password].passwordAddress);
        handles[3] = FHE.toBytes32(depositList[password].allowAddress);
        FHE.requestDecryption(handles, this.perWithdrawDecryption.selector);
        uint256 requestId = FHE.requestDecryption(handles, this.depositDecryption.selector);
        temWithdrawList[requestId] = TemWithdraw({withdrawing: true, password: password, amount: amount});
    }

    function withdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        require(temWithdrawList[requestID].withdrawing, "transfer: not withdrawing");
        (uint256 balance, uint256 transferType, address passwordAddress, address allowAddress) = abi.decode(
            cleartexts,
            (uint256, uint256, address, address)
        );
        require(balance - temWithdrawList[requestID].amount >= 0, "Insufficient balance");
        if (transferType == 1) {
            require(allowAddress == tx.origin, "Address verification failed");
        }
        Vault storage v = depositList[temWithdrawList[requestID].password];
        euint256 leftBalance = FHE.asEuint256(balance - temWithdrawList[requestID].amount);
        Withdrawal memory withdrawal = Withdrawal({
            receiver: FHE.asEaddress(tx.origin),
            amount: FHE.asEuint256(balance - temWithdrawList[requestID].amount)
        });
        FHE.allowThis(withdrawal.receiver);
        FHE.allow(withdrawal.receiver, passwordAddress);
        FHE.allowThis(withdrawal.amount);
        FHE.allow(withdrawal.amount, passwordAddress);
        v.balance = leftBalance;
        v.withdrawal.push(withdrawal);
        FHE.allowThis(v.balance);
        FHE.allow(v.balance, passwordAddress);
        Address.sendValue(payable(tx.origin), temWithdrawList[requestID].amount);
        emit WithdrawalExecuted(tx.origin, temWithdrawList[requestID].amount);
    }

    function depositDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        (uint256 password, address passwordAddress) = abi.decode(cleartexts, (uint256, address));
        require(!depositList[password].isPublished, "transfer: transfer already published");
        Vault storage v = depositList[password];
        v.isPublished = true;
        v.balance = temDepositList[requestID].balance;
        v.passwordAddress = temDepositList[requestID].passwordAddress;
        v.transferType = temDepositList[requestID].transferType;
        v.depositor = temDepositList[requestID].depositor;
        v.allowAddress = temDepositList[requestID].allowAddress;
        FHE.allow(v.balance, passwordAddress);
        FHE.allow(v.passwordAddress, passwordAddress);
        FHE.allow(v.depositor, passwordAddress);
        FHE.allow(v.transferType, passwordAddress);
        FHE.allow(v.allowAddress, passwordAddress);
    }

    function getVault(uint256 password) public view returns (Vault memory vault) {
        vault = depositList[password];
    }
}
