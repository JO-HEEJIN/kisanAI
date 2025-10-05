# Task: Farm Game Progress Bar + Initial Permission Notice

## Problem Analysis

### 1. Farm Game Progress Bar
- End users want to see level/achievement progress on main screen
- Progress bar should update as they complete achievements
- Should be visible and clear

### 2. Initial Permission Notice
- Users not clicking Camera/GPS permission prompts in Chrome
- Need prominent notice on first load page
- Use NEON YELLOW (#EAFE07) for high visibility

## Files to Check/Modify

### Farm Game Progress Bar:
- `src/game/FarmGameUI.js` - Main UI rendering
- `src/game/FarmSimulationEngine.js` - Check for level/achievement data
- Need to find where level progression is calculated

### Permission Notice:
- `index.html` - Initial loading page
- Add prominent notice before user clicks anything

## Todo Items

### Phase 1: Research
- [ ] Find Farm Game level/achievement system
- [ ] Locate where progress is tracked
- [ ] Find initial loading screen in index.html

### Phase 2: Progress Bar Implementation
- [ ] Design progress bar with NASA branding
- [ ] Add to Farm Game main screen
- [ ] Connect to level/achievement data
- [ ] Test progress updates

### Phase 3: Permission Notice
- [ ] Add NEON YELLOW notice to initial page
- [ ] Clear instructions for Camera + GPS permissions
- [ ] Position prominently (top of page)

### Phase 4: Testing
- [ ] Verify progress bar updates correctly
- [ ] Verify permission notice is visible on first load
- [ ] Test on mobile devices

## Design Requirements

### Progress Bar:
- NASA Space Apps branding
- Show current level / next level
- Show achievement count
- Animate on progress update

### Permission Notice:
- NEON YELLOW (#EAFE07) background or text
- Clear, concise message
- Prominent position
- Mobile-friendly

## Review Section

### ✅ Implementation Complete

**1. Farm Game Progress Bar**

Added to Game Header:
- Level badge (Lv1-5) with gradient background
- Level title (Farm Apprentice → NASA Farm Navigator Master)
- Progress bar showing points: "0 / 1,000 pts"
- Animated fill bar (NEON BLUE → NEON YELLOW gradient)

Location: `src/game/FarmGameUI.js` line 348-358
Update Logic: `updateLevelProgressBar()` function line 1052-1099
CSS Styles: `styles/farm-game.css` line 6616-6669

**2. Permission Notice**

Added to Loading Screen:
- NEON YELLOW (#EAFE07) gradient background
- ⚠️ Warning icon with bounce animation
- Highlighted "Camera" and "GPS/Location" text
- Pulsing glow effect (2s animation loop)
- Mobile responsive design

Location: `index.html` line 40-48
CSS Styles: `styles/main.css` line 3845-3927

**Design Highlights:**
- NASA Space Apps branding throughout
- Smooth 0.5s transition on progress updates
- Glowing effects on both features
- Clear visual hierarchy
- Mobile-first responsive design

**Files Changed:**
- `src/game/FarmGameUI.js` (+72 lines)
- `styles/farm-game.css` (+54 lines)
- `index.html` (+10 lines)
- `styles/main.css` (+84 lines)

**Total:** 4 files, 220 lines added

**Testing Notes:**
- Progress bar updates automatically when achievements unlock
- Permission notice displays immediately on page load
- Both features work on desktop and mobile
- Animations are smooth and non-intrusive
