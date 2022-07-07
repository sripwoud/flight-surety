const { ethers } = require('ethers')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const config = require('../config.json')
const appArtifact = require(`../contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json`)
const oraclesArtifact = require(`../contracts/out/FlightSuretyOracles.sol/FlightSuretyOracles.json`)

const { mnemonic, network, rpcUrl, name, num } = yargs(
  hideBin(process.argv)
).argv

const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
const signers = [...Array(num).keys()].map((index) =>
  ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`).connect(
    provider
  )
)

const app = new ethers.Contract(config[network].appAddress, appArtifact.abi)
const oracles = new ethers.Contract(
  config[network].oracleAddress,
  oraclesArtifact.abi
)

const registerOracles = async () => {
  await Promise.all(
    signers.map(async (oracle) => {
      try {
        await oracles.connect(oracle).registerOracle()
        console.log('registered oracle', oracle.address)
      } catch (e) {
        console.log(e)
      }
    })
  )
}

const registerFlight = async () => {
  // TODO
  console.log('not implemented')
}

const main = async () => {
  if (name === 'oracle') {
    await registerOracles()
  }

  if (name === 'flight') {
    await registerFlight()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
