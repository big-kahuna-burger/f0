docker run --rm --name jaeger -d \
  -e COLLECTOR_OTLP_ENABLED=true \
  -e METRICS_STORAGE_TYPE=prometheus \
  -p 14269:14269 \
  -p 4318:4318 \
  -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest