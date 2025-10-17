// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint256, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig, ZamaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract RedEnvelope is SepoliaConfig {
    string public name;
    euint256 private encryptedGift;
    address public immutable decryptionOracle;

    mapping(uint256 => address) public requestInitiator;
    mapping(uint256 => uint256) private decryptedAmounts;
    mapping(uint256 => bool) private requestHandled;

    event EnvelopeUpdated(address indexed sender, bytes32 ciphertextHandle);
    event DecryptionRequested(uint256 indexed requestID, address indexed requester);
    event EnvelopeDecrypted(uint256 indexed requestID, address indexed requester, uint256 clearAmount);

    constructor(string memory _name) {
        name = _name;
        decryptionOracle = ZamaConfig.getSepoliaConfig().DecryptionOracleAddress;
    }

    /// @notice Stores an externally encrypted value inside the envelope.
    function setRandom(externalEuint256 inputRandom, bytes memory inputProof) external {
        encryptedGift = FHE.fromExternal(inputRandom, inputProof);
        FHE.allowThis(encryptedGift);
        FHE.allow(encryptedGift, msg.sender);
        emit EnvelopeUpdated(msg.sender, FHE.toBytes32(encryptedGift));
    }

    /// @notice Performs on-chain trivial encryption for demonstration purposes.
    function setRandomFromPlain(uint256 plainValue) external {
        encryptedGift = FHE.asEuint256(plainValue);
        FHE.allowThis(encryptedGift);
        FHE.allow(encryptedGift, msg.sender);
        emit EnvelopeUpdated(msg.sender, FHE.toBytes32(encryptedGift));
    }

    /// @notice Returns the stored encrypted value handle.
    function getRandom() public view returns (euint256) {
        return encryptedGift;
    }

    /// @notice Triggers an async decryption request via the FHEVM oracle.
    function requestGiftDecryption() external returns (uint256 requestID) {
        require(FHE.isInitialized(encryptedGift), "RedEnvelope: envelope empty");

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(encryptedGift);

        requestID = FHE.requestDecryption(handles, this.fulfillDecryption.selector);
        requestInitiator[requestID] = msg.sender;

        emit DecryptionRequested(requestID, msg.sender);
    }

    /// @notice Callback invoked by the oracle with the decrypted value.
    function fulfillDecryption(uint256 requestID, bytes calldata cleartexts, bytes calldata proof) external {
        require(!requestHandled[requestID], "RedEnvelope: request already handled");

        FHE.checkSignatures(requestID, cleartexts, proof);

        address requester = requestInitiator[requestID];
        require(requester != address(0), "RedEnvelope: unknown request");

        uint256 clearAmount = abi.decode(cleartexts, (uint256));

        decryptedAmounts[requestID] = clearAmount;
        requestHandled[requestID] = true;

        emit EnvelopeDecrypted(requestID, requester, clearAmount);
    }

    /// @notice Reads the decrypted amount once the oracle fulfilled the request.
    function getDecryptedAmount(uint256 requestID) external view returns (uint256) {
        require(requestHandled[requestID], "RedEnvelope: decryption pending");
        return decryptedAmounts[requestID];
    }
}
