# DieselUp Admin Panel

This is the dedicated administrative dashboard for the DieselUp platform, built with React, Vite, and Vanilla CSS. It shares the primary Firebase backend and environment configurations with the main application.

## Features

- **Real-time Overview:** Aggregates and displays total revenue, orders, and active supplier statistics.
- **Supplier & Order Management:** Direct integration with Firestore to view, approve, and track operations.
- **Premium Aesthetics:** Employs a dynamic, glassmorphic design utilizing modern Vanilla CSS methodologies.

## Configuration

The admin panel automatically loads environment variables (`EXPO_PUBLIC_*`) from the parent `.env` file via the custom `vite.config.ts` configuration. No separate `.env` file is necessary as long as the parent configuration is properly filled out.

## Local Development

From the root `DieselUp` folder, you can run:

```powershell
npm --prefix admin run dev
```

Alternatively, from within the `admin` folder:

```powershell
npm install
npm run dev
```

To build the application for production:

```powershell
npm run build
```
