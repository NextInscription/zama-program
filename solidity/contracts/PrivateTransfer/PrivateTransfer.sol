// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    ebool,
    eaddress,
    euint64,
    euint256,
    externalEaddress,
    externalEuint64,
    externalEuint256
} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateTransfer is SepoliaConfig {
    string public name;
    struct Withdrawal {
        eaddress receiver;
        euint256 amount;
    }
    struct Vault {
        bool isPublished;
        euint256 balance;
        eaddress passwordAddress;
        eaddress depositor;
        eaddress allowAddress;
        Withdrawal[] memory withdrawal;
    }
    struct TemDeposit {
        bool isPublising;
        euint256 balance;
        eaddress passwordAddress;
        eaddress depositor;
        eaddress allowAddress;
    }
    mapping(uint256 => TemDeposit) private temList;

    mapping(uint256 => Vault) private depositList;

    constructor(string memory _name) {
        name = _name;
    }

    function deposit(
        externalEuint256 _password,
        externalEuint256 _amount,
        externalEaddress _passwordAddress,
        externalEaddress _allowAddress,
        bytes memory inputProof
    ) external payable {
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 amount = FHE.fromExternal(_amount, inputProof);
        eaddress passwordAddress = FHE.fromExternal(_passwordAddress, inputProof);
        eaddress allowAddress = FHE.fromExternal(_allowAddress, inputProof);
        eaddress depositor = FHE.asEaddress(msg.sender);
        FHE.allowThis(password);
        FHE.allowThis(amount);
        FHE.allowThis(passwordAddress);
        FHE.allowThis(allowAddress);
        FHE.allowThis(depositor);
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(password);
        handles[1] = FHE.toBytes32(passwordAddress);
        uint256 requestId = FHE.requestDecryption(handles, this.depositDecryption.selector);
        temList[requestId] = TemDeposit({
            isPublising: true,
            balance: amount,
            passwordAddress: passwordAddress,
            depositor: depositor,
            allowAddress: allowAddress
        });
    }

    /// @notice Triggers an async decryption request via the FHEVM oracle.
    function depositDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        require(!temList[requestID].isPublising, "transfer: request already handled");
        FHE.checkSignatures(requestID, cleartexts, proof);
        (uint256 password, address passwordAddress) = abi.decode(cleartexts, (uint256, address));
        require(!depositList[password].isPublished, "transfer: transfer already published");
        depositList[password] = Vault({
            isPublished: true,
            balance: temList[requestID].balance,
            passwordAddress: temList[requestID].passwordAddress,
            depositor: temList[requestID].depositor,
            allowAddress: temList[requestID].allowAddress,
            withdrawal: new Withdrawal[](0)
        });
        FHE.allow(depositList[password].balance, passwordAddress);
        FHE.allow(depositList[password].passwordAddress, passwordAddress);
        FHE.allow(depositList[password].depositor, passwordAddress);
        FHE.allow(depositList[password].allowAddress, passwordAddress);
    }
}
