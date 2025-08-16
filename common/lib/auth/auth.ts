import { CONSTANTS } from "../constants";
import { database as databaseName, dbClient, update } from "../database";
import { html, text, validEmail } from "../email";

import Mailgun from "@auth/sveltekit/providers/mailgun";

import { AUTH_SECRET, DOMAIN, MAILGUN_KEY } from "$env/static/private";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { SvelteKitAuth, type SvelteKitAuthConfig, type User } from "@auth/sveltekit";
import type { Adapter } from "@auth/core/adapters";
import type { EmailUserConfig } from "@auth/core/providers/email";

export const adapter: Adapter = MongoDBAdapter(dbClient, {
  databaseName,
});

export const auth = {
  trustHost: true,
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    generateSessionToken: () => crypto.randomUUID(),
    strategy: "database",
  },
  adapter,
  pages: {
    signIn: "/login",
    signOut: "/logout",
    verifyRequest: "/verify",
  },
  secret: AUTH_SECRET,

  providers: [
    Mailgun({
      name: "Sign in to Zoron",
      apiKey: MAILGUN_KEY,
      from: "system@mail.haelp.dev",

      async sendVerificationRequest({ identifier: to, provider, url: initialURL }) {
        try {
          await update("users", { email: to }, { $unset: { password: "" } });
        } catch {}
        const domain = provider.from!.split("@").at(1);

        if (!domain) throw new Error("malformed Mailgun domain");
        const url = `${initialURL.slice(
          0,
          initialURL
            .replace(`http${initialURL.includes("https://") ? "s" : ""}://`, "")
            .indexOf("/") + `http${initialURL.includes("https://") ? "s" : ""}://`.length
        )}/api/verify/fwd?user=${encodeURIComponent(to)}&target=${encodeURIComponent(
          btoa(encodeURIComponent(initialURL))
        )}`;
        const form = new FormData();
        form.append("from", `${CONSTANTS.name} system <${provider.from}>`);
        form.append("to", to);
        form.append("subject", `Sign in to ${CONSTANTS.name} (https://${CONSTANTS.url})`);
        if (validEmail(to)) {
          form.append("html", html(url));
          form.append("text", text(url));
        } else {
          form.append(
            "text",
            "Please enter a valid lexingtonma.org email address. The email you provided is not valid."
          );
        }

        const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${provider.apiKey}`)}`,
          },
          body: form,
        });

        if (!res.ok) throw new Error("Mailgun error: " + (await res.text()));
      },
    } satisfies EmailUserConfig),
  ],
  callbacks: {
    session({ session, token }) {
      session.user ??= token?.user as any;

      if (session.user.password) session.user.password = true as any;

      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "zoron.session",
      options: {
        domain: DOMAIN,
        path: "/",
        httpOnly: true,
        sameSite: "lax" as const,
        secure: false,
      },
    },
  },
} satisfies SvelteKitAuthConfig;
export const { handle, signIn, signOut } = SvelteKitAuth(auth);
