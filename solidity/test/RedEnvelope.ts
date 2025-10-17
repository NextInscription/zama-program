import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { RedEnvelope } from "../types";
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
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }
    ({ redContract, redContractAddress } = await deployFixture());
  });

  it("deploys", async () => {
    expect(await redContract.getAddress()).to.eq(redContractAddress);
  });

  it("accepts encrypted input and allows the sender to decrypt it", async function () {
    const random = 11111111111111n;
    const encryptedRandom = await fhevm
      .createEncryptedInput(redContractAddress, signers.deployer.address)
      .add256(random)
      .encrypt();

    const tx = await redContract
      .connect(signers.deployer)
      .setRandom(encryptedRandom.handles[0], encryptedRandom.inputProof);
    const receipt = await tx.wait();

    const storedHandle = await redContract.getRandom();
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      storedHandle,
      redContractAddress,
      signers.deployer,
    );

    expect(decryptedValue).to.equal(random);

    const parsedEvent = receipt!.logs
      .map((log) => {
        try {
          return redContract.interface.parseLog(log);
        } catch (e) {
          return undefined;
        }
      })
      .find((decoded) => decoded?.name === "EnvelopeUpdated");

    expect(parsedEvent).to.not.equal(undefined);
    expect(parsedEvent!.args.sender).to.equal(signers.deployer.address);
    expect(parsedEvent!.args.ciphertextHandle).to.equal(storedHandle);
  });

  it("trivially encrypts plaintext on-chain", async function () {
    const plainValue = 42n;

    const tx = await redContract.connect(signers.deployer).setRandomFromPlain(plainValue);
    const receipt = await tx.wait();

    const handle = await redContract.getRandom();
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      handle,
      redContractAddress,
      signers.deployer,
    );

    expect(decryptedValue).to.equal(plainValue);

    const parsedEvent = receipt!.logs
      .map((log) => {
        try {
          return redContract.interface.parseLog(log);
        } catch (e) {
          return undefined;
        }
      })
      .find((decoded) => decoded?.name === "EnvelopeUpdated");

    expect(parsedEvent).to.not.equal(undefined);
    expect(parsedEvent!.args.sender).to.equal(signers.deployer.address);
    expect(parsedEvent!.args.ciphertextHandle).to.equal(handle);
  });

  it("requests oracle decryption and stores the clear amount", async function () {
    const plainValue = 777n;

    await redContract.connect(signers.deployer).setRandomFromPlain(plainValue);

    const expectedRequestId = await redContract.connect(signers.deployer).requestGiftDecryption.staticCall();
    const requestTx = await redContract.connect(signers.deployer).requestGiftDecryption();
    const requestReceipt = await requestTx.wait();

    const requestEvent = requestReceipt!.logs
      .map((log) => {
        try {
          return redContract.interface.parseLog(log);
        } catch (e) {
          return undefined;
        }
      })
      .find((decoded) => decoded?.name === "DecryptionRequested");
    expect(requestEvent).to.not.equal(undefined);
    expect(requestEvent!.args.requestID).to.equal(expectedRequestId);
    expect(requestEvent!.args.requester).to.equal(signers.deployer.address);
    expect(await redContract.requestInitiator(expectedRequestId)).to.equal(signers.deployer.address);

    await fhevm.awaitDecryptionOracle();

    const decryptedAmount = await redContract.getDecryptedAmount(expectedRequestId);
    expect(decryptedAmount).to.equal(plainValue);

    const events = await redContract.queryFilter(
      redContract.filters.EnvelopeDecrypted(expectedRequestId, signers.deployer.address),
      requestReceipt!.blockNumber,
    );
    console.log(events[0].args.clearAmount);
    expect(events.length).to.be.greaterThan(0);
    expect(events[0].args.clearAmount).to.equal(plainValue);
  });
});
