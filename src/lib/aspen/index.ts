import { parseStringPromise } from "xml2js";
import Parser, { type Text, type Page } from "pdf2json";
import { JSDOM } from "jsdom";
import type { AuthResponse, Assignment, RecentActivityList, Attendance } from "./types";
import { encrypt as _encrypt, decrypt as _decrypt } from "./crypt";

export namespace aspen {
  export namespace Types {
    export type ProgressCallback = (step: number, total: number) => void;

    export interface Grade {
      number: number;
      letter: string;
    }

    export interface Name {
      first: string;
      last: string;
    }
    export interface AssignmentScore {
      percentage: number;
      scored: number;
      total: number;
    }

    export interface Class {
      id: string;
      name: string;
      course: string;
      term: string;
      teachers: Name[];
      email: string;
      room?: string;
      grade?: Grade;
      attendance: {
        absent: number;
        tardy: number;
        dismissed: number;
      };
    }

    export interface ClassDetailCategory {
      name: string;
      terms: {
        weight?: number;
        grade?: Grade;
      }[];
    }

    export interface Assignment {
      id: string;
      name: string;
      assigned: string;
      due: string;
      weight?: number;
      score?: AssignmentScore;
    }

    export interface ClassDetail {
      grades?: {
        categories: ClassDetailCategory[];
        averages: (Grade | undefined)[];
        posted: (Grade | undefined)[];
        final?: Grade;
      };
      assignments: Assignment[];
    }

    export namespace Schedule {
      export type Semester = 1 | 2;
      export type Lunch = 3 | 2 | 1;

      export interface PDFCourse {
        course: string;
        level?: "Hon" | "AP" | "CP";
        description: string;
        room: string;
        teacher: string;
        term: "ALL" | "S 1" | "S 2";
        schedule?: string;
        credit: number;
      }

      export interface Course extends PDFCourse {
        $: boolean;
        block: string;
      }

      export interface Schedule {
        semester: Semester;
        lunches: Lunch[];
        schedule: (Course | null)[];
      }
    }
  }

  export const encrypt = _encrypt;
  export const decrypt = _decrypt;

  const getCookies = (res: Response) =>
    [...res.headers.entries()]
      .filter(([name]) => name === "set-cookie")
      .map(([_, value]) => value)
      .map((value) => processCookie(value));

  const processCookie = (cookie: string) => {
    return cookie.split(";")[0];
  };

  const progressTicker = (steps: number, cb?: Types.ProgressCallback) => {
    let step = 0;
    return () => {
      step++;
      cb && cb(step, steps);
    };
  };

  export namespace constants {
    export namespace steps {
      export const authenticate = 5;
      export const classDetail = 4;
      export const assignment = 6;
      export namespace schedule {
        export const pdf = 5;
      }
    }
  }

