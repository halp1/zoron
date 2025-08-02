import { error as _error } from "@sveltejs/kit";

export namespace api {
  export const error = (message: string, code: number) => {
    _error(code, JSON.stringify({ success: false, error: message }));
  };

  export const json = <T>(data?: T) => {
    return Response.json({ success: true, data });
  };
}
