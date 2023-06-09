//@ts-ignore
import { initializeConnector } from '@web3-react/core'
import { TorusConnector } from '../../torus/dist'

export const [torus, hooks] = initializeConnector<TorusConnector>((actions) => new TorusConnector({ actions }))
