# TrustCheck Israel - Production Dockerfile
# Multi-stage build for optimal image size

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for NEXT_PUBLIC_ environment variables
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy node_modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application (without standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Copy .next directory first
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Then copy manifest to server subdirectory (this overwrites/adds to .next/server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/app-path-routes-manifest.json ./.next/server/app-path-routes-manifest.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node_modules/.bin/next", "start"]
