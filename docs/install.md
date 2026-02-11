# 📥 Installation Guide

This guide will help you get **Minusbot** up and running using Docker.

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running.
- [Git](https://git-scm.com/) installed.

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/sammwyy/minusbot
    cd minusbot
    ```

2.  **Build the Docker image**:
    ```bash
    docker build -t minusbot .
    ```

3.  **Run the container**:
    To function correctly, Minusbot needs access to the Docker daemon (for skills) and a persistent volume for its configuration and history.

    ```bash
    docker run -it \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v ~/.config/minusbot:/root/.config/minusbot \
      --name minusbot \
      minusbot
    ```

    > **Note**: Mounting `/var/run/docker.sock` allows Minusbot to manage containers (Skills) on your host system.

4.  **Initial Setup**:
    The first time you run it, you should configure your AI provider:
    ```bash
    docker exec -it minusbot bun run setup
    ```

## 🛠 Manual Installation (without Docker)

If you prefer to run it natively using [Bun](https://bun.sh):

```bash
bun install
bun run setup
bun start
```
