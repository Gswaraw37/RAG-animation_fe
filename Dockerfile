FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for healthcheck (optional)
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (not really needed for app service)
EXPOSE 5173

# Keep container running for build purposes
CMD ["tail", "-f", "/dev/null"]