// SPDX-FileCopyrightText: Copyright (c) 2024-2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
	useCallback,
	useRef,
	useState,
	type KeyboardEvent,
	type FormEvent,
	type MouseEvent,
} from 'react';
import { Button } from '@/common/Button';
import { Size, ButtonTheme } from '@/enums/button';
import { Icon, IconName } from '@/common/icons';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type ReasoningModelOption = {
	/** Profile id the backend accepts as `reasoning_model`. */
	id: string;
	/** Human label, e.g. "NVIDIA NIM". */
	label: string;
	/** False when the deployment has no endpoint/key for it yet. */
	available?: boolean;
};

type ChatInputProps = {
	/** Resolves false when the question was refused, so the text can be restored. */
	onSend: (text: string) => Promise<boolean>;
	onStop: () => void;
	isLoading: boolean;
	/** Selectable reasoning profiles. Fewer than two hides the picker. */
	reasoningModels?: ReasoningModelOption[];
	selectedReasoningModel?: string;
	onSelectReasoningModel?: (id: string) => void;
};

export const ChatInput = ({
	onSend,
	onStop,
	isLoading,
	reasoningModels = [],
	selectedReasoningModel = '',
	onSelectReasoningModel,
}: ChatInputProps) => {
	const { t } = useI18n();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	// Track whether the textarea currently has any non-whitespace text so the
	// Send button can be disabled/greyed-out when there's nothing to send.
	// We intentionally keep the textarea uncontrolled (perf + caret behaviour)
	// and only mirror the empty/non-empty flag into React state.
	const [hasText, setHasText] = useState(false);

	const resetHeight = () => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	};

	const handleInput = useCallback((e: FormEvent<HTMLTextAreaElement>) => {
		resetHeight();
		setHasText(e.currentTarget.value.trim().length > 0);
	}, []);

	const handleSubmit = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();
			const el = textareaRef.current;
			if (!el) return;
			const text = el.value.trim();
			if (!text || isLoading) return;

			// Clear straight away so sending feels immediate, then put the text
			// back if the backend refused it — a rejected question is never added
			// to the transcript, so discarding it would lose it entirely.
			el.value = '';
			el.style.height = 'auto';
			setHasText(false);

			const accepted = await onSend(text);
			if (accepted) return;

			const target = textareaRef.current;
			if (!target || target.value.trim()) return;
			target.value = text;
			resetHeight();
			setHasText(true);
		},
		[onSend, isLoading],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	const handleStop = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			onStop();
		},
		[onStop],
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
		>
			<div className="mx-auto flex max-w-3xl items-end gap-2">
				{reasoningModels.length > 1 && (
					<select
						value={selectedReasoningModel || reasoningModels[0].id}
						onChange={(e) => onSelectReasoningModel?.(e.target.value)}
						disabled={isLoading}
						aria-label={t('chat.model')}
						title={t('chat.modelHint')}
						className="h-[42px] shrink-0 rounded-xl border border-zinc-300 bg-zinc-50 px-2 text-xs font-medium text-heading outline-none transition-colors focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
					>
						{reasoningModels.map((model) => (
							<option
								key={model.id}
								value={model.id}
								disabled={model.available === false}
							>
								{model.available === false
									? t('chat.modelUnavailable', { name: model.label })
									: model.label}
							</option>
						))}
					</select>
				)}
				<textarea
					ref={textareaRef}
					rows={1}
					placeholder={t('chat.placeholder')}
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					className="flex-1 resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-secondary focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
				/>

				{isLoading ? (
					<Button
						key="stop"
						theme={ButtonTheme.Danger}
						size={Size.LARGE}
						iconOnly
						type="button"
						onClick={handleStop}
						aria-label={t('chat.stop')}
					>
						<Icon name={IconName.Stop} className="h-4 w-4" />
					</Button>
				) : (
					<Button
						key="send"
						theme={ButtonTheme.Primary}
						size={Size.LARGE}
						iconOnly
						type="submit"
						disabled={!hasText}
						aria-label={t('chat.send')}
					>
						<Icon name={IconName.Send} className="h-4 w-4" />
					</Button>
				)}
			</div>
		</form>
	);
};
