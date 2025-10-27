# Chat & Video Streaming App - API Routes Documentation

Base URL: `http://localhost:8080/api/v1`

---

## 🔐 Authentication Routes (`/auth`)

### 1. Register User

- **POST** `/api/v1/auth/register`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "statusCode": 201,
    "data": {
      "user": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com",
        "avatar": {...},
        "role": "USER",
        "isEmailVerified": true
      }
    },
    "message": "User registered successfully",
    "success": true
  }
  ```

### 2. Login User

- **POST** `/api/v1/auth/login`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  OR
  ```json
  {
    "username": "johndoe",
    "password": "password123"
  }
  ```
- **Response:** Returns user data + sets `accessToken` and `refreshToken` cookies
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {...},
      "accessToken": "...",
      "refreshToken": "..."
    },
    "message": "User logged in successfully",
    "success": true
  }
  ```

### 3. Logout User

- **POST** `/api/v1/auth/logout`
- **Auth Required:** Yes (Bearer token)
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "User logged out successfully",
    "success": true
  }
  ```

### 4. Get Current User

- **GET** `/api/v1/auth/current-user`
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      ...
    },
    "message": "Current user fetched successfully",
    "success": true
  }
  ```

### 5. Refresh Access Token

- **POST** `/api/v1/auth/refresh-token`
- **Auth Required:** No (requires refresh token in cookie or body)
- **Body:** (optional if sent via cookie)
  ```json
  {
    "refreshToken": "..."
  }
  ```

### 6. Change Password

- **POST** `/api/v1/auth/change-password`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "oldPassword": "oldpass123",
    "newPassword": "newpass123"
  }
  ```

---

## 💬 Chat Routes (`/chats`)

All chat routes require authentication.

### 1. Get All Chats

- **GET** `/api/v1/chats`
- **Auth Required:** Yes
- **Description:** Get all chats for the logged-in user
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "...",
        "name": "Chat name",
        "isGroupChat": false,
        "participants": [...],
        "lastMessage": {...}
      }
    ],
    "message": "All chats fetched successfully",
    "success": true
  }
  ```

### 2. Search Available Users

- **GET** `/api/v1/chats/users`
- **Auth Required:** Yes
- **Description:** Get all users except the logged-in user
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "...",
        "username": "user1",
        "email": "user1@example.com",
        "avatar": {...}
      }
    ],
    "message": "Users fetched successfully",
    "success": true
  }
  ```

### 3. Create/Get One-on-One Chat

- **POST** `/api/v1/chats/one-on-one/:receiverId`
- **Auth Required:** Yes
- **Params:** `receiverId` - User ID of the receiver
- **Description:** Creates a new one-on-one chat or returns existing one
- **Response:**
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "...",
      "name": "one-on-one chat",
      "isGroupChat": false,
      "participants": [...],
      "admin": "..."
    },
    "message": "Chat retrieved successfully",
    "success": true
  }
  ```

### 4. Create Group Chat

- **POST** `/api/v1/chats/group`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "name": "My Group Chat",
    "participants": ["userId1", "userId2", "userId3"]
  }
  ```
- **Note:** Minimum 3 participants required (including creator)
- **Response:**
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "...",
      "name": "My Group Chat",
      "isGroupChat": true,
      "participants": [...],
      "admin": "..."
    },
    "message": "Group chat created successfully",
    "success": true
  }
  ```

### 5. Get Group Chat Details

