import type {
  Actions,
  AddEthereumChainParameter,
  Provider,
  ProviderConnectInfo,
  ProviderRpcError,
} from '@web3-react/types'
import { Connector } from '@web3-react/types'
import Web3ProviderEngine from 'web3-provider-engine'
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
import { RPCSubprovider } from '@0x/subproviders/lib/src/subproviders/rpc_subprovider' // https://github.com/0xProject/0x-monorepo/issues/1400

function parseChainId(chainId: string) {
  return Number.parseInt(chainId, 16)
}

/**
 * @param options - Options to pass to `@metamask/detect-provider`
 * @param onError - Handler to report errors thrown from eventListeners.
 */
export interface LedgerConnectorArguments {
  actions: Actions
  onError?: (error: Error) => void
  chainId: number
  url: string
  pollingInterval?: number
  requestTimeoutMs?: number
  accountFetchingConfigs?: any
  baseDerivationPath?: string
}

export class LedgerConnector extends Connector {
  /** {@inheritdoc Connector.provider} */
  public provider?: any
  private eagerConnection?: Promise<void>
  private readonly chainId: number
  private readonly url: string
  private readonly pollingInterval?: number
  private readonly requestTimeoutMs?: number
  private readonly accountFetchingConfigs?: any
  private readonly baseDerivationPath?: string

  constructor({
    actions,
    onError,
    chainId,
    url,
    pollingInterval,
    requestTimeoutMs,
    accountFetchingConfigs,
    baseDerivationPath,
  }: LedgerConnectorArguments) {
    super(actions, onError)
    this.chainId = chainId
    this.url = url
    this.pollingInterval = pollingInterval
    this.requestTimeoutMs = requestTimeoutMs
    this.accountFetchingConfigs = accountFetchingConfigs
    this.baseDerivationPath = baseDerivationPath
  }

  private async isomorphicInitialize(): Promise<void> {
    const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
    engine.addProvider(
      new LedgerSubprovider({
        networkId: this.chainId,
        ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        accountFetchingConfigs: this.accountFetchingConfigs,
        baseDerivationPath: this.baseDerivationPath,
      })
    )
    engine.addProvider(new CacheSubprovider())
    engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))

    this.provider = engine

    this.provider.start()
  }

  /** {@inheritdoc Connector.connectEagerly} */
  public async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    await this.isomorphicInitialize()
    if (!this.provider) return cancelActivation()

    return Promise.all([
      this.provider.request({ method: 'eth_chainId' }) as Promise<string>,
      this.provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
    ])
      .then(([chainId, accounts]) => {
        console.log(chainId)
        if (accounts.length) {
          this.actions.update({ chainId: parseChainId(chainId), accounts })
        } else {
          throw new Error('No accounts returned')
        }
      })
      .catch((error) => {
        console.debug('Could not connect eagerly', error)
        // we should be able to use `cancelActivation` here, but on mobile, metamask emits a 'connect'
        // event, meaning that chainId is updated, and cancelActivation doesn't work because an intermediary
        // update has occurred, so we reset state instead
        this.actions.resetState()
      })
  }

  /**
   * Initiates a connection.
   *
   * @param desiredChainIdOrChainParameters - If defined, indicates the desired chain to connect to. If the user is
   * already connected to this chain, no additional steps will be taken. Otherwise, the user will be prompted to switch
   * to the chain, if one of two conditions is met: either they already have it added in their extension, or the
   * argument is of type AddEthereumChainParameter, in which case the user will be prompted to add the chain with the
   * specified parameters first, before being prompted to switch.
   */
  public async activate(desiredChainIdOrChainParameters?: number | AddEthereumChainParameter): Promise<void> {
    this.actions.startActivation()
    return this.isomorphicInitialize()
  }

  public async deactivate(error?: Error): Promise<void> {
    this.provider.stop()
  }
}
