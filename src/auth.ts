import { SvelteKitAuth } from "@auth/sveltekit";
import Mailgun from "@auth/sveltekit/providers/mailgun";

import { GP, MAILGUN_KEY } from "$env/static/private";
import { database as databaseName, dbClient } from "$lib/database";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { html, text, validEmail } from "$lib/email";

export const adapter = MongoDBAdapter(dbClient, {
  databaseName
});

export const { handle, signIn, signOut } = SvelteKitAuth({
  trustHost: true,
  adapter,
  pages: {
    signIn: "/login"
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
    session({ session, trigger, user, newSession }) {
      if (session?.user) {
        session.user = { ...user, ...session.user };
      }

      if (newSession && trigger === "update") {
        const updateProperties: { [key: string]: any } = {};
        if (newSession.image && typeof newSession.image === "string") {
          updateProperties.image = newSession.image;
        }
        if (newSession.name && typeof newSession.name === "string") {
          updateProperties.name = newSession.name;
        }

        if (Object.keys(updateProperties).length > 0) {
          adapter.updateUser!({ id: user.id, ...updateProperties });
        }
      }

      return session;
    }
  },
  cookies:
    GP && GP !== "0"
      ? {
          sessionToken: {
            name: "next-auth.session-token",
            options: {
              domain: GP,
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: false
            }
          }
        }
      : undefined
});
