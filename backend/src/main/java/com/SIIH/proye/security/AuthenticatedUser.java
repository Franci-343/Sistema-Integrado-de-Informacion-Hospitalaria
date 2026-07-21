package com.SIIH.proye.security;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record AuthenticatedUser(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String email,
        List<String> roles,
        Set<String> permissions
) implements Principal {

    @Override
    public String getName() {
        return username;
    }

    public String displayName() {
        return firstName + " " + lastName;
    }

    public String primaryRole() {
        return roles.isEmpty() ? "RECEPTION" : roles.getFirst();
    }

    public String roleLabel() {
        return switch (primaryRole()) {
            case "RECEPTION" -> "Admision y recepcion";
            case "DOCTOR" -> "Personal medico";
            case "NURSE" -> "Enfermeria";
            case "LAB_TECHNICIAN" -> "Laboratorio clinico";
            case "PHARMACIST" -> "Farmacia hospitalaria";
            case "CASHIER" -> "Caja y facturacion";
            case "DIRECTOR" -> "Direccion medica";
            case "SYSTEM_ADMIN" -> "Administracion del sistema";
            default -> primaryRole();
        };
    }
}
