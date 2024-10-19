import { parseStringPromise } from "xml2js";
import { JSDOM } from "jsdom";
import type { AuthResponse, Assignment, RecentActivityList, Attendance } from "./types";
import { encrypt as _encrypt, decrypt as _decrypt } from "./crypt";

export namespace aspen {
  export namespace Types {
    export type ProgressCallback = (step: number, total: number) => void;

    export interface Name {
      first: string;
      last: string;
    }
    export interface Assignment {
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
      grade?: {
        points: number;
        letter: string;
      };
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
        grade?: {
          number: number;
          letter: string;
        };
      }[];
    }

    export interface ClassDetail {
      grades: ClassDetailCategory[];
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
          points: Math.round(parseFloat(getItem(6).split(" ")[0]) * 100) / 100,
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
    onProgress
  }: {
    cookie: string;
    classID: string;
    onProgress?: Types.ProgressCallback;
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

    const text = await res.text();
    const dom = new JSDOM(text);

    const table = [...dom.window.document.querySelectorAll("table")]
      .filter((item) => item.textContent?.includes("Average Summary"))
      .at(-1);

    if (!table) throw new Error("Failed to find data table");
    const rows = [...table.querySelectorAll("tr.listCell")].slice(0, -1);
    const categories = [...table.querySelectorAll('td[rowspan="2"]')]
      .map((item) => item.textContent?.trim()!)
      .filter((i) => i);

    const result: Types.ClassDetail = {
      grades: []
    };

    for (let i = 0; i < categories.length * 2; i += 2) {
      const weights = [...rows[i].children]
        .slice(2)
        .map((item) => item.textContent?.trim())
        .map((item) => item === 'N/A' ? undefined : Math.round(100 * parseFloat(item?.slice(0, -1)!)) / 100);
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

      result.grades.push(r);
    }

    return result;
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
  }): Promise<Types.Assignment> => {
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
}
