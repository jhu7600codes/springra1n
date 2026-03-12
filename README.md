# springra1n

ios container environment running on the web. springid auth, springboard ui with android navigation, and springloader package manager with livecontainer url scheme integration.

## setup

1. create a supabase project
2. copy your project url and anon key to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. install deps:
```bash
npm install
```

4. dev:
```bash
npm run dev
```

## features

- **springid**: account system with supabase auth
- **springboard**: ios-like app grid with android 3-button nav
- **springloader**: package manager for sideloading apps via url schemes
- **setup wizard**: initial device setup on first login
- **livecontainer integration**: install apps directly on real iphone via url scheme

## deploy to vercel

```bash
vercel deploy
```

set `springra1n` as your subdomain in vercel project settings.
