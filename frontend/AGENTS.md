# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-26T22:53:17+08:00
**Project:** fad-management (Frontend)

## OVERVIEW
Vue 3 + Vite frontend for FAD (For After-school Discipline) management system. Chinese-language school administration UI.

## STRUCTURE
```
./
├── src/
│   ├── api/          # API endpoint modules (auth, fad, records, room, reward, students, other)
│   ├── views/        # Page components organized by domain
│   ├── stores/       # Pinia state management
│   ├── router/       # Vue Router configuration
│   ├── layouts/      # Layout components
│   ├── App.vue       # Root component with global Element Plus styles
│   └── main.js       # Entry point
├── package.json      # Dependencies: Vue 3, Vite, Element Plus, Pinia, Vue Router, Axios
└── index.html        # HTML template
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Entry point | `src/main.js` | Vue app initialization, Pinia, Router, Element Plus setup |
| Routing | `src/router/index.js` | All route definitions and auth guards |
| Global styles | `src/App.vue` | Custom Element Plus theme (blue #5b9bd5, rounded corners) |
| API base config | `src/api/request.js` | Axios instance with interceptors, auth headers |
| Auth state | `src/stores/user.js` | User token, group, login/logout logic |

## CONVENTIONS
- **Language**: Chinese (comments, UI strings, route titles)
- **Styling**: Custom Element Plus theme with soft blue (#5b9bd5) primary color, 12-16px border radius, gradient backgrounds
- **API calls**: All use `src/api/request.js` axios instance with Bearer token auth
- **State**: Pinia Composition API (`defineStore`)
- **Component style**: Element Plus components, setup script syntax

## UNIQUE STYLES
- **Theme**: "Fresh campus style" with blue gradients and rounded corners (see `src/App.vue` lines 21-205)
- **Auth pattern**: Token stored in localStorage, auto-injected via axios interceptor
- **Error handling**: Centralized in `request.js` with 401 → auto-logout

## COMMANDS
```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run build:prod   # Production build with --mode production
npm run preview      # Preview production build
```

## NOTES
- Default route: `/records/insert` (after auth)
- User groups: 'S' = admin, others = teacher
- API base URL: `import.meta.env.VITE_API_BASE_URL || '/api'`
