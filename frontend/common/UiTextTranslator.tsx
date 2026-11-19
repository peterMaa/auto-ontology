// SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { translateDom } from '@/lib/i18n/dom-translate';

/**
 * Applies the Chinese dictionary to already-rendered markup.
 *
 * Most administration screens carry hundreds of literal strings across dozens of
 * components; translating them at each call site is a large, error-prone edit.
 * This instead rewrites the DOM in place using exact matches only, which keeps
 * user data intact (see `dom-translate` for the skip rules).
 *
 * A MutationObserver re-applies it when React renders new nodes, which is what
 * makes it survive modals, tab switches and list growth. It runs only for
 * Chinese; English is the source text.
 *
 * Known limits: text built at runtime (template strings, model output) stays
 * English, and React re-rendering an already-translated node can revert it until
 * that subtree mounts again.
 */
export const UiTextTranslator = () => {
	const { locale } = useI18n();

	useEffect(() => {
		if (locale !== 'zh' || typeof document === 'undefined') return;

		translateDom(document.body, document);

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === 1 || node.nodeType === 3) {
						translateDom(node.parentNode ?? document.body, document);
					}
				});
			}
		});
		// childList only: our own text rewrites must not re-trigger the observer.
		observer.observe(document.body, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [locale]);

	return null;
};
