/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATA_ADDRESS: process.env.DATA_ADDRESS,
    APP_ADDRESS: process.env.APP_ADDRESS,
    ORACLES_ADDRESS: process.env.ORACLES_ADDRESS,
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID
  }
}

module.exports = nextConfig
