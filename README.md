# BloodLink Healthcare Platform

A full-stack blood bank management, hospital coordination, and donor proximity platform built with Next.js, TypeScript, and Drizzle ORM[cite: 1].

## Features

- **Admin Command & Clinical Analytics**: Core administrative modules alongside clinical insights and analytics dashboards[cite: 1].
- **Hospital Portal**: Dedicated portal for hospitals to manage blood requests and inventory coordination[cite: 1].
- **Donor Proximity Radar**: Real-time proximity radar to locate and alert nearby eligible blood donors[cite: 1].
- **Donor Mobile Experience**: Mobile-optimized interface tailored for blood donors[cite: 1].
- **Authentication Suite**: Integrated role-based authentication and access management[cite: 1].

## Tech Stack

- **Framework**: Next.js (App Router)[cite: 1]
- **Language**: TypeScript[cite: 1]
- **Database & ORM**: Drizzle ORM[cite: 1]
- **Styling**: PostCSS / Tailwind CSS[cite: 1]

## Project Structure

```text
├── drizzle.config.json        # Drizzle ORM configuration[cite: 1]
├── next.config.ts             # Next.js configuration[cite: 1]
├── package.json               # Project dependencies and scripts[cite: 1]
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── bloodlink/     # Core platform API routes[cite: 1]
    │   │   └── health/        # System health check endpoint[cite: 1]
    │   ├── globals.css        # Global styles[cite: 1]
    │   ├── layout.tsx         # Root layout[cite: 1]
    │   └── page.tsx           # Main entry page[cite: 1]
    ├── components/
    │   ├── admin/             # Admin core & clinical analytics modules[cite: 1]
    │   ├── auth/              # Authentication suite[cite: 1]
    │   ├── hospital/          # Hospital portal views[cite: 1]
    │   ├── mobile/            # Donor mobile app interface[cite: 1]
    │   ├── radar/             # Donor proximity radar component[cite: 1]
    │   └── ui/                # Shared BloodLink UI components[cite: 1]
    ├── db/
    │   ├── index.ts           # Database connection[cite: 1]
    │   ├── schema.ts          # Database schema definitions[cite: 1]
    │   └── seed.ts            # Database seeding script[cite: 1]
    ├── lib/
    │   └── bloodlink-utils.ts # Shared utility functions[cite: 1]
    └── types/
        └── bloodlink.ts       # TypeScript type definitions[cite: 1]
