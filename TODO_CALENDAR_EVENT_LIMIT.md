# TODO: Fix Calendar Month Day Event Formatting

## Issue
The "+x more" popup should appear after 2 events in the month view, but it's not working correctly.

## Current Status
- ❌ `eventLimit={2}` prop doesn't seem to work as expected
- ❌ CSS height limiting (30px) doesn't trigger the popup
- ✅ Popup click handling is working (clicks don't trigger calendar slot selection)

## Attempted Solutions
1. Added `eventLimit={2}` prop to BigCalendar component
2. Set CSS `max-height: 30px` on `.rbc-events-container`
3. Tried hiding events with `:nth-child(n+3)` selector
4. Added `popupOffset` for better positioning

## Next Steps to Try
1. Check React Big Calendar documentation for correct `eventLimit` usage
2. Consider custom `dateCellWrapper` component to manually control event display
3. Implement custom "+more" link that manually shows/hides events
4. Check if there are CSS conflicts preventing overflow detection
5. Verify React Big Calendar version compatibility with `eventLimit` prop

## Related Files
- `components/Calendar.tsx` - Calendar component
- `app/globals.css` - Calendar styling (lines ~448-462)

