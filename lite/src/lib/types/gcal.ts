export interface CalendarEvent {
  kind: string;
  etag: string;
  summary: string;
  description: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: any[]; // Adjust if reminders have a specific structure
  nextPageToken: string;
  items: EventItem[];
}

export interface EventItem {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  creator: {
    email: string;
  };
  organizer: {
    email: string;
    displayName: string;
    self: boolean;
  };
  start:
    | {
        date: string;
        dateTime: undefined;
      }
    | {
        dateTime: string;
        date: undefined;
      };
  end:
    | {
        dateTime: string;
        date: undefined;
      }
    | {
        date: string;
        dateTime: undefined;
      };
  recurrence: string[];
  iCalUID: string;
  sequence: number;
  extendedProperties: {
    private: {
      everyoneDeclinedDismissed: string;
    };
  };
  eventType: string;
}
