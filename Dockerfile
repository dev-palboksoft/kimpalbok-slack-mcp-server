FROM node:22.12-alpine

WORKDIR /app

# 전체 프로젝트 복사 (prepare/build에 필요)
COPY . .

# 프로덕션 의존성만 설치
RUN npm install --ignore-scripts

RUN npm run build

CMD ["node", "dist/index.js"]
