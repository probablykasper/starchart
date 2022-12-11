type ShortcutOptions = {
	shift?: boolean
	alt?: boolean
	cmdOrCtrl?: boolean
}
let isMac: boolean | undefined

export function checkModifiers(e: KeyboardEvent | MouseEvent, options: ShortcutOptions = {}) {
	if (isMac === undefined) {
		isMac = navigator.userAgent.indexOf('Mac') != -1
	}

	const target = {
		shift: options.shift || false,
		alt: options.alt || false,
		ctrl: (!isMac && options.cmdOrCtrl) || false,
		meta: (isMac && options.cmdOrCtrl) || false,
	}

	const pressed = {
		shift: !!e.shiftKey,
		alt: !!e.altKey,
		ctrl: !!e.ctrlKey,
		meta: !!e.metaKey,
	}

	return (
		pressed.shift === target.shift &&
		pressed.alt === target.alt &&
		pressed.ctrl === target.ctrl &&
		pressed.meta === target.meta
	)
}

export function checkShortcut(e: KeyboardEvent, key: string, options: ShortcutOptions = {}) {
	if (e.key.toUpperCase() !== key.toUpperCase()) return false
	return checkModifiers(e, options)
}
export function checkMouseShortcut(e: MouseEvent, options: ShortcutOptions = {}) {
	return checkModifiers(e, options)
}
