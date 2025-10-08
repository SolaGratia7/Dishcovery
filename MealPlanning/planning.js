/* planning.js
    Re-implemented to match draft01 functionality.
*/

// Application State (matches draft01's keys)
let appData = {
    pantry: [],
    recipes: [],
    savedRecipes: [],
    mealPlans: {},
    shoppingList: [],
    nutritionGoals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
    currentWeek: new Date(),
    currentRecipe: null
};
// internal flag: becomes true after first full initialization to prevent loadData
// from overwriting the user's live view in the same session.
appData._initialized = false;

// Storage key used by draft01
const STORAGE_KEY = 'recipeFinderData';

// Common constants to avoid duplication
const MEAL_TYPES = ['breakfast','lunch','dinner'];
const DEFAULT_SAVED = [
    { id: 101, title: 'Spaghetti Bolognese', image: '', readyInMinutes: 25 },
    { id: 102, title: 'Chicken Caesar Salad', image: '', readyInMinutes: 15 },
    { id: 103, title: 'Vegetable Stir Fry', image: '', readyInMinutes: 20 }
];

// Parse the server-emitted planning.php JS and return the object passed to localStorage.setItem(...)
function parseServerSeedText(txt){
    try{
        const m = txt.match(/localStorage\.setItem\(['"]recipeFinderData['"],\s*(\{[\s\S]*\})\s*\)/);
        if(m && m[1]) return JSON.parse(m[1]);
    }catch(e){ /* ignore parse errors */ }
    return null;
}

// Parse an ISO-like date string as a local date (treat 'YYYY-MM-DD' as local midnight)
function parseLocalDate(v){
    if(!v) return null;
    if(typeof v === 'string'){
        const m = v.match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
        if(m){ const y=Number(m[1]), mo=Number(m[2])-1, d=Number(m[3]); return new Date(y,mo,d); }
    }
    const d = new Date(v);
    return isNaN(d) ? null : d;
}

// Format a Date (or date-like) into local YYYY-MM-DD
function formatDateLocal(d){
    const dt = (d instanceof Date) ? d : parseLocalDate(d) || new Date(d);
    if(!dt || isNaN(dt)) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}

// Render an array of history match objects {date,meal,title} into #history-results
function renderHistoryResults(matches, emptyMessage){
    const out = document.getElementById('history-results'); if(!out) return;
    out.textContent = '';
    if(!matches || matches.length===0){ out.textContent = emptyMessage || 'No history found.'; return; }
    const frag = document.createDocumentFragment();
    matches.forEach(m => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.cursor = 'pointer';
        div.style.padding = '6px';
        div.style.borderBottom = '1px solid #eee';
        div.dataset.date = m.date;
        div.dataset.meal = m.meal;
    // build content: title — <strong>meal</strong> on Weekday, Date
    const dateObj = parseLocalDate(m.date) || new Date(m.date);
    const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
    const dateLabel = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    div.appendChild(document.createTextNode(m.title + ' — '));
    const strong = document.createElement('strong'); strong.textContent = m.meal; div.appendChild(strong);
    div.appendChild(document.createTextNode(' on ' + weekday + ', ' + dateLabel));
        div.addEventListener('click', ()=>{
            const d = div.dataset.date;
            const meal = div.dataset.meal;
            clearHighlights();
            const slot = document.getElementById(`slot-${d}-${meal}`);
            if(slot){ slot.classList.add('highlight'); slot.scrollIntoView({behavior:'smooth', block:'center'}); }
        });
        frag.appendChild(div);
    });
    out.appendChild(frag);
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved) || {};
            // Do not overwrite an in-memory currentWeek (user may have changed view)
            const savedCW = parsed.hasOwnProperty('currentWeek') ? parsed.currentWeek : undefined;
            if (parsed.currentWeek) delete parsed.currentWeek;
            appData = Object.assign(appData, parsed);
            // Apply persisted currentWeek only on the first initialization (so subsequent
            // in-session loadData() calls do not move the user's view unexpectedly).
            if (!appData._initialized && savedCW) {
                appData.currentWeek = savedCW;
            }
        } catch (e) { console.warn('Failed to parse saved data', e); }
    }

    // If another part of the app (recipeDiscovery.js) stored saved recipes under
    // the legacy key 'savedRecipes', import/merge them into our appData.savedRecipes
    // so the planner can use recipes without changing discovery files.
    try {
        const legacy = localStorage.getItem('savedRecipes');
        if (legacy) {
            const legacyArr = JSON.parse(legacy);
            if (Array.isArray(legacyArr) && legacyArr.length > 0) {
                // filter out known test-only recipe ids (cleanup)
                const cleanedLegacy = legacyArr.filter(r => Number(r.id) !== 9999);

                appData.savedRecipes = appData.savedRecipes || [];
                // merge without duplicates (by id)
                const existingIds = new Set(appData.savedRecipes.map(r => String(r.id)));
                let merged = appData.savedRecipes.slice();
                cleanedLegacy.forEach(r => {
                    if (!existingIds.has(String(r.id))) { merged.push(r); existingIds.add(String(r.id)); }
                });
                // If merged list changed, persist it under our STORAGE_KEY
                if (merged.length !== appData.savedRecipes.length) {
                    appData.savedRecipes = merged;
                    // persist immediately so other planner code sees it
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
                    // show a small toast to indicate migration happened (helpful during dev)
                    window.addEventListener('DOMContentLoaded', () => {
                        try { showToast(`Imported ${legacyArr.length} recipes from discovery cache.`, 'success'); }
                        catch (e) { /* ignore */ }
                    });
                }
            }
        }
    } catch (e) {
        console.warn('Failed to migrate legacy savedRecipes', e);
    }

    // Defensive cleanup: remove any lingering test-only recipes (id 9999)
    try {
        if (Array.isArray(appData.savedRecipes)) {
            const before = appData.savedRecipes.length;
            appData.savedRecipes = appData.savedRecipes.filter(r => Number(r.id) !== 9999);
            if (appData.savedRecipes.length !== before) {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e) { /* ignore */ }
            }
        }
        // also prune mealPlans entries that reference the test recipe id
        if (appData.mealPlans && typeof appData.mealPlans === 'object') {
            for (const d of Object.keys(appData.mealPlans)) {
                const meals = appData.mealPlans[d];
                let changed = false;
                MEAL_TYPES.forEach(mt => {
                    if (meals[mt] && Number(meals[mt].id) === 9999) { delete meals[mt]; changed = true; }
                });
                if (changed) {
                    if (Object.keys(meals).length === 0) delete appData.mealPlans[d];
                }
            }
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore cleanup errors */ }

    // Attempt to fetch the server-side seed and merge its savedRecipes into our appData
    try {
        fetch('planning.php', { cache: 'no-store' }).then(r => r.text()).then(txt => {
            const seed = parseServerSeedText(txt);
            if (seed && Array.isArray(seed.savedRecipes) && seed.savedRecipes.length > 0) {
                appData.savedRecipes = appData.savedRecipes || [];
                const existingIds = new Set(appData.savedRecipes.map(r => String(r.id)));
                let added = 0;
                seed.savedRecipes.forEach(r => {
                    if (Number(r.id) === 9999) return; // skip test recipe
                    if (!existingIds.has(String(r.id))) { appData.savedRecipes.push(r); existingIds.add(String(r.id)); added++; }
                });
                if (added > 0) {
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e) { /* ignore */ }
                    try { renderSavedRecipes(); } catch (e) { /* ignore */ }
                    try { showToast(`Imported ${added} server recipes.`, 'success'); } catch (e) { /* ignore */ }
                }
            }
        }).catch(e=>{/* ignore */});
    } catch (e) { /* ignore fetch errors */ }

    // If there are no saved recipes at this point, provide a reasonable default
    // so the user has choices in the planner dropdown.
    if (!Array.isArray(appData.savedRecipes) || appData.savedRecipes.length === 0) {
        // As a fallback, use default saved recipes so planner dropdowns have choices
        appData.savedRecipes = DEFAULT_SAVED.slice();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e) { /* ignore */ }
    }

    // default values for date inputs (use local date formatting)
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const expiryInput = document.getElementById('ingredient-expiry');
    if (expiryInput) expiryInput.value = formatDateLocal(nextWeek);

    const mealDate = document.getElementById('meal-plan-date');
    if (mealDate) mealDate.value = formatDateLocal(new Date());

    // Ensure we have a valid currentWeek in appData, but do NOT overwrite the user's
    // persisted view on every load. Only default to today if currentWeek is missing or invalid.
    try {
        if (!appData.currentWeek) {
            appData.currentWeek = new Date();
            try { saveData(); } catch (e) { /* ignore */ }
        } else {
            const cw = parseLocalDate(appData.currentWeek);
            if (!cw) {
                appData.currentWeek = new Date();
                try { saveData(); } catch (e) { /* ignore */ }
            } else {
                // normalized Date object (local)
                appData.currentWeek = cw;
            }
        }
    } catch (e) { appData.currentWeek = new Date(); }
}

