FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all necessary files
COPY src ./src
COPY next.config.js tsconfig.json .gitignore ./

# Create public directory if it doesn't exist
RUN mkdir -p public

# Run in dev mode
EXPOSE 3000
CMD ["npm", "run", "dev"]
