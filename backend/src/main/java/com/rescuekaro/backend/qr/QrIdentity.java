package com.rescuekaro.backend.qr;

import java.time.Instant;
import java.time.ZoneId;
import java.util.Locale;

public final class QrIdentity {
    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private QrIdentity() {}

    public static String serialCode(long number, Instant createdAt) {
        int year = createdAt.atZone(INDIA).getYear();
        return "RK" + year + String.format(Locale.ROOT, "%06d", number);
    }

    public static String publicUrl(String origin, long number, Instant createdAt, String token) {
        return origin.replaceAll("/$", "") + "/qr/" + serialCode(number, createdAt) + "/" + token;
    }
}
