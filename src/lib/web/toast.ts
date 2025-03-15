import {
  type Renderable,
  type ToastOptions,
  toast as _toast
} from "svelte-french-toast";

export namespace toast {
  export const success: typeof _toast.success = (message, options) =>
    _toast.success(message, { position: "bottom-right", ...options });
  export const error: typeof _toast.error = (message, options) =>
    _toast.error(message, { position: "bottom-right", ...options });
  export const loading: (
    message: Renderable,
    options?: Omit<ToastOptions, "className">
  ) => { dismiss: () => void; update: (content: string) => void } = (
    message,
    options
  ) => {
    const randomID = `toast-${Math.random().toString(36).substring(7)}`;
    const id = _toast.loading(message, {
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
    _toast.custom(message, { position: "bottom-right", ...options });
  export const dismiss = _toast.dismiss;
}
