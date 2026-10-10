#!/bin/sh
set -eu

cd /workspace

sh ./mvnw -B -DskipTests compile
sh ./mvnw -B spring-boot:run &
app_pid=$!

cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

source_signature() {
  find src -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d ' ' -f 1
}

last_signature=$(source_signature)
while kill -0 "$app_pid" 2>/dev/null; do
  sleep 2
  current_signature=$(source_signature)
  if [ "$current_signature" != "$last_signature" ]; then
    echo "Backend source changed; recompiling for Spring Boot DevTools restart..."
    if sh ./mvnw -B -DskipTests compile; then
      last_signature=$current_signature
    else
      echo "Backend compilation failed. Fix the source and save again to retry." >&2
      last_signature=$current_signature
    fi
  fi
done

wait "$app_pid"
