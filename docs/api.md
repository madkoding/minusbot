# 📡 API Documentation

Minusbot exposes a REST API for managing the bot and interacting with the system.

## Base URL
Default: `http://localhost:9753/api/v1`

## Authentication
Most endpoints require an `Authorization` header with a valid user token.
```http
Authorization: Bearer <token>
```

### 🔐 Auth
- `POST /auth/login`
  - Body: `{ "username": "...", "password": "..." }`
  - Response: `{ "token": "..." }`
- `GET /auth/me`
  - Get current user info.

## 💬 Chat
- `GET /chat`
  - List active chats.
- `GET /chat/:id`
  - Get messages for a specific chat.
- `POST /chat/:id`
  - Send a message.
  - Body: `{ "content": "..." }`

## 👥 Users (Admin)
- `GET /users`
  - List all users.
- `POST /users`
  - Create a new user.
- `DELETE /users/:username`
  - Delete a user.

## 🛠️ Channels
- `GET /channels`
  - List available channels.
- `GET /channels/:id/config`
  - Get config for a channel.
- `PUT /channels/:id/config`
  - Update channel config.

## 📊 Stats
- `GET /stats`
  - Get system statistics.
