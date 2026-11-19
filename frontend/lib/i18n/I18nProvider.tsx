// SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE,
	type Locale,
	normalizeLocale,
	translate,
} from './messages';

type I18nContextValue = {
	locale: Locale;
	/** Translate a message key; falls back to English, then to the key itself. */
	t: (key: string, vars?: Record<string, string | number>) => string;
	setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Holds the active locale for the app.
 *
 * The initial value is resolved on the server (cookie, then Accept-Language) and
 * handed down, so the first paint is already in the right language — switching
 * only mutates client state and writes the cookie for the next request. No flash
 * of English, and no hydration mismatch.
 */
export const I18nProvider = ({
	initialLocale = DEFAULT_LOCALE,
	children,
}: {
	initialLocale?: Locale;
	children: ReactNode;
}) => {
	const [locale, setLocaleState] = useState<Locale>(initialLocale);

	useEffect(() => {
		document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
	}, [locale]);

	const setLocale = useCallback((next: Locale) => {
		const normalized = normalizeLocale(next) ?? DEFAULT_LOCALE;
		setLocaleState(normalized);
		try {
			document.cookie = `${LOCALE_COOKIE}=${normalized}; path=/; max-age=31536000; samesite=lax`;
		} catch {
			/* cookie blocked — the choice lasts for this page only */
		}
		// Reload so the server renders the new locale and the runtime translation
		// pass starts from a clean DOM (it rewrites text in place and cannot undo).
		if (typeof window !== 'undefined') window.location.reload();
	}, []);

	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			t: (key, vars) => translate(locale, key, vars),
			setLocale,
		}),
		[locale, setLocale],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Read the active locale and translator.
 *
 * Falls back to English outside the provider so a component that renders in an
 * isolated test or a bare route still works instead of throwing.
 */
export const useI18n = (): I18nContextValue => {
	const context = useContext(I18nContext);
	if (context) return context;
	return {
		locale: DEFAULT_LOCALE,
		t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
		setLocale: () => undefined,
	};
};
