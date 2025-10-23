/**
 * Bounty Task Example for Zama Private Transfer SDK
 *
 * This example demonstrates how to:
 * - Create bounty tasks (Type 3 deposits)
 * - List available bounty tasks
 * - Complete bounty tasks and earn commissions
 */

import { PrivateTransferSDK, TransferType } from '../src';

async function bountyExample() {
  // Initialize SDK
  const sdk = new PrivateTransferSDK({
    contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
  });

  await sdk.initialize(/* your wallet provider */);

  // --- Part 1: Creating a Bounty Task ---
  console.log('=== Creating a Bounty Task ===\n');

  // When you create a Type 3 deposit, it becomes a bounty task
  const depositResult = await sdk.deposit({
    transferType: TransferType.ENTRUSTED_WITHDRAWAL,
    amount: '0.1', // 0.1 ETH
    recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Final recipient
  });

  console.log('Bounty task created!');
  console.log('Transaction:', depositResult.transactionHash);
  console.log('Password:', depositResult.passwordWallet.privateKey);
  console.log('\n💡 Share this password with a trustee to complete the withdrawal\n');

  // Save the password to share with trustee
  const taskPassword = depositResult.passwordWallet.privateKey;

  // --- Part 2: Viewing Bounty Tasks ---
  console.log('=== Available Bounty Tasks ===\n');

  // Get current commission fee rate
  const feeRate = await sdk.getFeeRate();
  console.log(`Commission rate: ${feeRate / 10}%\n`);

  // Get all available bounty tasks
  const tasks = await sdk.getBountyTasks();

  console.log(`Found ${tasks.length} bounty tasks:\n`);

  tasks.forEach((task, index) => {
    console.log(`Task #${index + 1}:`);
    console.log(`  Amount: ${task.totalReward} ETH`);
    console.log(`  Commission: ${task.commission} ETH (${feeRate / 10}%)`);
    console.log(`  Password hash: ${task.password.toString().slice(0, 20)}...`);
    console.log('');
  });

  // --- Part 3: Completing a Bounty Task (as a trustee) ---
  console.log('=== Completing a Bounty Task ===\n');

  // Get the first available task
  const taskToComplete = tasks[0];

  if (taskToComplete) {
    console.log('Attempting to complete task...');
    console.log(`Potential commission: ${taskToComplete.commission} ETH\n`);

    try {
      // Complete the task using the password
      const result = await sdk.completeTask({
        task: taskToComplete,
        password: taskPassword, // Password from task creator
      });

      console.log('✅ Task completed successfully!');
      console.log('Transaction:', result.transactionHash);
      console.log(`Commission earned: ${result.commission} ETH`);
      console.log('Block:', result.blockNumber);
    } catch (error) {
      console.error('❌ Failed to complete task:', (error as Error).message);
      console.log('This might happen if:');
      console.log('  - Password is incorrect');
      console.log('  - Task was already completed');
      console.log('  - You are not authorized');
    }
  } else {
    console.log('No bounty tasks available at the moment');
  }
}

// Advanced: Monitoring bounty tasks
async function monitorBountyTasks(sdk: PrivateTransferSDK) {
  console.log('=== Monitoring Bounty Tasks ===\n');

  // Poll for new tasks every 30 seconds
  const checkInterval = 30000; // 30 seconds

  setInterval(async () => {
    console.log(`[${new Date().toISOString()}] Checking for new tasks...`);

    const tasks = await sdk.getBountyTasks();
    const feeRate = await sdk.getFeeRate();

    if (tasks.length > 0) {
      console.log(`Found ${tasks.length} available task(s):`);

      // Find the most profitable task
      const mostProfitable = tasks.reduce((prev, current) =>
        parseFloat(current.commission) > parseFloat(prev.commission) ? current : prev
      );

      console.log(`Most profitable task:`);
      console.log(`  Commission: ${mostProfitable.commission} ETH`);
      console.log(`  Total amount: ${mostProfitable.totalReward} ETH`);
      console.log(`  Fee rate: ${feeRate / 10}%`);
    } else {
      console.log('No tasks available');
    }

    console.log('');
  }, checkInterval);
}

// Example: Task filtering
async function filterTasks(sdk: PrivateTransferSDK) {
  const tasks = await sdk.getBountyTasks();

  // Filter tasks by minimum commission
  const minCommission = 0.01; // 0.01 ETH
  const highValueTasks = tasks.filter((task) => parseFloat(task.commission) >= minCommission);

  console.log(`Tasks with commission >= ${minCommission} ETH:`);
  highValueTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.commission} ETH`);
  });

  // Sort tasks by commission (highest first)
  const sortedTasks = [...tasks].sort(
    (a, b) => parseFloat(b.commission) - parseFloat(a.commission)
  );

  console.log('\nTasks sorted by commission:');
  sortedTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.commission} ETH`);
  });
}

// Example: Batch processing multiple tasks
async function batchCompleteTasks(
  sdk: PrivateTransferSDK,
  tasksWithPasswords: Array<{ task: any; password: string }>
) {
  console.log('=== Batch Completing Tasks ===\n');

  const results = [];

  for (const { task, password } of tasksWithPasswords) {
    try {
      console.log(`Processing task with commission ${task.commission} ETH...`);

      const result = await sdk.completeTask({ task, password });

      console.log(`✅ Success! Earned ${result.commission} ETH`);
      results.push({ success: true, result });
    } catch (error) {
      console.error(`❌ Failed:`, (error as Error).message);
      results.push({ success: false, error });
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n=== Batch Summary ===');
  console.log(`Total tasks: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (successful > 0) {
    const totalEarned = results
      .filter((r) => r.success)
      .reduce((sum, r: any) => sum + parseFloat(r.result.commission), 0);

    console.log(`Total earned: ${totalEarned.toFixed(4)} ETH`);
  }
}

// Run the example (comment out if using as a module)
// bountyExample().catch(console.error);
