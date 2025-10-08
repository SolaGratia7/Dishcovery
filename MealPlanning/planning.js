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

// Render an array of history match objects {date,meal,title} into #history-results
function renderHistoryResults(matches, emptyMessage){
    const out = document.getElementById('history-results'); if(!out) return;
    if(!matches || matches.length===0){ out.textContent = emptyMessage || 'No history found.'; return; }
    out.innerHTML = matches.map(m=>`<div class="history-item" data-date="${m.date}" data-meal="${m.meal}" style="cursor:pointer;padding:6px;border-bottom:1px solid #eee">${m.title} — <strong>${m.meal}</strong> on ${new Date(m.date).toLocaleDateString()}</div>`).join('');
    Array.from(out.getElementsByClassName('history-item')).forEach(el=>{
        el.addEventListener('click', ()=>{
            const d = el.getAttribute('data-date');
            const meal = el.getAttribute('data-meal');
            clearHighlights();
            const slot = document.getElementById(`slot-${d}-${meal}`);
            if(slot){ slot.classList.add('highlight'); slot.scrollIntoView({behavior:'smooth', block:'center'}); }
        });
    });
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { appData = Object.assign(appData, JSON.parse(saved)); }
        catch (e) { console.warn('Failed to parse saved data', e); }
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

    // default values for date inputs
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const expiryInput = document.getElementById('ingredient-expiry');
    if (expiryInput) expiryInput.value = nextWeek.toISOString().split('T')[0];

    const mealDate = document.getElementById('meal-plan-date');
    if (mealDate) mealDate.value = new Date().toISOString().split('T')[0];

    // Always show the current week (today) on initial load so users start where they are.
    try { appData.currentWeek = new Date(); } catch (e) { appData.currentWeek = new Date(); }
}

// Helper: set current week view to the week containing the provided ISO date string (YYYY-MM-DD)
function setViewWeekToDate(isoDateStr){
    try {
        const d = new Date(isoDateStr);
        if (!isNaN(d)) {
            appData.currentWeek = d;
            // persist the user's current view week (optional)
            try { saveData(); } catch (e) { /* ignore */ }
            updateWeekDisplay();
            renderMealPlanner();
        }
    } catch (e) { /* ignore invalid date */ }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = `top:20px; right:20px; z-index:9999; min-width:300px;`;
    toast.innerHTML = `${message} <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>`;
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
        const d = new Date(dateStr);
        if(isNaN(d)) continue;
        const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
        months.add(key);
    }
    // sort descending
    const arr = Array.from(months).sort((a,b)=> b.localeCompare(a));
    // clear existing (keep first option)
    monthSelect.innerHTML = '<option value="">All months</option>' + arr.map(m=>{ const [y,mm]=m.split('-'); const label = new Date(y,Number(mm)-1,1).toLocaleString('default',{month:'long', year:'numeric'}); return `<option value="${m}">${label}</option>`; }).join('');
}