// Helper: set current week view to the week containing the provided ISO date string (YYYY-MM-DD)
function setViewWeekToDate(isoDateStr){
    try {
        const parsed = parseLocalDate(isoDateStr) || new Date(isoDateStr);
        if (parsed && !isNaN(parsed)) {
            // normalize to local-midnight Date constructed from Y/M/D to avoid TZ shifts
            const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            console.debug('[planner] setViewWeekToDate -> requested:', isoDateStr, 'parsed:', parsed.toString(), 'normalized:', d.toString());
            appData.currentWeek = d;
            // persist the user's current view week (optional)
            try { saveData(); } catch (e) { /* ignore */ }
            updateWeekDisplay();
            renderMealPlanner();
        }
    } catch (e) { /* ignore invalid date */ }
}

function saveData() {
    try {
        // Persist currentWeek as YYYY-MM-DD (local) to avoid timezone shifts when reloading
        const copy = Object.assign({}, appData);
        if (copy.currentWeek instanceof Date) copy.currentWeek = formatDateLocal(copy.currentWeek);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch (e) {
        // fallback
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e2) { /* ignore */ }
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = `top:20px; right:20px; z-index:9999; min-width:300px;`;
    // Build toast content without innerHTML
    const msgNode = document.createTextNode(message + ' ');
    toast.appendChild(msgNode);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button'; closeBtn.className = 'btn-close';
    closeBtn.addEventListener('click', () => { if (toast.parentElement) toast.parentElement.removeChild(toast); });
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3000);
}

