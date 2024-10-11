import type { Device } from "$lib/web";

export interface Subscription {
  created: Date;
  device: Device;
  subscription: PushSubscriptionJSON;
}

export interface Settings {
  notifications: {
    attendance: boolean;
    grades: boolean;
  };
}