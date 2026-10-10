package com.rescuekaro.backend.security;

import java.util.Arrays;

import javax.crypto.SecretKey;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.rescuekaro.backend.configuration.AppProperties;
import jakarta.servlet.http.Cookie;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, BearerTokenResolver resolver) throws Exception {
        CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrf.setCookiePath("/");
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())
                .csrf(config -> config.csrfTokenRepository(csrf)
                        .ignoringRequestMatchers("/api/v1/auth/**", "/api/v1/payments/webhook"))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/health", "/actuator/health", "/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**", "/api/v1/reviews", "/api/v1/public/qr/**", "/api/v1/emergency-directory").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/contact", "/api/v1/shipping/quote", "/api/v1/payments/webhook").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasAnyAuthority("SCOPE_OPERATOR", "SCOPE_ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.bearerTokenResolver(resolver).jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean
    SecretKey jwtSigningKey(AppProperties properties) { return TokenService.signingKey(properties.security().jwtSecret()); }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key) { return NimbusJwtDecoder.withSecretKey(key).build(); }

    @Bean
    BearerTokenResolver bearerTokenResolver() {
        return request -> {
            String authorization = request.getHeader("Authorization");
            if (authorization != null && authorization.startsWith("Bearer ")) return authorization.substring(7);
            Cookie[] cookies = request.getCookies();
            if (cookies == null) return null;
            return Arrays.stream(cookies).filter(cookie -> "rk_access".equals(cookie.getName()))
                    .map(Cookie::getValue).findFirst().orElse(null);
        };
    }

    private static JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("SCOPE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
