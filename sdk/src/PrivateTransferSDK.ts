/**
 * Zama Private Transfer SDK
 *
 * This SDK provides methods to interact with the Zama Private Transfer smart contract
 * including deposit, withdraw, bounty tasks, and refund operations.
 */

import { BrowserProvider, Contract, Wallet, parseEther, formatEther, hexlify } from 'ethers';
import type {
  SDKConfig,
  DepositParams,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
  VaultInfo,
  BountyTask,
  CompleteTaskParams,
  CompleteTaskResult,
  RefundParams,
  RefundResult,
  GeneratedWallet,
  SDKEventCallbacks,
} from './types';
import { TransferType } from './types';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_RPC_URL,
  BLACKHOLE_ADDRESS,
  SEPOLIA_FHE_CONFIG,
  CONTRACT_ABI,
} from './constants';

/**
 * Main SDK class for Zama Private Transfer
 */
export class PrivateTransferSDK {
  private config: Required<SDKConfig>;
  private contract: Contract | null = null;
  private fheInstance: any = null;
  private callbacks: SDKEventCallbacks = {};

  /**
   * Create a new PrivateTransferSDK instance
   * @param config SDK configuration (optional, uses defaults if not provided)
   */
  constructor(config?: SDKConfig) {
    this.config = {
      contractAddress: config?.contractAddress || DEFAULT_CONTRACT_ADDRESS,
      rpcUrl: config?.rpcUrl || DEFAULT_RPC_URL,
      provider: config?.provider,
      signer: config?.signer,
    } as Required<SDKConfig>;
  }


  /**
   * Initialize the SDK (must be called before using other methods)
   * @param provider Optional provider (browser wallet provider)
   */
  async initialize(instance: any, provider?: any): Promise<void> {
    try {
      // Initialize FHE instance
      console.log('[PrivateTransferSDK] Initializing FHE instance...');
      this.fheInstance = instance
      console.log('[PrivateTransferSDK] ✅ FHE instance created successfully');

      // Initialize provider and signer if not provided
      if (!this.config.provider && provider) {
        this.config.provider = new BrowserProvider(provider);
      }

      if (!this.config.signer && this.config.provider) {
        this.config.signer = await (this.config.provider as BrowserProvider).getSigner();
      }

      // Initialize contract
      if (this.config.signer) {
        this.contract = new Contract(this.config.contractAddress, CONTRACT_ABI, this.config.signer);
      }

      console.log('[PrivateTransferSDK] ✅ SDK initialized successfully');
    } catch (error) {
      console.error('[PrivateTransferSDK] ❌ Initialization failed:', error);
      throw new Error(`Failed to initialize SDK: ${(error as Error).message}`);
    }
  }

