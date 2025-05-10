import { buttonVariants } from '@note/ui/components/button'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { useEffect } from 'react'

export const getJWT = createServerFn().handler(async () => {
  const req = getWebRequest()

  const token = await fetch(import.meta.env.VITE_API_URL + "/auth/token", {
    headers: req?.headers
  })

  const data = await token.json()

  return data.token ?? ""
})

export const Route = createFileRoute('/auth/app')({
  component: RouteComponent,
  loader: async () => await getJWT()
})

function RouteComponent() {
  const jwt = Route.useLoaderData()

  useEffect(() => {
    window.location.href = `${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?jwt=${jwt}`
  }, [])

  return (
    <div>
      Redirecting to app, press button if you don't get redirected automatically
      <a
        href={`${import.meta.env.VITE_DESKTOP_PROTOCOL}://auth?jwt=${jwt}`}
        className={buttonVariants()}
      >
        Redirect
      </a>
    </div>
  )
}
