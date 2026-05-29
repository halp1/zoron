import { query, updateOrInsert } from "../database";

const collection = "app";
const disabledEmailsName = "disabledEmails";

export type DisabledEmailsDoc = {
  name: typeof disabledEmailsName;
  data: string[];
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const uniqueEmails = (emails: string[]) =>
  Array.from(
    new Set(
      emails
        .map((email) => normalizeEmail(email))
        .filter((email) => email.length > 0)
    )
  );

export const getDisabledEmails = async () => {
  const doc = (
    await query<DisabledEmailsDoc>({
      collection,
      query: { name: disabledEmailsName }
    })
  )[0];

  return uniqueEmails(doc?.data ?? []);
};

export const setDisabledEmails = async (emails: string[]) => {
  const data = uniqueEmails(emails);

  await updateOrInsert(
    collection,
    { name: disabledEmailsName },
    { name: disabledEmailsName, data }
  );

  return data;
};

export const isEmailDisabled = async (email: string) =>
  (await getDisabledEmails()).includes(normalizeEmail(email));
