import { zoron } from "..";

import { MONGODB_URI } from "$env/static/private";
import { MongoClient, ServerApiVersion } from "mongodb";
import type { Document, Filter, OptionalId, WithId } from "mongodb";

const uri = MONGODB_URI;

export const database = import.meta.env.DEV ? "dev" : "prod";
// export const database = import.meta.env.DEV ? "prod" : "prod";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// @ts-ignore
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

let clientPromise: Promise<MongoClient>;

let connectionStart = performance.now();

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise as dbClient };

let connecting: boolean | Promise<MongoClient> = true;
const logger = zoron.logger("MongoDB");

(async () => {
  // Connect to the MongoDB cluster
  connecting = client.connect();
  await connecting;
  connecting = false;
  logger.log(
    `Connected in ${Math.round(performance.now() - connectionStart)}ms`
  );
})();

export const createIndex = async (
  collection: string,
  field: string | Document,
  options: Document = {}
) => {
  if (connecting) await connecting;
  return await client
    .db(database)
    .collection(collection)
    .createIndex(field, options);
};

export const query = async <T = any>({
  collection,
  query = {},
  projection = {},
  sort = {}
}: {
  collection: string;
  query?: Filter<Document>;
  projection?: Document;
  sort?: Document;
}) => {
  if (connecting) await connecting;
  return (await client
    .db(database)
    .collection(collection)
    .find(query)
    .sort(sort)
    .project(projection)
    .toArray()) as WithId<T>[];
};

export const update = async (collection: string, query: any, update: any) => {
  if (connecting) await connecting;
  return await client
    .db(database)
    .collection(collection)
    .updateMany(query, update);
};

export const insert = async (collection: string, doc: OptionalId<Document>) => {
  if (connecting) await connecting;
  return await client.db(database).collection(collection).insertOne(doc);
};

export const updateOrInsert = async (
  collection: string,
  search: any,
  set: any
) => {
  if (connecting) await connecting;
  const queryRes = await query({ collection, query: search });
  if (queryRes.length > 0) {
    return await update(collection, search, { $set: { ...set } });
  } else {
    return await insert(collection, set);
  }
};

export const remove = async (collection: string, search: any) => {
  if (connecting) await connecting;
  const res = await client
    .db(database)
    .collection(collection)
    .deleteOne(search);
  return !!res.deletedCount;
};

export const transformID = <T>(object: WithId<T>) => {
  return { ...object, _id: object._id.toString() } as Omit<T, "_id"> & {
    _id: string;
  };
};

// update("users", {}, { $unset: { schedule: "" } });
