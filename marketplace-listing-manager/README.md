# Marketplace Listing Manager

AI-powered app listing generator for ERP/CRM integrations across multiple marketplaces.

## Features

- Generate compliant listings for HubSpot, Shopify, Salesforce, OpenAI, Microsoft AppSource, Zapier, Make, and custom marketplaces
- Character limits and content rules enforced automatically per marketplace
- Edit generated listings inline before copying or publishing
- Save version history with export/import for team sharing
- Add custom marketplaces with your own guidelines
- Compliance review notes flagged by AI

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for production

```bash
npm run build
```

## Deploying to Netlify

### Option A — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

When prompted for the build command: `npm run build`
When prompted for the publish directory: `dist`

### Option B — Connect your Git repo

1. Push this project to GitHub
2. In Netlify: New site → Import from Git → select your repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Go to **Site settings → Environment variables** and add:
   - `VITE_ANTHROPIC_API_KEY` = your Anthropic API key

### Option C — Drag and drop

1. Run `npm run build` locally
2. Drag the `dist/` folder into Netlify's deploy dropzone at app.netlify.com

## Adding marketplaces

Click **Add marketplace** in the sidebar. You can define:
- Character limits per field
- Content rules and restrictions
- Writing tone guidance

Custom marketplaces are saved in browser localStorage and persist across sessions.

## Team sharing

Use **Version history → Export all** to download a JSON file of all saved listings. Share it with teammates who can **Import** it into their own instance.

## Roadmap

- [ ] Image spec guidance per marketplace
- [ ] Bulk CSV/Word export
- [ ] Direct API publishing (HubSpot, Shopify)
- [ ] User authentication
- [ ] Shared cloud storage for teams
