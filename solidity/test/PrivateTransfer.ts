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

  it("deposit transferType 1", async function () {
    const passwordWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const password = BigInt(ethers.keccak256(passwordWallet.privateKey));
    const transferType = BigInt(1);
    const passwordAddress = passwordWallet.address;
    const allowAddress = signers.deployer.address;
    const depositAmount = ethers.parseEther("0.5");

    const encryptedDepoistInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .add256(transferType)
      .addAddress(passwordAddress)
      .addAddress(allowAddress)
      .encrypt();

    const deposittx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).deposit(
      encryptedDepoistInput.handles[0],
      encryptedDepoistInput.handles[1],
      encryptedDepoistInput.handles[2],
      encryptedDepoistInput.handles[3],
      encryptedDepoistInput.inputProof,
      { value: depositAmount },
    );
    await deposittx.wait();
    await fhevm.awaitDecryptionOracle();
    console.log("质押完成")
    console.log("开始领取")
    const withdrawAmount = ethers.parseEther("0.2");
    const encryptedWithdrawInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.deployer.address)
      .add256(password)
      .add256(withdrawAmount)
      .encrypt();
    const withdrawtx = await (PrivateTransferContract.connect(signers.deployer) as unknown as any).withdraw(
      encryptedWithdrawInput.handles[0],
      encryptedWithdrawInput.handles[1],
      encryptedWithdrawInput.inputProof
    );
    await withdrawtx.wait();
    await fhevm.awaitDecryptionOracle();
    await fhevm.awaitDecryptionOracle();
    console.log("领取完成")
    console.log("开始获取vault")
    const vault = await PrivateTransferContract.getVault(password);
    expect(vault.isPublished).to.equal(true);
    const decryptedBalance = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      vault.balance,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    console.log("剩余金额", decryptedBalance)
    for (let item of vault.withdrawal) {
      const decryptedReceiver = await fhevm.userDecryptEaddress(
        item.receiver,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      const decryptedAmount = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        item.amount,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      console.log(decryptedReceiver, decryptedAmount)
    }
  });
  it("deposit transferType 2", async function () {
    const passwordWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const password = BigInt(ethers.keccak256(passwordWallet.privateKey));
    const transferType = BigInt(2);
    const passwordAddress = passwordWallet.address;
    const allowAddress = signers.deployer.address;
    const depositAmount = ethers.parseEther("0.5");

    const encryptedDepoistInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .add256(transferType)
      .addAddress(passwordAddress)
      .addAddress(allowAddress)
      .encrypt();

    const deposittx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).deposit(
      encryptedDepoistInput.handles[0],
      encryptedDepoistInput.handles[1],
      encryptedDepoistInput.handles[2],
      encryptedDepoistInput.handles[3],
      encryptedDepoistInput.inputProof,
      { value: depositAmount },
    );
    await deposittx.wait();
    await fhevm.awaitDecryptionOracle();
    console.log("质押完成")
    console.log("开始领取")
    const withdrawAmount = ethers.parseEther("0.2");
    const encryptedWithdrawInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .add256(withdrawAmount)
      .encrypt();
    const withdrawtx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).withdraw(
      encryptedWithdrawInput.handles[0],
      encryptedWithdrawInput.handles[1],
      encryptedWithdrawInput.inputProof
    );
    await withdrawtx.wait();
    await fhevm.awaitDecryptionOracle();
    await fhevm.awaitDecryptionOracle();
    console.log("领取完成")
    console.log("开始获取vault")
    const vault = await PrivateTransferContract.getVault(password);
    expect(vault.isPublished).to.equal(true);
    const decryptedBalance = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      vault.balance,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    console.log("剩余金额", decryptedBalance)
    for (let item of vault.withdrawal) {
      const decryptedReceiver = await fhevm.userDecryptEaddress(
        item.receiver,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      const decryptedAmount = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        item.amount,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      console.log(decryptedReceiver, decryptedAmount)
    }
  });
  it("deposit transferType 3", async function () {
    const passwordWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const password = BigInt(ethers.keccak256(passwordWallet.privateKey));
    const transferType = BigInt(3);
    const passwordAddress = passwordWallet.address;
    const allowAddress = signers.deployer.address;
    const depositAmount = ethers.parseEther("0.5");

    const encryptedDepoistInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .add256(transferType)
      .addAddress(passwordAddress)
      .addAddress(allowAddress)
      .encrypt();

    const deposittx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).deposit(
      encryptedDepoistInput.handles[0],
      encryptedDepoistInput.handles[1],
      encryptedDepoistInput.handles[2],
      encryptedDepoistInput.handles[3],
      encryptedDepoistInput.inputProof,
      { value: depositAmount },
    );
    await deposittx.wait();
    await fhevm.awaitDecryptionOracle();
    console.log("质押完成")
    const beforpasswords = await PrivateTransferContract.getPasswords();
    console.log(beforpasswords)
    console.log("开始领取")
    const encryptedWithdrawInput = await fhevm
      .createEncryptedInput(PrivateTransferContractAddress, signers.alice.address)
      .add256(password)
      .encrypt();
    const withdrawtx = await (PrivateTransferContract.connect(signers.alice) as unknown as any).entrustWithdraw(
      encryptedWithdrawInput.handles[0],
      encryptedWithdrawInput.inputProof
    );
    const withDrawResult = await withdrawtx.wait();
    await fhevm.awaitDecryptionOracle();
    await fhevm.awaitDecryptionOracle();
    console.log("领取完成")
    console.log("开始获取vault")
    const vault = await PrivateTransferContract.getVault(password);
    expect(vault.isPublished).to.equal(true);
    const decryptedBalance = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      vault.balance,
      PrivateTransferContractAddress,
      passwordWallet,
    );
    console.log("剩余金额", decryptedBalance)
    for (let item of vault.withdrawal) {
      const decryptedReceiver = await fhevm.userDecryptEaddress(
        item.receiver,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      const decryptedAmount = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        item.amount,
        PrivateTransferContractAddress,
        passwordWallet,
      );
      console.log(decryptedReceiver, decryptedAmount)
    }
    const passwords = await PrivateTransferContract.getPasswords();
    console.log(passwords)
  });
});
