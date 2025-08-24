import type { Device } from "../web";

import type { PushSubscription } from "web-push";

export interface Subscription {
  created: Date;
  device: Device;
  subscription: PushSubscription;
}

export interface Settings {
  notifications: {
    attendance: boolean;
    grades: boolean;
  };
  home: {
    default: "home" | "schedule" | "grades" | "activity" | "friends";
    hideGPA: boolean;
  };
  social: {
    schedule: "all" | "friends" | "none";
  };
}

export interface Relationship {
  user: string;
  type: "request-outgoing" | "request-incoming" | "friend" | "block";
  since: Date;
}
