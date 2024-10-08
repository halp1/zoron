import { parseStringPromise } from "xml2js";
import { JSDOM } from "jsdom";
import type { AuthResponse, Assignment, RecentActivityList } from "./types";

export namespace aspen {
  const getCookies = (res: Response) =>
    [...res.headers.entries()]
      .filter(([name]) => name === "set-cookie")
      .map(([_, value]) => value)
      .map((value) => processCookie(value));

  const processCookie = (cookie: string) => {
    return cookie.split(";")[0];
  };

  export const authenticate = async (username: string, password: string) => {
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

    cookie = `${cookie}; ${getCookies(sessionRes)[0]}`;

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
      throw new Error("Invalid credentials");
    }

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

    const homeText = await homeRes.text();
    const tokenSearch = homeText.match(
      /<input type="hidden" name="org.apache.struts.taglib.html.TOKEN" value="(.+?)"/
    );
    if (!tokenSearch) {
      throw new Error("Failed to find token");
    }
    const token = tokenSearch[1];

    return { cookie, token };
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
    require("fs").writeFileSync("activity.html", activityXml);
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

    const mergedActivity = [...attendence, ...grades].sort(
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

  export const assignment = async ({
    cookie,
    assignment,
    studentID,
    token
  }: {
    cookie: string;
    token: string;
    assignment: Assignment;
    studentID: string;
  }) => {
    // goStudentFilteredList(
    //   "STD000000DgYFr",
    //   "portalClassList.do",
    //   "academics.classes.list",
    //   null,
    //   function () {
    //     applyAllRecordsFilter(
    //       "portalClassList.do?navKey=academics.classes.list",
    //       function () {
    //         goPreLoad(
    //           "portalAssignmentList.do?navkey=academics.classes.list.gcd&oid=SSC0000016IDiz&gtmoid=gtmX20000000T1",
    //           "portalAssignmentDetail.do?navkey=academics.classes.list.gcd.detail&oid=GCD0000017PfFO"
    //         );
    //       }
    //     );
    //   }
    // );

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

    const assignmentHtml = await assignmentRes.text();

    const dom = new JSDOM(assignmentHtml);
    const percentage = parseFloat(
      dom.window.document.querySelector(".percentFieldInlineLabel")?.textContent?.slice(0, -1) ||
        "NaN"
    );

    const [rawPoints]: [string] = [
      ...dom.window.document.querySelectorAll("td.detailValue table tbody tr td")
    ]
      .map((td) => td.textContent)
      .filter((item) => item?.includes(" / ")) as any;
    if (!rawPoints || !percentage) {
      throw new Error("Failed to parse points");
    }
    const [points, maxPoints] = rawPoints.split(" / ").map((item) => parseFloat(item.trim()));

    return {
      percentage,
      scored: points,
      total: maxPoints
    };
  };
}
