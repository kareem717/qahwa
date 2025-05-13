import { Button, buttonVariants } from '@note/ui/components/button'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getSessionFunction } from '@note/landing/functions/auth'
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { createClient } from '@note/sdk'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@note/ui/components/card'
import { cn } from '@note/ui/lib/utils'
import { Loader2 } from 'lucide-react'

export const getAPIKey = createServerFn({ method: 'GET' }).handler(async () => {
  const api = createClient(import.meta.env.VITE_API_URL)

  try {
    const req = await api.auth.key.$get(
      {}, {
      fetch(input, requestInit) {
        console.log("FETCH STUFF BELOW")
        return fetch(input, {
          ...requestInit,
          headers: getWebRequest()?.headers
        })
      },
    })

    if (req.status !== 200) {
      console.error("Failed to get API key", req.status, req.statusText)
      return {
        error: "Something went wrong while fetching API key",
        data: null
      }
    }

    // might want a try catch here
    const data = await req.json()

    return {
      data: data,
      error: null
    }
  } catch (error) {
    console.error("Failed to fetch API key", error)
    return {
      error: "Failed to fetch API key",
      data: null
    }
  }
})

export const Route = createFileRoute('/_auth/app-redirect')({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data, error } = await getSessionFunction()
    console.log(data, error)
    if (!data) {
      throw redirect({ to: '/sign-in' })
    }
  },
  loader: async () => await getAPIKey()
})

function RouteComponent() {
  const { data, error } = Route.useLoaderData()
  const [isRedirecting, setIsRedirecting] = useState(false)

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            Uh oh!
          </CardTitle>
          <CardDescription>
            Something went wrong while fetching the API key. Press the button below to try again.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className={cn(buttonVariants(), "w-full")}
            onClick={() => {
              setIsRedirecting(true)
              window.location.href = window.location.href
            }}
            disabled={isRedirecting}
          >
            {isRedirecting && <Loader2 className="size-4 mr-1 animate-spin" />}
            Retry
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const { key } = data

  useEffect(() => {
    window.location.href = `${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?key=${key}`
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          Redirecting...
        </CardTitle>
        <CardDescription>
          Press button if you don't get redirected to the desktop app automatically.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <a
          href={`${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?key=${key}`}
          className={cn(buttonVariants(), "w-full")}
        >
          Redirect
        </a>
      </CardFooter>
    </Card>
  )
}
