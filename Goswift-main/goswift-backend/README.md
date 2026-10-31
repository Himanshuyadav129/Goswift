# GoSwift backend

Express + MongoDB (Mongoose) + Socket.IO for the GoSwift bus-tracking frontend.

## Run

```bash
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed              # demo users, 3 routes, 4 buses, 14 days of sample trips
npm run dev               # http://localhost:5000
npm test                  # unit tests for ETA / search / reports / CSV (no database needed)
npm run simulate          # drives bus GS-101 along its route -> live map, ETA and alerts (see below)
```

Seeded logins (change before real use): `admin@goswift.local / Admin@12345`,
`driver@goswift.local / Driver@12345` (bus GS-101), `student@goswift.local / Student@123`.
The sample trips only exist so the Reports page is not empty - delete the `trips` collection to remove them.

## Features

| Area | What it does |
|---|---|
| Auth | Register / login (JWT). Roles: `user`, `driver`, `admin`. Public sign-up can only create `user`. |
| Admin panel | CRUD for buses, routes (stops picked on a map) and drivers; one driver per bus. |
| Routes + ETA | Each route is an ordered list of stops. `GET /api/buses/:id/eta` returns every stop as passed / arrived / next / upcoming with minutes and km, computed from the live GPS position and the bus's learned average speed. |
| Search | Direction-aware: "ITO -> Noida" only matches buses whose route visits ITO before Noida. |
| Trips | Driver starts/ends a trip. Distance, duration and stop arrivals are recorded per trip. |
| Alerts | A user subscribes to "bus X, stop Y, N minutes before". When the ETA drops below N (or the bus arrives) one notification per trip is created, pushed live over the socket, and optionally e-mailed. |
| Reports | Trips per day, distance per bus, average trip time, filterable trip history, CSV export. |

## API

Send the token as `Authorization: Bearer <token>`.

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/register` (also `/register`) | public | `{name,email,password}` |
| POST | `/api/login` | public | -> `{token,user}` |
| GET | `/api/me` | logged in | |
| POST/GET | `/api/search` | public | `{source,destination}` |
| GET | `/api/buses`, `/api/buses/:id` | public | |
| GET | `/api/buses/:id/eta` | public | stops with status + ETA |
| GET | `/api/buses/mine` | driver | my bus + route |
| POST/PUT/DELETE | `/api/buses[/:id]` | admin | `{busNumber, route, status, source?, destination?}` |
| GET | `/api/routes[/:id]` | public | |
| POST/PUT/DELETE | `/api/routes[/:id]` | admin | `{name, stops:[{name,lat,lng}]}` (2+ stops, in order) |
| POST | `/api/driver/trips/start`, `/api/driver/trips/end` | driver | |
| GET | `/api/driver/summary` | driver | current trip, trips today, km today |
| GET/POST/DELETE | `/api/subscriptions[/:id]` | logged in | `{busId, stopName, minutesBefore}` |
| GET | `/api/notifications` | logged in | `{unreadCount, items}` |
| PUT | `/api/notifications/read-all`, `/api/notifications/:id/read` | logged in | |
| GET | `/api/admin/stats` | admin | dashboard numbers |
| GET/POST/PUT/DELETE | `/api/admin/drivers[/:id]` | admin | |
| GET | `/api/admin/users`, PUT `/api/admin/users/:id/role` | admin | |
| GET | `/api/admin/reports/summary?days=14` | admin | per-day + per-bus numbers |
| GET | `/api/admin/reports/trips?from=&to=&busId=` | admin | trip history |
| GET | `/api/admin/reports/trips.csv?...` | admin | CSV download |

## Realtime (Socket.IO, same port)

- Driver -> server: `busLocation` `{ busId, latitude, longitude }`
- Server -> all: `busLocationUpdate` `{ busId, latitude, longitude, updatedAt }`, `busStatusUpdate` `{ busId, status }`
- Server -> one logged-in user: `notification` (connect with `io(API_URL, { auth: { token } })`)

Set `REQUIRE_SOCKET_AUTH=true` so only the assigned driver (or an admin) can move a bus.

## Demo without a phone

1. `npm run dev` (backend) and the frontend running.
2. Log in as `student@goswift.local`, open **Track**, pick **GS-101**.
3. In another terminal: `npm run simulate`. The marker moves, the stop ETAs update, and the student
   gets a "GS-101 is approaching Akshardham" notification (bell + pop-up).
4. Log in as admin -> **Reports** shows the finished trip.

## Notes / limits

- ETA = remaining distance along the route / average speed learned from recent pings (default 25 km/h). It is an estimate, not traffic aware.
- Search filters in JavaScript after loading the buses (fine for hundreds of buses; move it into the database query for thousands).
- Phone browsers only share GPS on HTTPS pages, so a real-phone demo needs the app deployed.
