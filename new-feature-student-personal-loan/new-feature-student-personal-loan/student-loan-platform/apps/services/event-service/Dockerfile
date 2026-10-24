FROM gradle:8-jdk17 AS build
WORKDIR /workspace
COPY --chown=gradle:gradle . .
RUN chmod +x ./gradlew && ./gradlew --no-daemon bootJar

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 app
COPY --from=build /workspace/build/libs/event-service-1.0.0.jar app.jar
USER app
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
