package com.rescuekaro.backend.qr;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class QrWizardOriginTest {
    @Test void localOriginsAreAllowedOnlyInDevelopment() {
        for (String origin : new String[]{"http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"}) {
            assertThat(QrWizardService.generationOriginAllowed(origin, true)).isTrue();
            assertThat(QrWizardService.generationOriginAllowed(origin, false)).isFalse();
        }
    }

    @Test void publicHttpsWorksAndMalformedOrPrivateOriginsAreRejected() {
        assertThat(QrWizardService.generationOriginAllowed("https://rescuekaro.example", false)).isTrue();
        for (String origin : new String[]{"http://rescuekaro.example", "http://localhost:3000/qr", "http://user@localhost:3000",
                "http://localhost:3000?query=1", "http://localhost:3000#fragment", "https://192.168.1.2", "invalid"}) {
            assertThat(QrWizardService.generationOriginAllowed(origin, true)).isFalse();
            assertThat(QrWizardService.generationOriginAllowed(origin, false)).isFalse();
        }
    }
}
