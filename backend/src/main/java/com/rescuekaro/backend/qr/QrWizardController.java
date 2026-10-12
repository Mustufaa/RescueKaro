package com.rescuekaro.backend.qr;

import com.rescuekaro.backend.dto.ApiResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class QrWizardController {
    private final QrWizardService wizard;
    public QrWizardController(QrWizardService wizard) { this.wizard = wizard; }

    @GetMapping("/qr-wizard")
    public ApiResponse<QrWizardService.View> get(Authentication auth) {
        return ApiResponse.of(wizard.get(user(auth)));
    }

    @PutMapping("/qr-wizard")
    public ApiResponse<QrWizardService.View> save(Authentication auth, @RequestBody Save request) {
        return ApiResponse.of(wizard.save(user(auth), request.draftId(), request.step(), request.data()));
    }

    @PostMapping("/qr-wizard/new")
    public ApiResponse<QrWizardService.View> startNew(Authentication auth) {
        return ApiResponse.of(wizard.startNew(user(auth)));
    }

    @PostMapping("/qr-wizard/finish")
    public ApiResponse<QrWizardService.View> finish(Authentication auth, @RequestBody Finish request) {
        return ApiResponse.of(wizard.finish(user(auth), request.draftId(), request.data()));
    }

    @GetMapping("/sticker-orders")
    public ApiResponse<List<QrWizardService.StickerOrder>> orders(Authentication auth) {
        return ApiResponse.of(wizard.listOrders(user(auth)));
    }

    @GetMapping("/sticker-orders/{id}")
    public ApiResponse<QrWizardService.StickerOrder> order(Authentication auth, @PathVariable UUID id) {
        return ApiResponse.of(wizard.order(user(auth), id));
    }

    private static UUID user(Authentication auth) { return UUID.fromString(auth.getName()); }
    public record Save(UUID draftId, int step, QrWizardService.Data data) {}
    public record Finish(UUID draftId, QrWizardService.Data data) {}
}
