"use server";

import { redirect } from "next/navigation";

import { loginUser } from "@/lib/login-user";
import { loginSchema, parseSchema } from "@/lib/validations";

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = parseSchema(loginSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.ok) {
    return { error: parsed.message };
  }

  const result = await loginUser(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    return { error: result.message };
  }

  redirect("/dashboard");
}
