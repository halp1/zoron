export interface ChangelogEntry {
	version: `${number}.${number}.${number}`;
	date: `${number}${number}/${number}${number}/${number}${number}${number}${number}`;
	overview: string;
	changes: string[];
	bugfixes: string[];
}