  /**
   * Set event callbacks
   * @param callbacks Event callback functions
   */
  setCallbacks(callbacks: SDKEventCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Generate a random wallet for password
   * @returns Generated wallet information
   */
  generatePasswordWallet(): GeneratedWallet {
    const wallet = Wallet.createRandom();
    return {
      privateKey: wallet.privateKey,
      address: wallet.address,
      wallet: wallet as any,
    };
  }

  /**
   * Make a deposit
   * @param params Deposit parameters
   * @returns Deposit result including generated password wallet
   */
  async deposit(params: DepositParams): Promise<DepositResult> {
    if (!this.fheInstance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized. Please ensure SDK is initialized with a wallet provider.');
    }

    if (!this.config.signer) {
      throw new Error('Signer not available. Please connect your wallet first.');
    }

    // Validate parameters
    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new Error('Invalid amount');
    }

    if (
      (params.transferType === TransferType.SPECIFIED_RECIPIENT ||
        params.transferType === TransferType.ENTRUSTED_WITHDRAWAL) &&
      !params.recipientAddress
    ) {
      throw new Error('Recipient address is required for this transfer type');
    }

    try {
      // Generate password wallet
      const passwordWallet = this.generatePasswordWallet();
      const passwordUint256 = BigInt(passwordWallet.privateKey);
      const passwordAddress = passwordWallet.address;

      // Determine target address
      const targetAddress =
        params.transferType === TransferType.ANYONE_WITH_PASSWORD
          ? BLACKHOLE_ADDRESS
          : params.recipientAddress!;

      // Get signer address
      const signerAddress = await this.config.signer.getAddress();

      // Create encrypted input
      console.log('[SDK] Creating encrypted input...')
      const input = this.fheInstance.createEncryptedInput(this.config.contractAddress, signerAddress);
      input.add256(passwordUint256);
      input.add256(BigInt(params.transferType));
      input.addAddress(passwordAddress);
      input.addAddress(targetAddress);

      // Encrypt
      console.log('[SDK] Starting encryption...')
      let encryptedInput;
      try {
        encryptedInput = await input.encrypt()
        console.log('[SDK] Encryption completed')
      } catch (encryptError) {
        console.error('[SDK] Encryption failed:', encryptError)
        throw new Error(`Encryption failed: ${(encryptError as Error).message}. Make sure WASM files are loaded correctly.`)
      }

      const handles = encryptedInput.handles;
      const inputProof = encryptedInput.inputProof;
      // Call deposit function
      console.log('[SDK] Submitting transaction...')
      const tx = await this.contract.deposit(
        handles[0], // password
        handles[1], // transferType
        handles[2], // passwordAddress
        handles[3], // allowAddress
        inputProof,
        { value: BigInt(parseFloat(params.amount) * 1e18) }
      );

      console.log('[SDK] Transaction submitted:', tx.hash)
      this.callbacks.onTransactionSubmitted?.(tx.hash);

      const receipt = await tx.wait();

      this.callbacks.onTransactionConfirmed?.(receipt);

      return {
        transactionHash: receipt.hash,
        password: passwordUint256,
        privateKey: passwordWallet.privateKey,
        passwordAddress: passwordWallet.address,
        recipientAddress: targetAddress,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('[SDK] Deposit error:', error)
      const err = new Error(`Deposit failed: ${(error as Error).message}`);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Get vault information by private key
   * @param privateKey The private key (password) from deposit result
   * @returns Vault information
   */
  async getVaultInfo(privateKey: string): Promise<VaultInfo> {
    if (!this.contract || !this.fheInstance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    if (!this.config.signer) {
      throw new Error('Signer not available. Please provide a signer.');
    }

    try {
      // Create wallet from private key
      const wallet = new Wallet(privateKey);
      const passwordUint256 = BigInt(privateKey);
      // Get vault info from contract
      const vault = await this.contract.getVault(passwordUint256);
      if (!vault.isPublished) {
        throw new Error('No vault found for this password');
      }

      // Generate keypair for decryption
      const keypair = this.fheInstance.generateKeypair();

      // Store handles as strings
      const transferTypeHandle = hexlify(vault.transferType);
      const balanceHandle = hexlify(vault.balance);
      const depositorHandle = hexlify(vault.depositor);
      const allowAddressHandle = hexlify(vault.allowAddress);

      // Prepare handle-contract pairs
      const handleContractPairs = [
        { handle: transferTypeHandle, contractAddress: this.config.contractAddress },
        { handle: balanceHandle, contractAddress: this.config.contractAddress },
        { handle: depositorHandle, contractAddress: this.config.contractAddress },
        { handle: allowAddressHandle, contractAddress: this.config.contractAddress },
      ];

      // Create EIP712 signature request
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [this.config.contractAddress];

      const eip712 = this.fheInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      // Sign with the private key wallet
      const signature = await wallet.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      // Perform user decryption
      const result = await this.fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        wallet.address,
        startTimeStamp,
        durationDays
      );

      const balanceWei = result[balanceHandle].toString();

      return {
        isPublished: vault.isPublished,
        transferType: Number(result[transferTypeHandle]),
        balance: balanceWei,
        balanceEth: formatEther(balanceWei),
        passwordAddress: wallet.address,
        depositor: result[depositorHandle].toString(),
        allowAddress: result[allowAddressHandle].toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get vault info: ${(error as Error).message}`);
    }
  }

  /**
   * Withdraw funds from vault
   * @param params Withdraw parameters
   * @returns Withdraw result
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    if (!this.contract || !this.fheInstance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    if (!this.config.signer) {
      throw new Error('Signer not available. Please provide a signer.');
    }

    // Validate parameters
    if (!params.privateKey) {
      throw new Error('Private key is required');
    }

    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      // Convert private key to uint256
      const passwordUint256 = BigInt(params.privateKey);

      const amountWei = parseEther(params.amount);

      // Get signer address
      const signerAddress = await this.config.signer.getAddress();

      // Encrypt password and amount
      const encryptedInput = await this.fheInstance
        .createEncryptedInput(this.config.contractAddress, signerAddress)
        .add256(passwordUint256)
        .add256(BigInt(amountWei.toString()))
        .encrypt();

      const handles = encryptedInput.handles.map((h: any) => hexlify(h));
      const inputProof = hexlify(encryptedInput.inputProof);

      // Call withdraw function
      const tx = await this.contract.withdraw(handles[0], handles[1], inputProof);

      this.callbacks.onTransactionSubmitted?.(tx.hash);

      const receipt = await tx.wait();

      this.callbacks.onTransactionConfirmed?.(receipt);

      return {
        transactionHash: receipt.hash,
        amount: params.amount,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      const err = new Error(`Withdrawal failed: ${(error as Error).message}`);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Get current commission fee rate
   * @returns Fee rate (e.g., 50 means 5%)
   */
  async getFeeRate(): Promise<number> {
    if (!this.contract) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const fee = await this.contract.fee();
      return Number(fee);
    } catch (error) {
      throw new Error(`Failed to get fee rate: ${(error as Error).message}`);
    }
  }

  /**
   * Get all available bounty tasks
   * @returns Array of bounty tasks
   */
  async getBountyTasks(): Promise<BountyTask[]> {
    if (!this.contract) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      // Get fee from contract
      const feeValue = await this.contract.fee();
      const fee = Number(feeValue);

      // Get all tasks
      const tasksData = await this.contract.getTasks();

      return tasksData.map((task: any) => {
        const amount = BigInt(task.amount);
        const commission = (amount * BigInt(fee)) / BigInt(1000);
        const totalReward = commission;

        return {
          password: BigInt(task.password),
          amount: amount,
          commission: this.formatEther(commission.toString()),
          totalReward: this.formatEther(totalReward.toString()),
        };
      });
    } catch (error) {
      throw new Error(`Failed to get bounty tasks: ${(error as Error).message}`);
    }
  }

  /**
   * Complete a bounty task (entrusted withdrawal)
   * @param params Complete task parameters
   * @returns Complete task result
   */
  async completeTask(params: CompleteTaskParams): Promise<CompleteTaskResult> {
    if (!this.contract || !this.fheInstance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    if (!this.config.signer) {
      throw new Error('Signer not available. Please provide a signer.');
    }

    // Validate parameters
    if (!params.password) {
      throw new Error('Password is required');
    }

    try {
      // Use password uint256 directly
      const passwordUint256 = params.password;

      // Verify password matches the task password
      if (passwordUint256 !== params.task.password) {
        throw new Error('Password does not match this task');
      }

      // Get signer address
      const signerAddress = await this.config.signer.getAddress();

      // Encrypt password
      const encryptedInput = await this.fheInstance
        .createEncryptedInput(this.config.contractAddress, signerAddress)
        .add256(passwordUint256)
        .encrypt();

      const handles = encryptedInput.handles.map((h: any) => hexlify(h));
      const inputProof = hexlify(encryptedInput.inputProof);

      // Call entrustWithdraw function
      const tx = await this.contract.entrustWithdraw(handles[0], inputProof);

      this.callbacks.onTransactionSubmitted?.(tx.hash);

      const receipt = await tx.wait();

      this.callbacks.onTransactionConfirmed?.(receipt);

      return {
        transactionHash: receipt.hash,
        commission: params.task.commission,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      const err = new Error(`Task completion failed: ${(error as Error).message}`);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Refund a deposit (only depositor can refund)
   * @param params Refund parameters
   * @returns Refund result
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.contract || !this.fheInstance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    if (!this.config.signer) {
      throw new Error('Signer not available. Please provide a signer.');
    }

    // Validate parameters
    if (!params.privateKey) {
      throw new Error('Private key is required');
    }

    try {
      // Convert private key to uint256
      const passwordUint256 = BigInt(params.privateKey);

      // Get vault info to get the balance
      const vaultInfo = await this.getVaultInfo(params.privateKey);

      // Get signer address
      const signerAddress = await this.config.signer.getAddress();

      // Encrypt password
      const encryptedInput = await this.fheInstance
        .createEncryptedInput(this.config.contractAddress, signerAddress)
        .add256(passwordUint256)
        .encrypt();

      const handles = encryptedInput.handles.map((h: any) => hexlify(h));
      const inputProof = hexlify(encryptedInput.inputProof);

      // Call refund function
      const tx = await this.contract.refund(handles[0], inputProof);
      this.callbacks.onTransactionSubmitted?.(tx.hash);

      const receipt = await tx.wait();

      this.callbacks.onTransactionConfirmed?.(receipt);

      return {
        transactionHash: receipt.hash,
        amount: vaultInfo.balanceEth,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      const err = new Error(`Refund failed: ${(error as Error).message}`);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Helper method to format wei to ETH
   * @param wei Amount in wei (string)
   * @returns Amount in ETH (string)
   */
  private formatEther(wei: string): string {
    try {
      return formatEther(wei);
    } catch {
      return '0';
    }
  }

  /**
   * Get the contract address
   * @returns Contract address
   */
  getContractAddress(): string {
    return this.config.contractAddress;
  }

  /**
   * Get the current signer address
   * @returns Signer address or null if not connected
   */
  async getSignerAddress(): Promise<string | null> {
    if (!this.config.signer) {
      return null;
    }
    return await this.config.signer.getAddress();
  }
}
