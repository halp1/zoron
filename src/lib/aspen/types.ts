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

export interface Attendance {
	type: "attendance";
	date: string;
	period: string;
	code: string;
	class: string;
	id: string;
	sscid: string;
}