package com.rescuekaro.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.net.URI;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		configureRenderEnvironment();
		SpringApplication.run(BackendApplication.class, args);
	}

	static void configureRenderEnvironment() {
		String connection = System.getenv("RENDER_DATABASE_URL");
		if (connection != null && !connection.isBlank() && System.getenv("DATABASE_URL") == null) {
			DatabaseConnection database = parseRenderDatabaseUrl(connection);
			System.setProperty("spring.datasource.url", database.jdbcUrl());
			System.setProperty("spring.datasource.username", database.username());
			System.setProperty("spring.datasource.password", database.password());
		}
		String frontendHost = System.getenv("RENDER_FRONTEND_HOST");
		if (frontendHost != null && !frontendHost.isBlank()) {
			if (System.getenv("FRONTEND_URL") == null) System.setProperty("FRONTEND_URL", "https://" + frontendHost);
			if (System.getenv("PUBLIC_APP_URL") == null) System.setProperty("PUBLIC_APP_URL", "https://" + frontendHost);
		}
	}

	static DatabaseConnection parseRenderDatabaseUrl(String connection) {
			URI uri = URI.create(connection);
			if (!"postgresql".equals(uri.getScheme()) && !"postgres".equals(uri.getScheme()))
				throw new IllegalArgumentException("RENDER_DATABASE_URL must be a PostgreSQL URL");
			if (uri.getHost() == null || uri.getRawPath() == null || uri.getRawPath().length() < 2 || uri.getRawUserInfo() == null)
				throw new IllegalArgumentException("RENDER_DATABASE_URL is incomplete");
			String[] credentials = uri.getUserInfo().split(":", 2);
			if (credentials.length != 2) throw new IllegalArgumentException("RENDER_DATABASE_URL requires credentials");
			String host = uri.getHost().contains(":") ? "[" + uri.getHost() + "]" : uri.getHost();
			String port = uri.getPort() < 0 ? "" : ":" + uri.getPort();
			return new DatabaseConnection("jdbc:postgresql://" + host + port + uri.getRawPath(), credentials[0], credentials[1]);
	}

	record DatabaseConnection(String jdbcUrl, String username, String password) {}

}
