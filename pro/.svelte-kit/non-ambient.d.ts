
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/account" | "/account/friends" | "/account/passkeys" | "/account/password" | "/account/settings" | "/account/update" | "/api" | "/api/account" | "/api/account/delete" | "/api/account/login" | "/api/account/markAsRead" | "/api/account/passkeys" | "/api/account/passkeys/auth" | "/api/account/passkeys/auth/options" | "/api/account/passkeys/auth/verify" | "/api/account/passkeys/delete" | "/api/account/passkeys/options" | "/api/account/passkeys/verify" | "/api/account/password" | "/api/account/settings" | "/api/account/settings/profile-picture" | "/api/account/subscribe" | "/api/account/unsubscribe" | "/api/account/update" | "/api/admin" | "/api/admin/copy-user" | "/api/admin/impersonate" | "/api/admin/impersonate/token" | "/api/admin/logs" | "/api/admin/logs/stream" | "/api/admin/time-delta" | "/api/admin/upgrade" | "/api/aspen" | "/api/aspen/activity" | "/api/aspen/assignment" | "/api/aspen/assignment/all" | "/api/aspen/classes" | "/api/aspen/class" | "/api/aspen/schedule" | "/api/aspen/schedule/gen" | "/api/aspen/transcript" | "/api/hideFooter" | "/api/home" | "/api/home/launch" | "/api/social" | "/api/social/accept" | "/api/social/remove" | "/api/social/request" | "/api/social/schedules" | "/api/social/schedules/[id]" | "/api/verify" | "/api/verify/fwd" | "/api/verify/init" | "/changelog" | "/forgor" | "/home" | "/home/activity" | "/home/admin" | "/home/admin/logs" | "/home/chat" | "/home/chat/chat" | "/home/chat/chat/[id]" | "/home/grades" | "/home/schedule" | "/launch" | "/legal" | "/legal/privacy" | "/legal/tos" | "/login" | "/logout" | "/privacy" | "/register" | "/tos" | "/verify" | "/verify/confirm";
		RouteParams(): {
			"/api/social/schedules/[id]": { id: string };
			"/home/chat/chat/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/account": Record<string, never>;
			"/account/friends": Record<string, never>;
			"/account/passkeys": Record<string, never>;
			"/account/password": Record<string, never>;
			"/account/settings": Record<string, never>;
			"/account/update": Record<string, never>;
			"/api": { id?: string };
			"/api/account": Record<string, never>;
			"/api/account/delete": Record<string, never>;
			"/api/account/login": Record<string, never>;
			"/api/account/markAsRead": Record<string, never>;
			"/api/account/passkeys": Record<string, never>;
			"/api/account/passkeys/auth": Record<string, never>;
			"/api/account/passkeys/auth/options": Record<string, never>;
			"/api/account/passkeys/auth/verify": Record<string, never>;
			"/api/account/passkeys/delete": Record<string, never>;
			"/api/account/passkeys/options": Record<string, never>;
			"/api/account/passkeys/verify": Record<string, never>;
			"/api/account/password": Record<string, never>;
			"/api/account/settings": Record<string, never>;
			"/api/account/settings/profile-picture": Record<string, never>;
			"/api/account/subscribe": Record<string, never>;
			"/api/account/unsubscribe": Record<string, never>;
			"/api/account/update": Record<string, never>;
			"/api/admin": Record<string, never>;
			"/api/admin/copy-user": Record<string, never>;
			"/api/admin/impersonate": Record<string, never>;
			"/api/admin/impersonate/token": Record<string, never>;
			"/api/admin/logs": Record<string, never>;
			"/api/admin/logs/stream": Record<string, never>;
			"/api/admin/time-delta": Record<string, never>;
			"/api/admin/upgrade": Record<string, never>;
			"/api/aspen": Record<string, never>;
			"/api/aspen/activity": Record<string, never>;
			"/api/aspen/assignment": Record<string, never>;
			"/api/aspen/assignment/all": Record<string, never>;
			"/api/aspen/classes": Record<string, never>;
			"/api/aspen/class": Record<string, never>;
			"/api/aspen/schedule": Record<string, never>;
			"/api/aspen/schedule/gen": Record<string, never>;
			"/api/aspen/transcript": Record<string, never>;
			"/api/hideFooter": Record<string, never>;
			"/api/home": Record<string, never>;
			"/api/home/launch": Record<string, never>;
			"/api/social": { id?: string };
			"/api/social/accept": Record<string, never>;
			"/api/social/remove": Record<string, never>;
			"/api/social/request": Record<string, never>;
			"/api/social/schedules": { id?: string };
			"/api/social/schedules/[id]": { id: string };
			"/api/verify": Record<string, never>;
			"/api/verify/fwd": Record<string, never>;
			"/api/verify/init": Record<string, never>;
			"/changelog": Record<string, never>;
			"/forgor": Record<string, never>;
			"/home": { id?: string };
			"/home/activity": Record<string, never>;
			"/home/admin": Record<string, never>;
			"/home/admin/logs": Record<string, never>;
			"/home/chat": { id?: string };
			"/home/chat/chat": { id?: string };
			"/home/chat/chat/[id]": { id: string };
			"/home/grades": Record<string, never>;
			"/home/schedule": Record<string, never>;
			"/launch": Record<string, never>;
			"/legal": Record<string, never>;
			"/legal/privacy": Record<string, never>;
			"/legal/tos": Record<string, never>;
			"/login": Record<string, never>;
			"/logout": Record<string, never>;
			"/privacy": Record<string, never>;
			"/register": Record<string, never>;
			"/tos": Record<string, never>;
			"/verify": Record<string, never>;
			"/verify/confirm": Record<string, never>
		};
		Pathname(): "/" | "/account" | "/account/friends" | "/account/passkeys" | "/account/password" | "/account/settings" | "/account/update" | "/api" | "/api/account" | "/api/account/delete" | "/api/account/login" | "/api/account/markAsRead" | "/api/account/passkeys" | "/api/account/passkeys/auth" | "/api/account/passkeys/auth/options" | "/api/account/passkeys/auth/verify" | "/api/account/passkeys/delete" | "/api/account/passkeys/options" | "/api/account/passkeys/verify" | "/api/account/password" | "/api/account/settings" | "/api/account/settings/profile-picture" | "/api/account/subscribe" | "/api/account/unsubscribe" | "/api/account/update" | "/api/admin" | "/api/admin/copy-user" | "/api/admin/impersonate" | "/api/admin/impersonate/token" | "/api/admin/logs" | "/api/admin/logs/stream" | "/api/admin/time-delta" | "/api/admin/upgrade" | "/api/aspen" | "/api/aspen/activity" | "/api/aspen/assignment" | "/api/aspen/assignment/all" | "/api/aspen/classes" | "/api/aspen/class" | "/api/aspen/schedule" | "/api/aspen/schedule/gen" | "/api/aspen/transcript" | "/api/hideFooter" | "/api/home" | "/api/home/launch" | "/api/social" | "/api/social/accept" | "/api/social/remove" | "/api/social/request" | "/api/social/schedules" | `/api/social/schedules/${string}` & {} | "/api/verify" | "/api/verify/fwd" | "/api/verify/init" | "/changelog" | "/forgor" | "/home" | "/home/activity" | "/home/admin" | "/home/admin/logs" | "/home/chat" | "/home/chat/chat" | `/home/chat/chat/${string}` & {} | "/home/grades" | "/home/schedule" | "/launch" | "/legal" | "/legal/privacy" | "/legal/tos" | "/login" | "/logout" | "/privacy" | "/register" | "/tos" | "/verify" | "/verify/confirm";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/apple-touch-icon-precomposed.png" | "/apple-touch-icon.png" | "/favicon-48x48.png" | "/favicon.ico" | "/favicon.png" | "/fonts/suse/bold.ttf" | "/fonts/suse/regular.ttf" | "/icons/icon-128x128.png" | "/icons/icon-144x144.png" | "/icons/icon-152x152.png" | "/icons/icon-192x192.png" | "/icons/icon-384x384.png" | "/icons/icon-512x512.png" | "/icons/icon-72x72.png" | "/icons/icon-96x96.png" | "/robots.txt" | "/screenshots/desktop.png" | "/screenshots/mobile.png" | "/seo/og-image.png" | "/site.webmanifest" | "/web-app-manifest-192x192.png" | "/web-app-manifest-512x512.png";
	}
}