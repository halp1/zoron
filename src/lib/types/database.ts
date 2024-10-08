import type { Device } from "$lib/web";

export interface Subscription {
  created: Date;
  device: Device;
  subscription: PushSubscriptionJSON;
}