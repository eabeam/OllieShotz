declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    scope?: string
    sw?: string
    runtimeCaching?: unknown[]
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
