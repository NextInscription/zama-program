// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, eaddress, euint256, externalEaddress, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

// 安全的数学计算库
library SafeMath {
    /**
     * @dev Multiplies two numbers, throws on overflow.
     */
    // 乘法计算
    function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
        // 判断 a 如果为0，则返回积为0。 这里为什么不把b一起判断了呢？
        if (a == 0) {
            return 0;
        }
        // 乘法计算公式
        c = a * b;
        // 返回之前，需要通过除法来验算一下结果没有溢出。因为溢出后，除法算式就不等了。
        // 这里也解答了上面为什么要单独判断 a==0，因为除法中，a 如果为0是不能作为除数的。
        // 上面不判断b，是多判断一个就会多一点计算量，为了简洁。
        assert(c / a == b);
        return c;
    }

    /**
     * @dev Integer division of two numbers, truncating the quotient.
     */
    // 除法计算
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        // uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        // 现在当除数为0时，solidity 会自动抛出异常
        // 除法计算不会出现整数溢出异常情况
        return a / b;
    }

    /**
     * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
     */
    // 减法计算
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        // 因为是无符号整数的计算，所以要验证被减数比减少大，或者相等。
        assert(b <= a);
        return a - b;
    }

    /**
     * @dev Adds two numbers, throws on overflow.
     */
    // 加法计算
    function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a + b;
        // c 为 a与b 的和，如果溢出，c将会变成一个很小的数，此时验证一下c 是否比a 大，或者相等（b为0时）。
        assert(c >= a);
        return c;
    }
}

