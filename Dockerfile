# ─────────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
# Copy prisma schema BEFORE npm ci — required because postinstall runs `prisma generate`
COPY prisma ./prisma
RUN npm ci --prefer-offline

# ─────────────────────────────────────────────
# Stage 2: Build the Next.js app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client already generated in deps stage, re-generate for correct platform
RUN npx prisma generate


# Build Next.js (requires a placeholder DATABASE_URL at build time)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-placeholder-secret"
ENV NEXTAUTH_URL="http://localhost:3000"

RUN npm run build

# Compile seed.ts → seed.js (so runner doesn't need tsx or esbuild)
RUN ./node_modules/.bin/esbuild prisma/seed.ts \
    --bundle \
    --platform=node \
    --outfile=prisma/seed.js \
    --external:@prisma/client \
    --external:bcryptjs

# ─────────────────────────────────────────────
# Stage 3: Production runner (minimal image)
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl tzdata
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ="Asia/Jayapura"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
# Ensure uploads directory exists OUTSIDE public/ so Next.js does NOT serve it statically
# Files are only accessible via the authenticated /api/files/ route
RUN mkdir -p /app/uploads/payments /app/uploads/logos && chown -R nextjs:nodejs /app/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client + CLI for migrations at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Copy Prisma CLI (pinned to project version, avoids npx downloading Prisma 7.x)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
RUN mkdir -p node_modules/.bin && \
    ln -sf /app/node_modules/prisma/build/index.js node_modules/.bin/prisma && \
    chmod +x node_modules/.bin/prisma

# Copy compiled seed + bcryptjs runtime dependency
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
