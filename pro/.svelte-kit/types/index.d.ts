type DynamicRoutes = {
	"/api/social/schedules/[id]": { id: string };
	"/home/chat/chat/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/account": undefined;
	"/account/friends": undefined;
	"/account/passkeys": undefined;
	"/account/password": undefined;
	"/account/settings": undefined;
	"/account/update": undefined;
	"/api": { id?: string };
	"/api/account": undefined;
	"/api/account/delete": undefined;
	"/api/account/login": undefined;
	"/api/account/markAsRead": undefined;
	"/api/account/passkeys": undefined;
	"/api/account/passkeys/auth": undefined;
	"/api/account/passkeys/auth/options": undefined;
	"/api/account/passkeys/auth/verify": undefined;
	"/api/account/passkeys/delete": undefined;
	"/api/account/passkeys/options": undefined;
	"/api/account/passkeys/verify": undefined;
	"/api/account/password": undefined;
	"/api/account/settings": undefined;
	"/api/account/settings/profile-picture": undefined;
	"/api/account/subscribe": undefined;
	"/api/account/unsubscribe": undefined;
	"/api/account/update": undefined;
	"/api/admin": undefined;
	"/api/admin/copy-user": undefined;
	"/api/admin/impersonate": undefined;
	"/api/admin/impersonate/token": undefined;
	"/api/admin/logs": undefined;
	"/api/admin/logs/stream": undefined;
	"/api/admin/time-delta": undefined;
	"/api/admin/upgrade": undefined;
	"/api/aspen": undefined;
	"/api/aspen/activity": undefined;
	"/api/aspen/assignment": undefined;
	"/api/aspen/assignment/all": undefined;
	"/api/aspen/classes": undefined;
	"/api/aspen/class": undefined;
	"/api/aspen/schedule": undefined;
	"/api/aspen/schedule/gen": undefined;
	"/api/aspen/transcript": undefined;
	"/api/hideFooter": undefined;
	"/api/home": undefined;
	"/api/home/launch": undefined;
	"/api/social": { id?: string };
	"/api/social/accept": undefined;
	"/api/social/remove": undefined;
	"/api/social/request": undefined;
	"/api/social/schedules": { id?: string };
	"/api/social/schedules/[id]": { id: string };
	"/api/verify": undefined;
	"/api/verify/fwd": undefined;
	"/api/verify/init": undefined;
	"/changelog": undefined;
	"/forgor": undefined;
	"/home": { id?: string };
	"/home/activity": undefined;
	"/home/admin": undefined;
	"/home/admin/logs": undefined;
	"/home/chat": { id?: string };
	"/home/chat/chat": { id?: string };
	"/home/chat/chat/[id]": { id: string };
	"/home/grades": undefined;
	"/home/schedule": undefined;
	"/launch": undefined;
	"/legal": undefined;
	"/legal/privacy": undefined;
	"/legal/tos": undefined;
	"/login": undefined;
	"/logout": undefined;
	"/privacy": undefined;
	"/register": undefined;
	"/tos": undefined;
	"/verify": undefined;
	"/verify/confirm": undefined
};

