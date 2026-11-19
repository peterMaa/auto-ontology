// SPDX-FileCopyrightText: Copyright (c) 2024-2026, NVIDIA CORPORATION & AFFILIATES.
// All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { withPermission } from '@/auth/with-auth';
import { proxyToBackend } from '@/auth/proxy-backend';

// Reasoning-model profiles the chat page may offer. Listing is folded into the
// chat permission: anyone who may ask a question may see which models answer.
export const GET = withPermission({ chat: ['use'] })((req) => proxyToBackend(req));
