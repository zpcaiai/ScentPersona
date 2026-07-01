# WebSocket push server for self-hosted deployments (real-time payment status).
#   docker build -f Dockerfile.ws -t scentpersona-ws .
#   docker run -p 3001:3001 -e WS_PUBLISH_SECRET=your-secret scentpersona-ws
FROM node:20-alpine
WORKDIR /app
# Only the `ws` dependency is needed by the standalone server.
RUN npm install --omit=dev --no-audit --no-fund ws@^8.18.0
COPY scripts/ws-server.mjs ./ws-server.mjs
ENV WS_PORT=3001 NODE_ENV=production
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- "http://127.0.0.1:${WS_PORT}/health" || exit 1
CMD ["node", "ws-server.mjs"]
