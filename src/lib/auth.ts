import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { isAllowedEmail } from "@/lib/email-domain";

const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Rate-limit auth endpoints to blunt brute-force / credential-stuffing.
  // Stricter limits on the sensitive credential routes. In-memory store here;
  // for multi-instance serverless, switch storage to "database".
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/forget-password": { window: 300, max: 3 },
    },
  },

  // Enforce the university email-domain restriction server-side (the register
  // form's check is only a UX hint and can be bypassed by calling the API).
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = ctx.body?.email as string | undefined;
        if (!email || !isAllowedEmail(email)) {
          throw new APIError("BAD_REQUEST", {
            message: "Please register with your university email address.",
          });
        }
      }
    }),
  },

  emailAndPassword: {
    enabled: true,
    // Verification is disabled during development so new accounts can log in
    // immediately. Flip this to true (and set sendOnSignUp) once Gmail is wired.
    requireEmailVerification: false,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Hi ${user.name},</p>
               <p>Click the link below to reset your password:</p>
               <p><a href="${url}">Reset password</a></p>
               <p>If you didn't request this, you can ignore this email.</p>`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Hi ${user.name},</p>
               <p>Welcome to the University Notice Board. Please verify your email:</p>
               <p><a href="${url}">Verify email</a></p>`,
      });
    },
  },

  // Cache the session in a signed cookie so most page loads skip the database
  // session lookup (falls back to the DB after maxAge / on cache miss).
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Custom fields stored on the user table. `role` cannot be set by the client
  // at sign-up (input: false) — everyone registers as STUDENT and is promoted
  // to ADMIN out-of-band.
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
      department: {
        type: "string",
        required: false,
      },
    },
  },

  // nextCookies() must be the last plugin so it can set cookies on responses.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
