export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32')
];

export const server_loads = [0,2,3,4,5];

export const dictionary = {
		"/": [~6],
		"/account": [7,[2]],
		"/account/friends": [~8,[2]],
		"/account/passkeys": [~9,[2]],
		"/account/password": [10,[2]],
		"/account/settings": [~11,[2]],
		"/account/update": [12,[2]],
		"/changelog": [13],
		"/forgor": [~14],
		"/home": [~15,[3]],
		"/home/activity": [16,[3]],
		"/home/admin": [~17,[3,4]],
		"/home/admin/logs": [18,[3,4]],
		"/home/chat": [19,[3,5]],
		"/home/chat/chat/[id]": [20,[3,5]],
		"/home/grades": [21,[3]],
		"/home/schedule": [22,[3]],
		"/launch": [~23],
		"/legal/privacy": [24],
		"/legal/tos": [25],
		"/login": [~26],
		"/logout": [~27],
		"/privacy": [~28],
		"/register": [~29],
		"/tos": [~30],
		"/verify": [~31],
		"/verify/confirm": [32]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';