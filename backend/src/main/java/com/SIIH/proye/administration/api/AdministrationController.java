package com.SIIH.proye.administration.api;

import com.SIIH.proye.administration.api.AdministrationModels.AuditEventResponse;
import com.SIIH.proye.administration.api.AdministrationModels.PermissionResponse;
import com.SIIH.proye.administration.api.AdministrationModels.RoleResponse;
import com.SIIH.proye.administration.api.AdministrationModels.UserCreateRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserResponse;
import com.SIIH.proye.administration.api.AdministrationModels.UserRolesRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserStatusRequest;
import com.SIIH.proye.administration.api.AdministrationModels.UserUpdateRequest;
import com.SIIH.proye.administration.service.AdministrationService;
import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AdministrationController {

    private final AdministrationService service;

    public AdministrationController(AdministrationService service) {
        this.service = service;
    }

    @GetMapping("/users")
    public List<UserResponse> users(@RequestParam(required = false) String search,
                                    @RequestParam(required = false) String status) {
        return service.users(search, status);
    }

    @GetMapping("/users/{id}")
    public UserResponse user(@PathVariable UUID id) {
        return service.user(id);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserCreateRequest request,
                               @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.createUser(request, actor);
    }

    @PutMapping("/users/{id}")
    public UserResponse update(@PathVariable UUID id,
                               @Valid @RequestBody UserUpdateRequest request,
                               @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.updateUser(id, request, actor);
    }

    @PatchMapping("/users/{id}/status")
    public UserResponse status(@PathVariable UUID id,
                               @Valid @RequestBody UserStatusRequest request,
                               @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.updateStatus(id, request, actor);
    }

    @PutMapping("/users/{id}/roles")
    public UserResponse roles(@PathVariable UUID id,
                              @Valid @RequestBody UserRolesRequest request,
                              @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.updateRoles(id, request, actor);
    }

    @GetMapping("/roles")
    public List<RoleResponse> roles() {
        return service.roles();
    }

    @GetMapping("/permissions")
    public List<PermissionResponse> permissions() {
        return service.permissions();
    }

    @GetMapping("/audit-events")
    public List<AuditEventResponse> audit(@RequestParam(required = false) String username,
                                          @RequestParam(required = false) String action,
                                          @RequestParam(required = false) String entityType,
                                          @RequestParam(required = false) OffsetDateTime from,
                                          @RequestParam(required = false) OffsetDateTime to) {
        return service.audit(username, action, entityType, from, to);
    }
}
