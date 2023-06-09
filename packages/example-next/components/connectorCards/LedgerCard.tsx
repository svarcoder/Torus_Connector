import { useEffect, useState } from 'react'
import { ledger, hooks } from '../../connectors/ledger'

import { Card } from '../Card'

const { useChainId, useAccounts, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

export default function LedgerCard() {
  const chainId = useChainId()
  const accounts = useAccounts()
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  const provider = useProvider()
  const ENSNames = useENSNames(provider)

  const [error, setError] = useState(undefined)

  // attempt to connect eagerly on mount
  // useEffect(() => {
  //   void ledger.connectEagerly().catch(() => {
  //     console.debug('Failed to connect eagerly to torus')
  //   })
  // }, [])

  console.log(ledger)

  return (
    <Card
      connector={ledger}
      chainId={chainId}
      isActivating={isActivating}
      isActive={isActive}
      error={error}
      setError={setError}
      accounts={accounts}
      provider={provider}
      ENSNames={ENSNames}
    />
  )
}
