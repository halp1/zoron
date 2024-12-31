import { aspen } from "$lib/aspen";
import { adapter } from "$lib/auth";
import { CONSTANTS } from "$lib/constants";
import { html, text, validEmail } from "$lib/email";
import { api } from "$lib/server";
import type { Session } from "$lib/types";

import { MAILGUN_KEY } from "$env/static/private";
import _ from "lodash";

import { defaultSettings } from "../settings/defaults";
import type { RequestHandler } from "./$types";

export interface AccountUpdateRes {
  email: string;
  name: { first: string; last: string };
  session: Session;
}

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session || !session.user || !session.user.id) api.error("Not authorized", 401);
  const data: { username: string; password: string, secret: string } = await request.json();
  if (!data.username || typeof data.username !== "string" || data.username.length === 0)
    return api.error("Missing username", 400);
  if (!data.password || typeof data.password !== "string" || data.password.length === 0)
    return api.error("Missing password", 400);
	if (!data.secret || typeof data.secret !== "string" || data.secret.length === 0)
		return api.error("Missing secret", 400);

  try {
    const account = await aspen.authenticate(data.username, data.password);
    const email = await aspen.email(account.cookie);
    if (email !== session?.user?.email) {
      const msg = `This is not your account. This incedent has been reported`;
      const to = email,
        from = "system@mail.haelp.dev";
      const form = new FormData();
      form.append("from", `${CONSTANTS.name} system <${from}>`);
      form.append("to", to);
      form.append("subject", `Sign in to ${CONSTANTS.name} (https://${CONSTANTS.url})`);
      if (validEmail(to)) {
        form.append(
          "text",
          `${session?.user?.email} just tried to create a ${CONSTANTS.name} account using your MyFollet Aspen credentials. Foward this email to "26stu282@lexingtonma.org" for more information. It is likely that this person knows your login information, which means it needs to be changed.`
        );
      } else {
        throw new Error("An invalid email was found on the account.");
      }

      const res = await fetch(`https://api.mailgun.net/v3/mail.haelp.dev/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_KEY}`)}`
        },
        body: form
      });

      if (!res.ok) throw new Error("Mailgun error: " + (await res.text()));

      throw new Error(msg);
    }

    const encrypted = aspen.encrypt(data.secret, data.username, data.password);

    const activity = await aspen.activity(account.cookie);
    const ids = activity.merged
      .map((item) =>
        btoa(("id" in item ? item.id : item.oid) + ("sscid" in item ? item.sscid : item.date))
      )
      .slice(1);

    await adapter.updateUser!({
      id: session.user.id!,
      name: `${account.name.first} ${account.name.last}`,
      aspen: encrypted,
      session: { cookie: account.cookie, token: account.token },
      settings: _.merge(defaultSettings, session.user.settings || {}),
      devices: [],
      notified: { activity: ids },
      activity: undefined,
      schedule: undefined
    });

    return api.json<AccountUpdateRes>({
      email,
      session: { cookie: account.cookie, token: account.token },
      name: account.name
    });
  } catch (e: any) {
    return api.error(e.message, 401);
  }
};
