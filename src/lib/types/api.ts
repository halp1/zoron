export namespace StreamAPI {
  export interface Progress {
    type: "progress";
    step: number;
    total: number;
  }

  export interface Response<T> {
    type: "response";
    data: T;
  }

  export interface Error {
    type: "error";
    error: string;
    code: number;
  }

  export type Message<T> = Progress | Response<T> | Error;
}
