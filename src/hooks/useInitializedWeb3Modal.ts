import { useEffect, useState } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export function useInitializedWeb3Modal() {
  const [isReady, setIsReady] = useState(false)
  const web3Modal = useWeb3Modal()

  useEffect(() => {
    // Set ready state after first render
    setIsReady(true)
  }, [])

  return { ...web3Modal, isReady }
}
