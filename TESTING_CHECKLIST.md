# Theme Toggle Testing Checklist

## Pre-Deployment Testing

### ✅ Build & Code Quality
- [x] Build completes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] No new ESLint errors in changed files
- [x] Correct branch: `feat/theme-toggle-light-dark-comfort`

### ✅ Default Theme
- [x] App configured to default to "light" theme
- [x] System theme detection disabled (`enableSystem={false}`)
- [x] Light theme uses comfortable colors (not bright white)

### ✅ Component Implementation
- [x] ThemeSwitcher is a simple button (no dropdown)
- [x] Icon shows Moon when in light mode
- [x] Icon shows Sun when in dark mode
- [x] Button has accessible label (screen reader)
- [x] Consistent styling with LanguageSwitcher

### ✅ Integration
- [x] ThemeSwitcher in desktop header
- [x] ThemeSwitcher in mobile menu
- [x] Positioned correctly next to LanguageSwitcher

## Manual Testing Required (After Deployment)

### First Visit (New User)
1. [ ] Open site in incognito/private window
2. [ ] Verify light theme is active by default
3. [ ] Check background is soft gray (#fafafa), not bright white
4. [ ] Verify text is readable (dark on light)
5. [ ] Check Moon icon is visible in header

### Theme Toggle - Desktop
1. [ ] Click Moon icon in light mode
2. [ ] Verify theme switches to dark
3. [ ] Verify icon changes to Sun
4. [ ] Check all content is readable in dark mode
5. [ ] Click Sun icon in dark mode
6. [ ] Verify theme switches to light
7. [ ] Verify icon changes to Moon

### Theme Toggle - Mobile
1. [ ] Open mobile menu (hamburger icon)
2. [ ] Locate ThemeSwitcher at bottom with LanguageSwitcher
3. [ ] Click Moon icon (light mode)
4. [ ] Verify theme switches to dark
5. [ ] Click Sun icon (dark mode)
6. [ ] Verify theme switches to light

### Persistence
1. [ ] Set theme to dark mode
2. [ ] Reload page (F5)
3. [ ] Verify dark theme persists
4. [ ] Set theme to light mode
5. [ ] Reload page (F5)
6. [ ] Verify light theme persists
7. [ ] Close browser, reopen
8. [ ] Verify last theme choice is remembered

### Visual Quality - Light Theme
1. [ ] Background is comfortable, not harsh white
2. [ ] Cards have good contrast against background
3. [ ] Text is clearly readable (high contrast)
4. [ ] Borders are visible but subtle
5. [ ] Red accent (primary) looks good
6. [ ] Blue accent (Arc Reactor) looks good
7. [ ] No visual glitches or artifacts

### Visual Quality - Dark Theme
1. [ ] Dark theme still works as before
2. [ ] All existing functionality preserved
3. [ ] No regression in dark mode appearance

### Pages to Test
Test theme toggle on these key pages:
- [ ] Home page (/)
- [ ] Products pages (/game-accounts, /digital-templates, /verifications)
- [ ] Product detail page
- [ ] Cart page
- [ ] Account page
- [ ] Admin pages (if admin)
- [ ] Sign in/Sign up pages

### Responsive Design
- [ ] Desktop (>1024px): Works correctly
- [ ] Tablet (768-1024px): Works correctly
- [ ] Mobile (320-767px): Works correctly

### Browser Compatibility
Test on:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Expected Behavior Summary

### Light Theme (Default)
- **Background**: Soft gray (#fafafa / hsl(0 0% 98%))
- **Text**: Almost black (hsl(0 0% 3%))
- **Cards**: White (hsl(0 0% 100%))
- **Icon**: Moon (indicates "click to go dark")

### Dark Theme
- **Background**: Dark with blue hint (#101419)
- **Text**: Off-white (#F7F7F7)
- **Cards**: Slightly lighter dark gray (#1A202C)
- **Icon**: Sun (indicates "click to go light")

### Toggle Behavior
- **Simple click**: No menu, direct toggle
- **Two states only**: Light ↔ Dark (no system)
- **Persistent**: Saved to localStorage
- **Smooth**: Clean transitions between themes

## Issues to Watch For

### Potential Problems
- [ ] Theme flicker on page load (FOUC)
- [ ] Icon not updating immediately after click
- [ ] localStorage not persisting theme
- [ ] Incorrect default theme on first visit
- [ ] System theme interfering (should be disabled)
- [ ] Mobile menu not showing theme switcher
- [ ] Light theme too bright/harsh
- [ ] Text not readable in either theme

### If Issues Found
1. Check browser console for errors
2. Verify localStorage contains "app-theme" key
3. Check if theme class is applied to html/body
4. Ensure ThemeProvider props are correct
5. Test in incognito to rule out cached settings

## Success Criteria

All of the following must be true:
- ✅ Default theme is light with comfortable colors
- ✅ Toggle button works with single click
- ✅ Icons change correctly (Moon ↔ Sun)
- ✅ No dropdown menu (simple button only)
- ✅ Theme persists across page reloads
- ✅ No system theme option
- ✅ Works on mobile and desktop
- ✅ No visual regressions in dark mode
- ✅ Build and deploy successful

## Deployment

After all tests pass:
1. [ ] Changes committed to `feat/theme-toggle-light-dark-comfort` branch
2. [ ] Branch pushed to repository
3. [ ] Deployed to production (Vercel)
4. [ ] Production smoke test completed
5. [ ] User acceptance confirmed

## Notes
- Light theme designed for extended comfortable viewing
- Dark theme maintains original Stark Industries aesthetic
- Simple toggle matches user expectation of light/dark switch
- No system preference needed per requirements
