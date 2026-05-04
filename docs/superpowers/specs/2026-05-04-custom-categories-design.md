# Custom Product Categories Design

## Overview
Allow shop owners to create, manage, and organize their own custom product categories with bilingual (EN/MM) names and emoji icons.

## Data Model

### Category Schema
```typescript
interface Category {
  id: string;           // auto-generated unique ID
  name?: string;        // English name (optional if name_mm exists)
  name_mm?: string;     // Myanmar name (optional if name exists)
  icon?: string;        // Emoji icon (default: 📦)
  created_at: Timestamp;
  order_index: number;  // for manual ordering
}
```

### Shop Document Update
```typescript
interface Shop {
  // ... existing fields
  categories: Category[];  // Array of custom categories
}
```

### Product Document Update
```typescript
interface Product {
  // ... existing fields
  category_id?: string;  // References shop.categories[].id
}
```

## UI Components

### 1. Public Shop Page - Category Tabs
- **"All" tab** - Always first, shows ALL products (including uncategorized)
- **Visible categories** - First 3-4 custom categories as individual tabs
- **"More" dropdown** - Remaining categories hidden behind "+N more" button
- **Responsive** - Fewer visible tabs on mobile

### 2. Shop Settings - Category Management
- **List view** of all categories
- **Drag-to-reorder** with visual feedback
- **Edit button** → Inline edit mode (name, name_mm, icon)
- **Delete button** → Confirmation modal
- **"Add Category"** button at bottom
- **Reorder indicator** (6-dot handle)

### 3. Product Forms (Add/Edit)
- **Category dropdown** - "Select Category"
- **Display format** - "💻 Gaming Laptops / ဂိမ်းလပ်တပ်များ"
- **"Uncategorized"** option at top
- **Optional** - Product can have no category

## API Endpoints

### New Endpoints
```
POST   /api/shops/[shopId]/categories          // Create category
PUT    /api/shops/[shopId]/categories/[id]     // Update category
DELETE /api/shops/[shopId]/categories/[id]     // Delete category
PUT    /api/shops/[shopId]/categories/reorder  // Reorder categories
```

### Modified Endpoints
```
POST   /api/products                    // Accept category_id
PUT    /api/products/[id]              // Accept category_id
GET    /api/shops/[shopId]             // Include categories array
GET    /api/shops/my-shop              // Include categories array
```

## Validation Rules

### Category Creation/Update
- **At least one name** required (EN or MY or both)
- **Max 30 characters** per name
- **Unique names** within shop (case-insensitive)
- **Icon optional** - defaults to 📦
- **Max unlimited** categories per shop

### Category Deletion
- Show confirmation modal
- Display count: "Delete 'Gaming Laptops'? 12 products will become uncategorized."
- Products become **uncategorized** (category_id removed)
- Uncategorized products only visible in "All" tab

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete category with products | Products become uncategorized |
| Empty category | Shown as "0 products" in count |
| No categories created | Only "All" tab shown |
| Only name provided | Show only EN name |
| Only name_mm provided | Show only MM name |
| Both names provided | Show "EN / MM" format |
| Drag to reorder | Updates order_index for all categories |
| Invalid category_id on product | Treat as uncategorized |

## Migration Strategy

### Existing Products
- Current `category` field (string) → Migrate to `category_id`
- Map old string values to new category IDs
- Products with no match become uncategorized

### Existing Shops
- Start with empty `categories` array
- Shop owners manually create categories as needed
- No automatic migration of old categories

## Security

### Authorization
- Only **shop owner** can modify categories
- Verify `owner_id` matches current user
- Standard shop ownership checks

### Rate Limiting
- Max 50 categories per shop (reasonable limit)
- Standard API rate limits apply

## Testing Scenarios

1. Create category with EN only
2. Create category with MM only  
3. Create category with both names
4. Reorder categories
5. Delete category with 0 products
6. Delete category with N products
7. Add product to category
8. Change product category
9. Remove product from category
10. View shop with 0/1/5/10+ categories

## Future Enhancements (Not in scope)

- Category-specific banner images
- Category descriptions
- Sub-categories (nested)
- Category color themes
- Auto-categorization rules
