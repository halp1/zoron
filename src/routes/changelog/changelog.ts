import type { ChangelogEntry } from "./types";

export const changelog: ChangelogEntry[] = [
  {
    version: "1.1.0",
    date: "04/<FILL OUT>/2025",
    overview: "Friends",
    changes: [
			"Added a date picker on the schedule page to easily select a date and view the schedule for that day.",
    ],
    bugfixes: []
  },
  {
    version: "1.1.0",
    date: "03/31/2025",
    overview: "Notifications",
    changes: [
      "Added notifications to the app. You can now receive notifications when new grades / attendance updates come in."
    ],
    bugfixes: [
      "Fixed several bugs that occurred when switching from Vercel to self hosting."
    ]
  },
  {
    version: "1.0.1",
    date: "01/01/2025",
    overview: "Minor bugfixes",
    changes: [
      "Added instructions on how to install the IOS app on the home page (because the install button doesn't show up on IOS :( )"
    ],
    bugfixes: [
      'Fixed a bug where logging in with "forgot password" or when creating a new account would not load the secret decryption key',
      "Fixed the sizing and placement of the navigation bar on mobile browsers",
      "Fixed a visual bug with displaying the changelog on the homepage"
    ]
  },
  {
    version: "1.0.0",
    date: "12/30/2024",
    overview: "Official Release",
    changes: [
      "Overhauled the authentication system to make it impossible to decrypt user data without the user's device. (You will be able to read more about this on the upcoming article)",
      "Zoron now loads all of the inital data all at once when launching, making the app and navigation faster.",
      "Added a loading screen when launching the app.",
      "Added entry animations to all parts of the dashboard and other parts of the site."
    ],
    bugfixes: [
      "Fixed a bug where loading the activty page more than once would leave unloaded grades blank until reloading the page",
      "Fixed a bug where navigating back would sometimes cause the site to load an api route instead an actual page",
      "Several small bugfixes relating to the schedule page",
      "Fixed a bug where the navbar on mobile would sometimes not show the correct page being highlighted"
    ]
  },
  {
    version: "0.1.0",
    date: "12/24/2024",
    overview: "The beginning",
    changes: [
      "The start of the changelog!",
      "Added much smoother animations and transitions to both the mobile and desktop view of the schedule."
    ],
    bugfixes: []
  }
];
