// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {FHE, euint256, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract RedEnvelope is SepoliaConfig {
    string public name;
    euint256 private random;

    constructor(string memory _name) {
        name = _name;
    }

    function setRandom(externalEuint256 inputRandom, bytes memory inputProof) external {
        random = FHE.fromExternal(inputRandom, inputProof);
        FHE.allowThis(random);
        FHE.allow(random, msg.sender);
    }

    function getRandom() public view returns (euint256) {
        return random;
    }
}