  export const authenticate = async (
    username: string,
    password: string,
    onProgress?: Types.ProgressCallback
  ) => {
    const tick = progressTicker(constants.steps.authenticate, onProgress);
    let cookie = "deploymentId=ma-lexington; locale=en_US";

    const sessionRes = await fetch("https://ma-lexington.myfollett.com/app/rest/i18n/locales", {
      headers: {
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        deploymentid: "ma-lexington",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen-login/?deploymentId=ma-lexington",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: null,
      method: "GET"
    });

    if (sessionRes.status !== 200) {
      throw new Error(
        `Failed to initialize authorization sequence: ${sessionRes.status} (${sessionRes.statusText})`
      );
    }

    cookie = `${cookie}; ${getCookies(sessionRes).join("; ")}`;

    const authRes = await fetch("https://ma-lexington.myfollett.com/app/rest/auth", {
      headers: {
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        deploymentid: "ma-lexington",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen-login/?deploymentId=ma-lexington",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: `username=${username}&password=${password}`,
      method: "POST"
    });

    // check auth
    if (authRes.status !== 200) {
      throw new Error("Invalid credentials: " + (await authRes.json()).message);
    }

    tick();

    const auth: AuthResponse = await authRes.json();
    cookie = `${cookie}; user=${encodeURIComponent(JSON.stringify(auth))}`;

    const authTokenRes = await fetch(auth.aspenUrl, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen-login/?deploymentId=ma-lexington",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: null,
      method: "GET"
    });

    if (authTokenRes.status !== 200) {
      throw new Error(`Failed to get auth token: ${await authTokenRes.text()}`);
    }

    tick();

    const homeRes = await fetch("https://ma-lexington.myfollett.com/aspen/home.do", {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie,
        Referer:
          "https://ma-lexington.myfollett.com/aspen/portalAssignmentDetail.do?navkey=academics.classes.list.gcd.detail&oid=GCD0000017PfFO",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: null,
      method: "GET"
    });

    if (homeRes.status !== 200) {
      throw new Error(`Failed to get home: ${await homeRes.text()}`);
    }

    tick();

    const homeText = await homeRes.text();

    const tokenSearch = homeText.match(
      /<input type="hidden" name="org.apache.struts.taglib.html.TOKEN" value="(.+?)"/
    );
    if (!tokenSearch) {
      throw new Error("Failed to find token");
    }
    const token = tokenSearch[1];

    const nameSearch = homeText.match(
      /<div id="userPreferenceMenu" class="toolbarText pointer toolbarItem" tabindex="0">\s*([\w\s,]+)\s*/
    );
    if (!nameSearch) {
      throw new Error("Failed to find name");
    }
    const name = nameSearch[1].trim();
    const [last, first] = name.split(", ");

    tick();

    return { cookie, token, name: { first, last } };
  };

  export const email = async (cookie: string) => {
    const mainPageRes = await fetch(
      "https://ma-lexington.myfollett.com/aspen/portalStudentDetail.do?navkey=myInfo.details.detail",
      {
        headers: {
          accept: "application/json",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          deploymentid: "ma-lexington",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen-login/?deploymentId=ma-lexington",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (mainPageRes.status !== 200) {
      throw new Error(`Failed to get main info page`);
    }

    const mainPageHTML = await mainPageRes.text();
    const mainPageDom = new JSDOM(mainPageHTML);

    const form = mainPageDom.window.document.forms["genericDetailForm" as any];

    const formData = new mainPageDom.window.FormData(form);
    formData.set("userParam", "3");
    formData.set("userEvent", "2030");

    const body = new mainPageDom.window.URLSearchParams(formData as any).toString();

    const pageRes = await fetch(`https://ma-lexington.myfollett.com/aspen/portalStudentDetail.do`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body,
      method: "POST"
    });

    const email = [
      ...new JSDOM(await pageRes.text()).window.document.querySelectorAll("input")
    ].filter((i) => i.value.includes("@lexingtonma.org"))[0].value;

    return email;
  };

  export const activity = async (cookie: string) => {
    const activityRes = await fetch(
      "https://ma-lexington.myfollett.com/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A%20%20%3Cpref%20id%3D%22dateRange%22%20type%3D%22int%22%3E4%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E&rand=1728335376000",
      {
        headers: {
          accept: "application/xml, text/xml, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (activityRes.status !== 200) {
      throw new Error(`Failed to get activity: ${await activityRes.text()}`);
    }

    const activityXml = await activityRes.text();
    const activity: RecentActivityList = await parseStringPromise(activityXml);

    const attendence = activity["recent-activity-list"]["recent-activity"][0].periodAttendance.map(
      (period) => {
        return {
          type: "attendance" as const,
          date: period.$.date,
          period: period.$.period,
          code: period.$.code,
          class: period.$.classname,
          id: period.$.oid,
          sscid: period.$.sscoid
        };
      }
    );

    const grades = activity["recent-activity-list"]["recent-activity"][0].gradebookScore.map(
      (score) => {
        return {
          type: "grade" as const,
          date: score.$.date,
          assignment: score.$.assignmentname,
          class: score.$.classname,
          grade: score.$.grade,
          id: score.$.assignmentoid,
          sscid: score.$.sscoid,
          gtmid: score.$.gtmoid
        } satisfies Assignment;
      }
    );

    const computeMilliseconds = (date: string): number => {
      const d = new Date(
        parseInt(date.substring(0, 4)),
        parseInt(date.substring(5, 7)) - 1,
        parseInt(date.substring(8, 10))
      );
      return d.getTime();
    };

    const mergedActivity: (Assignment | Attendance)[] = [...attendence, ...grades].sort(
      (a, b) => computeMilliseconds(b.date) - computeMilliseconds(a.date)
    );
    return {
      merged: mergedActivity,
      attendence: attendence.sort(
        (a, b) => computeMilliseconds(b.date) - computeMilliseconds(a.date)
      ),
      grades: grades.sort((a, b) => computeMilliseconds(b.date) - computeMilliseconds(a.date)),
      raw: activity
    };
  };

  export const classes = async (cookie: string): Promise<{ classes: Types.Class[] }> => {
    const res = await fetch(
      "https://ma-lexington.myfollett.com/aspen/portalClassList.do?navkey=academics.classes.list",
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie: cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get classes: ${res.status}`);
    }

    const text = await res.text();
    const dom = new JSDOM(text);
    const body = dom.window.document.querySelector("#dataGrid table tbody");
    if (!body) throw new Error("Failed to find data");
    const rows = [...body.children].slice(1);

    const data: Types.Class[] = [];
    for (const row of rows) {
      const items = [...row.children].slice(1) as HTMLTableCellElement[];
      if (items.length === 0) continue;
      const getItem = (index: number) =>
        [...items[index].children][0]?.innerHTML?.trim() || items[index].innerHTML.trim();
      data.push({
        id: items[0].id,
        name: getItem(0),
        course: getItem(1),
        term: getItem(2),
        teachers: getItem(3)
          .split("; ")
          .map(
            (item) =>
              ({ first: item.split(", ")[1], last: item.split(", ")[0] }) satisfies Types.Name
          ),
        email: getItem(4),
        room: getItem(5),
        grade: {
          number: Math.round(parseFloat(getItem(6).split(" ")[0]) * 100) / 100,
          letter: getItem(6).split(" ")[1]
        },
        attendance: {
          absent: parseInt(getItem(7)),
          tardy: parseInt(getItem(8)),
          dismissed: parseInt(getItem(9))
        }
      });
    }

    return {
      classes: data
    };
  };

  const rewriteUrl = (url: string) => {
    url = url.replaceAll("\\", "%5C");
    url = url.replaceAll("^", "%5E");
    url = url.replaceAll("`", "%60");
    url = url.replaceAll("{", "%7B");
    url = url.replaceAll("|", "%7C");
    url = url.replaceAll("}", "%7D");
    var paramsExist = url.lastIndexOf("?");
    if (paramsExist > 0) {
      var parts = url.split("?");
      if (parts.length == 2)
        url =
          parts[0] +
          "?" +
          parts[1].replaceAll(":", "%3A").replaceAll("[", "%5B").replaceAll("]", "%5D");
    }
    return url;
  };

  export const classDetail = async ({
    cookie,
    classID,
    onProgress,
    assignments
  }: {
    cookie: string;
    classID: string;
    onProgress?: Types.ProgressCallback;
    assignments?: {
      category?: string;
      term?: number;
    };
  }) => {
    const tick = progressTicker(constants.steps.classDetail, onProgress);

    const prefetch = await fetch(
      "https://ma-lexington.myfollett.com/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie: cookie,
          Referer:
            "https://ma-lexington.myfollett.com/aspen/portalClassDetail.do?navkey=academics.classes.list.detail",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (prefetch.status !== 200) {
      throw new Error(`Failed to prefetch classes: ${prefetch.status}`);
    }

    tick();

    const prefetchDom = new JSDOM(await prefetch.text());
    const prefetchForm = prefetchDom.window.document.forms["classListForm" as any];
    const formData = new prefetchDom.window.FormData(prefetchForm);
    formData.set("userParam", classID);
    formData.set("userEvent", "2100");
    const body = new prefetchDom.window.URLSearchParams(formData as any).toString();

    const res = await fetch("https://ma-lexington.myfollett.com/aspen/portalClassList.do", {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        pragma: "no-cache",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie,
        Referer:
          "https://ma-lexington.myfollett.com/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body,
      method: "POST"
    });

    if (res.status !== 200) {
      throw new Error(`Failed to get class detail: ${res.status}`);
    }

    tick();

    const [grades, ass] = await Promise.all([
      (async () => {
        const text = await res.text();
        const dom = new JSDOM(text);

        const table = [...dom.window.document.querySelectorAll("table")]
          .filter((item) => item.textContent?.includes("Average Summary"))
          .at(-1);

        if (!table) throw new Error("Failed to find data table");
        const rows = [...table.querySelectorAll("tr.listCell")];
        const categories = [...table.querySelectorAll('td[rowspan="2"]')]
          .map((item) => item.textContent?.trim()!)
          .filter((i) => i);

        const result: Types.ClassDetail["grades"] =
          (categories.length > 0 && {
            categories: [],
            averages: [],
            posted: []
          }) ||
          undefined;
        if (categories.length > 0) {
          for (let i = 0; i < categories.length * 2; i += 2) {
            const weights = [...rows[i].children]
              .slice(2)
              .map((item) => item.textContent?.trim())
              .map((item) =>
                item === "N/A" ? undefined : Math.round(100 * parseFloat(item?.slice(0, -1)!)) / 100
              );
            const grades = [...rows[i + 1].children]
              .slice(1)
              .map((item) => item.textContent?.trim())
              .map(
                (item) =>
                  (item &&
                    item.length > 0 &&
                    ([
                      Math.round(100 * parseFloat(item.split(" ")[0])) / 100,
                      item.split(" ")[1]
                    ] as const)) ||
                  undefined
              );
            const r: Types.ClassDetailCategory = {
              name: categories[i / 2],
              terms: weights.map(
                (weight, idx) =>
                  ({
                    weight,
                    grade: grades[idx]
                      ? {
                          number: grades[idx][0],
                          letter: grades[idx][1]
                        }
                      : undefined
                  }) satisfies Types.ClassDetailCategory["terms"][number]
              )
            };

            result!.categories.push(r);
          }

          result!.averages = [
            ...(table.querySelector("tr.listCellHighlight") as HTMLTableRowElement).children
          ]
            .slice(1)
            .map((item) => item.textContent?.trim())
            .map((item) =>
              item && item.length > 0
                ? ({
                    number: Math.round(100 * parseFloat(item.split(" ")[0])) / 100,
                    letter: item.split(" ")[1]
                  } satisfies Types.Grade)
                : undefined
            );

          result!.posted = [...rows.at(-1)!.children]
            .slice(1)
            .map((item) => item.textContent?.trim())
            .map((item) =>
              item && item.length > 0
                ? ({
                    number: Math.round(100 * parseFloat(item.split(" ")[0])) / 100,
                    letter: item.split(" ")[1]
                  } satisfies Types.Grade)
                : undefined
            );

          const finalText = [
            ...[
              ...dom.window.document.querySelectorAll(
                "div.detailContainer table tbody tr td.detailProperty.headerLabelBackground"
              )
            ].at(-1)!.parentNode!.children
          ].at(-1)!.textContent;
          if (!finalText) throw new Error("Failed to find final grade");
          if (finalText.trim().length > 1) {
            result!.final = {
              number: Math.round(parseFloat(finalText.split(" ")[0]) * 100) / 100,
              letter: finalText.split(" ")[1].trim()
            };
          }
        }

        return result;
      })(),
      (async () => {
        const initialRes = await fetch(
          "https://ma-lexington.myfollett.com/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
          {
            headers: {
              accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
              "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
              "cache-control": "no-cache",
              pragma: "no-cache",
              "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "document",
              "sec-fetch-mode": "navigate",
              "sec-fetch-site": "none",
              "sec-fetch-user": "?1",
              "upgrade-insecure-requests": "1",
              cookie
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET"
          }
        );

        if (initialRes.status !== 200) {
          throw new Error(`Failed to get initial assignments: ${initialRes.status}`);
        }

        const parseAssignements = (document: JSDOM["window"]["document"]): Types.Assignment[] => {
          const rows = [...document.querySelectorAll("#dataGrid > table > tbody > tr.listCell")];

          if (rows[0].textContent?.trim() === "No matching records") return [];

          return rows.map(
            (row) =>
              ({
                id: row.children[1].id,
                name: row.children[1].textContent!.trim(),
                assigned: row.children[2].textContent!.trim(),
                due: row.children[3].textContent!.trim(),
                weight:
                  row.children.length === 7
                    ? Math.round(parseFloat(row.children[4].textContent!.trim()) * 100) / 100
                    : undefined,
                score:
                  row.children[4].textContent!.trim() === "Ungraded"
                    ? undefined
                    : ((): Types.Assignment["score"] => {
                        const items =
                          row.children[row.children.length === 7 ? 5 : 4].querySelectorAll(
                            "table > tbody > tr > td"
                          );
                        if (items.length === 1) return;

                        const str = items[items.length - 2].textContent!.trim().split(" / ");
                        const scored = Math.round(parseFloat(str[0]) * 100) / 100;
                        const total = Math.round(parseFloat(str[1]) * 100) / 100;
                        return {
                          scored,
                          total,
                          percentage: Math.round((scored / total) * 100 * 100) / 100
                        };
                      })()
              }) satisfies Types.Assignment
          );
        };

        const document = new JSDOM(await initialRes.text()).window.document;
        const defaultTerm = parseInt(
          (document.querySelector("#gradeTermOid") as HTMLSelectElement).value.slice(-1)
        );

        if (
          !assignments ||
          (assignments.category === undefined && assignments.term === undefined) ||
          (assignments.category === "All" &&
            (assignments.term === undefined || assignments.term === defaultTerm))
        ) {
          return parseAssignements(document);
        } else {
          // for now
          return parseAssignements(document);
        }
      })()
    ] as const);

    return {
      grades,
      assignments: ass
    } satisfies Types.ClassDetail;
  };

  export const assignment = async ({
    cookie,
    assignment,
    studentID,
    token,
    onProgress
  }: {
    cookie: string;
    token: string;
    assignment: Assignment;
    studentID: string;
    onProgress?: Types.ProgressCallback;
  }): Promise<Types.AssignmentScore> => {
    const tick = progressTicker(constants.steps.assignment, onProgress);

    const preload = rewriteUrl("portalClassList.do");
    const resource = rewriteUrl(`${preload}?navkey=academics.classes.list`);
    const resourceRes = await fetch(`https://ma-lexington.myfollett.com/aspen/${resource}`, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: null,
      method: "GET"
    });

    if (resourceRes.status !== 200) {
      throw new Error(`Failed to get resource: ${resourceRes.status}`);
    }

    tick();

    const preloadRes = await fetch(`https://ma-lexington.myfollett.com/aspen/${preload}`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: `selectedStudentOid=${studentID}&userEvent=2210&org.apache.struts.taglib.html.TOKEN=${token}`,
      method: "POST"
    });

    if (preloadRes.status !== 200) {
      throw new Error(`Failed to get preload: ${preloadRes.status}`);
    }

    tick();

    const filterRes = await fetch(`https://ma-lexington.myfollett.com/aspen/${resource}`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        cookie,
        Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: `filterDefinitionId=%23%23%23all&userEvent=2060&org.apache.struts.taglib.html.TOKEN=${token}`,
      method: "POST"
    });

    if (filterRes.status !== 200) {
      throw new Error(`Failed to get filter: ${filterRes.status}`);
    }

    tick();

    const preloadRes2 = await fetch(
      `https://ma-lexington.myfollett.com/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd&oid=${assignment.sscid}&gtmoid=${assignment.gtmid}`,
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (preloadRes2.status !== 200) {
      throw new Error(`Failed to get preload2: ${preloadRes2.status}`);
    }

    tick();

    const assignmentRes = await fetch(
      `https://ma-lexington.myfollett.com/aspen/portalAssignmentDetail.do?navkey=academics.classes.list.gcd.detail&oid=${assignment.id}`,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie: cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      }
    );

    if (assignmentRes.status !== 200) {
      throw new Error(`Failed to get assignment: ${assignmentRes.status}`);
    }

    tick();

    const assignmentHtml = await assignmentRes.text();

    const dom = new JSDOM(assignmentHtml);
    let percentage = parseFloat(
      dom.window.document.querySelector(".percentFieldInlineLabel")?.textContent?.slice(0, -1) ||
        "NaN"
    );

    const [rawPoints]: [string] = [
      ...dom.window.document.querySelectorAll("td.detailValue table tbody tr td")
    ]
      .map((td) => td.textContent)
      .filter((item) => item?.includes(" / ")) as any;

    if (!rawPoints) {
      throw new Error("Failed to parse points");
    }
    const [points, maxPoints] = rawPoints.split(" / ").map((item) => parseFloat(item.trim()));

    if (Number.isNaN(percentage)) percentage = Math.round((points / maxPoints) * 100);

    tick();

    return {
      percentage,
      scored: Math.round(points * 100) / 100,
      total: maxPoints
    };
  };

  export namespace schedule {
    export const pdf = async (
      cookie: string,
      semester: Types.Schedule.Semester = 1,
      onProgress?: Types.ProgressCallback
    ): Promise<Types.Schedule.Schedule> => {
      const tick = progressTicker(constants.steps.schedule.pdf, onProgress);
      const toolRes = await fetch(
        `https://ma-lexington.myfollett.com/aspen/runTool.do?maximized=false&oid=RPT0000010rMZR&toolClass=com.follett.fsc.core.k12.beans.Report&deploymentId=ma-lexington`,
        {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
            "cache-control": "no-cache",
            pragma: "no-cache",
            "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            cookie,
            Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          body: null,
          method: "GET"
        }
      );

      if (toolRes.status !== 200) {
        throw new Error(`Failed to get tool page: ${toolRes.status} (${toolRes.statusText})`);
      }

      tick();

      const { window: toolWindow } = new JSDOM(await toolRes.text());
      const { document: toolDoc } = toolWindow;

      const toolForm = new toolWindow.FormData(toolDoc.forms["toolInputForm" as any]);
      // toolForm.set("formatStr", "0"); // we don't want csv anymore :((
      toolForm.set("userEvent", "960");

      const body = new FormData();
      for (const [key, value] of toolForm.entries()) {
        body.append(key, value);
      }

      const res = await fetch(`https://ma-lexington.myfollett.com/aspen/runTool.do`, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body,
        method: "POST"
      });

      if (res.status !== 200) {
        throw new Error(`Failed to run schedule job: ${res.status} (${res.status})`);
      }

      tick();

      const text = await res.text();
      const urlStart = "doNamedPopup('";
      const idx = text.indexOf(urlStart);
      if (idx === -1) {
        throw new Error("Failed to find schedule download URL");
      }
      const url = text.substring(
        idx + urlStart.length,
        text.indexOf("'", idx + urlStart.length + 1)
      );

      const prePdfRes = await fetch(`https://ma-lexington.myfollett.com/aspen/${url}`, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: null,
        method: "GET"
      });

      if (prePdfRes.status !== 200) {
        throw new Error(
          `Failed to prefetch schedule: ${prePdfRes.status} (${prePdfRes.statusText})`
        );
      }

      tick();

      const pdfURLStart = "rewriteUrl('";
      const prePdfText = await prePdfRes.text();
      const pdfURL = prePdfText.substring(
        prePdfText.indexOf(pdfURLStart) + pdfURLStart.length,
        prePdfText.indexOf("')", prePdfText.indexOf(pdfURLStart) + pdfURLStart.length)
      );

      const pdfRes = await fetch(pdfURL, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,und;q=0.8,es;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie,
          Referer: "https://ma-lexington.myfollett.com/aspen/home.do",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
      });

      if (pdfRes.status !== 200) {
        throw new Error(`Failed to download schedule: ${pdfRes.status} (${pdfRes.statusText})`);
      }

      tick();

      const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
      const parsed = await parser.extract(pdfBuffer, semester);
      tick();
      return parsed;
    };

    export namespace parser {
      export const pdfPromise = async (data: Buffer): Promise<import("pdf2json").Page[]> =>
        new Promise<Page[]>((res, rej) => {
          const parser = new Parser();
          parser.on("pdfParser_dataError", (errData) => rej(errData.parserError));
          parser.on("pdfParser_dataReady", (pdfData) => {
            res(pdfData.Pages);
          });

          parser.parseBuffer(data);
        });

      export const parse = async (d: Buffer) => {
        const et = (text: Text) => decodeURIComponent(text.R[0].T);

        const data = await pdfPromise(d);
        const schedulePage = data[0];
        const text = schedulePage.Texts;
        const name = et(text[0]);

        const columns = {
          1.688: "course",
          5.625: "level",
          9.313: "description",
          18.563: "room",
          21.438: "teacher",
          26.813: "term",
          29.375: "schedule",
          34.125: "credit"
        };

        const res: Types.Schedule.Course[] = [];
        const cols = Object.keys(columns).map((key) => parseFloat(key));
        const idCol = cols[0];
        const rows = text.filter((t) => t.x === idCol).map((t) => t.y);
        rows.forEach((y) => {
          const r: Record<string, string | number> = {};
          cols.forEach((col) => {
            const i = text.find((t) => t.x === col && t.y === y);
            if (i) r[columns[col as keyof typeof columns]] = et(i).trim();
          });
          if ("credit" in r) r.credit = parseInt(r.credit as string);
          res.push(r as any);
        });

        return { name, courses: res.filter((r) => r.course !== "Course") };
      };

      export const generateSchedule = (
        data: Awaited<ReturnType<typeof parse>>,
        semester: 1 | 2
      ): Types.Schedule.Schedule => {
        const schedule = [
          ["A1", "B1", "C1", "D1", "E1", "F1"],
          ["E2", "F2", "G1", "H1", "R", "D2"],
          ["B2", "A2", "G2", "H2", "I", "C2"],
          ["A3", "B3", "C3", "D3", "E3", "F3"],
          ["E4", "F4", "G3", "H3", "I", "D4"],
          ["B4", "A4", "G4", "H4", "I", "C4"]
        ].flat();
        /** @type {({...(typeof data.courses[number]), $: boolean} | null)[]} */
        const res: (null | Types.Schedule.Course)[] = Array(schedule.length).fill(null);
        const lunches: Types.Schedule.Lunch[] = Array(6).fill(3);
        data.courses.forEach((course) => {
          if (
            !course.schedule ||
            course.schedule === "I" ||
            !(course.term === "ALL" || course.term === `S ${semester}`) ||
            course.schedule.length === 0
          )
            return;
          if (course.schedule === "HR") {
            res[schedule.findIndex((b) => b === "R")] = JSON.parse(JSON.stringify(course));
            return;
          }
          const blocks: [string, boolean, ...number[]][] = [];
          for (const char of course.schedule.split("")) {
            if (char === "$") {
              blocks.at(-1)![1] = true;
            } else if ("1234".includes(char)) blocks.at(-1)!.push(parseInt(char));
            else blocks.push([char, false]);
          }
          blocks.forEach((block) => {
            if (block.length === 2) block.push(1, 2, 3, 4);
          });
          schedule.forEach((block, i) => {
            blocks.forEach((b) => {
              const code = block[0],
                day = parseInt(block[1]);
              if (b[0] === code && b.slice(2).includes(day))
                res[i] = {
                  ...course,
                  $: b[1],
                  block: block[0] + (b[1] ? "$" : "") + day.toString()
                };
            });
          });
        });
        for (let i = 0; i < 6; i++) {
          const $s = res
            .slice(i * 6, (i + 1) * 6)
            .filter((item, idx) => item?.$ && (idx === 2 || idx === 3));
          lunches[i] = (3 - $s.length) as any;
        }

        return { semester, lunches, schedule: res };
      };

      export const extract = (data: Buffer, semester: 1 | 2): Promise<Types.Schedule.Schedule> =>
        parse(data).then((data) => generateSchedule(data, semester));
    }
  }
}
