import React from "react";
import { SignInForm } from "../components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-accent">
      <SignInForm />
    </div>
  );
}
