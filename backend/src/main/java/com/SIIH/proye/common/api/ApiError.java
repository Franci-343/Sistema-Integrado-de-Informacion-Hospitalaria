package com.SIIH.proye.common.api;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        Instant timestamp,
        String code,
        String message,
        String traceId,
        Map<String, String> details
) {
}
