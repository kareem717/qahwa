import {
  createFileRoute,
  Navigate,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { SignOutButton } from "./-components/sign-out-button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qahwa/ui/components/card";
import { Button } from "@qahwa/ui/components/button";
import { getSessionFunction } from "../../functions/auth";

export const Route = createFileRoute("/_auth/sign-out")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { data } = await getSessionFunction();

    if (!data) {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: import.meta.env.VITE_APP_URL + location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Are you sure you want to sign out?</CardTitle>
        <CardDescription>
          You will be logged out of your account.
        </CardDescription>
      </CardHeader>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button onClick={() => router.history.back()}>Cancel</Button>
        <SignOutButton
          onSuccess={() => {
            navigate({
              to: "/",
            });
          }}
          variant="secondary"
        >
          Sign out
        </SignOutButton>
      </CardFooter>
    </Card>
  );
}
