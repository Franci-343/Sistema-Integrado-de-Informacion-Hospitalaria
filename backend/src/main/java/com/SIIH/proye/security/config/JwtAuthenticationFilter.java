package com.SIIH.proye.security.config;

import com.SIIH.proye.security.AuthenticatedUser;
import com.SIIH.proye.security.service.JwtService;
import com.SIIH.proye.security.service.SecurityAccountService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final SecurityAccountService accounts;

    public JwtAuthenticationFilter(JwtService jwtService, SecurityAccountService accounts) {
        this.jwtService = jwtService;
        this.accounts = accounts;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                AuthenticatedUser user = accounts.loadActive(jwtService.parseUserId(authorization.substring(7)));
                var authorities = new ArrayList<SimpleGrantedAuthority>();
                user.roles().forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role)));
                user.permissions().forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission)));
                var authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
