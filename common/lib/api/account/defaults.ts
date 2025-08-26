import type { Settings } from "@zoron/common/types";

export const defaultSettings: Settings = {
  notifications: {
    attendance: false,
    grades: false
  },
  home: {
    default: "schedule",
    hideGPA: false
  },
  social: {
    schedule: "all"
  }
};
