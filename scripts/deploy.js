const { ethers } = require('ethers')
const lineReplace = require('line-replace')
const path = require('path')

const config = require('../config.json')

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC_DEV).connect(
  provider
)

const deploy = async (contractName, params) => {
  const fieldName = `${contractName.toLowerCase()}Address`
  const artifact = require(`../contracts/out/FlightSurety${contractName}.sol/FlightSurety${contractName}.json`)
  const address = config[fieldName]

  if (address) {
    const bytecode = await provider.send('eth_getCode', [address, 'latest'])
    const exists = bytecode !== '0x'
    if (exists) {
      console.log(`${contractName} Contract already deployed at ${address}`)
      return new ethers.Contract(address, artifact.abi, signer)
    }
  }

  const Contract = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  )

  const contract = await Contract.deploy(...params)

  await contract.deployed()
  console.log(`${contractName} Contract deployed at ${contract.address}`)

  return contract
}

async function main() {
  const data = await deploy('Data', [signer.address])
  const app = await deploy('App', [data.address])

  const file = path.join(__dirname, '..', '.env')
  lineReplace({
    file,
    line: 3,
    text: `DATA_ADDRESS='${data.address}'`,
    addNewLine: true,
    callback: () => {
      lineReplace({
        file,
        line: 4,
        text: `APP_ADDRESS='${app.address}'`,
        addNewLine: true,
        callback: () => {}
      })
    }
  })

  const tx = await data.authorizeCaller(app.address)
  await tx.wait()
  console.log('Authorized App Contract')

  await app.fund({ value: ethers.utils.parseEther('10') })
  console.log(`Airline 0 ${signer.address} has funded`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
