import { get } from "svelte/store";

import {
  type Renderable,
  type ToastOptions,
  toast as _toast
} from "svelte-french-toast";

import { theme } from "./theme";

const style =
  "border: 2px solid #FFFFFF; color: #FFFFFF; background-color: #000000;";

const iconTheme = {
  primary: "#FFFFFF",
  secondary: "#000000"
};
export namespace toast {
  namespace themes {
    interface Theme {
      style: string;
      iconTheme: {
        primary: string;
        secondary: string;
      };
    }
    export const zoron: Partial<Theme> = {};
    export const amoled: Partial<Theme> = {
      style:
        "border: 2px solid #FFFFFF; color: #FFFFFF; background-color: #000000;",
      iconTheme: {
        primary: "#FFFFFF",
        secondary: "#000000"
      }
    };

    export const current = () => {
      const t = get(theme);
      if (t === "zoron") return themes.zoron;
      return themes.amoled;
    };
  }
  export const success: typeof _toast.success = (message, options) =>
    _toast.success(message, {
      ...themes.current(),
      position: "bottom-right",
      ...options
    });
  export const error: typeof _toast.error = (message, options) =>
    _toast.error(message, {
      ...themes.current(),
      position: "bottom-right",
      ...options
    });
  export const loading: (
    message: Renderable,
    options?: Omit<ToastOptions, "className">
  ) => { dismiss: () => void; update: (content: string) => void } = (
    message,
    options
  ) => {
    const randomID = `toast-${Math.random().toString(36).substring(7)}`;
    const id = _toast.loading(message, {
      ...themes.current(),
      position: "bottom-right",
      ...options,
      className: randomID
    });

    return {
      dismiss: () => _toast.dismiss(id),
      update: (content) => {
        const toast = document.querySelector(`.${randomID}`)?.children[1];
        if (toast) {
          toast.innerHTML = content;
        }
      }
    };
  };
  export const custom: typeof _toast.custom = (message, options) =>
    _toast.custom(message, {
      ...themes.current,
      position: "bottom-right",
      ...options
    });
  export const dismiss = _toast.dismiss;
}
