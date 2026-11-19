// SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

'use client';

import { LOCALES, LOCALE_SHORT, LOCALE_LABELS } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Two-state language toggle. Switching reloads the page: the translations that
 * are applied at render time come from the server (cookie), and the runtime
 * pass over already-rendered text cannot be undone reliably, so a reload is the
 * cheapest way to land in a fully consistent state.
 */
export const LanguageSwitcher = () => {
	const { locale, setLocale, t } = useI18n();

	return (
		<div
			role="group"
			aria-label={t('common.language')}
			title={t('common.language')}
			className="flex items-center rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700"
		>
			{LOCALES.map((option) => {
				const isActive = option === locale;
				return (
					<button
						key={option}
						type="button"
						onClick={() => setLocale(option)}
						aria-pressed={isActive}
						aria-label={LOCALE_LABELS[option]}
						title={LOCALE_LABELS[option]}
						className={`min-w-7 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors ${
							isActive
								? 'bg-[#76b900]/15 text-[#76b900]'
								: 'text-secondary hover:text-heading dark:hover:text-zinc-200'
						}`}
					>
						{LOCALE_SHORT[option]}
					</button>
				);
			})}
		</div>
	);
};
