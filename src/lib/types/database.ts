import type { Device } from "$lib/web";

export interface Subscription {
  email: string;
  created: Date;
  target: string;
  device: Device;
  subscription: PushSubscriptionJSON;
}

export interface Item {
  owner: string;
  name: string;
  created: Date;
  key: string;
}
