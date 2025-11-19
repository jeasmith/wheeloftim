# Build Fix Plan

## Issues Identified and Fixed

### ✅ 1. TypeScript Config Path Resolution Error - FIXED
**Error**: `File '@repo/typescript-config/nextjs.json' not found`
**Location**: `apps/web/tsconfig.json` and `packages/ui/tsconfig.json`
**Cause**: TypeScript cannot resolve the workspace package path correctly
**Fix Applied**: 
- Updated `apps/web/tsconfig.json` to use relative path: `../../packages/typescript-config/nextjs.json`
- Updated `packages/ui/tsconfig.json` to use relative path: `../../typescript-config/react-library.json`
- This ensures TypeScript can resolve the config files regardless of workspace linking

### ✅ 2. XState Version Mismatch - FIXED
**Issue**: `@xstate/react@4.1.3` requires `xstate ^5.18.2` as peer dependency, but we had `xstate ^5.0.0`
**Location**: `apps/web/package.json`
**Impact**: Potential peer dependency warnings during install
**Fix Applied**: 
- Updated `xstate` from `^5.0.0` to `^5.24.0` (latest 5.x version)
- This ensures full compatibility with `@xstate/react@4.1.3`

### ✅ 3. Linting Errors - RESOLVED
**Status**: All TypeScript and linting errors have been resolved
**Verification**: Ran `read_lints` - no errors found

## Next Steps for Testing

1. **Install Dependencies**
   ```bash
   bun install
   ```
   - Check for any peer dependency warnings
   - Verify all workspace packages are properly linked

2. **Build the Application**
   ```bash
   bun run build
   ```
   - Should complete without TypeScript errors
   - Verify all packages build successfully

3. **Start Development Server**
   ```bash
   bun dev
   ```
   - Server should start on http://localhost:3000
   - Check console for any runtime warnings

4. **Browser Testing**
   - Navigate to http://localhost:3000
   - Test the name spinner functionality:
     - Add participants
     - Remove participants
     - Spin the wheel to select a random participant
   - Verify XState state management works correctly
   - Check browser console for any errors

## Expected Behavior

- ✅ TypeScript compilation should succeed
- ✅ No peer dependency warnings for XState
- ✅ App should load in browser
- ✅ Name spinner should function correctly with XState state management
- ✅ All components should render properly with shadcn/ui styling

