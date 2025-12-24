FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build Medusa (if using TypeScript)
RUN npm run build

EXPOSE 9000
CMD ["npm", "run", "start"]