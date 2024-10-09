import chalk from "chalk";
import { aspen } from "./aspen";

const { cookie, token } = await aspen.authenticate(process.env.USERNAME!, process.env.PASSWORD!);

const { merged, raw } = await aspen.activity(cookie);

const studentID = raw["recent-activity-list"]["recent-activity"][0].$.studentoid;

let grades: Awaited<ReturnType<typeof aspen.assignment>>[] = [];

console.log();
let i = 0;
for (const activity of merged) {
  if (activity.type === "grade") {
    grades.push(
      await aspen.assignment({
        cookie,
        token,
        assignment: activity,
        studentID
      })
    );
  } else grades.push({ scored: 0, total: 0, percentage: 0 });
  process.stdout.write(`\r${++i}/${merged.length}`);
}
console.log();

console.log(
  (
    await Promise.all(
      merged.map(
        async (activity, i) =>
          `* ${activity.date} - ${
            activity.type === "grade" ? chalk.blue("Assignment Grade") : chalk.blue("Attendance")
          } ${
            activity.type === "grade"
              ? `(${activity.class}) ${chalk.bold(
                  "Grade:"
                )} ${`${grades[i].scored} / ${grades[i].total} (${grades[i].percentage}%)`} ${chalk.bold(
                  "Assignment:"
                )} ${activity.assignment}`
              : `(${activity.code}) ${chalk.bold("Class:")} ${
                  activity.class
                } ${chalk.bold("Period:")} ${activity.period}`
          }`
      )
    )
  ).join("\n")
);
