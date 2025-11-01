<template>
  <div
    v-if="calendarVisible"
    :class="['calendar-dropdown', { 'below': dropdownPosition === 'below', 'above': openAbove }]"
    @click.stop
  >
    <div :class="['dropdown-content', { 'below': dropdownPosition === 'below', 'above': openAbove }]">
      <div class="mini-calendar">
        <div class="mini-calendar-header">
          <button type ="button" @click="changeMonth(-1)" class="month-nav-btn">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="current-month-year" @click="toggleMonthSelector">{{ miniCalendarMonthYear }}</span>
          <button type ="button" @click="changeMonth(1)" class="month-nav-btn">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Month Selector Dropdown -->
        <div v-if="showMonthSelector" class="month-selector">
          <div class="month-selector-header">
            <button type ="button" @click="changeYear(-1)" class="year-nav-btn">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="selected-year">{{ selectedYear }}</span>
            <button type ="button" @click="changeYear(1)" class="year-nav-btn">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
          <div class="month-grid">
            <div
              v-for="(month, index) in months"
              :key="index"
              :class="['month-item', {
                'active': index === miniCalendarDate.getMonth() && selectedYear === miniCalendarDate.getFullYear()
              }]"
              @click="selectMonth(index)"
            >
              {{ month }}
            </div>
          </div>
        </div>

        <!-- Calendar Days (only show when month selector is closed) -->
        <div v-if="!showMonthSelector">
          <div class="mini-calendar-weekdays">
            <div v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="day" class="weekday-label">
              {{ day }}
            </div>
          </div>
          <div class="mini-calendar-days">
            <div
              v-for="day in miniCalendarDays"
              :key="day.dateStr"
              :class="['mini-calendar-day', {
                'today': day.isToday,
                'selected': day.isSelected,
                'in-range': day.isInRange,
                'range-start': day.isRangeStart,
                'range-end': day.isRangeEnd,
                'current-month': day.isCurrentMonth,
                'other-month': !day.isCurrentMonth,
                'has-meals': day.hasMeals
              }]"
              @click="handleDateClick(day)"
            >
              {{ day.day }}
              <span v-if="day.hasMeals" class="meal-indicator"></span>
            </div>
          </div>
        </div>

        <!-- Today Button -->
        <div v-if="showTodayButton" class="card-bottom">
          <button type ="button" @click="goToToday" class="today-btn">
            Today
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, unref } from 'vue'

const props = defineProps({
  currentWeek: {
    type: Date,
    required: true
  },
  selectedDates: {
    type: Array,
    default: () => []
  },
  datesWithMeals: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'single'
  },
  highlightSelected: {
    type: Boolean,
    default: false
  },
  dropdownPosition: {
    type: String,
    default: 'inline' // 'inline' or 'below'
  },
  // 🆕 Added props
  showTodayButton: {
    type: Boolean,
    default: true // PantryView can set this to false
  },
  openAbove: {
    type: Boolean,
    default: false // PantryView can set this to true
  },
  // highlight today's date
  highlightToday: {
    type: Boolean,
    default: true // PantryView can set this to false
  },
  autoClose: {
    type: Boolean,
    default: true // Set to false for inline calendars
  }
})



const emit = defineEmits(['select-date'])

const miniCalendarDate = ref(new Date(props.currentWeek))
const showMonthSelector = ref(false)
const selectedYear = ref(new Date().getFullYear())

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const miniCalendarMonthYear = computed(() => {
  const options = { month: 'long', year: 'numeric' }
  return miniCalendarDate.value.toLocaleDateString('en-US', options)
})

