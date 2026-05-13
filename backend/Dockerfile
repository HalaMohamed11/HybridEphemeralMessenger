FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and config
COPY src ./src
COPY tsconfig.json .gitignore ./

# Run in dev mode with ts-node
EXPOSE 3001
CMD ["npm", "run", "dev"]
