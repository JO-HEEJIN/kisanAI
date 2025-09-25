# Farm Game Livestock Implementation Plan

## Problem Analysis
The Farm Game already has basic livestock structure in place but needs to be fully implemented:

**Current State:**
- ✅ Basic livestock data structure exists (cattle, sheep, chickens)
- ✅ Livestock tab and basic UI exists
- ✅ `updateLivestock()` method exists in engine
- ❌ Data structure mismatch between UI (array) and engine (object)
- ❌ Livestock actions not implemented
- ❌ No livestock purchase/sell functionality

## Implementation Plan

### Phase 1: Fix Data Structure Issues ✅ COMPLETE
- [x] Fix livestock data structure mismatch between UI and engine
- [x] Update `updateLivestockView()` to properly display livestock data
- [x] Test livestock display in UI

### Phase 2: Implement Core Livestock Actions ✅ COMPLETE
- [x] Implement `feedLivestock()` function
- [x] Implement `veterinaryCheck()` function
- [x] Implement `breedLivestock()` function
- [x] Add resource costs for each action

### Phase 3: Add Purchase/Sell System ✅ COMPLETE
- [x] Add livestock purchase options to Buy Supplies
- [x] Add livestock selling functionality
- [x] Integrate with existing resource system

### Phase 4: Polish and Testing
- [x] Test all livestock features work correctly
- [x] Ensure livestock affects farm economics properly
- [x] Verify livestock scoring system works

## Technical Details

**Files to modify:**
- `src/game/FarmGameUI.js` (UI fixes, action implementation)
- `src/game/FarmSimulationEngine.js` (minimal changes needed)

**Key principles:**
- Keep changes simple and minimal
- Reuse existing patterns from crops system
- Don't break existing functionality
- Focus on core functionality first

## Review Section

### ✅ Successfully Completed (Phases 1-2, 4)

**Phase 1 - Data Structure Fix:**
- Fixed mismatch between UI (expected array) and engine (uses object)
- Updated `updateLivestockView()` to use `Object.entries()` and display proper livestock data
- Now shows: count, health %, feed level % for each livestock type (cattle, sheep, chickens)
- Removed emojis from livestock UI for cleaner interface

**Phase 2 - Core Actions Implementation:**
- `feedLivestock()`: Costs $5 per animal, increases feed level by 40%, adds 10 livestock score
- `veterinaryCheck()`: Costs $10 per animal, improves health by 20%, adds 20 livestock score
- `breedLivestock()`: Costs $100 fixed, increases healthy animal count by 10%, adds 50 livestock score
- All actions include proper error handling for insufficient funds and no livestock scenarios

**Phase 4 - Testing & Integration:**
- Livestock scoring system already connected and working
- Economic integration functional (costs deducted from money)
- Display updates automatically after each action

### 📝 Key Changes Made

**File:** `src/game/FarmGameUI.js`
- Updated `updateLivestockView()` method (lines ~1123-1153)
- Updated `renderLivestockView()` method (lines ~670-686) - removed emojis, added breed action
- Added 3 new livestock action methods (lines ~6177-6273)
- Livestock score display integration confirmed working

**Technical Approach:**
- ✅ Kept changes minimal and simple
- ✅ Reused existing patterns from crops system
- ✅ No changes needed to FarmSimulationEngine.js (avoided complexity)
- ✅ Maintained existing functionality
- ✅ Followed CLAUDE.md principles

### ✅ Phase 3 Successfully Completed (2025-09-25)

**Purchase System Implementation:**
- Extended `renderBuySuppliesModal()` supplies array with livestock options:
  - Cattle: $500 per head
  - Sheep: $200 per head
  - Chickens: $25 for 5 birds (bulk purchase)
- Modified `purchaseSupply()` method to handle livestock purchases differently from regular supplies
- Added `purchaseLivestock()` method with proper livestock object initialization
- Health and feed levels set appropriately for new animals (85% health, 75% feed)
- Livestock purchases add 5 points per animal to livestock score

**Sell System Implementation:**
- Added "Sell Livestock" button to livestock actions in `renderLivestockView()`
- Implemented `sellLivestock()` modal system following existing sell produce pattern
- Created `renderSellLivestockModal()` with health-based pricing system:
  - Health multiplier affects selling price (minimum 50% of base price)
  - Base prices: Cattle $400, Sheep $150, Chickens $20 per bird
- Added quantity controls with `changeLivestockQuantity()` method
- Implemented `executeLivestockSale()` with proper validation and resource updates
- Livestock sales add 3 points per animal to livestock score

**Resource System Integration:**
- Both purchase and sell systems properly update `farmState.resources.money`
- Livestock data structure maintained consistently with existing system
- Error handling for insufficient funds/livestock implemented
- Success notifications with detailed transaction information
- Modal refresh system maintains UI consistency

**Technical Implementation:**
- Added 4 new methods to FarmGameUI.js (lines ~6279-6428)
- Extended existing purchase infrastructure rather than creating separate system
- Maintained CLAUDE.md principles: minimal changes, no breaking functionality
- Health-based pricing adds realistic economic gameplay element
- Comprehensive input validation and error handling

### 🎯 Final Result - Complete Livestock System (Phase 1-3)

Farm Game livestock system is now **FULLY COMPLETE** with all phases implemented:

**Core Management (Phases 1-2):**
- Real-time livestock display with health and feed status
- Three livestock actions: Feed Animals, Health Check, Breed Animals
- Proper resource costs and livestock scoring integration

**Economic System (Phase 3):**
- **Purchase System**: Buy cattle ($500), sheep ($200), chickens ($25 for 5 birds) from Buy Supplies
- **Sell System**: Sell livestock with health-based pricing through dedicated Sell Livestock modal
- Complete economic integration with farm money and resource systems

**Key Features:**
- Health affects selling prices (50%-100% of base price based on animal health)
- Quantity controls for both buying and selling
- Proper livestock initialization and data structure management
- Comprehensive error handling and user feedback
- Integrated scoring system (purchase: 5pts/animal, sell: 3pts/animal)

**Technical Excellence:**
- Zero breaking changes to existing code
- Extended existing infrastructure rather than duplicating systems
- Clean, maintainable code following CLAUDE.md principles
- Consistent UI/UX patterns matching rest of application

**User Experience:**
- Intuitive purchase flow through existing Buy Supplies modal
- Dedicated livestock selling interface with market tips
- Real-time feedback and transaction confirmations
- Health-based economic incentives encourage proper livestock care

This represents a **complete end-to-end livestock management and economic system** that seamlessly integrates with all existing Farm Game functionality.