- **GET** `/api/v1/chats/group/:chatId`
- **Auth Required:** Yes
- **Params:** `chatId` - Group chat ID
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": {...},
    "message": "Group chat details fetched successfully",
    "success": true
  }
  ```

### 6. Rename Group Chat

- **PATCH** `/api/v1/chats/group/:chatId`
- **Auth Required:** Yes (must be admin)
- **Params:** `chatId` - Group chat ID
- **Body:**
  ```json
  {
    "name": "New Group Name"
  }
  ```

### 7. Delete Group Chat

- **DELETE** `/api/v1/chats/group/:chatId`
- **Auth Required:** Yes (must be admin)
- **Params:** `chatId` - Group chat ID
- **Description:** Deletes the group chat and all its messages

### 8. Add Participant to Group

- **POST** `/api/v1/chats/group/:chatId/:participantId`
- **Auth Required:** Yes (must be admin)
- **Params:**
  - `chatId` - Group chat ID
  - `participantId` - User ID to add

### 9. Remove Participant from Group

- **DELETE** `/api/v1/chats/group/:chatId/:participantId`
- **Auth Required:** Yes (must be admin)
- **Params:**
  - `chatId` - Group chat ID
  - `participantId` - User ID to remove

### 10. Leave Group Chat

- **DELETE** `/api/v1/chats/leave/group/:chatId`
- **Auth Required:** Yes
- **Params:** `chatId` - Group chat ID
- **Description:** Leave the group chat as a participant

### 11. Delete One-on-One Chat

- **DELETE** `/api/v1/chats/delete/one-on-one/:chatId`
- **Auth Required:** Yes
- **Params:** `chatId` - Chat ID
- **Description:** Deletes the one-on-one chat and all its messages

---

## 📨 Message Routes (`/messages`)

All message routes require authentication.

### 1. Get All Messages in Chat

- **GET** `/api/v1/messages/:chatId`
- **Auth Required:** Yes
- **Params:** `chatId` - Chat ID
- **Description:** Get all messages in a specific chat (sorted by newest first)
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "...",
        "sender": {
          "_id": "...",
          "username": "user1",
          "email": "...",
          "avatar": {...}
        },
        "content": "Hello!",
        "attachments": [],
        "chat": "...",
        "createdAt": "..."
      }
    ],
    "message": "Messages fetched successfully",
    "success": true
  }
  ```

### 2. Send Message

- **POST** `/api/v1/messages/:chatId`
- **Auth Required:** Yes
- **Params:** `chatId` - Chat ID
- **Content-Type:** `multipart/form-data`
- **Body:**
  ```
  content: "Hello, how are you?"
  attachments: [file1, file2] (optional, max 5 files)
  ```
- **Note:** Either content or attachments must be provided
- **Response:**
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "...",
      "sender": {...},
      "content": "Hello, how are you?",
      "attachments": [...],
      "chat": "...",
      "createdAt": "..."
    },
    "message": "Message sent successfully",
    "success": true
  }
  ```

### 3. Delete Message

- **DELETE** `/api/v1/messages/:chatId/:messageId`
- **Auth Required:** Yes (must be sender)
- **Params:**
  - `chatId` - Chat ID
  - `messageId` - Message ID
- **Description:** Deletes the message and its attachments
- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": {...},
    "message": "Message deleted successfully",
    "success": true
  }
  ```

---

## 🔌 WebSocket Events

The app uses Socket.IO for real-time communication.

### Socket Events:

- `connected` - User connected to socket
- `disconnect` - User disconnected
- `joinChat` - User joins a chat room
- `leaveChat` - User leaves a chat
- `newChat` - New chat created
- `messageReceived` - New message received
- `messageDeleted` - Message deleted
- `updateGroupName` - Group name updated
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `socketError` - Socket error occurred

---

## 🛠️ Testing the API

### Using cURL:

#### 1. Register a User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

#### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

#### 3. Get Current User (with auth)

```bash
curl -X GET http://localhost:8080/api/v1/auth/current-user \
  -b cookies.txt
```

#### 4. Get All Chats

```bash
curl -X GET http://localhost:8080/api/v1/chats \
  -b cookies.txt
```

### Using Postman/Thunder Client:

1. Import the routes above
2. For authenticated routes, add the `Authorization` header:
   ```
   Authorization: Bearer <your_access_token>
   ```
   Or let cookies handle it automatically

---

## ⚠️ Environment Variables Required

Make sure your `.env` file has:

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=30d

# Node Environment
NODE_ENV=development
```

---

## 🐛 Bugs Fixed

1. ✅ Fixed socket event emission in `sendMessage` - now correctly sends to other participants
2. ✅ Fixed socket event emission in `deleteMessage` - now correctly sends to other participants
3. ✅ Added auth routes for user registration and login
4. ✅ Integrated auth routes in app.ts

---

## 📝 Notes

- All authenticated routes require either:
  - `Authorization: Bearer <token>` header, OR
  - Valid `accessToken` cookie
- File uploads are handled via `multer` middleware
- Maximum 5 attachments per message
- Tokens are set as HTTP-only cookies for security
- Socket.IO runs on the same server as the REST API
