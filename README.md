# Freezer Tracker

A self-hosted app to track food items in your freezer, with support for raw food, prepared meals, and breast milk storage.

## Features

- **Three categories:** Raw Food, Prepared Meals, Breast Milk
- **Raw Food:** Track by kg or pieces, split bags when taking out partial amounts
- **Prepared Meals:** Track bags and portions, create multiple identical entries at once
- **Breast Milk:** Track by volume with expression and freezer dates
- **Freshness indicators:** Color-coded based on configurable thresholds per category/sub-category
- **Red Zone alerts:** Daily reminder for items that should be used immediately
- **Stats dashboard:** Track what's in freezer and what's been consumed
- **Configurable freshness thresholds:** Customize per sub-category

## Tech Stack

- **Backend:** Express + better-sqlite3 + TypeScript
- **Frontend:** React + Vite + TypeScript + Tailwind
- **Deployment:** Docker (single container)

## Data Model

### Raw Food
- Sub-categories: Poultry, Red Meat, Fish/Seafood, Ground Meat, Vegetables, Fruits, Other
- Name (with dropdown from history, filtered by sub-category)
- Amount + measuring unit (kg or pieces)
- Date added, comment
- Supports splitting when taking out partial amounts

### Prepared Meals
- Name (with dropdown from history)
- Portions per bag
- When adding multiple bags, creates separate entries
- Taking out removes the whole bag

### Breast Milk
- Date expressed + date added to freezer
- Volume in ml
- Taking out removes the whole bag

## Freshness Thresholds (Defaults)

| Category | Fresh | Good | Use Soon | Red Zone |
|----------|-------|------|----------|----------|
| Poultry | 0-3 mo | 3-6 mo | 6-9 mo | 9+ mo |
| Red Meat | 0-4 mo | 4-8 mo | 8-12 mo | 12+ mo |
| Fish/Seafood | 0-3 mo | 3-6 mo | 6-9 mo | 9+ mo |
| Ground Meat | 0-2 mo | 2-4 mo | 4-6 mo | 6+ mo |
| Vegetables | 0-6 mo | 6-10 mo | 10-12 mo | 12+ mo |
| Fruits | 0-6 mo | 6-10 mo | 10-12 mo | 12+ mo |
| Prepared Meals | 0-1 mo | 1-2 mo | 2-3 mo | 3+ mo |
| Breast Milk | 0-3 mo | 3-6 mo | 6-9 mo | 9+ mo |

All thresholds are configurable in Settings.

## Deployment

### Docker Compose

```bash
docker-compose up -d --build
```

Access at `http://<your-pi-ip>:3000`

### Timezone Configuration

The app uses local time for dates. By default it's set to `America/Mexico_City`. To change it:

```bash
# Option 1: Set TZ environment variable before running
TZ=America/New_York docker-compose up -d --build

# Option 2: Edit docker-compose.yml and change the TZ line
- TZ=${TZ:-America/New_York}
```

Common timezone values: `America/New_York`, `America/Los_Angeles`, `Europe/London`, `Asia/Tokyo`

### Portainer

1. Create a new Stack in Portainer
2. Copy the `docker-compose.yml` content
3. Deploy

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Raw Food
- `GET /api/raw-food` - Get active items
- `GET /api/raw-food/consumed` - Get consumed items
- `GET /api/raw-food/names/:subCategory` - Get name suggestions
- `POST /api/raw-food` - Create item
- `POST /api/raw-food/:id/take-out` - Take out (with split support)
- `PATCH /api/raw-food/:id` - Update
- `DELETE /api/raw-food/:id` - Delete

### Prepared Meals
- `GET /api/prepared-meals` - Get active items
- `GET /api/prepared-meals/consumed` - Get consumed items
- `GET /api/prepared-meals/names` - Get name suggestions
- `POST /api/prepared-meals` - Create (supports quantity for multiple)
- `POST /api/prepared-meals/:id/take-out` - Take out whole bag
- `PATCH /api/prepared-meals/:id` - Update
- `DELETE /api/prepared-meals/:id` - Delete

### Breast Milk
- `GET /api/breast-milk` - Get active items
- `GET /api/breast-milk/consumed` - Get consumed items
- `POST /api/breast-milk` - Create
- `POST /api/breast-milk/:id/take-out` - Take out whole bag
- `PATCH /api/breast-milk/:id` - Update
- `DELETE /api/breast-milk/:id` - Delete

### Stats & Settings
- `GET /api/stats` - Get all statistics
- `GET /api/freshness-settings` - Get freshness thresholds
- `PATCH /api/freshness-settings/:id` - Update threshold
- `GET /api/red-zone-dismissed` - Check if dismissed today
- `POST /api/red-zone-dismiss` - Dismiss red zone for today
