package com.SIIH.proye.security.config;

import com.SIIH.proye.common.api.ApiError;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthenticationFilter jwtFilter,
                                            JsonMapper jsonMapper) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> writeError(response, jsonMapper,
                                HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Debes iniciar sesion para continuar."))
                        .accessDeniedHandler((request, response, exception) -> writeError(response, jsonMapper,
                                HttpStatus.FORBIDDEN, "FORBIDDEN", "No tienes permiso para realizar esta operacion.")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/patients/*/clinical-history", "/api/v1/patients/*/consultations").hasAuthority("CLINICAL_READ")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/patients/*/clinical-history").hasAuthority("CLINICAL_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/patients/**").hasAuthority("PATIENT_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/patients/**").hasAuthority("PATIENT_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/patients/**").hasAuthority("PATIENT_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments/**").hasAuthority("APPOINTMENT_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments/**").hasAuthority("APPOINTMENT_WRITE")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/appointments/**").hasAuthority("APPOINTMENT_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/consultations/**").hasAuthority("CLINICAL_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/consultations/**").hasAuthority("CLINICAL_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/consultations/**").hasAuthority("CLINICAL_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/triage/**").hasAuthority("TRIAGE_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/triage/**").hasAuthority("TRIAGE_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/triage/**").hasAuthority("TRIAGE_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/hospitalizations/**", "/api/v1/beds/**").hasAuthority("HOSPITALIZATION_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/hospitalizations/**").hasAuthority("HOSPITALIZATION_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/hospitalizations/**").hasAuthority("HOSPITALIZATION_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/laboratory/**", "/api/v1/lab-orders/**", "/api/v1/lab-results/**", "/api/v1/lab-tests/**").hasAuthority("LAB_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/lab-orders/**", "/api/v1/lab-results/**").hasAuthority("LAB_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/lab-orders/**", "/api/v1/lab-results/**").hasAuthority("LAB_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/pharmacy/**", "/api/v1/prescriptions/**", "/api/v1/dispensations/**", "/api/v1/medications/**").hasAuthority("PHARMACY_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/prescriptions/**").hasAuthority("CLINICAL_WRITE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/dispensations/**").hasAuthority("PHARMACY_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/inventory/**", "/api/v1/stock-movements/**", "/api/v1/batches/**").hasAuthority("INVENTORY_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/inventory/**", "/api/v1/stock-movements/**", "/api/v1/batches/**").hasAuthority("INVENTORY_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/billing/**", "/api/v1/charges/**", "/api/v1/invoices/**", "/api/v1/payments/**", "/api/v1/services/**").hasAuthority("BILLING_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/charges/**", "/api/v1/invoices/**", "/api/v1/payments/**").hasAuthority("BILLING_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/invoices/**").hasAuthority("BILLING_WRITE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/reports/**").hasAuthority("REPORT_READ")
                        .requestMatchers(HttpMethod.GET, "/api/v1/audit-events/**").hasAnyAuthority("AUDIT_READ", "ADMIN_READ")
                        .requestMatchers(HttpMethod.GET, "/api/v1/administration/**", "/api/v1/users/**", "/api/v1/roles/**", "/api/v1/permissions/**").hasAuthority("ADMIN_READ")
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/**").hasAuthority("ADMIN_WRITE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/**").hasAuthority("ADMIN_WRITE")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/users/**").hasAuthority("ADMIN_WRITE")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeError(jakarta.servlet.http.HttpServletResponse response,
                                   JsonMapper jsonMapper,
                                   HttpStatus status,
                                   String code,
                                   String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        jsonMapper.writeValue(response.getWriter(), new ApiError(
                Instant.now(), code, message, UUID.randomUUID().toString(), Map.of()));
    }
}
