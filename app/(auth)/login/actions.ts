"use server";

import { redirect } from "next/navigation";

import { loginUser } from "@/lib/login-user";

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await loginUser(email, password);

  if (!result.ok) {
    return { error: result.message };
  }

  redirect("/dashboard");
}
