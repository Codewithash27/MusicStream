import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { getApiErrorMessage, useLoginMutation } from "../features/auth/hooks";

const schema = z.object({
  identifier: z.string().min(3, "Enter email or username"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/home";
  const login = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate(from, { replace: true });
    } catch {
      // surfaced via login.error
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(29,185,84,0.2), transparent 40%), #121212",
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-ms-border bg-ms-surface p-8 shadow-2xl shadow-black/40">
        <h1 className="font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-ms-muted">Log in to continue listening.</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email or username"
            placeholder="you@email.com"
            error={errors.identifier?.message}
            {...register("identifier")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          {login.isError ? (
            <p className="text-sm text-ms-danger">
              {getApiErrorMessage(login.error, "Invalid credentials")}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ms-muted">
          New here?{" "}
          <Link to="/register" className="font-semibold text-ms-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
