export const STARLIGHT_NAME_PREFIX = 'starlight-';

export function isStarlightName(name: string) {
	return name.startsWith(STARLIGHT_NAME_PREFIX);
}

export function toStarlightName(name: string) {
	return `${STARLIGHT_NAME_PREFIX}${name}`;
}

const STARLIGHT_PREFIX_REGEX = new RegExp(`^${STARLIGHT_NAME_PREFIX}`);
export function fromStarlightName(name: string) {
	return name.replace(STARLIGHT_PREFIX_REGEX, '');
}
