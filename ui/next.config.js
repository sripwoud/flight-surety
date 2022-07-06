/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATA_ADDRESS: process.env.DATA_ADDRESS,
    APP_ADDRESS: process.env.APP_ADDRESS
  }
}

module.exports = nextConfig
