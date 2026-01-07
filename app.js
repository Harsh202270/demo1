/* app.js - shared logic across pages
   Items structure:
   {
     id: "uuid",
     name: "Milk",
     date: "2025-12-20",
     stock: 5,
     note: ""  // optional
   }
*/

function uid() {
  return 'id-' + Math.random().toString(36).slice(2,10);
}

function loadItems() {
  return JSON.parse(localStorage.getItem('groc_items') || '[]');
}

function saveItems(items) {
  localStorage.setItem('groc_items', JSON.stringify(items));
}

function addItemObject(obj) {
  const items = loadItems();
  items.push(obj);
  saveItems(items);
}

function findSameNameItems(name) {
  const items = loadItems();
  return items.filter(it => it.name.trim().toLowerCase() === name.trim().toLowerCase());
}

/* addItemSmart:
   If an exact name exists -> ask user:
   OK  => treat as same item -> increase stock of first matching entry
   Cancel => add a separate entry
*/
function addItemSmart(name, date, stock, note='') {
  name = name.trim();
  if(!name || !date || isNaN(stock) || stock < 0) {
    alert('Please enter valid name, expiry date and stock (>=0).');
    return;
  }

  const same = findSameNameItems(name);
  if (same.length > 0) {
    // ask confirmation
    const msg = `An item with name "${name}" already exists (${same.length} record(s)).\n\nPress OK to UPDATE existing stock (merge) or Cancel to ADD as a separate entry.`;
    if (confirm(msg)) {
      // merge into first matching entry: increase stock and update expiry if new expiry is later
      const items = loadItems();
      const idx = items.findIndex(i => i.name.trim().toLowerCase() === name.toLowerCase());
      if (idx !== -1) {
        items[idx].stock = items[idx].stock + Number(stock);
        // set to nearest expiry (keep earliest expiry to be safe) -> choose min date
        const existingDate = new Date(items[idx].date);
        const newDate = new Date(date);
        items[idx].date = (newDate < existingDate) ? date : items[idx].date;
        if (note) items[idx].note = note;
        saveItems(items);
        alert('Existing item updated (stock increased).');
        return;
      }
    }
    // else fallthrough to create separate item
  }

  // create new
  const item = {
    id: uid(),
    name,
    date,
    stock: Number(stock),
    note
  };
  addItemObject(item);
  alert('Item added successfully.');
}

/* sellItemByName: decreases 1 unit from first found matching item (case-insensitive).
   If none found -> alert not found
   If stock <= 0 -> alert out of stock
*/
function sellItemByName(name) {
  const items = loadItems();
  const idx = items.findIndex(i => i.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (idx === -1) {
    alert('Item not found.');
    return;
  }
  if (items[idx].stock <= 0) {
    alert('OUT OF STOCK!');
  } else {
    items[idx].stock -= 1;
    saveItems(items);
    alert(`Sold 1 ${items[idx].name}. Remaining: ${items[idx].stock}`);
  }
}

/* updateItemById */
function updateItemById(id, newDate, newStock, newNote) {
  const items = loadItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) { alert('Item not found'); return; }
  if (newDate) items[idx].date = newDate;
  if (!isNaN(newStock)) items[idx].stock = Number(newStock);
  if (typeof newNote !== 'undefined') items[idx].note = newNote;
  saveItems(items);
}

/* deleteItemById */
function deleteItemById(id) {
  let items = loadItems();
  items = items.filter(i => i.id !== id);
  saveItems(items);
}

/* statusColor: returns class name 'green','yellow','red','blue' */
function statusColor(item) {
  const today = new Date();
  const exp = new Date(item.date + 'T23:59:59'); // ensure day ends
  const diffDays = Math.floor((exp - today) / (1000*60*60*24));
  if (item.stock <= 0) return 'red';
  if (diffDays < 0) return 'red';
  if (diffDays <= 3) return 'yellow';
  return 'green';
}

/* helper to format date in readable form */
function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString();
}

/* GROUP by name for search results */
function groupByName(items) {
  const map = {};
  items.forEach(it => {
    const key = it.name.trim().toLowerCase();
    if (!map[key]) map[key] = [];
    map[key].push(it);
  });
  return map;
}

/* returns items matching query (name contains query) */
function searchItems(query) {
  const items = loadItems();
  if (!query) return items;
  const q = query.trim().toLowerCase();
  return items.filter(it => it.name.toLowerCase().includes(q));
}

/* getItemById */
function getItemById(id) {
  const items = loadItems();
  return items.find(i => i.id === id);
}

/* ensure at least sample data for demo convenience (call once) */
function ensureDemoData() {
  const items = loadItems();
  if (items.length === 0) {
    addItemObject({ id: uid(), name: 'Milk', date: getFutureDate(2), stock: 3, note: '2L pack' });
    addItemObject({ id: uid(), name: 'Bread', date: getFutureDate(1), stock: 2, note: 'Whole Wheat' });
    addItemObject({ id: uid(), name: 'Eggs', date: getFutureDate(10), stock: 12, note: 'Dozen' });
  }
}

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0,10);
}

/* utility to render footer (used by each page if needed) */
function footerHTML() {
  return `
    <footer class="site-footer">
      <div class="left">Smart Grocery Expiry Reminder</div>
      <div class="center">MSR College — MCA Project</div>
      <div class="right">Made by Harsh</div>
    </footer>
  `;
}
