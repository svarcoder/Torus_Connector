import { initializeConnector } from '@web3-react/core'
import { LedgerConnector } from '../../ledger/dist'

let chainId = 1
let url: any = 'https://mainnet.infura.io/v3/dda7cbb4c0834433a2f82b00d74824ac'
let pollingInterval: any = 12000

export const [ledger, hooks] = initializeConnector<LedgerConnector>(
  (actions) => new LedgerConnector({ actions, chainId, url, pollingInterval })
)
