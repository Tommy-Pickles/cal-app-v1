# Hawkes Health Helper

A responsive calorie and macro diary with goal onboarding, food search, saved meals, recipe portion calculations and an OpenAI meal-estimation endpoint. Built with React, TypeScript, Vinext and Cloudflare D1; published privately through Sites.

## Run locally

```sh
npm run install:ci
npm run db:generate  # only after schema changes
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flat_sentry.sql
npm run dev
```

Apply a migration only once to a local database. The development preview uses the starter's mock sign-in. Production uses Sites sign-in; the API requires a server-provided user identity. Production data is separate from preview data. Keep this Site private unless deliberately changing its audience.

## OpenAI configuration

Set `OPENAI_API_KEY` as a secret in Sites, then redeploy. For local development put it in ignored `.dev.vars`. Never put it in browser code or Git. `OPENAI_MODEL` optionally overrides the default `gpt-5.6-terra` model. Model access and billing must be enabled on the API project.

`POST /api/analyze` accepts text and an optional JPEG/PNG/WebP data URL. It calls the Responses API with a strict JSON schema, validates output, asks clarification questions for ambiguous quantities, and returns provisional food portions. Only the user's explicit approval writes food to the diary. Photos are not stored by the application. `store: false` is passed to OpenAI; provider retention policies still apply.

Voice input uses browser speech recognition in supported browsers; the resulting editable transcript is sent to the same AI endpoint. Browser voice availability and its speech service depend on the browser. Keyboard dictation and typing are the fallback. Live microphone capture and live OpenAI responses require separate end-to-end validation after credentials are configured.

## Nutrition and portions

- Energy estimate: Mifflin–St Jeor BMR, activity multiplier, then 10% surplus for Get Big or 15% deficit for Lose Weight. Automatic estimates have a 1,200 kcal floor, which is a product guardrail rather than a personal recommendation. The optional average equation averages the two sex constants. Users can set their own target of 1,200–6,000 kcal.
- Protein choices: 1.4, 1.8 and 2.2 g/kg, capped at 35% of energy. Fat is approximately 30% of energy; carbohydrates fill the remainder. These are general adult starting targets, not clinical prescriptions.
- Calories and kilojoules convert using 1 kcal = 4.184 kJ.
- Recipe totals sum the listed ingredient portions. A weighed portion uses `portion grams / finished batch grams`. A serving uses `1 / number of servings`. Finished cooked weight avoids confusing raw ingredient weight with final yield.
- Starter food values are typical reference estimates, not a verified branded nutrition database. Label entry lets users supply brand-specific values. AI values must always be checked.

References: [Mifflin–St Jeor](https://pubmed.ncbi.nlm.nih.gov/2305711/), [ISSN protein position stand](https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/), [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-terra).

## Data and checks

D1 stores a versioned JSON diary per authenticated user. Updates use optimistic concurrency to reject stale saves from another tab. Export is available under How it works. The app starts with an empty diary; preview test data is never shipped.

```sh
npm test
npx tsc --noEmit
npm run build
```

The tests cover nutrition scaling, recipe servings and cooked-weight portions, kcal/kJ conversion, spelling aliases, macro targets, and local calendar dates. Browser checks cover onboarding, searching, logging, persistence, unit switching, saving meals, recipe creation and adding a 300g portion. A second review checks 320px/390px mobile layouts, goal validation, zero/oversized portions, 100ml liquid entry, fractional recipe ingredients, and the missing-AI-key fallback. The interface uses system typography, a compact nutrition summary, grouped food log, mobile bottom sheets and a floating tab bar.

## Next iterations

A larger verified food catalogue, barcode scanning, editing logged meals, and native mobile packaging are natural extensions. The web manifest supports a standalone launch experience, but this version does not cache the app for offline use. AI credentials and live photo/voice verification remain required before calling the AI features production-ready.