function initializeEventListeners() {
    const addIngredientForm = document.getElementById('add-ingredient-form');
    if (addIngredientForm) addIngredientForm.addEventListener('submit', e => { e.preventDefault(); addIngredient(); });

    const addShoppingForm = document.getElementById('add-shopping-form');
    if (addShoppingForm) addShoppingForm.addEventListener('submit', e => { e.preventDefault(); addShoppingItem(); });

    const nutritionForm = document.getElementById('nutrition-goals-form');
    if (nutritionForm) nutritionForm.addEventListener('submit', e => { e.preventDefault(); saveNutritionGoals(); });

    const recipeSearch = document.getElementById('recipe-search');
    if (recipeSearch) recipeSearch.addEventListener('keypress', e => { if (e.key === 'Enter') searchRecipes(); });

    const pantryFilter = document.getElementById('pantry-filter');
    if (pantryFilter) pantryFilter.addEventListener('change', renderPantry);

    const saveRecipeBtn = document.getElementById('saveRecipeBtn');
    if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', saveRecipe);

    const addToMealPlanBtn = document.getElementById('addToMealPlanBtn');
    if (addToMealPlanBtn) addToMealPlanBtn.addEventListener('click', addToMealPlan);

    // history search/filter (planner-only controls)
    const historyInput = document.getElementById('history-search');
    const historyFilterBtn = document.getElementById('history-filter-btn');
    const historyMonth = document.getElementById('history-month');
    const historyMeal = document.getElementById('history-mealtype');
    if (historyInput) historyInput.addEventListener('keypress', e => { if (e.key === 'Enter') doFilteredHistorySearch(); });
    if (historyFilterBtn) historyFilterBtn.addEventListener('click', () => doFilteredHistorySearch());
    // populate month options from existing mealPlans
    populateHistoryMonths();
}

