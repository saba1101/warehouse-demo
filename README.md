# Warehouse — Car Flip Tycoon

A browser-based car-flipping tycoon game built with React. Start with cash and a warehouse, buy cars in various conditions, fix or salvage them, trade with others, and grow your empire.

All data is stored in **localStorage** — no backend required.

## Gameplay

1. **Create a profile** — pick a name and optional avatar to get started with starter cash and a free warehouse.
2. **Marketplace** — browse cars in different conditions (poor → excellent). Filter, sort, and buy cars into a warehouse you own.
3. **Warehouse** — manage your warehouses and the cars inside them.
   - **Fix** cars to improve their condition and resale value.
   - **Salvage** cars for parts you can sell later.
   - **Sell** cars or parts for profit.
   - **Buy / sell warehouses** to expand or downsize your operation.
4. **Trade-Ins** — receive randomized trade offers from other users. Accept or decline swaps, paying or pocketing the price difference.
5. **Settings** — edit your profile, upload a custom background, choose a background preset, or restart your account.

## Tech Stack

| Layer       | Choice                            |
| ----------- | --------------------------------- |
| Framework   | React 19                          |
| Routing     | React Router 7                    |
| Build       | Vite (rolldown-vite)              |
| Styling     | SCSS Modules                      |
| State       | localStorage + custom `useUser` hook |
| Hosting     | Netlify (SPA redirect configured) |

## Project Structure

```
src/
├── assets/icons/        # SVG nav icons
├── components/
│   ├── modal/           # Generic Modal + ConfirmModal
│   └── sidebar/         # Sidebar / mobile bottom nav
├── constants/           # Background presets
├── data/                # Static car, warehouse & trade data
├── hooks/               # useUserData hook (localStorage)
├── modules/user/        # AddUser onboarding screen
├── pages/               # Home, Marketplace, Warehouse, TradeIns, Settings
├── styles/              # SCSS modules + variables
├── App.jsx              # Root layout, background, routing
├── router.jsx           # Route definitions
└── main.jsx             # Entry point
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The repo includes `netlify.toml` and `public/_redirects` for Netlify hosting with SPA client-side routing support. Push to your Netlify-connected repo and it will build and deploy automatically.

## Key Mechanics

- **Car conditions**: poor, fair, good, excellent — each affects price and fix cost.
- **Fixing**: pay to upgrade a car's condition; sell price increases by 1.5× the fix cost.
- **Salvage**: strip a car for parts; part value scales with the car's condition (poor 1.3×, fair 1.4×, good 1.5×, excellent 2.0×).
- **Warehouse capacity**: each warehouse has a max slot count; you must have space to buy a car.
- **Selling warehouses**: you receive a depreciated price (price / 1.2) plus the value of all cars and parts stored inside.
- **Trade offers**: randomized per-session; accepting a trade swaps the cars and adjusts your balance by the price difference.

## Responsive Design

- Desktop: sidebar on the left with profile, balance, and navigation.
- Mobile (< 768px): fixed bottom nav with avatar + balance on the left and icon-only navigation on the right. All pages use single-column layouts with touch-friendly sizing.

## License

MIT
