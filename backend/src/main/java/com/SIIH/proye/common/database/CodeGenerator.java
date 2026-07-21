package com.SIIH.proye.common.database;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

public final class CodeGenerator {

    private static final DateTimeFormatter DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private CodeGenerator() {
    }

    public static String next(String prefix) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
        return prefix + "-" + DATE.format(LocalDate.now()) + "-" + suffix;
    }
}
