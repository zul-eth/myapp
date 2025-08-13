import 'server-only';

type Env = {
  MNEMONIC: string;

  RPC_BASE_SEPOLIA?: string;
  BASE_SEPOLIA_PRIVATE_KEY?: string;

  RPC_ETH_SEPOLIA?: string;
  ETH_SEPOLIA_PRIVATE_KEY?: string;

  RPC_ARB_SEPOLIA?: string;
  ARB_SEPOLIA_PRIVATE_KEY?: string;
};

function assertEnv() {
  const env: Env = {
    MNEMONIC: process.env.MNEMONIC ?? '',

    RPC_BASE_SEPOLIA: process.env.RPC_BASE_SEPOLIA,
    BASE_SEPOLIA_PRIVATE_KEY: process.env.BASE_SEPOLIA_PRIVATE_KEY,

    RPC_ETH_SEPOLIA: process.env.RPC_ETH_SEPOLIA,
    ETH_SEPOLIA_PRIVATE_KEY: process.env.ETH_SEPOLIA_PRIVATE_KEY,

    RPC_ARB_SEPOLIA: process.env.RPC_ARB_SEPOLIA,
    ARB_SEPOLIA_PRIVATE_KEY: process.env.ARB_SEPOLIA_PRIVATE_KEY,
  };

  const issues: string[] = [];
  if (!env.MNEMONIC || env.MNEMONIC.trim().split(/\s+/).length < 12) {
    issues.push('MNEMONIC tidak valid (kurang dari 12 kata?)');
  }

  if (issues.length) {
    throw new Error(`ENV tidak lengkap/valid: ${issues.join(', ')}`);
  }
  return env;
}

export const ENV = assertEnv();