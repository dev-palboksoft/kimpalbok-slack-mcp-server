FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# prepare 훅 없이 의존성만 설치
RUN npm install --ignore-scripts

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Command will be provided by smithery.yaml
CMD ["node", "dist/index.js"]
