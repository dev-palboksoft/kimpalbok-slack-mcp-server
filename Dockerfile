FROM node:22.12-alpine AS builder

WORKDIR /app

# 전체 프로젝트 복사 (prepare/build에 필요)
COPY . .

# 의존성 설치 및 빌드
RUN npm install --ignore-scripts
RUN npm run build

FROM node:22.12-alpine AS release

WORKDIR /app

# 빌드 산출물 및 패키지 파일만 복사
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# 프로덕션 의존성만 설치
RUN npm ci --ignore-scripts --omit=dev

ENTRYPOINT ["node", "dist/index.js"]
