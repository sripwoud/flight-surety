const { exec } = require('child_process')
const { ethers } = require('ethers')

const dataArtifact = require('../contracts/out/FlightSuretyData.sol/FlightSuretyData.json')
const appArtifact = require('../contracts/out/FlightSuretyApp.sol/FlightSuretyApp.json')
const config = require('../config.json')

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const signer = ethers.Wallet.fromMnemonic(process.env.mnemonic).connect(
  provider
)

const DASEL_CMD = 'dasel put string -f config.json -r json'
const cb = (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
}

const updateInConfigFile = (fieldName, value) => {
  exec(`${DASEL_CMD} '.${fieldName}' ${value}`, cb)
}

const deploy = async (contractName) => {
  const address = config[`${contractName.toLowerCase()}Address`]
  if (address) {
    const bytecode = await provider.send('eth_getCode', [address])
    console.log({ bytecode })
    const exists = bytecode === '0x'
    if (exists) {
      console.log(`${contractName} Contract already deployed at ${address}`)
      return
    }

    const artifact = require(`../contracts/out/FlightSuretyApp.sol/FlightSurety${contractName}.json`)
  }

  const Data = new ethers.ContractFactory(
    dataArtifact.abi,
    dataArtifact.bytecode,
    signer
  )
  const data = await Data.deploy(signer.address)
  await data.deployed()
  console.log(`Data Contract deployed at ${data.address}`)
  updateInConfigFile('dataAddress', data.address)
}

async function main() {
  const Data = new ethers.ContractFactory(
    dataArtifact.abi,
    dataArtifact.bytecode,
    signer
  )
  const data = await Data.deploy(signer.address)
  await data.deployed()
  console.log(`Data Contract deployed at ${data.address}`)
  updateInConfigFile('dataAddress', data.address)

  const App = new ethers.ContractFactory(
    appArtifact.abi,
    appArtifact.bytecode,
    signer
  )
  const app = await App.deploy(data.address)
  await app.deployed()
  console.log(`App Contract deployed at ${app.address}`)
  updateInConfigFile('appAddress', app.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
