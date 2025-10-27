# PowerShell Script to Test API Routes
# Make sure the server is running before executing this script

$baseUrl = "http://localhost:8080/api/v1"
$ContentType = "application/json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Chat & Video Streaming App API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Register User 1
Write-Host "Test 1: Registering User 1..." -ForegroundColor Yellow
$registerBody1 = @{
    username = "testuser1"
    email = "testuser1@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody1 -ContentType $ContentType
    Write-Host "✅ User 1 registered successfully" -ForegroundColor Green
    Write-Host "User ID: $($response1.data.user._id)`n" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "ℹ️  User 1 already exists" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 2: Register User 2
Write-Host "Test 2: Registering User 2..." -ForegroundColor Yellow
$registerBody2 = @{
    username = "testuser2"
    email = "testuser2@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody2 -ContentType $ContentType
    Write-Host "✅ User 2 registered successfully" -ForegroundColor Green
    Write-Host "User ID: $($response2.data.user._id)`n" -ForegroundColor Gray
    $user2Id = $response2.data.user._id
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "ℹ️  User 2 already exists" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 3: Login User 1
Write-Host "Test 3: Logging in User 1..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser1@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType $ContentType -SessionVariable session
    Write-Host "✅ User 1 logged in successfully" -ForegroundColor Green
    $accessToken = $loginResponse.data.accessToken
    Write-Host "Access Token: $($accessToken.Substring(0,20))...`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Get Current User
Write-Host "Test 4: Getting current user..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

try {
    $currentUser = Invoke-RestMethod -Uri "$baseUrl/auth/current-user" -Method Get -Headers $headers
    Write-Host "✅ Current user fetched successfully" -ForegroundColor Green
    Write-Host "Username: $($currentUser.data.username)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 5: Search Available Users
Write-Host "Test 5: Searching available users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/chats/users" -Method Get -Headers $headers
    Write-Host "✅ Users fetched successfully" -ForegroundColor Green
    Write-Host "Found $($users.data.Count) user(s)`n" -ForegroundColor Gray
    # Get the second user's ID for creating chat
    if ($users.data.Count -gt 0 -and -not $user2Id) {
        $user2Id = $users.data[0]._id
        Write-Host "Using user ID for chat: $user2Id`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 6: Create One-on-One Chat
Write-Host "Test 6: Creating one-on-one chat..." -ForegroundColor Yellow
if ($user2Id) {
    try {
        $chat = Invoke-RestMethod -Uri "$baseUrl/chats/one-on-one/$user2Id" -Method Post -Headers $headers
        Write-Host "✅ One-on-one chat created successfully" -ForegroundColor Green
        Write-Host "Chat ID: $($chat.data._id)`n" -ForegroundColor Gray
        $chatId = $chat.data._id
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping - User 2 ID not available`n" -ForegroundColor DarkGray
}

# Test 7: Get All Chats
Write-Host "Test 7: Getting all chats..." -ForegroundColor Yellow
try {
    $chats = Invoke-RestMethod -Uri "$baseUrl/chats" -Method Get -Headers $headers
    Write-Host "✅ Chats fetched successfully" -ForegroundColor Green
    Write-Host "Found $($chats.data.Count) chat(s)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 8: Send Message
Write-Host "Test 8: Sending a message..." -ForegroundColor Yellow
if ($chatId) {
    $messageBody = @{
        content = "Hello! This is a test message from PowerShell script."
    } | ConvertTo-Json
    
    try {
        $message = Invoke-RestMethod -Uri "$baseUrl/messages/$chatId" -Method Post -Body $messageBody -Headers $headers -ContentType $ContentType
        Write-Host "✅ Message sent successfully" -ForegroundColor Green
        Write-Host "Message ID: $($message.data._id)`n" -ForegroundColor Gray
        $messageId = $message.data._id
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping - Chat ID not available`n" -ForegroundColor DarkGray
}

# Test 9: Get All Messages
Write-Host "Test 9: Getting all messages in chat..." -ForegroundColor Yellow
if ($chatId) {
    try {
        $messages = Invoke-RestMethod -Uri "$baseUrl/messages/$chatId" -Method Get -Headers $headers
        Write-Host "✅ Messages fetched successfully" -ForegroundColor Green
        Write-Host "Found $($messages.data.Count) message(s)`n" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping - Chat ID not available`n" -ForegroundColor DarkGray
}

# Test 10: Logout
Write-Host "Test 10: Logging out..." -ForegroundColor Yellow
try {
    $logout = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $headers
    Write-Host "✅ User logged out successfully`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