function populateHistoryMonths(){
    const monthSelect = document.getElementById('history-month');
    if(!monthSelect) return;
    const months = new Set();
    for(const dateStr in appData.mealPlans){
        const d = parseLocalDate(dateStr);
        if(isNaN(d)) continue;
        const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
        months.add(key);
    }
    // sort descending
    const arr = Array.from(months).sort((a,b)=> b.localeCompare(a));
    // clear existing and rebuild options
    while (monthSelect.firstChild) monthSelect.removeChild(monthSelect.firstChild);
    const first = document.createElement('option'); first.value = ''; first.textContent = 'All months'; monthSelect.appendChild(first);
    arr.forEach(m => {
        const [y,mm] = m.split('-');
        const label = new Date(y, Number(mm)-1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        const opt = document.createElement('option'); opt.value = m; opt.textContent = label; monthSelect.appendChild(opt);
    });
}

function doFilteredHistorySearch(){
    const q = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    const month = document.getElementById('history-month')?.value || '';
    const meal = document.getElementById('history-mealtype')?.value || '';
    const out = document.getElementById('history-results'); if(!out) return;
    const matches = [];
    for(const date in appData.mealPlans){
        // month filter
        if(month){ const [y,m] = month.split('-'); const d = parseLocalDate(date); if(!d || d.getFullYear()!=Number(y) || (d.getMonth()+1)!=Number(m)) continue; }
        const meals = appData.mealPlans[date];
        for(const mealType of MEAL_TYPES){
            if(meal && meal !== mealType) continue;
            if(meals[mealType] && meals[mealType].title){
                if(!q || meals[mealType].title.toLowerCase().includes(q)){
                    matches.push({date,meal:mealType,title:meals[mealType].title});
                }
            }
        }
    }
    if(matches.length===0){ renderHistoryResults([], q? `No history found for "${q}" with these filters.` : 'No history found for these filters.'); return; }
    // sort matches by date desc, then meal order (breakfast, lunch, dinner)
    matches.sort(historySortComparator);
    renderHistoryResults(matches);
}

// Search past mealPlans for occurrences of the given query within saved recipe titles
function searchMealHistory(query){
    const out = document.getElementById('history-results');
    if(!out) return;
    if(!query || query.trim().length===0){ out.textContent = 'Enter a recipe title to search history.'; return; }
    const q = query.toLowerCase();
    const matches = [];
    for(const date in appData.mealPlans){
        const meals = appData.mealPlans[date];
        for(const mealType of MEAL_TYPES){
            if(meals[mealType] && meals[mealType].title && meals[mealType].title.toLowerCase().includes(q)){
                matches.push({date,meal:mealType,title:meals[mealType].title});
            }
        }
    }
    if(matches.length===0){ renderHistoryResults([], 'No history found for "'+query+'".'); return; }
    matches.sort(historySortComparator);
    renderHistoryResults(matches);
}

function showAllHistory(){
    const out = document.getElementById('history-results'); if(!out) return;
    const matches = [];
    for(const date in appData.mealPlans){
        const meals = appData.mealPlans[date];
        for(const mealType of MEAL_TYPES){
            if(meals[mealType] && meals[mealType].title){
                matches.push({date,meal:mealType,title:meals[mealType].title});
            }
        }
    }
    if(matches.length===0){ renderHistoryResults([], 'No history available.'); return; }
    matches.sort(historySortComparator);
    renderHistoryResults(matches);
}

// Comparator used to sort history results: date descending, then breakfast->lunch->dinner
function historySortComparator(a,b){
    // a.date and b.date are ISO-like YYYY-MM-DD strings
    const da = parseLocalDate(a.date) || new Date(a.date);
    const db = parseLocalDate(b.date) || new Date(b.date);
    // compare date descending
    if (da.getTime() !== db.getTime()) return db.getTime() - da.getTime();
    const order = { breakfast: 0, lunch: 1, dinner: 2 };
    const oa = order[a.meal] ?? 99;
    const ob = order[b.meal] ?? 99;
    return oa - ob;
}

function clearHighlights(){ Array.from(document.querySelectorAll('.meal-slot.highlight')).forEach(s=>s.classList.remove('highlight')); }

// Minimal implementations (copied/adapted from draft01)
function renderMealPlanner() {
    const container = document.getElementById('meal-planner-grid');
    if (!container) return;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOfWeek = new Date(appData.currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    container.textContent = '';
    const frag = document.createDocumentFragment();
    days.forEach((day, idx) => {
        const currentDate = new Date(startOfWeek); currentDate.setDate(currentDate.getDate() + idx);
    const dateStr = formatDateLocal(currentDate);
        const dayMeals = appData.mealPlans[dateStr] || {};
        const tr = document.createElement('tr');
        const tdDay = document.createElement('td');
        const strong = document.createElement('strong'); strong.textContent = day; tdDay.appendChild(strong);
        tdDay.appendChild(document.createElement('br'));
        const small = document.createElement('small'); small.className = 'text-muted'; small.textContent = currentDate.toLocaleDateString(); tdDay.appendChild(small);
        tr.appendChild(tdDay);
        // helper to create meal cell
        function makeMealCell(mealType){
            const td = document.createElement('td');
            const div = document.createElement('div');
            div.id = `slot-${dateStr}-${mealType}`;
            div.className = `meal-slot ${mealType}` + (dayMeals[mealType] ? ' has-meal' : ' empty');
            div.addEventListener('click', () => planMeal(dateStr, mealType));
            if(dayMeals[mealType] && dayMeals[mealType].title){ div.textContent = dayMeals[mealType].title; }
            else { const plus = document.createElement('span'); plus.className = 'plus-sign'; plus.textContent = '+'; div.appendChild(plus); }
            td.appendChild(div);
            return td;
        }
        tr.appendChild(makeMealCell('breakfast'));
        tr.appendChild(makeMealCell('lunch'));
        tr.appendChild(makeMealCell('dinner'));
        frag.appendChild(tr);
    });
    container.appendChild(frag);
}

function updateWeekDisplay() {
    const el = document.getElementById('current-week'); if (!el) return;
    const startOfWeek = new Date(appData.currentWeek); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 6);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    el.textContent = `${fmt(startOfWeek)} - ${fmt(endOfWeek)}`;
}

function changeWeek(direction) { const cw = new Date(appData.currentWeek); cw.setDate(cw.getDate() + direction * 7); appData.currentWeek = cw; updateWeekDisplay(); renderMealPlanner(); }

function planMeal(date, mealType) {
    // refresh in-memory data from storage in case other pages updated it
    try { loadData(); } catch (e) { /* ignore */ }

    // ensure we have recipes to choose from; if not, provide lightweight defaults
    const saved = Array.isArray(appData.savedRecipes) ? appData.savedRecipes : [];
    const defaults = DEFAULT_SAVED.map(r => ({ id: r.id, title: r.title }));
    const sourceList = saved.length > 0 ? saved : defaults;
    const recipeOptions = sourceList.map(r => `<option value="${r.id}">${r.title}</option>`).join('');
    // expose the current source list so quickSaveMeal can find items when savedRecipes is empty
    try { window._plannerRecipeSource = sourceList; } catch (e) { /* ignore */ }
    const modalBody = document.getElementById('recipeModalBody');
    if (!modalBody) return;
    // Place Add and Remove alongside Close (Close will dismiss modal). This matches the requested layout.
    modalBody.textContent = '';
    const form = document.createElement('form'); form.id = 'quick-meal-plan-form';
    const divWrap = document.createElement('div'); divWrap.className = 'mb-3';
    const label = document.createElement('label'); label.className = 'form-label'; label.textContent = `Select Recipe for ${mealType} on ${new Date(date).toLocaleDateString()}`;
    const select = document.createElement('select'); select.className = 'form-select'; select.id = 'quick-recipe-select'; select.required = true;
    const optDefault = document.createElement('option'); optDefault.value = ''; optDefault.textContent = 'Choose a recipe...'; select.appendChild(optDefault);
    // populate options
    sourceList.forEach(r => { const o = document.createElement('option'); o.value = String(r.id); o.textContent = r.title; select.appendChild(o); });
    divWrap.appendChild(label); divWrap.appendChild(select); form.appendChild(divWrap);
    const btnDiv = document.createElement('div'); btnDiv.className = 'd-flex justify-content-end';
    const addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.className = 'btn btn-primary'; addBtn.textContent = 'Add to Meal Plan'; addBtn.addEventListener('click', () => quickSaveMeal(date, mealType));
    const remBtn = document.createElement('button'); remBtn.type = 'button'; remBtn.className = 'btn btn-danger ms-2'; remBtn.textContent = 'Remove Meal'; remBtn.addEventListener('click', () => removeMeal(date, mealType));
    btnDiv.appendChild(addBtn); btnDiv.appendChild(remBtn); form.appendChild(btnDiv); modalBody.appendChild(form);
    document.getElementById('recipeModalTitle').textContent = 'Plan Meal';
    new bootstrap.Modal(document.getElementById('recipeModal')).show();
}

function quickSaveMeal(date, mealType) {
    const recipeId = parseInt(document.getElementById('quick-recipe-select').value);
    if (!recipeId) { showToast('Please select a recipe', 'warning'); return; }
    let recipe = (Array.isArray(appData.savedRecipes) && appData.savedRecipes.find(r => Number(r.id) === recipeId));
    if (!recipe && window._plannerRecipeSource) {
        recipe = window._plannerRecipeSource.find(r => Number(r.id) === recipeId);
    }
    if (!recipe) { showToast('Selected recipe not found', 'warning'); return; }
    if (!appData.mealPlans[date]) appData.mealPlans[date] = {};
    appData.mealPlans[date][mealType] = { id: recipe.id, title: recipe.title, image: recipe.image || '' };
    saveData(); setViewWeekToDate(date); updateTodayMeals(); populateHistoryMonths();
    const modal = bootstrap.Modal.getInstance(document.getElementById('recipeModal'));
    if (modal) modal.hide();
    showToast(`${recipe.title} added to ${mealType}!`, 'success');
}


function removeMeal(date, mealType) {
    if (appData.mealPlans[date] && appData.mealPlans[date][mealType]) {
        console.debug('[planner] removeMeal -> removing', date, mealType, 'currentWeek before:', appData.currentWeek);
        delete appData.mealPlans[date][mealType];
        if (Object.keys(appData.mealPlans[date]).length === 0) delete appData.mealPlans[date];
        // persist and ensure the planner view stays on the week containing 'date'
        saveData();
        setViewWeekToDate(date);
        console.debug('[planner] removeMeal -> currentWeek after setViewWeekToDate:', appData.currentWeek);
        renderMealPlanner();
        updateTodayMeals();
        populateHistoryMonths();
        const m = bootstrap.Modal.getInstance(document.getElementById('recipeModal'));
        if (m) m.hide();
        showToast('Meal removed from plan', 'info');
    }
}

function addToMealPlan() { document.getElementById('selected-recipe-id').value = appData.currentRecipe?.id || ''; document.getElementById('selected-recipe-title').value = appData.currentRecipe?.title || ''; const modal = bootstrap.Modal.getInstance(document.getElementById('recipeModal')); if (modal) modal.hide(); new bootstrap.Modal(document.getElementById('mealPlanModal')).show(); }

function saveMealPlan() {
    const date = document.getElementById('meal-plan-date').value;
    const mealType = document.getElementById('meal-plan-type').value;
    const recipeId = parseInt(document.getElementById('selected-recipe-id').value);
    const recipeTitle = document.getElementById('selected-recipe-title').value;
    if (!date || !mealType || !recipeId) { showToast('Please fill in all fields', 'warning'); return; }
    if (!appData.mealPlans[date]) appData.mealPlans[date] = {};
    appData.mealPlans[date][mealType] = { id: recipeId, title: recipeTitle, image: appData.currentRecipe?.image || '' };
    saveData(); setViewWeekToDate(date); updateTodayMeals(); populateHistoryMonths();
    const modal = bootstrap.Modal.getInstance(document.getElementById('mealPlanModal'));
    if (modal) modal.hide();
    showToast(`${recipeTitle} added to ${mealType}!`, 'success');
}

function updateTodayMeals() { const today = formatDateLocal(new Date()); const todayMeals = appData.mealPlans[today] || {}; const setOr = 'No meal planned'; const elB = document.getElementById('today-breakfast'); if (elB) elB.textContent = todayMeals.breakfast ? todayMeals.breakfast.title : setOr; const elL = document.getElementById('today-lunch'); if (elL) elL.textContent = todayMeals.lunch ? todayMeals.lunch.title : setOr; const elD = document.getElementById('today-dinner'); if (elD) elD.textContent = todayMeals.dinner ? todayMeals.dinner.title : setOr; }

function generateShoppingList() { showToast('Added items to shopping list (demo).', 'info'); }

// Demo recipe search & render (expanded)
function searchRecipes() {
    const demo = [
        { id: 10, title: 'Spaghetti Carbonara', image: '', readyInMinutes: 20, servings: 4, summary: 'Classic Italian pasta with eggs and pancetta.' },
        { id: 11, title: 'Chicken Stir Fry', image: '', readyInMinutes: 15, servings: 2, summary: 'Quick stir fry with vegetables and soy sauce.' },
        { id: 12, title: 'Veggie Tacos', image: '', readyInMinutes: 25, servings: 4, summary: 'Colorful tacos with seasoned vegetables and toppings.' },
        { id: 13, title: 'Beef Chili', image: '', readyInMinutes: 90, servings: 6, summary: 'Hearty slow-cooked chili with beans and spices.' },
        { id: 14, title: 'Grilled Salmon', image: '', readyInMinutes: 18, servings: 2, summary: 'Simple grilled salmon with lemon and herbs.' },
        { id: 15, title: 'Caprese Salad', image: '', readyInMinutes: 10, servings: 2, summary: 'Fresh tomatoes, mozzarella, basil, and olive oil.' }
    ];
    appData.recipes = demo;
    renderRecipes(demo);
}

function searchByPantryIngredients() { if (appData.pantry.length === 0) { showToast('Add some ingredients to your pantry first!', 'warning'); return; } searchRecipes(); }

function renderRecipes(recipes) {
    const container = document.getElementById('recipe-results'); if (!container) return; container.textContent = '';
    if (!recipes || recipes.length === 0) {
        const div = document.createElement('div'); div.className = 'col-12'; const p = document.createElement('p'); p.className = 'text-muted text-center'; p.textContent = 'No recipes found.'; div.appendChild(p); container.appendChild(div); return;
    }
    const frag = document.createDocumentFragment();
    recipes.forEach(r => {
        const col = document.createElement('div'); col.className = 'col-md-4 col-sm-6 mb-4';
        const card = document.createElement('div'); card.className = 'card recipe-card'; card.addEventListener('click', () => showRecipeDetails(r.id));
        const body = document.createElement('div'); body.className = 'card-body';
        const h6 = document.createElement('h6'); h6.textContent = r.title; const small = document.createElement('p'); small.className = 'small text-muted'; small.textContent = r.summary || '';
        body.appendChild(h6); body.appendChild(small); card.appendChild(body); col.appendChild(card); frag.appendChild(col);
    });
    container.appendChild(frag);
}

function showRecipeDetails(id) {
    const recipe = appData.recipes.find(r => r.id === id) || appData.savedRecipes.find(r => r.id === id);
    if (!recipe) return;
    appData.currentRecipe = recipe;
    document.getElementById('recipeModalTitle').textContent = recipe.title;
    const body = document.getElementById('recipeModalBody'); if (!body) return; body.textContent = '';
    const row = document.createElement('div'); row.className = 'row';
    const colImg = document.createElement('div'); colImg.className = 'col-md-6';
    const img = document.createElement('img'); img.src = recipe.image || 'https://via.placeholder.com/400x300'; img.className = 'img-fluid rounded'; colImg.appendChild(img);
    const colText = document.createElement('div'); colText.className = 'col-md-6';
    const p = document.createElement('p'); p.textContent = recipe.summary || ''; colText.appendChild(p);
    row.appendChild(colImg); row.appendChild(colText); body.appendChild(row);
    new bootstrap.Modal(document.getElementById('recipeModal')).show();
}

function saveRecipe() { if (!appData.currentRecipe) return; if (appData.savedRecipes.find(r => r.id === appData.currentRecipe.id)) { showToast('Recipe already saved!', 'info'); return; } appData.savedRecipes.push({ ...appData.currentRecipe, savedDate: new Date().toISOString() }); saveData(); renderSavedRecipes(); showToast('Recipe saved!', 'success'); }

function renderSavedRecipes() {
    const container = document.getElementById('saved-recipes'); if (!container) return; container.textContent = '';
    if (!Array.isArray(appData.savedRecipes) || appData.savedRecipes.length === 0) {
        const div = document.createElement('div'); div.className = 'col-12'; const p = document.createElement('p'); p.className = 'text-muted text-center'; p.textContent = 'No saved recipes yet.'; div.appendChild(p); container.appendChild(div); return;
    }
    const frag = document.createDocumentFragment();
    appData.savedRecipes.forEach(r => {
        const col = document.createElement('div'); col.className = 'col-md-4 col-sm-6 mb-3';
        const card = document.createElement('div'); card.className = 'card recipe-card'; card.addEventListener('click', () => showRecipeDetails(r.id));
        const body = document.createElement('div'); body.className = 'card-body'; const h6 = document.createElement('h6'); h6.textContent = r.title; body.appendChild(h6); card.appendChild(body); col.appendChild(card); frag.appendChild(col);
    });
    container.appendChild(frag);
}

function removeSavedRecipe(id) { appData.savedRecipes = appData.savedRecipes.filter(r => r.id !== id); saveData(); renderSavedRecipes(); showToast('Recipe removed!', 'info'); }

function addIngredient() { const name = document.getElementById('ingredient-name')?.value || 'Test Ingredient'; const category = document.getElementById('ingredient-category')?.value || 'pantry'; const quantity = parseFloat(document.getElementById('ingredient-quantity')?.value || 1); const unit = document.getElementById('ingredient-unit')?.value || 'pieces'; const expiry = document.getElementById('ingredient-expiry')?.value || formatDateLocal(new Date()); const item = { id: Date.now(), name, category, quantity, unit, expiry }; appData.pantry.push(item); saveData(); renderPantry(); showToast('Ingredient added!', 'success'); }

function renderPantry() {
    const container = document.getElementById('pantry-items'); if (!container) return; container.textContent = '';
    if (!Array.isArray(appData.pantry) || appData.pantry.length === 0) { const p = document.createElement('p'); p.className = 'text-muted text-center'; p.textContent = 'Your pantry is empty.'; container.appendChild(p); return; }
    const frag = document.createDocumentFragment();
    appData.pantry.forEach(i => {
        const wrap = document.createElement('div'); wrap.className = 'ingredient-item';
        const row = document.createElement('div'); row.className = 'd-flex justify-content-between';
        const left = document.createElement('div'); const h6 = document.createElement('h6'); h6.textContent = i.name; const small = document.createElement('small'); small.className = 'text-muted'; small.textContent = `${i.quantity} ${i.unit}`; left.appendChild(h6); left.appendChild(small);
        const btn = document.createElement('button'); btn.className = 'btn btn-danger btn-sm'; btn.addEventListener('click', ()=> removeIngredient(i.id)); const icon = document.createElement('i'); icon.className = 'fas fa-trash'; btn.appendChild(icon);
        row.appendChild(left); row.appendChild(btn); wrap.appendChild(row); frag.appendChild(wrap);
    });
    container.appendChild(frag);
}

function removeIngredient(id) { appData.pantry = appData.pantry.filter(p => p.id !== id); saveData(); renderPantry(); showToast('Ingredient removed!', 'info'); }

function addShoppingItem() { const name = document.getElementById('shopping-item-name')?.value || 'Sample'; const quantity = document.getElementById('shopping-item-quantity')?.value || '1'; const category = document.getElementById('shopping-item-category')?.value || 'produce'; const item = { id: Date.now(), name, quantity, category, checked: false }; appData.shoppingList.push(item); saveData(); renderShoppingList(); showToast('Item added!', 'success'); }

function renderShoppingList() {
    const container = document.getElementById('shopping-list'); if (!container) return; container.textContent = '';
    if (!Array.isArray(appData.shoppingList) || appData.shoppingList.length === 0) { const p = document.createElement('p'); p.className = 'text-muted'; p.textContent = 'Your shopping list is empty.'; container.appendChild(p); return; }
    const frag = document.createDocumentFragment();
    appData.shoppingList.forEach(i => {
        const wrap = document.createElement('div'); wrap.className = 'shopping-item';
        const row = document.createElement('div'); row.className = 'd-flex justify-content-between align-items-center';
        const left = document.createElement('div'); left.textContent = `${i.name} (${i.quantity})`;
        const btn = document.createElement('button'); btn.className = 'btn btn-danger btn-sm'; btn.addEventListener('click', ()=> removeShoppingItem(i.id)); const icon = document.createElement('i'); icon.className = 'fas fa-trash'; btn.appendChild(icon);
        row.appendChild(left); row.appendChild(btn); wrap.appendChild(row); frag.appendChild(wrap);
    });
    container.appendChild(frag);
}

function removeShoppingItem(id) { appData.shoppingList = appData.shoppingList.filter(i => i.id !== id); saveData(); renderShoppingList(); }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeEventListeners();
    renderSavedRecipes();
    renderPantry();
    renderShoppingList();
    updateWeekDisplay();
    renderMealPlanner();
    updateTodayMeals();
    // mark initialization complete so subsequent in-session loadData() calls
    // (for example triggered by other windows/tabs) won't overwrite the
    // user's current view week unexpectedly.
    try { appData._initialized = true; } catch (e) { /* ignore */ }
});
