import { createFileRoute } from '@tanstack/react-router'
import { LoginButton } from '../components/auth/login-button'

export const Route = createFileRoute('/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <LoginButton provider="google" redirect="desktop" />
    </div>
  )
}
