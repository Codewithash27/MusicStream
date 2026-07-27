import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "../components/common/button";
import { Input } from "../components/common/input";
import { getApiErrorMessage, useRegisterMutation } from "../features/auth/hooks";

const schema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .refine((v) => /[A-Z]/.test(v), "Need an uppercase letter")
    .refine((v) => /\d/.test(v), "Need a digit"),
  role: z.enum(["USER", "ARTIST"]),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: "",
      username: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values);
      navigate("/home", { replace: true });
    } catch {
      // surfaced below
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 10%, rgba(29,185,84,0.22), transparent 45%), #121212",
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-ms-border bg-ms-surface p-8 shadow-2xl shadow-black/40">
        <h1 className="font-display text-3xl font-bold">Join MusicStream</h1>
        <p className="mt-2 text-sm text-ms-muted">Create your account in under a minute.</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Display name"
            placeholder="Alex Rivera"
            error={errors.display_name?.message}
            {...register("display_name")}
          />
          <Input
            label="Username"
            placeholder="alex_r"
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="flex gap-3">
                {(["USER", "ARTIST"] as const).map((role) => (
                  <label
                    key={role}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm ${
                      field.value === role
                        ? "border-ms-primary bg-ms-elevated"
                        : "border-ms-border bg-ms-elevated"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mr-2 accent-ms-primary"
                      checked={field.value === role}
                      onChange={() => field.onChange(role)}
                    />
                    {role === "USER" ? "Listener" : "Artist"}
                  </label>
                ))}
              </div>
            )}
          />

          {registerMutation.isError ? (
            <p className="text-sm text-ms-danger">
              {getApiErrorMessage(registerMutation.error, "Could not create account")}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ms-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-ms-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
