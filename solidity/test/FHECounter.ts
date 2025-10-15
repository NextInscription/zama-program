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

// describe("FHECounter", function () {
//   let signers: Signers;
//   let fheCounterContract: FHECounter;
//   let fheCounterContractAddress: string;

//   before(async function () {
//     const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
//     signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
//     console.log(signers);
//   });

//   beforeEach(async function () {
//     // Check whether the tests are running against an FHEVM mock environment
//     if (!fhevm.isMock) {
//       console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
//       this.skip();
//     }

//     await deployFixture();
//   });
//   // it("encrypted count should be uninitialized after deployment", async function () {
//   //   // const encryptedCount = await fheCounterContract.getCount();
//   //   // // Expect initial count to be bytes32(0) after deployment,
//   //   // // (meaning the encrypted count value is uninitialized)
//   //   // expect(encryptedCount).to.eq(ethers.ZeroHash);
//   // });

//   // it("increment the counter by 1", async function () {
//   //   // const encryptedCountBeforeInc = await fheCounterContract.getCount();
//   //   // expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);
//   //   // const clearCountBeforeInc = 0;
//   //   // // Encrypt constant 1 as a euint32
//   //   // const clearOne = 1;
//   //   // const encryptedOne = await fhevm
//   //   //   .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
//   //   //   .add32(clearOne)
//   //   //   .encrypt();
//   //   // const tx = await fheCounterContract
//   //   //   .connect(signers.alice)
//   //   //   .increment(encryptedOne.handles[0], encryptedOne.inputProof);
//   //   // await tx.wait();
//   //   // const encryptedCountAfterInc = await fheCounterContract.getCount();
//   //   // const clearCountAfterInc = await fhevm.userDecryptEuint(
//   //   //   FhevmType.euint32,
//   //   //   encryptedCountAfterInc,
//   //   //   fheCounterContractAddress,
//   //   //   signers.alice,
//   //   // );
//   //   // expect(clearCountAfterInc).to.eq(clearCountBeforeInc + clearOne);
//   // });

//   // it("decrement the counter by 1", async function () {
//   //   // Encrypt constant 1 as a euint32
//   //   // const clearOne = 1;
//   //   // const encryptedOne = await fhevm
//   //   //   .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
//   //   //   .add32(clearOne)
//   //   //   .encrypt();
//   //   // // First increment by 1, count becomes 1
//   //   // let tx = await fheCounterContract
//   //   //   .connect(signers.alice)
//   //   //   .increment(encryptedOne.handles[0], encryptedOne.inputProof);
//   //   // await tx.wait();
//   //   // // Then decrement by 1, count goes back to 0
//   //   // tx = await fheCounterContract.connect(signers.alice).decrement(encryptedOne.handles[0], encryptedOne.inputProof);
//   //   // await tx.wait();
//   //   // const encryptedCountAfterDec = await fheCounterContract.getCount();
//   //   // const clearCountAfterInc = await fhevm.userDecryptEuint(
//   //   //   FhevmType.euint32,
//   //   //   encryptedCountAfterDec,
//   //   //   fheCounterContractAddress,
//   //   //   signers.alice,
//   //   // );
//   //   // expect(clearCountAfterInc).to.eq(0);
//   // });
// });

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
    // Then decrement by 1, count goes back to 0
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
