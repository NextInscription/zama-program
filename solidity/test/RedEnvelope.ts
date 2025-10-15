import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { RedEnvelope, RedEnvelope__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
    deployer: HardhatEthersSigner;
    alice: HardhatEthersSigner;
    bob: HardhatEthersSigner;
};

async function deployFixture() {
    const factory = await ethers.getContractFactory("RedEnvelope");
    const redContract = await factory.deploy("RedEnvelope");
    const redContractAddress = await redContract.getAddress();
    return { redContract, redContractAddress };
}

describe("RedEnvelope", function () {
    let signers: Signers;
    let redContract: RedEnvelope;
    let redContractAddress: string;

    before(async function () {
        const ethSigners = await ethers.getSigners();
        signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
        console.log("Deployer:", signers.deployer.address);
    });

    beforeEach(async function () {
        if (!fhevm.isMock) {
            console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
            this.skip();
        }
        ({ redContract, redContractAddress } = await deployFixture());
    });

    it("smoke", async () => {
        expect(await redContract.getAddress()).to.eq(redContractAddress);
    });
    it("set random", async function () {
        const random = ethers.toBigInt("11111111111111");
        const encryptedRandom = await fhevm
            .createEncryptedInput(redContractAddress, signers.deployer.address)
            .add256(random)
            .encrypt();
        const tx = await redContract
            .connect(signers.deployer)
            .setRandom(encryptedRandom.handles[0], encryptedRandom.inputProof);
        await tx.wait();
        const result = await redContract.connect(signers.deployer).getRandom();
        console.log("加密后的参数" + result);
        const clearCountAfterInc = await fhevm.userDecryptEuint(
            FhevmType.euint256,
            result,
            redContractAddress,
            signers.deployer,
        );
        console.log("解密后的参数" + clearCountAfterInc);
    });
});
