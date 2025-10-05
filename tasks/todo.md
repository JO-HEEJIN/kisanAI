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
(To be filled after completion)
