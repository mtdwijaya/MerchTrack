"use server";

import { redirect } from "next/navigation";

import { loginUser } from "@/lib/login-user";
import {
  consumeRateLimit,
  loginRateLimitKey,
  resetRateLimit,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
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

  const ip = await getClientIp();
  const rate = consumeRateLimit(loginRateLimitKey(ip));

  if (!rate.ok) {
    return {
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${rate.retryAfterSeconds} detik.`,
    };
  }

  const result = await loginUser(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    return { error: result.message };
  }

  resetRateLimit(loginRateLimitKey(ip));
  redirect("/dashboard");
}
