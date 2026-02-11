# Use the official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Create volume for configuration and persistent data
VOLUME ["/root/.config/minusbot"]

# Start the application
ENTRYPOINT ["bun", "run", "start"]
