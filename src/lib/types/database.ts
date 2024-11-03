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
  home: {
    default: "home" | "schedule" | "grades" | "activity";
		hideGPA: boolean;
  };
}
