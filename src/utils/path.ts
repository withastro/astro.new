import { posix } from 'node:path';

export function prependSlash(path: string) {
	return path.startsWith('/') ? path : `/${path}`;
}

export function joinPath(...parts: string[]) {
	return prependSlash(posix.join(...parts));
}
