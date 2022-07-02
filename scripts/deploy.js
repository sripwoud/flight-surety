const { exec } = require('child_process')
const { ethers } = require('ethers')

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

const deploy = async (contractName, params) => {
  const fieldName = `${contractName.toLowerCase()}Address`
  const address = config[fieldName]
  if (address) {
    const bytecode = await provider.send('eth_getCode', [address, 'latest'])
    const exists = bytecode === '0x'
    if (!exists) {
      console.log(`${contractName} Contract already deployed at ${address}`)
      return
    }
  }

  const artifact = require(`../contracts/out/FlightSurety${contractName}.sol/FlightSurety${contractName}.json`)
  const Contract = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  )

  const contract = await Contract.deploy(...params)

  await contract.deployed()
  console.log(`${contractName} Contract deployed at ${contract.address}`)
  updateInConfigFile(fieldName, contract.address)

  return contract
}

async function main() {
  const data = await deploy('Data', [signer.address])
  await deploy('App', [data.address])
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
