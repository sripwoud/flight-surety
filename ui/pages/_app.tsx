import '../styles/globals.css'
import 'semantic-ui-css/semantic.min.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { DAppProvider, Config } from '@usedapp/core'

import Layout from '../components/Layout'

const config: Config = {
  readOnlyChainId: 3,
  readOnlyUrls: { 3: process.env.RPC_URL! }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Flight Surety</title>
      </Head>
      <DAppProvider config={config}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </DAppProvider>
    </>
  )
}

export default MyApp
