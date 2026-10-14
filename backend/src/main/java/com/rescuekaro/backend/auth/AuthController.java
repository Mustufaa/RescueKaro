package com.rescuekaro.backend.auth;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final AppProperties properties;
    private final org.springframework.core.env.Environment environment;
    private final ClientIpResolver clientIp;

    public AuthController(AuthService auth, AppProperties properties,org.springframework.core.env.Environment environment,
            ClientIpResolver clientIp) { this.auth = auth; this.properties = properties; this.environment=environment; this.clientIp=clientIp; }

    @PostMapping("/register")
    public ApiResponse<EmailOtpService.Sent> register(@Valid @RequestBody Register request, HttpServletRequest http) {
        if(!request.password().equals(request.confirmPassword())) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR","Passwords do not match.");
        return ApiResponse.of(auth.register(request.fullName(),request.email(),request.phone(),request.password(),clientIp.resolve(http),request.previousRequestId()));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Map<String,Object>>> verifyEmail(@Valid @RequestBody OtpVerify request,HttpServletRequest http) {
        return session(auth.verifyRegistration(request.requestId(),request.code(),clientIp.resolve(http)),http);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String,Object>>> login(@Valid @RequestBody Login request, HttpServletRequest http) {
        var result = auth.login(request.email(), request.password(), clientIp.resolve(http));
        if (result.verification() != null)
            return ResponseEntity.ok(ApiResponse.of(Map.of("verification", result.verification())));
        return session(result.session(), http);
    }

    @PostMapping("/resend-otp")
    public ApiResponse<EmailOtpService.Sent> resend(@Valid @RequestBody Resend request,HttpServletRequest http) {
        return ApiResponse.of(auth.resend(request.requestId(),clientIp.resolve(http)));
    }

    @PostMapping("/password/reset/request")
    public ApiResponse<EmailOtpService.Sent> requestPasswordReset(@Valid @RequestBody ResetRequest request,HttpServletRequest http) {
        return ApiResponse.of(auth.requestPasswordReset(request.email(),clientIp.resolve(http)));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordReset request,HttpServletRequest http) {
        if (!request.newPassword().equals(request.confirmPassword()))
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR","Passwords do not match.");
        auth.resetPassword(request.requestId(),request.code(),request.newPassword(),clientIp.resolve(http));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String,Object>>> refresh(@CookieValue(name="rk_refresh",required=false) String token,HttpServletRequest http) {
        if(token==null) throw new ApiException(HttpStatus.UNAUTHORIZED,"AUTH_REQUIRED","Refresh session is required.");
        return session(auth.refresh(token),http);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name="rk_refresh",required=false) String token,HttpServletRequest http) {
        auth.logout(token);
        return ResponseEntity.noContent().headers(clearCookies(http)).build();
    }

    @GetMapping("/session")
    public ApiResponse<Map<String,Object>> current(Authentication authentication) {
        if(authentication==null) throw new ApiException(HttpStatus.UNAUTHORIZED,"AUTH_REQUIRED","Authentication is required.");
        return ApiResponse.of(Map.of("user",auth.current(UUID.fromString(authentication.getName()))));
    }

    @GetMapping("/csrf")
    public ApiResponse<Map<String,String>> csrf(CsrfToken token) {
        return ApiResponse.of(Map.of("headerName", token.getHeaderName(), "token", token.getToken()));
    }

    private ResponseEntity<ApiResponse<Map<String,Object>>> session(AuthService.Session session,HttpServletRequest request) {
        boolean secure=secureCookies(request);
        HttpHeaders headers=new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE,cookie("rk_access",session.accessToken(),Duration.ofMinutes(properties.security().accessTokenMinutes()),"/",secure).toString());
        headers.add(HttpHeaders.SET_COOKIE,cookie("rk_refresh",session.refreshToken(),Duration.ofDays(properties.security().refreshTokenDays()),"/api/v1/auth",secure).toString());
        return ResponseEntity.ok().headers(headers).body(ApiResponse.of(Map.of("user",session.user())));
    }

    private static ResponseCookie cookie(String name,String value,Duration age,String path,boolean secure){
        return ResponseCookie.from(name,value).httpOnly(true).secure(secure).sameSite("Lax").path(path).maxAge(age).build();
    }
    private boolean secureCookies(HttpServletRequest request){
        return request.isSecure() || environment.acceptsProfiles(Profiles.of("prod"));
    }
    private HttpHeaders clearCookies(HttpServletRequest request){
        HttpHeaders headers=new HttpHeaders(); boolean secure=secureCookies(request);
        headers.add(HttpHeaders.SET_COOKIE,cookie("rk_access","",Duration.ZERO,"/",secure).toString());
        headers.add(HttpHeaders.SET_COOKIE,cookie("rk_refresh","",Duration.ZERO,"/api/v1/auth",secure).toString());
        return headers;
    }

    public record OtpVerify(@NotNull java.util.UUID requestId,@NotBlank @Pattern(regexp="\\d{6}") String code) {}
    public record Resend(@NotNull java.util.UUID requestId) {}
    public record ResetRequest(@NotBlank @Email String email) {}
    public record Register(@NotBlank @Size(min=2,max=100) String fullName,@NotBlank @Email String email,@NotBlank String phone,
                           @NotBlank String password,@NotBlank String confirmPassword,java.util.UUID previousRequestId) {}
    public record Login(@NotBlank @Email String email,@NotBlank String password) {}
    public record PasswordReset(@NotNull java.util.UUID requestId,@NotBlank @Pattern(regexp="\\d{6}") String code,
                                @NotBlank String newPassword,@NotBlank String confirmPassword) {}
}
