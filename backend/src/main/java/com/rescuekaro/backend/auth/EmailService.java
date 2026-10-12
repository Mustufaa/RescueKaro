package com.rescuekaro.backend.auth;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender sender;
    private final String from;
    private final String fromName;
    private final String host;
    private final String username;
    private final String password;
    private final boolean auth;

    public EmailService(ObjectProvider<JavaMailSender> provider,
            @Value("${SMTP_FROM:}") String from, @Value("${SMTP_FROM_NAME:RescueKaro}") String fromName,
            @Value("${SMTP_HOST:}") String host, @Value("${SMTP_USERNAME:}") String username,
            @Value("${SMTP_PASSWORD:}") String password, @Value("${SMTP_AUTH:true}") boolean auth) {
        this.sender = provider.getIfAvailable();
        this.from = from;
        this.fromName = fromName;
        this.host = host;
        this.username = username;
        this.password = password;
        this.auth = auth;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (sender == null || host.isBlank() || from.isBlank() || (auth && (username.isBlank() || password.isBlank())))
            throw new IllegalStateException("Email OTP requires SMTP_HOST, SMTP_FROM and SMTP credentials when authentication is enabled.");
    }

    public void sendRegistrationOtp(String to, String name, String code) { send(to, name, code, EmailOtpTemplate.Action.SIGNUP); }
    public void sendLoginOtp(String to, String name, String code) { send(to, name, code, EmailOtpTemplate.Action.LOGIN); }
    public void sendPasswordResetOtp(String to, String name, String code) { send(to, name, code, EmailOtpTemplate.Action.PASSWORD_RESET); }

    private void send(String to, String name, String code, EmailOtpTemplate.Action action) {
        MimeMessage message = sender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(from, fromName, "UTF-8"));
            helper.setTo(to);
            helper.setSubject(EmailOtpTemplate.subject(action));
            helper.setText(EmailOtpTemplate.plain(action, name, code), EmailOtpTemplate.html(action, name, code));
            sender.send(message);
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException("Unable to prepare verification email.");
        }
    }
}
