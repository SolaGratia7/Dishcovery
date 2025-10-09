document.addEventListener('DOMContentLoaded', () => {
  const pantryList = document.getElementById('pantryList');
  const addItemForm = document.getElementById('addItemForm');
  const filterCategory = document.getElementById('filterCategory');
  const sortExpiration = document.getElementById('sortExpiration');
  const filterButton = document.getElementById('filterButton');

  let pantryData = []; // authoritative copy from server

  // --- Helpers ---
  function startOfDay(d) {
    const dt = new Date(d);
    dt.setHours(0,0,0,0);
    return dt;
  }

  // returns number of days from today to expiration (0 = today, negative = already expired)
  function getDaysUntil(dateStr) {
    const today = startOfDay(new Date());
    const exp   = startOfDay(new Date(dateStr));
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((exp - today) / msPerDay);
  }

  // apply color rules:
  // less than 3 days -> red (critical)
  // less than 7 days -> yellow (warning)
  // else normal
  function expiryClassForDays(days) {
    if (days < 0) return 'expired';
    if (days < 3) return 'expiring-critical';
    if (days < 7) return 'expiring-warning';
    return 'normal';
  }

  // --- Render pantry items (items should be array of objects) ---
  function displayPantry(items) {
    pantryList.innerText = '';
    if (!Array.isArray(items) || items.length === 0) {
        let newE = document.createElement('div');
        newE.className = "text-muted";
        newE.innerText = "No items in pantry."
        pantryList.appendChild(newE);
      return;
    }

    items.forEach(item => {
      // guard: skip malformed entries
      if (!item || !item.id || !item.name) return;

      const days = getDaysUntil(item.expiration);
      const cls = expiryClassForDays(days);

      const card = document.createElement('div');
      card.className = `pantry-item ${cls}`;

      // name (largest), then italicized quantity/unit and expiration on new line
      let newdiv = document.createElement('div');
      newdiv.className = "d-flex justify-content-between align-items-start";

      let newdiv2 = document.createElement('div');

      // appending childs to newdiv2 
      let h4 = document.createElement('h4');
      h4.className = "fw-bold mb-2";
      h4.innerText = item.name;
      newdiv2.appendChild(h4);

      let p = document.createElement('p');
      p.className = "fst-italic mb-0";
      //   2nd line of when it expires
      let secondLine;
      if (days<0){
        secondLine = `Expired ${days*-1} days ago on ${item.expiration}`;
      } else if(days == 0) {
        secondLine = `Expires today on ${item.expiration}`;
      } else{
        secondLine = `Expires in ${days} days on ${item.expiration}`;
      }
      // adding innerText to p   
      p.innerText = `${item.quantity} ${item.unit} | ${item.category}\n${secondLine}`;
      newdiv2.appendChild(p);
    
      //   appending div3 button
      let newdiv3 = document.createElement('div');
      newdiv3.className = "ms-3";
      
      //   creating del button for each item
      let btn = document.createElement('button');
      if (days<0){
        btn.className = "btn btn-sm btn-dark delete-btn"
      } else {
        btn.className = "btn btn-sm btn-outline-danger delete-btn";
      }
      btn.setAttribute('data-id', item.id);
      btn.innerText = 'Delete';
      newdiv3.appendChild(btn);
      
      newdiv.appendChild(newdiv2);
      newdiv.appendChild(newdiv3);
      card.appendChild(newdiv);
      pantryList.appendChild(card);
    });
  }

  // --- Fetch pantry from server ---
  async function fetchPantry() {
    try {
      const res = await fetch('pantry.php');
      if (!res.ok) throw new Error('Failed to fetch pantry'); //throws custom error
      const data = await res.json();
      // ensure array and remove any null/malformed entries
      pantryData = Array.isArray(data) ? data.filter(it => it && it.id && it.name) : [];
      displayPantry(pantryData); //pantrydata is an array of objects
    } catch (err) {
      console.error(err);
      let newdiv = document.createElement('div');
      newdiv.className = "text-danger";
      newdiv.innerText = 'Error loading pantry.';
      pantryList.appendChild(newdiv);
    }
  }

  // --- Add new item ---
  addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value;
    const quantityRaw = document.getElementById('quantity').value;
    const unit = document.getElementById('unit').value.trim();
    const expiration = document.getElementById('expiration').value;

    // basic client-side validation
    // if (!name || !category || !quantityRaw || !unit || !expiration) {
    //   alert('Please fill all fields.');
    //   return;
    // }

    errorMsg = '';
    if (!name){
        errorMsg += '\nPlease fill in Name';
    }
    if (!category){
        errorMsg += '\nPlease fill in Category';
    }
    if (!quantityRaw){
        errorMsg += '\nPlease fill in Quantity';
    }
    if (!unit){
        errorMsg += '\nPlease fill in Unit';
    }
    if (!expiration){
        errorMsg += '\nPlease fill in Expiration';
    }
    if (errorMsg != ''){
        alert(errorMsg);
        return;
    }


    const quantity = parseFloat(quantityRaw);
    if (Number.isNaN(quantity) || quantity < 0) {
      alert('Enter a valid quantity.');
      return;
    }

    const payload = { name, category, quantity, unit, expiration };

    try {
      const res = await fetch('pantry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.status === 'error') {
        alert('Could not add item: ' + (result.message || 'validation failed'));
        return;
      }
      addItemForm.reset();
      await fetchPantry(); //resets the UI by adding most recent item into pantry without refreshing page
    } catch (err) {
      console.error(err);
      alert('Failed to add item.');
    }
  });

  // --- Delete handler using event delegation ---
  pantryList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;

    // optional: quick confirm
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch('pantry.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteId: id })
      });
      const result = await res.json();
      if (result.status === 'deleted') {
        await fetchPantry();
      } else {
        alert('Could not delete item.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  });

  // --- Filter & sort ---
  filterButton.addEventListener('click', () => {
    let filtered = [...pantryData];

    const category = filterCategory.value;
    if (category) {
      filtered = filtered.filter(item => (item.category || '') === category);
    }

    const sortOrder = sortExpiration.value;
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => new Date(b.expiration) - new Date(a.expiration));
    }

    displayPantry(filtered);
  });

  // initial load
  fetchPantry();
});
