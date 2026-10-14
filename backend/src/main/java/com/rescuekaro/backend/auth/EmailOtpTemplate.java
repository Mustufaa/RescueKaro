package com.rescuekaro.backend.auth;

public final class EmailOtpTemplate {
    public enum Action { SIGNUP, LOGIN, PASSWORD_RESET }
    private EmailOtpTemplate() {}

    public static String subject(Action action) {
        return switch (action) {
            case SIGNUP -> "Verify your RescueKaro email";
            case LOGIN -> "Your RescueKaro sign-in code";
            case PASSWORD_RESET -> "Reset your RescueKaro password";
        };
    }

    private static String heading(Action action) {
        return switch (action) {
            case SIGNUP -> "Verify your email";
            case LOGIN -> "Confirm your sign-in";
            case PASSWORD_RESET -> "Reset your password";
        };
    }

    public static String plain(Action action, String name, String code) {
        return "RescueKaro · Scan karo, safe karo.\n\n" + heading(action) + "\n\nHi " + greeting(name)
                + ",\n\nYour verification code is: " + code
                + "\n\nExpires in 10 minutes.\nDo not share this code.\nIf you did not request this, ignore this email.\n\nRescueKaro · Scan karo, safe karo.";
    }

    public static String html(Action action, String name, String code) {
        return "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>"
                + "<body style=\"margin:0;padding:16px;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#16243a\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse\">"
                + "<tr><td style=\"height:6px;background:#d42737\"></td></tr>"
                + "<tr><td style=\"padding:28px 24px 8px\"><strong style=\"font-size:23px;color:#d42737\">RescueKaro</strong>"
                + "<span style=\"display:block;color:#24518a;font-size:13px;margin-top:4px\">Scan karo, safe karo.</span></td></tr>"
                + "<tr><td style=\"padding:10px 24px 24px\"><h1 style=\"font-size:26px;line-height:1.25;margin:12px 0;color:#16243a\">"
                + heading(action) + "</h1><p style=\"font-size:16px;line-height:1.5\">Hi " + escape(greeting(name)) + ",</p>"
                + "<p style=\"font-size:16px;line-height:1.5\">Enter this code to continue:</p>"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;border-collapse:collapse\"><tr>"
                + "<td style=\"padding:18px 8px;background:#eef3fa;text-align:center;color:#173f77;font-size:32px;font-weight:700;letter-spacing:6px\">"
                + escape(code) + "</td></tr></table>"
                + "<p style=\"font-size:14px;line-height:1.6\">Expires in 10 minutes.<br>Do not share this code.<br>"
                + "If you did not request this, ignore this email.</p></td></tr>"
                + "<tr><td style=\"border-top:1px solid #dbe3ee;padding:18px 24px;color:#596779;font-size:13px\">"
                + "RescueKaro · Scan karo, safe karo.</td></tr></table></body></html>";
    }

    private static String greeting(String name) {
        String clean = name == null ? "" : name.replaceAll("[\\p{Cntrl}]", " ").trim();
        return clean.isEmpty() ? "there" : clean;
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
