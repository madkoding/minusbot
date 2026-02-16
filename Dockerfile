# Use the official Bun image
FROM oven/bun:latest

# Install system dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install and build everything in a single step to minimize layers
RUN bun run install:all && bun run build

# Create volume for configuration and persistent data
VOLUME ["/root/.config/minusbot"]

# Start the application
ENTRYPOINT ["bun", "run", "start"]
