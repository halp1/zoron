import { database as databaseName, dbClient } from "$lib/database";
import { html, text, validEmail } from "$lib/email";

import Mailgun from "@auth/sveltekit/providers/mailgun";

import { DOMAIN, MAILGUN_KEY } from "$env/static/private";
import { decode, encode } from "@auth/core/jwt";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { SvelteKitAuth, type SvelteKitAuthConfig, type User } from "@auth/sveltekit";

export const adapter = MongoDBAdapter(dbClient, {
  databaseName
});

export const trimUser = (user: User) => ({
  id: user.id,
  name: user.name,
  password: !!user.password,
  email: user.email,
  image: user.image,
  aspen: user.aspen,
  session: user.session,
  settings: user.settings,
  devices: user.devices
});

export const auth = {
  trustHost: true,
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    generateSessionToken: () => crypto.randomUUID(),
    strategy: "jwt"
  },
  jwt: {
    encode,
    decode
  },
  adapter,
  pages: {
    signIn: "/login",
    signOut: "/logout",
    verifyRequest: "/verify"
  },

  providers: [
    Mailgun({
      name: "Sign in to Push",
      apiKey: MAILGUN_KEY,
      from: "system@mail.haelp.dev",

      async sendVerificationRequest({ identifier: to, provider, url }) {
        const domain = provider.from!.split("@").at(1);

        if (!domain) throw new Error("malformed Mailgun domain");

        const form = new FormData();
        form.append("from", `A+spen system <${provider.from}>`);
        form.append("to", to);
        form.append("subject", `Sign in to A+spen (https://aplus.haelp.dev)`);
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
            Authorization: `Basic ${btoa(`api:${provider.apiKey}`)}`
          },
          body: form
        });

        if (!res.ok) throw new Error("Mailgun error: " + (await res.text()));
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (!user) token.user = trimUser((await adapter.getUser!(token.sub!))!);
      return token;
    },
    session({ session, token }) {
      session.user = token.user as any;

      if (session.user.password) session.user.password = true as any;

      return session;
    }
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        domain: DOMAIN,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false
      }
    }
  }
} satisfies SvelteKitAuthConfig;
export const { handle, signIn, signOut } = SvelteKitAuth(auth);
