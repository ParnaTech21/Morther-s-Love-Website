# Mother’s Love Crafts

React + TypeScript + Chakra UI (v2) front end, ASP.NET Core 8 (C#) API, SQL Server.

## Run it
**Backend** (needs .NET 8 SDK and SQL Server or LocalDB)
```
cd backend/MothersLoveCrafts.Api
# edit appsettings.json: connection string, Jwt:Key (32+ chars), Admin:Username/Password
dotnet run          # http://localhost:5080 (creates and seeds the database on first run)
```
**Frontend** (Node 18+)
```
cd frontend
npm install
npm run dev         # http://localhost:5173 (proxies /api to the backend)
```
Staff dashboard: http://localhost:5173/admin

## Before going live
- Move secrets out of appsettings.json (user-secrets or environment variables).
- Replace `EnsureCreated()` in Program.cs with EF Core migrations.
- Update shop details and currency in `frontend/src/shop.ts`.
- Set `Cors:Origins` to your real domain and serve over HTTPS.
