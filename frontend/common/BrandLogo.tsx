// SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Image from 'next/image';

/** Product mark for ArgOnto: one component so the asset path lives in one place. */
export const BrandLogo = ({ className }: { className?: string }) => (
	<Image
		src="/argonto-logo.webp"
		alt="ArgOnto"
		width={320}
		height={320}
		unoptimized
		priority
		className={className}
	/>
);
