This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Workflow safety and tests

- Run `pnpm test` for isolated regression tests. Tests transpile the real TypeScript modules with mocked AI and filesystem adapters; they never read secrets, call live providers, or write `.data`.
- Stages 01–06 are a **draft planning pipeline**, not verified market research or automatic launch approval. Discovery uses sample candidates; competitor and supplier data remain unverified/estimated. Missing trend/ads measurements are `null`, not random observations.
- AI output must satisfy runtime schemas before persistence. Validation without live evidence cannot automatically produce `GO`; creative completion does not produce `LAUNCH_READY`.
- A successful upstream rerun clears downstream artifacts. Product revisions reject outputs computed against old inputs; rejected products are blocked. Explicit Stage03 NO_GO override is scoped to the current validation and is cleared on revalidation.
- Bundle economics assume shipping per unit, payment fee 2.9% + $0.30 and a 3% refund reserve. Price floors target 30% contribution **before advertising**. Tax, operating costs, verified quotes and final merchant policies still require review. The 500-order wholesale scenario is hypothetical, not a supplier commitment.
- Store writes use an atomic rename plus a fail-fast directory lock across processes sharing the same filesystem. If a process crashes and leaves `.data/ecom_store.json.lock`, first verify that **all app workers are stopped**, then remove the stale lock manually. Never clear a lock held by a live worker. This local-file store is not a distributed/serverless database.
- Existing seed/legacy outputs are not retroactively verified. Invalid legacy shapes are not rendered by stage views; rerun the affected stages to regenerate safe draft outputs. No existing product data is automatically rewritten by these fixes.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
