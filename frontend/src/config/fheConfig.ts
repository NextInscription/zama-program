// Zama FHE Configuration for Sepolia Testnet
export const SEPOLIA_FHE_CONFIG = {
  // ACL_CONTRACT_ADDRESS (FHEVM Host chain)
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  // DECRYPTION_ADDRESS (Gateway chain)
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  // INPUT_VERIFICATION_ADDRESS (Gateway chain)
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  // FHEVM Host chain id
  chainId: 11155111,
  // Gateway chain id
  gatewayChainId: 55815,
  // Optional RPC provider to host chain
  network: 'https://1rpc.io/sepolia',
  // Relayer URL - trying gateway URL instead of relayer.testnet
  networkUrl: "https://sepolia.public.blastapi.io",
  relayerUrl: "https://relayer.testnet.zama.cloud",
  gatewayUrl: "https://gateway.sepolia.zama.ai/",
}
