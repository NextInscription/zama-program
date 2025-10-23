/**
 * Basic Usage Example for Zama Private Transfer SDK
 *
 * This example demonstrates how to use the SDK for basic operations:
 * - Initialize SDK
 * - Make deposits
 * - Check vault info
 * - Withdraw funds
 */

import { PrivateTransferSDK, TransferType } from '../src';

// Example: Initialize and use the SDK
async function main() {
  // Step 1: Create SDK instance
  console.log('Creating SDK instance...');
  const sdk = new PrivateTransferSDK({
    contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
    rpcUrl: 'https://1rpc.io/sepolia',
  });

  // Step 2: Set up event callbacks (optional but recommended)
  sdk.setCallbacks({
    onTransactionSubmitted: (txHash) => {
      console.log('✅ Transaction submitted:', txHash);
    },
    onTransactionConfirmed: (receipt) => {
      console.log('✅ Transaction confirmed at block:', receipt.blockNumber);
    },
    onError: (error) => {
      console.error('❌ Error:', error.message);
    },
  });

  // Step 3: Initialize SDK with wallet provider
  // In browser: await sdk.initialize(window.ethereum)
  // In Node.js/testing: provide a signer or provider
  console.log('Initializing SDK...');
  await sdk.initialize(/* your wallet provider here */);

  console.log('SDK initialized successfully!');
  console.log('Contract address:', sdk.getContractAddress());
  console.log('Signer address:', await sdk.getSignerAddress());

  // Step 4: Make a deposit (Type 2 - Anyone with password)
  console.log('\n--- Making Deposit ---');
  const depositResult = await sdk.deposit({
    transferType: TransferType.ANYONE_WITH_PASSWORD,
    amount: '0.01', // 0.01 ETH
  });

  console.log('Deposit successful!');
  console.log('Transaction hash:', depositResult.transactionHash);
  console.log('Password private key:', depositResult.passwordWallet.privateKey);
  console.log('Password address:', depositResult.passwordWallet.address);
  console.log('\n⚠️  IMPORTANT: Save the password private key above!');

  // Save the password for later use
  const savedPassword = 'your-password-here'; // In practice, this would be user input

  // Step 5: Check vault information
  console.log('\n--- Checking Vault Info ---');
  const vaultInfo = await sdk.getVaultInfo(savedPassword);

  console.log('Vault found!');
  console.log('Transfer type:', vaultInfo.transferType);
  console.log('Balance:', vaultInfo.balanceEth, 'ETH');
  console.log('Depositor:', vaultInfo.depositor);
  console.log('Recipient:', vaultInfo.allowAddress);

  // Step 6: Withdraw funds
  console.log('\n--- Withdrawing Funds ---');
  const withdrawResult = await sdk.withdraw({
    password: savedPassword,
    amount: '0.005', // Withdraw 0.005 ETH
  });

  console.log('Withdrawal successful!');
  console.log('Transaction hash:', withdrawResult.transactionHash);
  console.log('Amount withdrawn:', withdrawResult.amount, 'ETH');
}

// Example: Different deposit types
async function depositExamples(sdk: PrivateTransferSDK) {
  // Type 1: Specified Recipient
  console.log('\n--- Type 1: Specified Recipient ---');
  const type1Result = await sdk.deposit({
    transferType: TransferType.SPECIFIED_RECIPIENT,
    amount: '0.1',
    recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  });
  console.log('Password key:', type1Result.passwordWallet.privateKey);

  // Type 2: Anyone with Password
  console.log('\n--- Type 2: Anyone with Password ---');
  const type2Result = await sdk.deposit({
    transferType: TransferType.ANYONE_WITH_PASSWORD,
    amount: '0.05',
  });
  console.log('Password key:', type2Result.passwordWallet.privateKey);

  // Type 3: Entrusted Withdrawal (creates bounty)
  console.log('\n--- Type 3: Entrusted Withdrawal ---');
  const type3Result = await sdk.deposit({
    transferType: TransferType.ENTRUSTED_WITHDRAWAL,
    amount: '0.2',
    recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  });
  console.log('Password key:', type3Result.passwordWallet.privateKey);
  console.log('This creates a bounty task for trustees to complete!');
}

// Example: Error handling
async function errorHandlingExample(sdk: PrivateTransferSDK) {
  try {
    // Attempt to withdraw with invalid password
    await sdk.withdraw({
      password: 'invalid-password',
      amount: '0.01',
    });
  } catch (error) {
    console.error('Error caught:', (error as Error).message);
    // Handle the error appropriately
  }

  try {
    // Attempt to deposit with invalid amount
    await sdk.deposit({
      transferType: TransferType.ANYONE_WITH_PASSWORD,
      amount: '-0.01', // Negative amount
    });
  } catch (error) {
    console.error('Error caught:', (error as Error).message);
  }
}

// Run the example (comment out if using as a module)
// main().catch(console.error);
