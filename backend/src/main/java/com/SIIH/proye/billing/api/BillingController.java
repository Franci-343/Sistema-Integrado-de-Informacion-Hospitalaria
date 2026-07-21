package com.SIIH.proye.billing.api;

import com.SIIH.proye.billing.api.BillingModels.ChargeCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.ChargeResponse;
import com.SIIH.proye.billing.api.BillingModels.InvoiceCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.InvoiceResponse;
import com.SIIH.proye.billing.api.BillingModels.PaymentCreateRequest;
import com.SIIH.proye.billing.api.BillingModels.PaymentResponse;
import com.SIIH.proye.billing.api.BillingModels.ServiceResponse;
import com.SIIH.proye.billing.service.BillingService;
import com.SIIH.proye.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class BillingController {

    private final BillingService service;

    public BillingController(BillingService service) {
        this.service = service;
    }

    @GetMapping("/services")
    public List<ServiceResponse> services() {
        return service.services();
    }

    @GetMapping("/charges")
    public List<ChargeResponse> charges(@RequestParam(required = false) UUID patientId,
                                        @RequestParam(required = false) String status) {
        return service.charges(patientId, status);
    }

    @PostMapping("/charges")
    @ResponseStatus(HttpStatus.CREATED)
    public ChargeResponse createCharge(@Valid @RequestBody ChargeCreateRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createCharge(request, user);
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> invoices(@RequestParam(required = false) UUID patientId,
                                          @RequestParam(required = false) String status) {
        return service.invoices(patientId, status);
    }

    @GetMapping("/invoices/{id}")
    public InvoiceResponse invoice(@PathVariable UUID id) {
        return service.invoice(id);
    }

    @PostMapping("/invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse createInvoice(@Valid @RequestBody InvoiceCreateRequest request,
                                         @AuthenticationPrincipal AuthenticatedUser user) {
        return service.createInvoice(request, user);
    }

    @PutMapping("/invoices/{id}/issue")
    public InvoiceResponse issueInvoice(@PathVariable UUID id,
                                        @AuthenticationPrincipal AuthenticatedUser user) {
        return service.issueInvoice(id, user);
    }

    @GetMapping("/payments")
    public List<PaymentResponse> payments(@RequestParam(required = false) UUID invoiceId) {
        return service.payments(invoiceId);
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse payment(@Valid @RequestBody PaymentCreateRequest request,
                                   @AuthenticationPrincipal AuthenticatedUser user) {
        return service.registerPayment(request, user);
    }
}
