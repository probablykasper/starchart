type ShortcutOptions = {
	shift?: boolean
	alt?: boolean
	cmdOrCtrl?: boolean
}
let is_mac: boolean | undefined

export function check_modifiers(e: KeyboardEvent | MouseEvent, options: ShortcutOptions = {}) {
	if (is_mac === undefined) {
		is_mac = navigator.userAgent.indexOf('Mac') != -1
	}

	const target = {
		shift: options.shift || false,
		alt: options.alt || false,
		ctrl: (!is_mac && options.cmdOrCtrl) || false,
		meta: (is_mac && options.cmdOrCtrl) || false,
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

export function check_shortcut(e: KeyboardEvent, key: string, options: ShortcutOptions = {}) {
	if (e.key.toUpperCase() !== key.toUpperCase()) return false
	return check_modifiers(e, options)
}
export function check_mouse_shortcut(e: MouseEvent, options: ShortcutOptions = {}) {
	return check_modifiers(e, options)
}
