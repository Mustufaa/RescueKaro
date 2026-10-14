# syntax=docker/dockerfile:1.7
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN command -v curl >/dev/null || (apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*)

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

RUN useradd --system --uid 10001 --create-home appuser
USER appuser
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