function doFilteredHistorySearch(){
    const q = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    const month = document.getElementById('history-month')?.value || '';
    const meal = document.getElementById('history-mealtype')?.value || '';
    const out = document.getElementById('history-results'); if(!out) return;
    const matches = [];
    for(const date in appData.mealPlans){
        // month filter
        if(month){ const [y,m] = month.split('-'); const d = new Date(date); if(d.getFullYear()!=Number(y) || (d.getMonth()+1)!=Number(m)) continue; }
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
    renderHistoryResults(matches);
}

function clearHighlights(){ Array.from(document.querySelectorAll('.meal-slot.highlight')).forEach(s=>s.classList.remove('highlight')); }

// Minimal implementations (copied/adapted from draft01)
function renderMealPlanner() {
    const container = document.getElementById('meal-planner-grid');
    if (!container) return;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOfWeek = new Date(appData.currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const html = days.map((day, idx) => {
        const currentDate = new Date(startOfWeek); currentDate.setDate(currentDate.getDate() + idx);
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayMeals = appData.mealPlans[dateStr] || {};
        return `
            <tr>
                <td><strong>${day}</strong><br><small class="text-muted">${currentDate.toLocaleDateString()}</small></td>
                <td><div id="slot-${dateStr}-breakfast" class="meal-slot breakfast ${dayMeals.breakfast ? 'has-meal' : 'empty'}" onclick="planMeal('${dateStr}','breakfast')">${dayMeals.breakfast ? dayMeals.breakfast.title : '<span class=\\"plus-sign\\">+</span>'}</div></td>
                <td><div id="slot-${dateStr}-lunch" class="meal-slot ${dayMeals.lunch ? 'has-meal' : 'empty'}" onclick="planMeal('${dateStr}','lunch')">${dayMeals.lunch ? dayMeals.lunch.title : '<span class=\\"plus-sign\\">+</span>'}</div></td>
                <td><div id="slot-${dateStr}-dinner" class="meal-slot ${dayMeals.dinner ? 'has-meal' : 'empty'}" onclick="planMeal('${dateStr}','dinner')">${dayMeals.dinner ? dayMeals.dinner.title : '<span class=\\"plus-sign\\">+</span>'}</div></td>
            </tr>
        `;
    }).join('');
    container.innerHTML = html;
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
    modalBody.innerHTML = `
        <form id="quick-meal-plan-form">
            <div class="mb-3">
                <label class="form-label">Select Recipe for ${mealType} on ${new Date(date).toLocaleDateString()}</label>
                <select class="form-select" id="quick-recipe-select" required>
                    <option value="">Choose a recipe...</option>
                    ${recipeOptions}
                </select>
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-primary" onclick="quickSaveMeal('${date}','${mealType}')">Add to Meal Plan</button>
                <button type="button" class="btn btn-danger ms-2" onclick="removeMeal('${date}','${mealType}')">Remove Meal</button>
            </div>
        </form>`;
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


function removeMeal(date, mealType) { if (appData.mealPlans[date] && appData.mealPlans[date][mealType]) { delete appData.mealPlans[date][mealType]; if (Object.keys(appData.mealPlans[date]).length === 0) delete appData.mealPlans[date]; saveData(); renderMealPlanner(); updateTodayMeals(); populateHistoryMonths(); const m = bootstrap.Modal.getInstance(document.getElementById('recipeModal')); if (m) m.hide(); showToast('Meal removed from plan', 'info'); } }

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

function updateTodayMeals() { const today = new Date().toISOString().split('T')[0]; const todayMeals = appData.mealPlans[today] || {}; const setOr = 'No meal planned'; const elB = document.getElementById('today-breakfast'); if (elB) elB.textContent = todayMeals.breakfast ? todayMeals.breakfast.title : setOr; const elL = document.getElementById('today-lunch'); if (elL) elL.textContent = todayMeals.lunch ? todayMeals.lunch.title : setOr; const elD = document.getElementById('today-dinner'); if (elD) elD.textContent = todayMeals.dinner ? todayMeals.dinner.title : setOr; }

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

function renderRecipes(recipes) { const container = document.getElementById('recipe-results'); if (!container) return; if (recipes.length === 0) { container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No recipes found.</p></div>'; return; } container.innerHTML = recipes.map(r => `<div class="col-md-4 col-sm-6 mb-4"><div class="card recipe-card" onclick="showRecipeDetails(${r.id})"><div class="card-body"><h6>${r.title}</h6><p class="small text-muted">${r.summary || ''}</p></div></div></div>`).join(''); }

function showRecipeDetails(id) { const recipe = appData.recipes.find(r => r.id === id) || appData.savedRecipes.find(r => r.id === id); if (!recipe) return; appData.currentRecipe = recipe; document.getElementById('recipeModalTitle').textContent = recipe.title; document.getElementById('recipeModalBody').innerHTML = `<div class="row"><div class="col-md-6"><img src="${recipe.image || 'https://via.placeholder.com/400x300'}" class="img-fluid rounded"></div><div class="col-md-6"><p>${recipe.summary || ''}</p></div></div>`; new bootstrap.Modal(document.getElementById('recipeModal')).show(); }

function saveRecipe() { if (!appData.currentRecipe) return; if (appData.savedRecipes.find(r => r.id === appData.currentRecipe.id)) { showToast('Recipe already saved!', 'info'); return; } appData.savedRecipes.push({ ...appData.currentRecipe, savedDate: new Date().toISOString() }); saveData(); renderSavedRecipes(); showToast('Recipe saved!', 'success'); }

function renderSavedRecipes() { const container = document.getElementById('saved-recipes'); if (!container) return; if (appData.savedRecipes.length === 0) { container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No saved recipes yet.</p></div>'; return; } container.innerHTML = appData.savedRecipes.map(r => `<div class="col-md-4 col-sm-6 mb-3"><div class="card recipe-card" onclick="showRecipeDetails(${r.id})"><div class="card-body"><h6>${r.title}</h6></div></div></div>`).join(''); }

function removeSavedRecipe(id) { appData.savedRecipes = appData.savedRecipes.filter(r => r.id !== id); saveData(); renderSavedRecipes(); showToast('Recipe removed!', 'info'); }

function addIngredient() { const name = document.getElementById('ingredient-name')?.value || 'Test Ingredient'; const category = document.getElementById('ingredient-category')?.value || 'pantry'; const quantity = parseFloat(document.getElementById('ingredient-quantity')?.value || 1); const unit = document.getElementById('ingredient-unit')?.value || 'pieces'; const expiry = document.getElementById('ingredient-expiry')?.value || new Date().toISOString().split('T')[0]; const item = { id: Date.now(), name, category, quantity, unit, expiry }; appData.pantry.push(item); saveData(); renderPantry(); showToast('Ingredient added!', 'success'); }

function renderPantry() { const container = document.getElementById('pantry-items'); if (!container) return; if (appData.pantry.length === 0) { container.innerHTML = '<p class="text-muted text-center">Your pantry is empty.</p>'; return; } container.innerHTML = appData.pantry.map(i => `<div class="ingredient-item"><div class="d-flex justify-content-between"><div><h6>${i.name}</h6><small class="text-muted">${i.quantity} ${i.unit}</small></div><button class="btn btn-danger btn-sm" onclick="removeIngredient(${i.id})"><i class="fas fa-trash"></i></button></div></div>`).join(''); }

function removeIngredient(id) { appData.pantry = appData.pantry.filter(p => p.id !== id); saveData(); renderPantry(); showToast('Ingredient removed!', 'info'); }

function addShoppingItem() { const name = document.getElementById('shopping-item-name')?.value || 'Sample'; const quantity = document.getElementById('shopping-item-quantity')?.value || '1'; const category = document.getElementById('shopping-item-category')?.value || 'produce'; const item = { id: Date.now(), name, quantity, category, checked: false }; appData.shoppingList.push(item); saveData(); renderShoppingList(); showToast('Item added!', 'success'); }

function renderShoppingList() { const container = document.getElementById('shopping-list'); if (!container) return; if (appData.shoppingList.length === 0) { container.innerHTML = '<p class="text-muted">Your shopping list is empty.</p>'; return; } container.innerHTML = appData.shoppingList.map(i => `<div class="shopping-item"><div class="d-flex justify-content-between align-items-center"><div>${i.name} (${i.quantity})</div><button class="btn btn-danger btn-sm" onclick="removeShoppingItem(${i.id})"><i class="fas fa-trash"></i></button></div></div>`).join(''); }

function removeShoppingItem(id) { appData.shoppingList = appData.shoppingList.filter(i => i.id !== id); saveData(); renderShoppingList(); }

// Initialize
document.addEventListener('DOMContentLoaded', () => { loadData(); initializeEventListeners(); renderSavedRecipes(); renderPantry(); renderShoppingList(); updateWeekDisplay(); renderMealPlanner(); updateTodayMeals(); });
