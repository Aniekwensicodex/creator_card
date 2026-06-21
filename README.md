# Creator Cards API

A REST microservice for creating, retrieving, and deleting shareable creator profile cards.

Built for the Resilience 17 Venture Studio backend engineering assessment.

---

## Stack

- **Runtime**: Node.js (vanilla JavaScript)
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **ID generation**: ULID
- **Deployment**: Render / Heroku

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd creator-cards-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB Atlas connection string:

```
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/creator-cards?retryWrites=true&w=majority
```

### 3. Run locally

```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## Endpoints

All endpoints are at the root with **no versioning**.

### POST /creator-cards
Create a new Creator Card.

**Body:**
```json
{
  "title": "George Cooks",
  "description": "Weekly cooking podcast",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    { "title": "YouTube", "url": "https://youtube.com/@georgecooks" }
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      { "name": "IG Story Post", "description": "One story mention", "amount": 5000000 }
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

- `slug` is auto-generated from `title` if omitted
- `access_type` defaults to `public`
- `access_code` is required (exactly 6 alphanumeric chars) when `access_type` is `private`

### GET /creator-cards/:slug
Retrieve a card by slug. Drafts return 404. Private cards require `?access_code=XXXXXX`.

### DELETE /creator-cards/:slug
Soft-delete a card.

**Body:**
```json
{ "creator_reference": "crt_8f2k1m9x4p7w3q5z" }
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| SL02 | 400 | Slug is already taken |
| AC01 | 400 | access_code required for private card |
| AC05 | 400 | access_code must not be set on public cards |
| NF01 | 404 | Card not found |
| NF02 | 404 | Card exists but is a draft |
| AC03 | 403 | Private card — access code required |
| AC04 | 403 | Invalid access code |

---

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repository
4. Set build command: `npm install`
5. Set start command: `node index.js`
6. Add environment variable: `MONGODB_URI` = your Atlas connection string
7. Deploy

Your base URL will be something like `https://your-app.onrender.com` — submit this exactly with no paths or versioning.

---

## Project Structure

```
creator-cards-api/
├── index.js                          # Entry point / bootstrap
├── app.js                            # Express app setup
├── config/
│   └── database.js                   # MongoDB connection
├── core/
│   ├── errors.js                     # AppError class + error codes
│   ├── id.js                         # ULID generator
│   ├── logger.js                     # App logger
│   ├── response.js                   # sendSuccess / sendError helpers
│   └── validator.js                  # VSL validator engine
├── endpoints/
│   └── creator-cards/
│       └── creator-card.endpoint.js  # Route handlers
├── services/
│   └── creator-cards/
│       ├── creator-card.service.js   # Business logic
│       └── creator-card.validation.js# Input validation specs
├── repository/
│   └── creator-cards/
│       └── creator-card.repository.js# DB access + serialization
├── models/
│   └── creator-card.model.js         # Mongoose schema
├── messages/
│   └── creator-cards.messages.js     # Response messages
├── middlewares/
│   └── error.middleware.js           # Global error handling
├── .env.example
├── Procfile
└── package.json
```
