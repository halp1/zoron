import Parser, { type Page, type Text } from "pdf2json";

export namespace aspen {
  export namespace Types {
    export type ProgressCallback = (step: number, total: number) => void;

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

  const progressTicker = (steps: number, cb?: Types.ProgressCallback) => {
    let step = 0;
    return () => {
      step++;
      cb && cb(step, steps);
    };
  };

  export namespace schedule {
    export namespace parser {
      export const pdfPromise = async (
        data: Buffer
      ): Promise<import("pdf2json").Page[]> =>
        new Promise<Page[]>((res, rej) => {
          const parser = new Parser();
          parser.on("pdfParser_dataError", (errData) =>
            rej(errData.parserError)
          );
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
        const res: (null | Types.Schedule.Course)[] = Array(
          schedule.length
        ).fill(null);
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
            res[schedule.findIndex((b) => b === "R")] = JSON.parse(
              JSON.stringify(course)
            );
            return;
          }
          const blocks: [string, boolean, ...number[]][] = [];
          for (const char of course.schedule.split("")) {
            if (char === "$") {
              blocks.at(-1)![1] = true;
            } else if ("1234".includes(char))
              blocks.at(-1)!.push(parseInt(char));
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

      export const extract = (
        data: Buffer,
        semester: 1 | 2
      ): Promise<Types.Schedule.Schedule> =>
        parse(data).then((data) => generateSchedule(data, semester));
    }
  }
}
