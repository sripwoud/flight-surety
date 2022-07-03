import '../styles/globals.css'
import 'semantic-ui-css/semantic.min.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'

import Layout from '../components/Layout'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Flight Surety</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}

export default MyApp
