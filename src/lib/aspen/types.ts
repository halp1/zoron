import type { aspen } from ".";

export interface AuthResponse {
  aspenUrl: string;
  csrfToken: string;
  aaspLogon: boolean;
  aaspOrganizationOid: string | null;
  pwdRecoveryMode: string;
  mfaMode: string;
  mfaOption: string | null;
  defaultPortal: string;
  defaultView: string;
  passwordExpired: boolean;
  securityAnswerExist: boolean;
}

export interface RecentActivityList {
  "recent-activity-list": {
    $: {
      daterange: string;
      attendance: string;
      grades: string;
      conduct: string;
    };
    "recent-activity": [
      {
        $: {
          studentoid: string;
          studentname: string;
          collapsed: string;
        };
        attendance: Array<{
          $: {
            date: string;
            code: "A-E";
            dismissed: "false" | "true";
            absent: "true" | "false";
            excused: "true" | "false";
            tardy: "false" | "true";
            portionabsent: string;
            oid: string;
          };
        }>;
        periodAttendance: Array<{
          $: {
            date: string;
            period: string;
            code: string;
            classname: string;
            dismissed: string;
            absent: string;
            excused: string;
            tardy: string;
            oid: string;
            sscoid: string;
          };
        }>;
        gradebookScore: Array<{
          $: {
            assignmentoid: string;
            date: string;
            gtmoid: string;
            classname: string;
            grade: string;
            oid: string;
            assignmentname: string;
            sscoid: string;
          };
        }>;
        gradePost: Array<{
          $: {
            date: string;
            classname: string;
            teacherfirst: string;
            oid: string;
            type: string;
            teacherlast: string;
            sscoid: string;
          };
        }>;
      }
    ];
  };
}

export interface Assignment {
  type: "grade";
  date: string;
  assignment: string;
  class: string;
  grade: string;
  id: string;
  sscid: string;
  gtmid: string;
}

export interface PeriodAttendance {
  type: "period-attendance";
  date: string;
  period: string;
  code: string;
  class: string;
  id: string;
  sscid: string;
}

export interface Attendance {
  type: "attendance";
  date: string;
  code: string;
  dismissed: boolean;
  absent: boolean;
  excused: boolean;
  tardy: boolean;
  portionabsent: number;
  id: string;
}

export interface PostedGrade {
  type: "posted-grade";
  date: string;
  classname: string;
  teacher: aspen.Types.Name;
  oid: string;
  postType: number;
  sscid: string;
}