const miniCalendarDays = computed(() => {
  const year = miniCalendarDate.value.getFullYear()
  const month = miniCalendarDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const prevLastDay = new Date(year, month, 0)

  const firstDayOfWeek = firstDay.getDay()
  const lastDateOfMonth = lastDay.getDate()
  const prevLastDate = prevLastDay.getDate()

  const days = []

  // Make sure Vue tracks this
  const mealDates = unref(props.datesWithMeals) || []
  console.log('mealDates for', miniCalendarMonthYear.value, mealDates)

  // Previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevLastDate - i
    const date = new Date(year, month - 1, day)
    const dateStr = formatDateLocal(date)
    days.push({
      day,
      date,
      dateStr,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(dateStr),
      isInRange: isInRangeDate(dateStr),
      isRangeStart: isRangeStartDate(dateStr),
      isRangeEnd: isRangeEndDate(dateStr),
      hasMeals: mealDates.includes(dateStr)
    })
  }

  // Current month days
  for (let day = 1; day <= lastDateOfMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = formatDateLocal(date)
    days.push({
      day,
      date,
      dateStr,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: isSelectedDate(dateStr),
      isInRange: isInRangeDate(dateStr),
      isRangeStart: isRangeStartDate(dateStr),
      isRangeEnd: isRangeEndDate(dateStr),
      hasMeals: mealDates.includes(dateStr)
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    const dateStr = formatDateLocal(date)
    days.push({
      day,
      date,
      dateStr,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(dateStr),
      isInRange: isInRangeDate(dateStr),
      isRangeStart: isRangeStartDate(dateStr),
      isRangeEnd: isRangeEndDate(dateStr),
      hasMeals: mealDates.includes(dateStr)
    })
  }

  return days
})

const selectedDateStr = ref(null)
const calendarVisible = ref(true)


function toggleMonthSelector() {
  showMonthSelector.value = !showMonthSelector.value
  if (showMonthSelector.value) {
    selectedYear.value = miniCalendarDate.value.getFullYear()
  }
}

function changeYear(delta) {
  selectedYear.value += delta
}

function selectMonth(monthIndex) {
  const newDate = new Date(selectedYear.value, monthIndex, 1)
  miniCalendarDate.value = newDate
  showMonthSelector.value = false
}

function changeMonth(delta) {
  const newDate = new Date(miniCalendarDate.value)
  const day = newDate.getDate()
  newDate.setDate(1)
  newDate.setMonth(newDate.getMonth() + delta)
  const daysInTargetMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()
  newDate.setDate(Math.min(day, daysInTargetMonth))

  miniCalendarDate.value = newDate
}


function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isToday(date) {
  if (!props.highlightToday) return false
  const today = new Date()
  return date.toDateString() === today.toDateString()
}


// function isSelectedDate(dateStr) {
//   if (props.mode === 'single') {
//     if (props.highlightSelected) {
//       return props.selectedDates.includes(dateStr)
//     } else {
//       const weekStart = new Date(props.currentWeek)
//       weekStart.setDate(weekStart.getDate() - weekStart.getDay())
//       return dateStr === formatDateLocal(weekStart)
//     }
//   } else {
//     return props.selectedDates.includes(dateStr)
//   }
// }
function isSelectedDate(dateStr) {
  return selectedDateStr.value === dateStr
}


function isInRangeDate(dateStr) {
  if (props.mode === 'range' && props.selectedDates.length === 2) {
    const [start, end] = [...props.selectedDates].sort()
    return dateStr > start && dateStr < end
  }
  return false
}

function isRangeStartDate(dateStr) {
  if (props.mode === 'range' && props.selectedDates.length > 0) {
    const sorted = [...props.selectedDates].sort()
    return dateStr === sorted[0]
  }
  return false
}

function isRangeEndDate(dateStr) {
  if (props.mode === 'range' && props.selectedDates.length === 2) {
    const sorted = [...props.selectedDates].sort()
    return dateStr === sorted[1]
  }
  return false
}


function goToToday() {
  const today = new Date()
  miniCalendarDate.value = new Date(today)
  emit('select-date', today)
}

function handleDateClick(day) {
  selectedDateStr.value = formatDateLocal(day.date)
  emit('select-date', day.date)

  // Only close if autoClose is enabled
  if (props.autoClose) {
    // Delay closing slightly so highlight renders first
    setTimeout(() => {
      closeCalendar()
    }, 150)
  }
}


function closeCalendar() {
  calendarVisible.value = false
}

</script>

<style scoped>
/* Existing styles ... */
.calendar-dropdown {
  position: relative;
  width: 100%;
}

.calendar-dropdown.below {
  position: static;
}

.dropdown-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  width: 100%;
}

.dropdown-content.above {
  position: absolute;
  bottom: 100%; /* place above input */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  margin-bottom: 0.5rem;
  width: 280px;
}



.dropdown-content.below {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  margin-top: 0.5rem;
  width: 280px;
}

.mini-calendar {
  padding: 1rem;
}

.mini-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-nav-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.month-nav-btn:hover {
  background: #f0f0f0;
  color: #ff6b1a;
}

.current-month-year {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.current-month-year:hover {
  background: #f0f0f0;
}

.mini-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  padding: 0.25rem;
}

.mini-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.mini-calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.mini-calendar-day:hover {
  background: #f0f0f0;
}

.mini-calendar-day.today {
  background: rgba(255, 107, 26, 0.1);
  color: #ea580c !important;
  font-weight: 700;
}

.mini-calendar-day.selected {
  background: #ff6b1a;
  color: white !important;
  font-weight: 700;
}

 .mini-calendar-day.in-range {
  background: rgba(255, 107, 26, 0.15);
  color: #1a1a1a;
}

 .mini-calendar-day.range-start,
.mini-calendar-day.range-end {
  background: #ff6b1a;
  color: white !important;
  font-weight: 700;
}


.mini-calendar-day.range-start {
  border-radius: 6px 0 0 6px;
}

.mini-calendar-day.range-end {
  border-radius: 0 6px 6px 0;
}

.mini-calendar-day.range-start.range-end {
  border-radius: 6px;
}

.mini-calendar-day.current-month {
  color: #1a1a1a;
}

.mini-calendar-day.other-month {
  color: #ccc;
}
/* Meal background for days with meals */
.mini-calendar-day.has-meals {
  background: rgba(255, 107, 26, 0.15);
  color: #1a1a1a;
}

.mini-calendar-day.today.has-meals {
  background: rgba(234, 88, 12, 0.1);
  color: #ea580c;
}

.mini-calendar-day.selected.has-meals {
  background: #ff6b1a;
  color: white;
}


.card-bottom {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e5e5;
}

.today-btn {
  width: 100%;
  padding: 0.5rem;
  background: #ff6b1a;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.today-btn:hover {
  background: #e55a0f;
}

.month-selector {
  padding: 0.5rem 0;
}

.month-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.year-nav-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.year-nav-btn:hover {
  background: #f0f0f0;
  color: #ff6b1a;
}

.selected-year {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1rem;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.month-item {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  color: #1a1a1a;
}

.month-item:hover {
  background: #f0f0f0;
}

.month-item.active {
  background: rgba(255, 107, 26, 0.2);
  color: #ff6b1a;
  font-weight: 700;
}
</style>
