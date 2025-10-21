import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateTransfer } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("PrivateTransfer");
  const PrivateTransferContract = await factory.deploy("PrivateTransfer");
  const PrivateTransferContractAddress = await PrivateTransferContract.getAddress();
  return { PrivateTransferContract, PrivateTransferContractAddress };
}

describe("PrivateTransfer", function () {
  let signers: Signers;
  let PrivateTransferContract: PrivateTransfer;
  let PrivateTransferContractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }
    ({ PrivateTransferContract, PrivateTransferContractAddress } = await deployFixture());
  });

  it("deploys", async () => {
    expect(await PrivateTransferContract.getAddress()).to.eq(PrivateTransferContractAddress);
  });

  it("deposit rejects zero value", async function () {
    const transferType = BigInt(1);
    const encryptedInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(123n)
      .add256(transferType)
      .addAddress(signers.alice.address)
      .addAddress(signers.bob.address)
      .encrypt();

    await expect(
      (PrivateTransferContract.connect(signers.alice) as unknown as any).deposit(
        encryptedInput.handles[0],
      encryptedInput.handles[1],
      encryptedInput.handles[2],
      encryptedInput.handles[3],
        encryptedInput.inputProof,
      ),
    ).to.be.revertedWith("value zero");
  });

  it("getVault returns the decrypted vault after a deposit", async function () {
    const passwordWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const password = BigInt(ethers.keccak256(passwordWallet.privateKey));
    const transferType = BigInt(1);
    const passwordAddress = passwordWallet.address;
    const allowAddress = signers.deployer.address;
    const depositAmount = ethers.parseEther("0.5");

    const encryptedInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .add256(transferType)
      .addAddress(passwordAddress)
      .addAddress(allowAddress)
      .encrypt();

    const tx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).deposit(
      encryptedInput.handles[0],
      encryptedInput.handles[1],
      encryptedInput.handles[2],
      encryptedInput.handles[3],
      encryptedInput.inputProof,
      { value: depositAmount },
    );
    await tx.wait();
    await fhevm.awaitDecryptionOracle();
    const vault = await PrivateTransferContract.getVault(password);
    expect(vault.isPublished).to.equal(true);
    const decryptedBalance = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      vault.balance,
      PrivateTransferContractAddress,
      passwordWallet,
    ); 
    expect(decryptedBalance).to.equal(depositAmount);
    const decryptedType = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      vault.transferType,
      PrivateTransferContractAddress,
      passwordWallet,
    ); 
    expect(decryptedType).to.equal(transferType);
    const decryptedPasswordAddress = await fhevm.userDecryptEaddress(
      vault.passwordAddress,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    expect(decryptedPasswordAddress).to.equal(passwordAddress);

    const decryptedDepositor = await fhevm.userDecryptEaddress(
      vault.depositor,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    expect(decryptedDepositor).to.equal(signers.alice.address);

    const decryptedAllowAddress = await fhevm.userDecryptEaddress(
      vault.allowAddress,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    expect(decryptedAllowAddress).to.equal(allowAddress);

    expect(vault.withdrawal.length).to.equal(0);
  });
});
