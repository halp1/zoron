import {toast as _toast} from 'svelte-french-toast';

export namespace toast {
	export const success: typeof _toast.success = (message, options) =>
    _toast.success(message, { position: "bottom-right", ...options });
	export const error: typeof _toast.error = (message, options) =>
    _toast.error(message, { position: "bottom-right", ...options });
	export const loading: typeof _toast.loading = (message, options) =>
    _toast.loading(message, { position: "bottom-right", ...options });
	export const custom: typeof _toast.custom = (message, options) =>
    _toast.custom(message, { position: "bottom-right", ...options });
}