# Use LTS Node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Ensure buffer directory exists
RUN mkdir -p src/buffer/pending

# Expose API port
EXPOSE 3000

# Default command (API)
CMD ["node", "src/server.js"]
