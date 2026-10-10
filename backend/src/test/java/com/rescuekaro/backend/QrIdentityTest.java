package com.rescuekaro.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.rescuekaro.backend.qr.QrIdentity;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class QrIdentityTest {
    @Test void serialUsesIndiaIssuanceYearAndPaddedSequence() {
        Instant indiaNewYear = Instant.parse("2025-12-31T18:30:00Z");
        assertThat(QrIdentity.serialCode(1, indiaNewYear)).isEqualTo("RK2026000001");
        assertThat(QrIdentity.publicUrl("https://rescuekaro.example/", 1, indiaNewYear, "private-token"))
            .isEqualTo("https://rescuekaro.example/qr/RK2026000001/private-token");
    }
}
