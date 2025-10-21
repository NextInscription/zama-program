// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    eaddress,
    euint256,
    externalEaddress,
    externalEuint256
} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateTransfer is SepoliaConfig {
    string public name;
    bytes32 private immutable DOMAIN_SEPARATOR;
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
        Withdrawal[] withdrawal;
    }
    struct TemDeposit {
        euint256 balance;
        eaddress passwordAddress;
        eaddress depositor;
        eaddress allowAddress;
    }
    mapping(uint256 => TemDeposit) private temList;

    uint256 private constant SECP256K1N_HALF = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant WITHDRAW_TYPEHASH = keccak256("Withdraw(bytes32 password,bytes32 amount)");
    bytes32 private constant VERSION_HASH = keccak256(bytes("1"));

    mapping(uint256 => Vault) private depositList;

    constructor(string memory _name) {
        name = _name;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(_name)),
                VERSION_HASH,
                block.chainid,
                address(this)
            )
        );
    }

    function withdraw(
        externalEuint256 _password,
        externalEuint256 _amount,
        bytes memory inputProof,
        bytes calldata signature
    ) external {
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 amount = FHE.fromExternal(_amount, inputProof);
        bytes32 passwordHandle = FHE.toBytes32(password);
        bytes32 amountHandle = FHE.toBytes32(amount);

        bytes32 structHash = keccak256(abi.encode(WITHDRAW_TYPEHASH, passwordHandle, amountHandle));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        address signer = _recoverSigner(digest, signature);
        require(signer == msg.sender, "transfer: invalid withdraw signature");

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = passwordHandle;
        handles[1] = amountHandle;
    }

    function deposit(
        externalEuint256 _password,
        externalEaddress _passwordAddress,
        externalEaddress _allowAddress,
        bytes memory inputProof
    ) external payable {
        require(msg.value > 0, "value zero");
        euint256 password = FHE.fromExternal(_password, inputProof);
        euint256 amount = FHE.asEuint256(msg.value);
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
            balance: amount,
            passwordAddress: passwordAddress,
            depositor: depositor,
            allowAddress: allowAddress
        });
    }

    function withdrawDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {}

    function depositDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        FHE.checkSignatures(requestID, cleartexts, proof);
        (uint256 password, address passwordAddress) = abi.decode(cleartexts, (uint256, address));
        require(!depositList[password].isPublished, "transfer: transfer already published");
        Vault storage v = depositList[password];
        v.isPublished = true;
        v.balance = temList[requestID].balance;
        v.passwordAddress = temList[requestID].passwordAddress;
        v.depositor = temList[requestID].depositor;
        v.allowAddress = temList[requestID].allowAddress;
        FHE.allow(v.balance, passwordAddress);
        FHE.allow(v.passwordAddress, passwordAddress);
        FHE.allow(v.depositor, passwordAddress);
        FHE.allow(v.allowAddress, passwordAddress);
    }

    function getVault(uint256 password) public view returns (Vault memory vault) {
        vault = depositList[password];
    }

    function _recoverSigner(bytes32 digest, bytes calldata signature) private pure returns (address) {
        require(signature.length == 65, "transfer: invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        require(uint256(s) <= SECP256K1N_HALF, "transfer: invalid signature s");
        require(v == 27 || v == 28, "transfer: invalid signature v");

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "transfer: invalid signature");
        return recovered;
    }
}
