# Campus Market API Documentation 📚

This document provides comprehensive documentation for the Campus Market API endpoints, authentication, and data structures.

## 🔐 Authentication

### Firebase Authentication

Campus Market uses Firebase Authentication for user management. All API requests require a valid Firebase ID token.

```typescript
// Example: Getting user token
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = auth.currentUser
const token = await user?.getIdToken()
```

### Headers

Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

## 📋 API Endpoints

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://campusmarke.co.zw/api`

### Products API

#### Get All Products

```http
GET /api/products
```

**Query Parameters:**
- `category` (string): Filter by category
- `search` (string): Search term
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `condition` (string): Product condition (new, used, etc.)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": "product_id",
      "title": "Product Title",
      "description": "Product description",
      "price": 100,
      "category": "electronics",
      "condition": "new",
      "images": ["url1", "url2"],
      "seller": {
        "id": "user_id",
        "name": "Seller Name",
        "rating": 4.5
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Product by ID

```http
GET /api/products/{id}
```

**Response:**
```json
{
  "id": "product_id",
  "title": "Product Title",
  "description": "Product description",
  "price": 100,
  "category": "electronics",
  "condition": "new",
  "images": ["url1", "url2"],
  "seller": {
    "id": "user_id",
    "name": "Seller Name",
    "rating": 4.5,
    "university": "University Name"
  },
  "location": {
    "university": "University Name",
    "campus": "Main Campus"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Create Product

```http
POST /api/products
```

**Request Body:**
```json
{
  "title": "Product Title",
  "description": "Product description",
  "price": 100,
  "category": "electronics",
  "condition": "new",
  "images": ["url1", "url2"],
  "location": {
    "university": "University Name",
    "campus": "Main Campus"
  }
}
```

**Response:**
```json
{
  "id": "new_product_id",
  "title": "Product Title",
  "description": "Product description",
  "price": 100,
  "category": "electronics",
  "condition": "new",
  "images": ["url1", "url2"],
  "seller": {
    "id": "user_id",
    "name": "Seller Name"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Update Product

```http
PUT /api/products/{id}
```

**Request Body:** Same as Create Product

#### Delete Product

```http
DELETE /api/products/{id}
```

### Messages API

#### Get Conversations

```http
GET /api/messages
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conversation_id",
      "participants": [
        {
          "id": "user_id",
          "name": "User Name",
          "avatar": "avatar_url"
        }
      ],
      "lastMessage": {
        "id": "message_id",
        "content": "Message content",
        "senderId": "user_id",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

#### Get Messages in Conversation

```http
GET /api/messages/{conversationId}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "message_id",
      "content": "Message content",
      "senderId": "user_id",
      "timestamp": "2024-01-01T00:00:00Z",
      "type": "text"
    }
  ]
}
```

#### Send Message

```http
POST /api/messages
```

**Request Body:**
```json
{
  "conversationId": "conversation_id",
  "content": "Message content",
  "type": "text"
}
```

### Reviews API

#### Get Product Reviews

```http
GET /api/reviews?productId={productId}
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "review_id",
      "productId": "product_id",
      "reviewerId": "user_id",
      "reviewerName": "Reviewer Name",
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Review

```http
POST /api/reviews
```

**Request Body:**
```json
{
  "productId": "product_id",
  "rating": 5,
  "comment": "Great product!"
}
```

### Search API

#### Search Products

```http
GET /api/search?q={query}
```

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `condition` (string): Product condition

**Response:**
```json
{
  "results": [
    {
      "id": "product_id",
      "title": "Product Title",
      "description": "Product description",
      "price": 100,
      "category": "electronics",
      "seller": {
        "id": "user_id",
        "name": "Seller Name"
      }
    }
  ],
  "total": 50
}
```

### Notifications API

#### Get User Notifications

```http
GET /api/notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "message",
      "title": "New Message",
      "body": "You have a new message",
      "read": false,
      "timestamp": "2024-01-01T00:00:00Z",
      "data": {
        "conversationId": "conversation_id"
      }
    }
  ]
}
```

#### Mark Notification as Read

```http
PUT /api/notifications/{id}/read
```

## 📊 Data Models

### Product

```typescript
interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: 'new' | 'used' | 'refurbished'
  images: string[]
  seller: {
    id: string
    name: string
    rating?: number
    university?: string
  }
  location?: {
    university: string
    campus: string
  }
  createdAt: string
  updatedAt: string
}
```

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  university?: string
  campus?: string
  rating?: number
  totalSales?: number
  createdAt: string
  updatedAt: string
}
```

### Message

```typescript
interface Message {
  id: string
  conversationId: string
  content: string
  senderId: string
  type: 'text' | 'image' | 'file'
  timestamp: string
}
```

### Review

```typescript
interface Review {
  id: string
  productId: string
  reviewerId: string
  reviewerName: string
  rating: number
  comment: string
  createdAt: string
}
```

## 🔧 Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `PERMISSION_DENIED` - User doesn't have permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🚀 Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📝 SDK Examples

### JavaScript/TypeScript

```typescript
class CampusMarketAPI {
  private baseURL: string
  private token: string

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL
    this.token = token
  }

  async getProducts(params?: any) {
    const response = await fetch(`${this.baseURL}/products?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }

  async createProduct(product: any) {
    const response = await fetch(`${this.baseURL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    })
    return response.json()
  }
}
```

### Python

```python
import requests

class CampusMarketAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_products(self, params=None):
        response = requests.get(
            f'{self.base_url}/products',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def create_product(self, product):
        response = requests.post(
            f'{self.base_url}/products',
            headers=self.headers,
            json=product
        )
        return response.json()
```

## 🔗 Webhooks

Campus Market supports webhooks for real-time notifications:

### Webhook Events

- `product.created` - New product listed
- `product.updated` - Product updated
- `product.deleted` - Product deleted
- `message.sent` - New message sent
- `review.created` - New review posted
- `order.created` - New order placed

### Webhook Configuration

```json
{
  "url": "https://your-domain.com/webhooks",
  "events": ["product.created", "message.sent"],
  "secret": "webhook_secret"
}
```

## 📞 Support

For API support and questions:

- **Email**: api@campusmarke.co.zw
- **Documentation**: https://docs.campusmarke.co.zw
- **Status Page**: https://status.campusmarke.co.zw

---

*Last updated: January 2024* 