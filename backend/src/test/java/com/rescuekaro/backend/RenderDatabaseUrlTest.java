package com.rescuekaro.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class RenderDatabaseUrlTest {
    @Test
    void convertsInternalConnectionStringToJdbcFields() {
        var result = BackendApplication.parseRenderDatabaseUrl(
                "postgresql://app:p%40ss%3Aword@internal-db:5432/rescuekaro_db");
        assertEquals("jdbc:postgresql://internal-db:5432/rescuekaro_db", result.jdbcUrl());
        assertEquals("app", result.username());
        assertEquals("p@ss:word", result.password());
    }

    @Test
    void rejectsNonPostgresConnectionString() {
        assertThrows(IllegalArgumentException.class,
                () -> BackendApplication.parseRenderDatabaseUrl("https://example.com/data"));
    }
}
