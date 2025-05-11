import { buttonVariants } from '@note/ui/components/button'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { Loader2 } from 'lucide-react'

const DESKTOP_API_KEY_NAME = "desktop"

export const Route = createFileRoute('/app-redirect')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setErrorState] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)

  useEffect(() => {
    const setError = (error: string) => {
      setIsLoading(false)
      setErrorState(error)
    }

    // In client code to avoid header problems
    const getApiKey = async () => {
      const { data: apiKeys, error } = await authClient.apiKey.list();
      if (error) {
        console.error(error)

        return setError("Failed to get API keys")
      }

      if (apiKeys?.length) {
        const desktopApiKey = apiKeys.find(key => key.name === DESKTOP_API_KEY_NAME)

        if (desktopApiKey) {
          const { data, error } = await authClient.apiKey.delete({
            keyId: desktopApiKey.id,
            // fetchOptions
          })

          if (error || !data.success) {
            console.error(error)

            return setError("Failed to delete old API key")
          }
        }
      }

      const { data: apiKey, error: createError } = await authClient.apiKey.create({
        name: DESKTOP_API_KEY_NAME,
        // fetchOptions
      })

      if (createError) {
        console.error(createError)

        return setError("Failed to create API key")
      }

      setKey(apiKey.key)
      setIsLoading(false)
    }


    // window.location.href = `${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?key=${key}`

    getApiKey()
  }, [])

  useEffect(() => {
    if (key && !error && !isLoading) {
      window.location.href = `${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?key=${key}`
    }
  }, [key, error, isLoading])

  return (
    <div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <div>
            {error}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen">
          <div>
            Redirecting to app, press button if you don't get redirected automatically
          </div>
          <a
            href={`${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?key=${key}`}
            className={buttonVariants()}
          >
            Redirect
          </a>
        </div >
      )}
    </div >
  )
}