export type RouteId = "/" | "/account" | "/account/friends" | "/account/passkeys" | "/account/password" | "/account/settings" | "/account/update" | "/api" | "/api/account" | "/api/account/delete" | "/api/account/login" | "/api/account/markAsRead" | "/api/account/passkeys" | "/api/account/passkeys/auth" | "/api/account/passkeys/auth/options" | "/api/account/passkeys/auth/verify" | "/api/account/passkeys/delete" | "/api/account/passkeys/options" | "/api/account/passkeys/verify" | "/api/account/password" | "/api/account/settings" | "/api/account/settings/profile-picture" | "/api/account/subscribe" | "/api/account/unsubscribe" | "/api/account/update" | "/api/admin" | "/api/admin/copy-user" | "/api/admin/impersonate" | "/api/admin/impersonate/token" | "/api/admin/logs" | "/api/admin/logs/stream" | "/api/admin/time-delta" | "/api/admin/upgrade" | "/api/aspen" | "/api/aspen/activity" | "/api/aspen/assignment" | "/api/aspen/assignment/all" | "/api/aspen/classes" | "/api/aspen/class" | "/api/aspen/schedule" | "/api/aspen/schedule/gen" | "/api/aspen/transcript" | "/api/hideFooter" | "/api/home" | "/api/home/launch" | "/api/social" | "/api/social/accept" | "/api/social/remove" | "/api/social/request" | "/api/social/schedules" | "/api/social/schedules/[id]" | "/api/verify" | "/api/verify/fwd" | "/api/verify/init" | "/changelog" | "/forgor" | "/home" | "/home/activity" | "/home/admin" | "/home/admin/logs" | "/home/chat" | "/home/chat/chat" | "/home/chat/chat/[id]" | "/home/grades" | "/home/schedule" | "/launch" | "/legal" | "/legal/privacy" | "/legal/tos" | "/login" | "/logout" | "/privacy" | "/register" | "/tos" | "/verify" | "/verify/confirm";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/account" | "/account/friends" | "/account/passkeys" | "/account/password" | "/account/settings" | "/account/update" | "/api" | "/api/account" | "/api/account/delete" | "/api/account/login" | "/api/account/markAsRead" | "/api/account/passkeys" | "/api/account/passkeys/auth" | "/api/account/passkeys/auth/options" | "/api/account/passkeys/auth/verify" | "/api/account/passkeys/delete" | "/api/account/passkeys/options" | "/api/account/passkeys/verify" | "/api/account/password" | "/api/account/settings" | "/api/account/settings/profile-picture" | "/api/account/subscribe" | "/api/account/unsubscribe" | "/api/account/update" | "/api/admin" | "/api/admin/copy-user" | "/api/admin/impersonate" | "/api/admin/impersonate/token" | "/api/admin/logs" | "/api/admin/logs/stream" | "/api/admin/time-delta" | "/api/admin/upgrade" | "/api/aspen" | "/api/aspen/activity" | "/api/aspen/assignment" | "/api/aspen/assignment/all" | "/api/aspen/classes" | "/api/aspen/class" | "/api/aspen/schedule" | "/api/aspen/schedule/gen" | "/api/aspen/transcript" | "/api/hideFooter" | "/api/home" | "/api/home/launch" | "/api/social" | "/api/social/accept" | "/api/social/remove" | "/api/social/request" | "/api/social/schedules" | `/api/social/schedules/${string}` & {} | "/api/verify" | "/api/verify/fwd" | "/api/verify/init" | "/changelog" | "/forgor" | "/home" | "/home/activity" | "/home/admin" | "/home/admin/logs" | "/home/chat" | "/home/chat/chat" | `/home/chat/chat/${string}` & {} | "/home/grades" | "/home/schedule" | "/launch" | "/legal" | "/legal/privacy" | "/legal/tos" | "/login" | "/logout" | "/privacy" | "/register" | "/tos" | "/verify" | "/verify/confirm";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/apple-touch-icon-precomposed.png" | "/apple-touch-icon.png" | "/favicon-48x48.png" | "/favicon.ico" | "/favicon.png" | "/fonts/suse/bold.ttf" | "/fonts/suse/regular.ttf" | "/icons/icon-128x128.png" | "/icons/icon-144x144.png" | "/icons/icon-152x152.png" | "/icons/icon-192x192.png" | "/icons/icon-384x384.png" | "/icons/icon-512x512.png" | "/icons/icon-72x72.png" | "/icons/icon-96x96.png" | "/robots.txt" | "/screenshots/desktop.png" | "/screenshots/mobile.png" | "/seo/og-image.png" | "/site.webmanifest" | "/web-app-manifest-192x192.png" | "/web-app-manifest-512x512.png";