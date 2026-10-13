# LIFEOS

A personal intelligence for everyday life in Dubai. LIFEOS remains a working name. The product coordinates life moments, intentions and mutually useful arrangements; events and paper trading are optional capabilities.

## Run locally

Requires Node.js 24 or newer. The server uses Node's bundled SQLite implementation.

1. Install dependencies with `npm install`.
2. Open `.env` (a blank local file is prepared), paste your Google AI Studio key into `GEMINI_API_KEY`, and save.
3. Run `npm run dev` and open http://localhost:3000.
4. Restart the server after editing `.env`. `GEMINI_MODEL` selects the model; the default is `gemini-3.8-flash`. The request timeout defaults to 30 seconds.

The Gemini key stays on the Node server. Missing keys and failed requests produce explicit errors. There are no hardcoded replies pretending to be live intelligence. The app supports English UI and Arabic/English conversation input; full Arabic UI localisation is not implemented.

Without a key, profile editing, attendance, private coordination demos, notifications and virtual paper trades work. Natural-language interpretation and conversation require Gemini. Gemini setup status reports whether a key is configured, not whether the key has been validated against Google's API.

## Private participants

Create a participant on the opening screen. New participants begin with introductions and city discovery disabled. Choose roles, skills, interests, workdays, districts, goals and permissions in You.

Save the private access link from You. It contains a random 256-bit credential in the URL fragment and opens the same participant in another browser or device. The fragment is removed after opening; each tab keeps its own session in sessionStorage. Anyone holding the link can access that participant. Participant IDs are not credentials; private records are scoped to the authenticated participant. The public bootstrap lists only predefined sample participants when demo mode is enabled, without session secrets.

Demo login is enabled in local development. It is disabled by `npm start` unless `ENABLE_DEMO=true` is explicitly set. Do not enable demo login for a private deployment.

## Working flows

- **Everyday conversation:** Gemini uses the user's own profile, recent conversation, active moments and known city context. It returns a validated create/update/no-action plan. Questions and hypothetical examples do not create moments. Refining a goal updates its existing moment.
- **Moments:** save goals, timing, district, permissions and boundaries; edit, complete, cancel or open a related conversation. Rest stays private. Schedule overlaps and small travel buffers produce grounded personal insights.
- **Introductions:** only opted-in, non-private, overlapping moments with shared intentions are considered. Invitations are limited by weekly caps and active proposals. The recipient expresses interest, then the initiator approves the same arrangement. Profiles are disclosed only after mutual consent, and both people get a private meeting moment. Changes reset both approvals. Conflicts and permissions are rechecked at acceptance. Declines/cancellations halt coordination. Completion records an outcome and lets each person report usefulness.
- **Attendance:** participants independently record attendance. Repeat requests do not double-count. Cancelling updates the demand estimate and associated plans.
- **City:** search and filter sample or participant-published activities, publish a gathering, view organiser estimates and independently confirmed attendance, and add an activity to personal plans. The district illustration is explicitly schematic; Street map opens an interactive OpenStreetMap embed. No private person locations appear on maps.
- **Drivers:** estimates use independent attendance and a disclosed 30% taxi assumption. Suggestions require opted-in transport insights, a relevant district and an overlapping declared workday/shift. A limited number of drivers receive an insight. Changed attendance updates existing estimates; disappeared demand retires them. No rides or income are promised.
- **Quiet updates:** Dubai quiet hours, active rest, manual interruption pause, daily budgets, deduplication, snooze, dismissal and stop-topic choices apply. Pending notifications are checked every 30 seconds. Browser alerts are opt-in and work while the website is open. Closed-browser push is not implemented.
- **Paper trading:** optional, isolated per participant, persisted on the server, and uses virtual cash and fixed sample prices. Positive whole-share quantities and cash/holding limits are enforced. No broker or live quotes are connected.

## Three sample experiences

Open You > Sample experiences. Each participant is fictional and listings are labelled as samples.

**Introduction:** use Elena and Rashid in separate browser tabs. Run Introduction as Elena. Rashid receives a private invitation in Moments/Ask and chooses Interested. Elena then chooses Agree to introduction. Both timelines update in realtime. The demo creates sample intentions but never approves either person's decision automatically. A change requires both people to agree again.

**Driver context:** independently confirm at least two participants for the sample Dubai Marina event in Explore. Tariq can then see a qualified estimate when his workday and shift overlap. Driver context recalculates from current records; it never invents 10,000 confirmed attendees.

**Food coordination:** run the Food coordination sample. Today shows a simulated AED 48 meal, explicitly not a real listing or verified provider. Accepting saves a simulated pickup plan and outcome. It does not place an external order. Real hunger requests save the person's actual preferences, but do not fabricate provider availability.

## Capability limits

This is a functioning local multi-participant prototype. Live food providers, surplus-food verification, external calendars, real venue reservations, transport bookings, ticketing, external service fulfilment and financial brokers need actual provider integrations. The interface and model are told not to claim those actions happened. No unsafe or unverified food exchange is arranged. Organiser listings are participant submissions, not verified listings.

Gemini understands varied context; deterministic introduction discovery currently scores shared goal/interest terms with time, district and permission checks. It is a baseline candidate-selection policy, not an embedding or city-scale semantic graph. Outcome feedback is recorded; automatic model retraining is not implemented.

## Persistence and deployment

The shared backend persists in `data/lifeos.sqlite`, with WAL journalling and atomic state snapshots. A legacy `data/lifeos-store.json` is imported once into a new database. The original JSON is preserved. Imported events are labelled as demo data, ambiguous time strings are converted to dated sample moments, and invalid undated prototype proposals expire rather than bypass fresh approval.

Use one server process with a persistent data directory. `LIFEOS_DATA_DIR` selects its location. A deployment must mount persistent storage and serve over HTTPS. Multiple server workers sharing one state snapshot are not supported. Database files contain private participant records and are excluded from Git. Access-link authentication is suitable for a private prototype; a public service needs account recovery, link rotation, abuse controls and a deployment authentication review.

`npm run build` builds the frontend. `npm start` serves the built frontend and API. The server binds to loopback by default; set HOST only when deliberately deploying or enabling access from other devices. For local cross-device testing, the server must be reachable on that device and the access link must use that reachable origin.

## Validation

- `npm run lint`: TypeScript checking.
- `npm test`: isolated integration and policy tests; they do not use your real database or Gemini key.
- `npm run build`: production frontend build.

Tests cover scoped access, missing-key errors, independent approval, replay prevention, approval resets, confirmed plans, duplicate attendance, cancellation, simulated food approval/outcomes, invalid trades, SQLite restart persistence, Dubai quiet hours, active rest, notification budgets/deduplication/topic stops, schedule friction and changing driver demand.

Browser checks exercised all five screens at 360, 375, 390, 430, 768, 1024, 1440 and 1920 pixels with no horizontal overflow, and independently completed the introduction in two browser sessions. The configured key successfully listed available Gemini models. Live generation currently returns provider HTTP 503 (high demand), so a successful live response remains unverified. A retired-model HTTP 404 was resolved by selecting the provider-recommended gemini-3.8-flash. The app retries briefly and reports overload without changing plans.

The active interface is `src/components/LifeUI.tsx`, with the shared design system in `src/index.css` and application state in `src/App.tsx`. Older generated view files remain for reference and are not mounted by the active app.
