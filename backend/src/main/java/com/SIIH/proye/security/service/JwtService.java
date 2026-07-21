package com.SIIH.proye.security.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtService {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final Pattern SUBJECT = Pattern.compile("\\\"sub\\\":\\\"([0-9a-fA-F-]{36})\\\"");
    private static final Pattern EXPIRATION = Pattern.compile("\\\"exp\\\":([0-9]+)");
    private static final String HEADER = ENCODER.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] secret;

    public JwtService(@Value("${app.security.jwt-secret}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("app.security.jwt-secret debe tener al menos 32 caracteres.");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public AccessToken issue(UUID userId, Duration duration) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(duration);
        String payload = "{\"sub\":\"" + userId + "\",\"iat\":" + issuedAt.getEpochSecond()
                + ",\"exp\":" + expiresAt.getEpochSecond() + ",\"jti\":\"" + UUID.randomUUID() + "\"}";
        String encodedPayload = ENCODER.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signingInput = HEADER + "." + encodedPayload;
        String signature = ENCODER.encodeToString(sign(signingInput));
        return new AccessToken(signingInput + "." + signature, expiresAt);
    }

    public UUID parseUserId(String token) {
        String[] parts = token == null ? new String[0] : token.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("Token invalido.");

        byte[] expected = sign(parts[0] + "." + parts[1]);
        byte[] actual;
        try {
            actual = DECODER.decode(parts[2]);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Token invalido.", exception);
        }
        if (!MessageDigest.isEqual(expected, actual)) throw new IllegalArgumentException("Firma invalida.");

        String payload;
        try {
            payload = new String(DECODER.decode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Token invalido.", exception);
        }
        Matcher subject = SUBJECT.matcher(payload);
        Matcher expiration = EXPIRATION.matcher(payload);
        if (!subject.find() || !expiration.find()) throw new IllegalArgumentException("Token incompleto.");
        if (Long.parseLong(expiration.group(1)) <= Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("Token expirado.");
        }
        return UUID.fromString(subject.group(1));
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("No se pudo firmar el token.", exception);
        }
    }

    public record AccessToken(String value, Instant expiresAt) {
    }
}
