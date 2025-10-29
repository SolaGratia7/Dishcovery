# TODO: Update PlanningView.vue for Date Range Selection

## Completed Tasks
- [x] Replace week selector with date range picker
- [x] Add start and end date inputs with calendar pickers
- [x] Update state management for date range selection
- [x] Modify generateAutoMealPlan to use selected date range
- [x] Add validation for date range
- [x] Update UI styles for date inputs
- [x] Add responsive design for mobile
- [x] Adjust calendar size to optimal dimensions
- [x] Add proper border and styling to calendar containers
- [x] Remove duplicate borders from calendar wrapper elements
- [x] Hide calendar icon when calendar is open
- [x] Dynamically calculate timeframe from selected date range
- [x] Update goal input to show calculated timeframe (days/weeks/months)
- [x] Show days for non-complete weeks/months, weeks for complete weeks, months for complete months
- [x] Don't show 'month(s)' when dates are selected but timeframe is being calculated
- [x] Disable manual timeframe input when date range is selected
- [x] Keep inline positioning (no dropdown) for better UX

## Testing Tasks
- [ ] Test date picker functionality
- [ ] Test single date selection (start = end)
- [ ] Test date range selection
- [ ] Test meal generation for custom ranges
- [ ] Test validation messages
- [ ] Test mobile responsiveness
- [ ] Verify no impact on MiniCalendar.vue usage in other views
- [ ] Test dynamic timeframe calculation and display

## Notes
- MiniCalendar.vue remains unchanged to avoid affecting other views
- Date range allows both single day and multi-day selections
- Auto-generation now works for any date range, not just weeks
- Calendars are now optimally sized with clean borders and styling
- Calendar icons are hidden when the calendar picker is open for cleaner UI
- Timeframe is now automatically calculated from the selected date range
- Shows exact days for non-complete periods, weeks for complete weeks, months for complete months
- Manual timeframe input is disabled when date range is selected
