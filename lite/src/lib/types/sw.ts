import type {
  Assignment,
  Attendance,
  PeriodAttendance,
  PostedGrade
} from "$lib/aspen/types";

export type PushEvent = {
  type: "auth-request";
  data: (Attendance | PeriodAttendance | GradeWithData | PostedGrade)[];
};

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