contract PrivateTransfer is SepoliaConfig {
    using SafeMath for uint;
    string public name;
    address public owner;
    uint256 public fee = 100;
    event WithdrawalExecuted(address indexed receiver, uint256 indexed amount);
    event DepositExecuted(address indexed depositer, uint256 indexed amount);
    struct Withdrawal {
        eaddress receiver;
        euint256 amount;
    }
    struct Task {
        uint256 password;
        uint256 amount;
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
        address sender;
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

    mapping(uint256 => address) private temWithdrawAddresses;

    mapping(uint256 => Vault) private depositList;
    Task[] public tasks;

    constructor(string memory _name) {
        name = _name;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // 拥有者可转移权限
    function changeFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function entrustWithdraw(externalEuint256 _password, bytes memory inputProof) external {
        euint256 password = FHE.fromExternal(_password, inputProof);
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(password);
        uint256 requestId = FHE.requestDecryption(handles, this.perEntrustWithdrawDecryption.selector);
        temWithdrawAddresses[requestId] = msg.sender;
    }

    function perEntrustWithdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        uint256 password = abi.decode(cleartexts, (uint256));
        require(depositList[password].isPublished, "transfer: transfer not published");
        bytes32[] memory handles = new bytes32[](4);
        handles[0] = FHE.toBytes32(depositList[password].balance);
        handles[1] = FHE.toBytes32(depositList[password].transferType);
        handles[2] = FHE.toBytes32(depositList[password].passwordAddress);
        handles[3] = FHE.toBytes32(depositList[password].allowAddress);
        uint256 requestId = FHE.requestDecryption(handles, this.entrustWithdrawDecryption.selector);
        temWithdrawList[requestId] = TemWithdraw({
            withdrawing: true,
            password: password,
            amount: 0,
            sender: temWithdrawAddresses[requestID]
        });
    }

    function withdraw(externalEuint256 _password, externalEuint256 _amount, bytes memory inputProof) external {
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 amount = FHE.fromExternal(_amount, inputProof);
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(password);
        handles[1] = FHE.toBytes32(amount);
        uint256 requestId = FHE.requestDecryption(handles, this.perWithdrawDecryption.selector);
        temWithdrawAddresses[requestId] = msg.sender;
    }

    function entrustWithdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        require(temWithdrawList[requestID].withdrawing, "transfer: not withdrawing");
        (uint256 balance, uint256 transferType, address passwordAddress, address allowAddress) = abi.decode(
            cleartexts,
            (uint256, uint256, address, address)
        );
        require(balance > 0, "Insufficient balance");
        require(transferType == 3, "transferType error");
        uint256 payfee = balance.mul(fee).div(1000);
        Withdrawal memory withdrawal = Withdrawal({
            receiver: FHE.asEaddress(allowAddress),
            amount: FHE.asEuint256(balance.sub(payfee))
        });
        FHE.allowThis(withdrawal.receiver);
        FHE.allow(withdrawal.receiver, passwordAddress);
        FHE.allowThis(withdrawal.amount);
        FHE.allow(withdrawal.amount, passwordAddress);
        depositList[temWithdrawList[requestID].password].balance = FHE.asEuint256(0);
        depositList[temWithdrawList[requestID].password].withdrawal.push(withdrawal);
        FHE.allowThis(depositList[temWithdrawList[requestID].password].balance);
        FHE.allow(depositList[temWithdrawList[requestID].password].balance, passwordAddress);
        removeByValueFast(temWithdrawList[requestID].password);
        Address.sendValue(payable(temWithdrawList[requestID].sender), payfee);
        emit WithdrawalExecuted(temWithdrawList[requestID].sender, payfee);
        Address.sendValue(payable(allowAddress), balance.sub(payfee));
        emit WithdrawalExecuted(allowAddress, balance.sub(payfee));
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
        bytes32[] memory handles = new bytes32[](5);
        handles[0] = FHE.toBytes32(password);
        handles[1] = FHE.toBytes32(passwordAddress);
        handles[2] = FHE.toBytes32(depositor);
        handles[3] = FHE.toBytes32(amount);
        handles[4] = FHE.toBytes32(transferType);
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
        uint256 requestId = FHE.requestDecryption(handles, this.withdrawDecryption.selector);
        temWithdrawList[requestId] = TemWithdraw({
            withdrawing: true,
            password: password,
            amount: amount,
            sender: temWithdrawAddresses[requestID]
        });
    }

    function withdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        require(temWithdrawList[requestID].withdrawing, "transfer: not withdrawing");
        (uint256 balance, uint256 transferType, address passwordAddress, address allowAddress) = abi.decode(
            cleartexts,
            (uint256, uint256, address, address)
        );
        require(transferType != 3, "transferType error");
        require(balance - temWithdrawList[requestID].amount >= 0, "Insufficient balance");
        if (transferType == 1) {
            require(allowAddress == temWithdrawList[requestID].sender, "Address verification failed");
        }
        euint256 leftBalance = FHE.asEuint256(balance - temWithdrawList[requestID].amount);
        Withdrawal memory withdrawal = Withdrawal({
            receiver: FHE.asEaddress(temWithdrawList[requestID].sender),
            amount: FHE.asEuint256(balance - temWithdrawList[requestID].amount)
        });
        FHE.allowThis(withdrawal.receiver);
        FHE.allow(withdrawal.receiver, passwordAddress);
        FHE.allowThis(withdrawal.amount);
        FHE.allow(withdrawal.amount, passwordAddress);
        depositList[temWithdrawList[requestID].password].balance = leftBalance;
        depositList[temWithdrawList[requestID].password].withdrawal.push(withdrawal);
        FHE.allowThis(depositList[temWithdrawList[requestID].password].balance);
        FHE.allow(depositList[temWithdrawList[requestID].password].balance, passwordAddress);
        Address.sendValue(payable(temWithdrawList[requestID].sender), temWithdrawList[requestID].amount);
        emit WithdrawalExecuted(temWithdrawList[requestID].sender, temWithdrawList[requestID].amount);
    }

    function depositDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        (uint256 password, address passwordAddress, address depositor, uint256 amount, uint256 transferType) = abi
            .decode(cleartexts, (uint256, address, address, uint256, uint256));
        require(!depositList[password].isPublished, "transfer: transfer already published");
        depositList[password].isPublished = true;
        depositList[password].balance = temDepositList[requestID].balance;
        depositList[password].passwordAddress = temDepositList[requestID].passwordAddress;
        depositList[password].transferType = temDepositList[requestID].transferType;
        depositList[password].depositor = temDepositList[requestID].depositor;
        depositList[password].allowAddress = temDepositList[requestID].allowAddress;
        FHE.allow(depositList[password].balance, passwordAddress);
        FHE.allow(depositList[password].passwordAddress, passwordAddress);
        FHE.allow(depositList[password].depositor, passwordAddress);
        FHE.allow(depositList[password].transferType, passwordAddress);
        FHE.allow(depositList[password].allowAddress, passwordAddress);
        if (transferType == 3) {
            tasks.push(Task({password: password, amount: amount}));
        }
        emit DepositExecuted(depositor, amount);
    }

    function removeByValueFast(uint256 value) internal {
        uint256 length = tasks.length;
        for (uint256 i = 0; i < length; i++) {
            if (tasks[i].password == value) {
                tasks[i] = tasks[length - 1]; // 用最后一个覆盖
                tasks.pop(); // 删除最后一个
                break;
            }
        }
    }

    function batchGetVault(uint256[] memory passwords) public view returns (Vault[] memory vaults) {
        vaults = new Vault[](passwords.length);
        for (uint256 i = 0; i < passwords.length; i++) {
            vaults[i] = depositList[passwords[i]];
        }
    }

    function getVault(uint256 password) public view returns (Vault memory vault) {
        vault = depositList[password];
    }

    function getPasswords() public view returns (Task[] memory _tasks) {
        _tasks = tasks;
    }
}
