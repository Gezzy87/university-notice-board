import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
    sendOnSignUp: true,
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
