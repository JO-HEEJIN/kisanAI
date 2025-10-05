# Task: Add "Click the Target!" Popup After AR Launch

## Problem Analysis
- User clicks "Launch AR" button → `handleARButtonClick()` → `launchRealAR()`
- AR scene starts with moving target indicator
- Need to show "Click the Target!" popup **2 seconds after AR starts**
- Previous attempt modified `EnhancedARPixelView.js` which was wrong location
- Should add popup trigger in `launchRealAR()` function in `src/ar-functions.js`

## Files to Modify
1. `src/ar-functions.js` - Add popup trigger 2 seconds after AR starts
2. Create new function `showTargetClickGuidePopup()` in same file (simple, no duplicate)

## Todo Items

### 1. Research Phase
- [ ] Read `launchRealAR()` function to understand AR initialization flow
- [ ] Find where AR scene is fully loaded and ready
- [ ] Check if popup function already exists (avoid duplicates!)

### 2. Implementation Phase
- [ ] Create `showTargetClickGuidePopup()` function with NASA branding
- [ ] Add 2-second delayed call after AR scene is ready
- [ ] Test popup appears at correct timing

### 3. Testing & Verification
- [ ] Verify popup shows 2 seconds after Launch AR click
- [ ] Verify popup doesn't interfere with AR functionality
- [ ] Verify popup auto-dismisses after 8 seconds
- [ ] Verify manual dismiss works

## Design Requirements
- NASA Space Apps branding (NEON BLUE, NEON YELLOW, DEEP BLUE)
- Clear message: "Click the moving target indicator"
- "Got it! 🚀" button for manual dismiss
- 8-second auto-dismiss
- Full-screen overlay (z-index: 999999)

## Review Section
(To be filled after completion)
