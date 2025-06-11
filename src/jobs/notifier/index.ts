import type { aspen } from "$lib/aspen";
import type {
  Assignment,
  Attendance,
  PeriodAttendance,
  PostedGrade
} from "$lib/aspen/types";
import { adapter } from "$lib/auth";
import { cache } from "$lib/cache";
import { query, transformID } from "$lib/database";

import { VAPID_PRIVATE, VAPID_PUBLIC } from "$env/static/private";
import type { Session, User } from "@auth/sveltekit";
import webpush from "web-push";

import type { PushEvent } from "../../lib/types";
import { activity } from "../../routes/api/aspen/activity";
import { assignment } from "../../routes/api/aspen/assignment";
import { Job } from "../base";

interface GradeWithData extends Assignment {
  scoring?:
    | {
        percentage: number;
        scored: number;
        total: number;
      }
    | number
    | null;
}

export class Notifier extends Job {
  constructor() {
    super({
      id: "notifier",
      time: 60 * 60 * 1000,
      randomness: 1000 * 60 * 5,
      timeRanges: [[7 * 60 * 60 * 1000, 22 * 60 * 60 * 1000]]
    });
  }

  async #processBatch(
    session: Session,
    secret: string,
    assignments: { assignment: Assignment; studentID: string }[]
  ) {
    const queue = [...assignments];
    const results: (aspen.Types.AssignmentScore | null)[] = [];
    const internalResults: {
      id: string;
      lastLoaded: string;
      data: aspen.Types.AssignmentScore | null;
    }[] = [];
    const inProgress = new Set();
    const batchSize = 20;

    const processOne = (item: {
      assignment: Assignment;
      studentID: string;
    }): Promise<aspen.Types.AssignmentScore | null> =>
      new Promise(async (resolve) => {
        try {
          const result = await assignment(
            session,
            secret,
            item.assignment,
            item.studentID,
            () => {},
            true
          );
          internalResults.push({
            id: item.assignment.id,
            lastLoaded: item.assignment.grade,
            data: result
          });
          resolve(result);
        } catch (error) {
          internalResults.push({
            id: item.assignment.id,
            lastLoaded: item.assignment.grade,
            data: null
          });
          resolve(null);
        } finally {
          inProgress.delete(item);
          if (queue.length > 0) {
            const next = queue.shift()!;
            inProgress.add(next);
            results.push(await processOne(next));
          } else if (inProgress.size === 0) {
            // upload results to db
            const current =
              (await adapter.getUser!(session.user?.id!))?.activity || [];
            const merged = current
              .filter((a) => !internalResults.some((b) => a.id === b.id))
              .concat(internalResults);

            adapter.updateUser!({ id: session.user?.id!, activity: merged });
          }
        }
      });

    // Start initial batch
    const initialBatch = queue.splice(0, batchSize);

    for (const item of initialBatch) {
      inProgress.add(item);
      processOne(item).then((result) => results.push(result));
    }

    while (inProgress.size > 0 || queue.length > 0) {
      // Wait for all items to finish processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return internalResults;
  }

  async #fetchUserNotifications(
    user: User,
    secret: string
  ): Promise<(Attendance | PeriodAttendance | GradeWithData | PostedGrade)[]> {
    const existingData = user.activity;

    if (!existingData) return [];

    const session: Session = {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toString()
    };

    const { merged, raw } = await activity(session, secret);

    const preprocessed: (
      | Attendance
      | PeriodAttendance
      | GradeWithData
      | PostedGrade
    )[] = merged.map((item) => {
      if (item.type !== "grade") return item;
      const existing = existingData.find((existing) => existing.id === item.id);
      if (
        !existing ||
        !existing.lastLoaded ||
        existing.lastLoaded !== item.grade.trim()
      )
        return { ...item, scoring: 0 };
      else return { ...item, scoring: existing.data };
    });

    const res = (
      await this.#processBatch(
        session,
        secret,
        preprocessed
          .filter(
            (item): item is Assignment =>
              item.type === "grade" && typeof item.scoring === "number"
          )
          .map((item) => ({
            assignment: item,
            studentID:
              raw["recent-activity-list"]["recent-activity"][0].$.studentoid
          }))
      )
    ).filter((item) => item.data !== null);

    const newGrades = preprocessed
      .filter(
        (item): item is GradeWithData =>
          item.type === "grade" && res.some((r) => r.id === item.id)
      )
      .map((item) => {
        return {
          ...item,
          scoring: res.find((r) => r.id === item.id)?.data
        };
      });

    const otherPreloaded =
      (await adapter.getUser!(session.user!.id!))!.seenActivity || [];

    const otherNewActivity = preprocessed.filter(
      (item) =>
        item.type !== "grade" &&
        !otherPreloaded.includes("id" in item ? item.id : item.oid)
    );

    // Update the user's activity in the database
    await adapter.updateUser!({
      id: session.user!.id!,
      seenActivity: preprocessed
        .filter((item) => item.type !== "grade")
        .map((item) => ("id" in item ? item.id : item.oid))
    });

    return [...newGrades, ...otherNewActivity];
  }

  async run() {	
    if (import.meta.env.DEV) return;

    console.log("Running notifier job at", new Date().toString());

    webpush.setVapidDetails(
      "https://push.haelp.dev",
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );

    const users = (await query<User>({ collection: "users", query: {} })).map(
      (user) => transformID(user)
    );

    await Promise.all(
      users.map(async (user) => {
        try {
          if (
            !user.devices ||
            !user.aspen ||
            !user.password ||
            !user.activity ||
            (!user.settings?.notifications?.attendance &&
              !user.settings?.notifications?.grades)
          )
            return;

          const key = cache.getUser(user._id);

          if (!key) return;

          const notifications = await this.#fetchUserNotifications(
            { ...user, id: user._id },
            key
          ).then((notifications) =>
            notifications
              .filter(
                (notification) =>
                  !(
                    notification.type === "grade" ||
                    notification.type === "posted-grade"
                  ) || user.settings?.notifications?.grades
              )
              .filter(
                (notification) =>
                  !(
                    notification.type === "attendance" ||
                    notification.type === "period-attendance"
                  ) || user.settings?.notifications?.attendance
              )
          );

          if (notifications.length > 0) {
            const successful = (
              await Promise.all(
                user.devices.map((device) =>
                  // device.device.backgroundSync
                  //   ? Promise.resolve(device) // If background sync is available, skip sending a notification
                  //   :
                  webpush
                    .sendNotification(
                      device.subscription,
                      JSON.stringify({
                        type: "auth-request",
                        data: notifications
                      } satisfies PushEvent)
                    )
                    .then(() => device)
                    .catch(() => null)
                )
              )
            ).filter((device) => device !== null);

            if (successful.length !== user.devices.length) {
              await adapter.updateUser!({
                id: user.id!,
                devices: successful
              });
            }
          }
        } catch (e) {
          console.error(
            "Error processing user notifications:",
            user.name ?? user.email,
            e
          );
        }
      })
    );

    console.log("Finished notifier job at", new Date().toString());
  }
}
