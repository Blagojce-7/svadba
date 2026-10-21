function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

let guests = JSON.parse(localStorage.getItem('wedding_guests')) || [];
let expenses = JSON.parse(localStorage.getItem('wedding_expenses')) || [];
let timeline = JSON.parse(localStorage.getItem('wedding_timeline')) || [];

const defaultTasks = [
    { title: 'Избран ресторан / сала', done: false },
    { title: 'Капарисана музика / бенд', done: false },
    { title: 'Избран фотограф и видеограф', done: false },
    { title: 'Избрани бурми', done: false },
    { title: 'Нарачани свадбени покани', done: false },
    { title: 'Избрани одела / фустан', done: false },
    { title: 'Нарачана торта и десерти', done: false }
];
let tasks = JSON.parse(localStorage.getItem('wedding_tasks')) || defaultTasks;

let currentFilter = 'Сите';
let editModal, assignModal, createTableModal, titleModal;

document.addEventListener('DOMContentLoaded', function() {
    editModal = new bootstrap.Modal(document.getElementById('editGuestModal'));
    assignModal = new bootstrap.Modal(document.getElementById('assignGuestModal'));
    createTableModal = new bootstrap.Modal(document.getElementById('createNewTableModal'));
    titleModal = new bootstrap.Modal(document.getElementById('editTitleModal'));
    
    renderWeddingTitle();
    renderGuests();
    renderExpenses();
    renderTimeline();
    renderTasks();
    renderTablesView();
});


// ================= ДИНАМИЧКИ НАСЛОВ =================
function renderWeddingTitle() {
    const savedTitle = localStorage.getItem('wedding_title') || 'Внеси Наслов на Свадбата';
    document.getElementById('weddingTitleText').innerText = savedTitle;
}

function openTitleModal() {
    const currentTitle = localStorage.getItem('wedding_title') || '';
    document.getElementById('titleInput').value = currentTitle;
    titleModal.show();
}

document.getElementById('editTitleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newTitle = document.getElementById('titleInput').value.trim();
    if (newTitle !== '') {
        localStorage.setItem('wedding_title', newTitle);
        renderWeddingTitle();
    }
    titleModal.hide();
});

// ================= GOSTI LOGIKA =================
const guestForm = document.getElementById('guestForm');
const editGuestForm = document.getElementById('editGuestForm');
const guestTableBody = document.getElementById('guestTableBody');
const mobileGuestCardsContainer = document.getElementById('mobileGuestCardsContainer');
const searchInput = document.getElementById('searchInput');

function setFilter(category, btnElement) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderGuests();
}

function renderGuests() {
    guestTableBody.innerHTML = '';
    mobileGuestCardsContainer.innerHTML = '';

    let totalPersons = 0, totalConfirmed = 0, totalPending = 0;

    guests.forEach(guest => {
        totalPersons += parseInt(guest.count);
        if (guest.status === 'Потврдено') totalConfirmed += parseInt(guest.count);
        if (guest.status === 'Чека') totalPending += parseInt(guest.count);
    });

    document.getElementById('totalGuestsCount').innerText = totalPersons;
    document.getElementById('confirmedCount').innerText = totalConfirmed;
    document.getElementById('pendingCount').innerText = totalPending;

    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filteredGuests = guests.filter(guest => {
        const matchesCategory = (currentFilter === 'Сите') || (guest.category === currentFilter);
        const matchesSearch = guest.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    filteredGuests.sort((a, b) => {
        const tA = a.table ? a.table.trim() : '';
        const tB = b.table ? b.table.trim() : '';

        if (tA === '' && tB !== '') return 1;
        if (tA !== '' && tB === '') return -1;
        if (tA === '' && tB === '') return 0;

        return tA.localeCompare(tB, undefined, { numeric: true, sensitivity: 'base' });
    });

    let categoryPersonsSum = 0;
    filteredGuests.forEach(g => categoryPersonsSum += parseInt(g.count));

    document.getElementById('filterCategoryLabel').innerText = currentFilter;
    document.getElementById('filterCountBadge').innerText = `Вкупно лица: ${categoryPersonsSum}`;

    if (filteredGuests.length === 0) {
        const emptyMsg = `<div class="text-center text-muted py-4 small">Нема пронајдено гости.</div>`;
        guestTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Нема пронајдено гости.</td></tr>`;
        mobileGuestCardsContainer.innerHTML = emptyMsg;
    } else {
        filteredGuests.forEach((guest) => {
            const originalIndex = guests.indexOf(guest);
            let badgeClass = 'bg-warning text-dark';
            if (guest.status === 'Потврдено') badgeClass = 'bg-success';
            if (guest.status === 'Одбиено') badgeClass = 'bg-danger';

            let borderStyle = 'border-left-color: #0d6efd;';
            let catBadge = 'bg-primary';

            if (guest.category === 'Невеста') {
                borderStyle = 'border-left-color: #d63384;';
                catBadge = 'bg-danger';
            } else if (guest.category === 'Деца') {
                borderStyle = 'border-left-color: #20c997;';
                catBadge = 'bg-success';
} else if (guest.category === 'Заеднички') {
    borderStyle = 'border-left-color: #6f42c1;';
    catBadge = 'bg-purple text-dark';
}

            let row = `
                <tr>
                    <td class="fw-bold text-danger">${guest.table ? 'Маса ' + guest.table : '<span class="text-muted fw-normal">-</span>'}</td>
                    <td class="fw-bold text-dark fs-6">${guest.name}</td>
                    <td><span class="badge ${catBadge}">${guest.category}</span></td>
                    <td>${guest.count}</td>
                    <td><span class="badge ${badgeClass}">${guest.status}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${originalIndex})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteGuest(${originalIndex})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
            guestTableBody.innerHTML += row;

            let mobileCard = `
                <div class="mobile-guest-card" style="${borderStyle}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div class="main-guest-name mb-1">
                                <i class="fa-solid fa-user-tag text-danger me-1" style="font-size:0.9rem;"></i> ${guest.name}
                            </div>
                            <span class="badge ${catBadge} me-1" style="font-size:0.75rem;">${guest.category}</span>
                            <span class="badge ${badgeClass}" style="font-size:0.75rem;">${guest.status}</span>
                        </div>
                        <span class="badge bg-light text-dark border px-2 py-1" style="font-size:0.82rem; font-weight:700;">
                            <i class="fa-solid fa-chair text-danger me-1"></i>${guest.table ? 'Маса ' + guest.table : 'Без маса'}
                        </span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <span class="small text-muted"><i class="fa-solid fa-users me-1 text-primary"></i>Лица: <strong class="text-dark fs-6">${guest.count}</strong></span>
                        <div>
                            <button class="btn btn-sm btn-outline-primary btn-action-mobile me-1" onclick="openEditModal(${originalIndex})"><i class="fa-solid fa-pen me-1"></i> Измени</button>
                            <button class="btn btn-sm btn-outline-danger btn-action-mobile" onclick="deleteGuest(${originalIndex})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            mobileGuestCardsContainer.innerHTML += mobileCard;
        });
    }

    localStorage.setItem('wedding_guests', JSON.stringify(guests));
}

guestForm.addEventListener('submit', function(e) {
    e.preventDefault();
    guests.push({
        name: document.getElementById('guestName').value,
        category: document.getElementById('guestCategory').value,
        count: document.getElementById('guestCount').value,
        status: document.getElementById('guestStatus').value,
        table: document.getElementById('tableNumber').value
    });
    document.getElementById('guestName').value = '';
    document.getElementById('guestCount').value = "1";
    renderGuests();
    renderTablesView();
});

function openEditModal(index) {
    const guest = guests[index];
    document.getElementById('editGuestIndex').value = index;
    document.getElementById('editGuestName').value = guest.name;
    document.getElementById('editGuestCategory').value = guest.category;
    document.getElementById('editGuestCount').value = guest.count;
    document.getElementById('editGuestStatus').value = guest.status;
    document.getElementById('editTableNumber').value = guest.table || '';
    editModal.show();
}

editGuestForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const index = document.getElementById('editGuestIndex').value;
    guests[index] = {
        name: document.getElementById('editGuestName').value,
        category: document.getElementById('editGuestCategory').value,
        count: document.getElementById('editGuestCount').value,
        status: document.getElementById('editGuestStatus').value,
        table: document.getElementById('editTableNumber').value
    };
    editModal.hide();
    renderGuests();
    renderTablesView();
});

function deleteGuest(index) {
    if (confirm('Дали сте сигурни дека сакате да го избришете овој гостин?')) {
        guests.splice(index, 1);
        renderGuests();
        renderTablesView();
    }
}

// ================= MASI LOGIKA =================
// На почетокот на script.js додај ја низата за празни маси
let emptyTables = JSON.parse(localStorage.getItem('wedding_empty_tables')) || [];

// ================= MASI LOGIKA =================
function renameTable(oldTableNum) {
    const newTableNum = prompt(
        `Маса ${oldTableNum}\nВнеси нов број на маса:`,
        oldTableNum
    );

    if (newTableNum === null) return;

    const newNum = newTableNum.trim();

    if (!/^\d+$/.test(newNum) || Number(newNum) < 1) {
        alert('Внеси валиден број на маса.');
        return;
    }

    if (newNum === oldTableNum) return;

    const oldNum = Number(oldTableNum);
    const targetNum = Number(newNum);

    // Ако бројот е помал, помести ги другите маси за едно место нагоре
    if (targetNum < oldNum) {
        guests.forEach(g => {
            if (!g.table || !/^\d+$/.test(g.table.trim())) return;

            const n = Number(g.table);

            if (n >= targetNum && n < oldNum) {
                g.table = String(n + 1);
            } else if (n === oldNum) {
                g.table = String(targetNum);
            }
        });

        emptyTables = emptyTables.map(t => {
            if (!/^\d+$/.test(String(t))) return t;

            const n = Number(t);

            if (n >= targetNum && n < oldNum) return String(n + 1);
            if (n === oldNum) return String(targetNum);

            return t;
        });
    } else {
        // Ако бројот е поголем, помести ги другите маси за едно место надолу
        guests.forEach(g => {
            if (!g.table || !/^\d+$/.test(g.table.trim())) return;

            const n = Number(g.table);

            if (n > oldNum && n <= targetNum) {
                g.table = String(n - 1);
            } else if (n === oldNum) {
                g.table = String(targetNum);
            }
        });

        emptyTables = emptyTables.map(t => {
            if (!/^\d+$/.test(String(t))) return t;

            const n = Number(t);

            if (n > oldNum && n <= targetNum) return String(n - 1);
            if (n === oldNum) return String(targetNum);

            return t;
        });
    }

    emptyTables = [...new Set(emptyTables)];

    localStorage.setItem('wedding_empty_tables', JSON.stringify(emptyTables));

    renderGuests();
    renderTablesView();
}

function renderTablesView() {
    const tablesContainer = document.getElementById('tablesContainer');
    if (!tablesContainer) return;
    tablesContainer.innerHTML = '';

    const tablesMap = {};
    const unassigned = [];

    // 1. Иницијализирај ги сите рачно креирани празни маси
    emptyTables.forEach(tableNum => {
        tablesMap[tableNum] = [];
    });

    // 2. Групирај ги гостите по нивниот број на маса
    guests.forEach(guest => {
        const tableNum = guest.table ? guest.table.trim() : '';
        if (tableNum === '') {
            unassigned.push(guest);
        } else {
            if (!tablesMap[tableNum]) tablesMap[tableNum] = [];
            tablesMap[tableNum].push(guest);
        }
    });

    const sortedTableKeys = Object.keys(tablesMap).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    document.getElementById('tablesCountBadge').innerText = `Маси: ${sortedTableKeys.length}`;

    sortedTableKeys.forEach(tableNum => {
        const guestList = tablesMap[tableNum];
        let tablePersonsSum = 0;
        let guestRowsHTML = '';

        guestList.forEach(g => {
            const originalIndex = guests.indexOf(g);
            const count = parseInt(g.count) || 1;
            tablePersonsSum += count;

            let accent = '#0d6efd';
            if (g.category === 'Невеста') accent = '#d63384';
            else if (g.category === 'Деца') accent = '#20c997';
            else if (g.category === 'Заеднички') accent = '#6f42c1';

            guestRowsHTML += `
                <div class="table-guest-row" style="--guest-accent: ${accent}">
                    <div class="table-guest-info">
                        <span class="table-guest-name">${g.name}</span>
                        <span class="table-guest-meta">${g.category || 'Гостин'}${count > 1 ? ` · ${count} лица` : ''}</span>
                    </div>
                    <div class="table-guest-actions">
                        <span class="table-guest-count">${count}</span>
                        <button class="table-remove-guest" onclick="removeGuestFromTable(${originalIndex})" title="Отстрани од маса" aria-label="Отстрани ${g.name} од маса">×</button>
                    </div>
                </div>
            `;
        });

        const emptyMessage = `<div class="table-empty-state"><i class="fa-regular fa-clipboard mb-2"></i><div>Масата е празна</div><small>Притисни „+ Додај“ за да внесеш гости.</small></div>`;
        let tableCardHTML = `
            <div class="col-12 col-md-6 col-xl-4">
                <div class="card table-card p-3 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <div class="table-number-icon"><i class="fa-solid fa-utensils"></i></div>
                            <div>
                                <h6 class="fw-bold mb-1 text-dark">
    Маса ${tableNum}
    <button
        class="btn btn-sm btn-outline-secondary ms-1"
        onclick="renameTable('${tableNum}')"
        title="Преименувај маса">
        <i class="fa-solid fa-pen"></i>
    </button>
</h6>
                                <small class="text-muted">${guestList.length} ${guestList.length === 1 ? 'група гости' : 'групи гости'}</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge ${tablePersonsSum > 0 ? 'bg-danger' : 'bg-secondary'} rounded-pill px-3 py-2">${tablePersonsSum} лица</span>
                            ${tablePersonsSum === 0 ? `<button class="btn btn-sm btn-light text-danger" onclick="deleteEmptyTable('${tableNum}')" title="Избриши празна маса"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                    <div class="table-guests-list">
                        ${guestRowsHTML || emptyMessage}
                    </div>
                    <button class="btn btn-outline-danger w-100 mt-3 fw-semibold" onclick="openAssignModal('${tableNum}')"><i class="fa-solid fa-plus me-2"></i>Додај гости на маса</button>
                </div>
            </div>
        `;
        tablesContainer.innerHTML += tableCardHTML;
    });

    if (unassigned.length > 0) {
        let unassignedPersonsSum = 0;
        let unassignedListHTML = '';

unassigned.forEach(g => {
            const originalIndex = guests.indexOf(g);
            unassignedPersonsSum += parseInt(g.count);
            unassignedListHTML += `
                <div class="guest-tag-item d-flex justify-content-between align-items-center" style="border-left: 3px solid #6c757d;">
                    <div>
                        <div class="guest-name-text" style="font-size:0.85rem;">${g.name}</div>
                        <small class="text-muted d-block" style="font-size:0.7rem;">${g.category} (👥 ${g.count})</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-danger rounded-circle p-1" style="width: 26px; height: 26px; font-size: 11px; display: flex; align-items: center; justify-content: center;" onclick="quickAssignToTable(${originalIndex})" title="Dodadi na masa">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        let unassignedCardHTML = `
            <div class="col-md-6 col-lg-4">
                <div class="card table-card table-card-unassigned p-3 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <h6 class="fw-bold mb-0 text-secondary"><i class="fa-solid fa-user-slash me-1"></i> Без Маса</h6>
                        <span class="badge bg-secondary rounded-pill">Лица: ${unassignedPersonsSum}</span>
                    </div>
                    <div>${unassignedListHTML}</div>
                </div>
            </div>
        `;
        tablesContainer.innerHTML += unassignedCardHTML;
    }

    if (sortedTableKeys.length === 0 && unassigned.length === 0) {
        tablesContainer.innerHTML = `<div class="col-12 text-center text-muted py-5">Нема внесено гости за приказ по маси.</div>`;
    }

    localStorage.setItem('wedding_empty_tables', JSON.stringify(emptyTables));
}

// Зачувување на нова маса (дури и без избрани гости)
document.getElementById('createNewTableForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const tableNum = document.getElementById('newTableNumInput').value.trim();
    if (!tableNum) return;

    const checkboxes = document.querySelectorAll('.new-table-guest-check:checked');
    
    if (checkboxes.length === 0) {
        // Ако не е штиклиран ниту еден гостин, зачувај ја како празна маса
        if (!emptyTables.includes(tableNum)) {
            emptyTables.push(tableNum);
        }
    } else {
        checkboxes.forEach(chk => {
            const guestIdx = chk.value;
            guests[guestIdx].table = tableNum;
        });
    }

    createTableModal.hide();
    renderGuests();
    renderTablesView();
});

// Функција за бришење празна маса
function deleteEmptyTable(tableNum) {
    emptyTables = emptyTables.filter(t => t !== tableNum);
    renderTablesView();
}

function removeGuestFromTable(index) {
    const guest = guests[index];
    if (confirm(`Дали сакате да го отстраните "${guest.name}" од Маса ${guest.table}?`)) {
        guest.table = '';
        renderGuests();
        renderTablesView();
    }
}

function openAssignModal(tableNum) {
    document.getElementById('assignTargetTable').value = tableNum;
    document.getElementById('assignModalTitle').innerHTML = `<i class="fa-solid fa-chair text-danger me-2"></i> Додај Гостин на Маса ${tableNum}`;

    const search = document.getElementById('assignGuestSearch');
    const results = document.getElementById('assignGuestResults');
    const selected = document.getElementById('assignGuestSelect');
    const selectionLabel = document.getElementById('assignGuestSelection');
    selected.value = '';
    selectionLabel.textContent = '';
    search.value = '';

    function renderAssignGuestResults() {
        const query = search.value.trim().toLocaleLowerCase('mk');
const matches = guests
    .map((g, idx) => ({ g, idx }))
    .filter(({ g }) =>
        !query || g.name.toLocaleLowerCase('mk').includes(query)
    )
    .sort((a, b) => {
        const aHasTable = a.g.table && String(a.g.table).trim() !== '';
        const bHasTable = b.g.table && String(b.g.table).trim() !== '';

        // Прво гости без маса
        if (aHasTable !== bHasTable) {
            return aHasTable ? 1 : -1;
        }

        // Потоа азбучно по име во рамките на групата
        return a.g.name.localeCompare(b.g.name, 'mk');
    })
    .slice(0, 80);

        if (!guests.length) {
            results.innerHTML = '<div class="assign-guest-empty">Нема внесено гости во системот.</div>';
            return;
        }
        if (!matches.length) {
            results.innerHTML = '<div class="assign-guest-empty">Нема пронајдено гостин со тоа име.</div>';
            return;
        }

        results.innerHTML = matches.map(({g, idx}) => {
            const tableText = g.table && g.table.trim() !== ''
                ? `Веќе на Маса ${escapeHtml(String(g.table))}`
                : 'Без маса';
            const isAssigned = g.table && g.table.trim() !== '';
            return `<button type="button" class="assign-guest-option ${selected.value === String(idx) ? 'selected' : ''}" data-guest-index="${idx}" role="option" aria-selected="${selected.value === String(idx)}">
                <span class="assign-guest-option-main">${escapeHtml(g.name)}</span>
                <span class="assign-guest-option-meta">${escapeHtml(String(g.count))} лица · ${tableText}</span>
            </button>`;
        }).join('');

        results.querySelectorAll('[data-guest-index]').forEach(button => {
            button.addEventListener('click', () => {
                selected.value = button.dataset.guestIndex;
                const guest = guests[Number(selected.value)];
                selectionLabel.textContent = `✓ Избран гостин: ${guest.name} (${guest.count} лица)`;
                renderAssignGuestResults();
            });
        });
    }

    // Keep the listener single per modal opening.
    search.oninput = renderAssignGuestResults;
    renderAssignGuestResults();
    assignModal.show();
    setTimeout(() => search.focus(), 150);
}

document.getElementById('assignGuestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const guestIndex = document.getElementById('assignGuestSelect').value;
    const targetTable = document.getElementById('assignTargetTable').value;

    if (guestIndex === '') {
        alert('Ве молиме изберете гостин.');
        return;
    }

    const guest = guests[guestIndex];
    const oldTable = guest.table ? guest.table.trim() : '';

    if (oldTable !== '' && oldTable !== targetTable) {
        alert(`Гостинот "${guest.name}" веќе беше доделен на Маса ${oldTable}.\nСега е префрлен на Маса ${targetTable}!`);
    }

    guest.table = targetTable;
    
    assignModal.hide();
    renderGuests();
    renderTablesView();
});

function openCreateNewTableModal() {
    document.getElementById('newTableNumInput').value = '';
    const checklistContainer = document.getElementById('unassignedGuestsChecklist');
    checklistContainer.innerHTML = '';

    const unassignedGuests = guests.filter(g => !g.table || g.table.trim() === '');

    if (unassignedGuests.length === 0) {
        checklistContainer.innerHTML = `<div class="text-center text-muted small py-2">Сите гости веќе имаат маса!</div>`;
    } else {
        unassignedGuests.forEach(g => {
            const originalIndex = guests.indexOf(g);
            checklistContainer.innerHTML += `
                <div class="form-check py-1 border-bottom">
                    <input class="form-check-input new-table-guest-check" type="checkbox" value="${originalIndex}" id="chk_guest_${originalIndex}">
                    <label class="form-check-label small d-flex justify-content-between" for="chk_guest_${originalIndex}">
                        <span><strong>${g.name}</strong> (${g.category})</span>
                        <span class="badge bg-secondary">${g.count} лица</span>
                    </label>
                </div>
            `;
        });
    }

    createTableModal.show();
}

document.getElementById('createNewTableForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const tableNum = document.getElementById('newTableNumInput').value.trim();
    if (!tableNum) return;

    const checkboxes = document.querySelectorAll('.new-table-guest-check:checked');
    checkboxes.forEach(chk => {
        const guestIdx = chk.value;
        guests[guestIdx].table = tableNum;
    });

    createTableModal.hide();
    renderGuests();
    renderTablesView();
});

// ================= TIMELINE =================
const timelineForm = document.getElementById('timelineForm');
const timelineTableBody = document.getElementById('timelineTableBody');
const mobileTimelineContainer = document.getElementById('mobileTimelineContainer');

function renderTimeline() {
    if(!timelineTableBody) return;
    timelineTableBody.innerHTML = '';
    mobileTimelineContainer.innerHTML = '';

    timeline.sort((a, b) => a.time.localeCompare(b.time));
    document.getElementById('timelineCountBadge').innerText = `Настани: ${timeline.length}`;

    if (timeline.length === 0) {
        timelineTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Нема внесени настани.</td></tr>`;
        mobileTimelineContainer.innerHTML = `<div class="text-center text-muted py-4 small">Нема внесени настани во планот.</div>`;
        return;
    }

    timeline.forEach((item, index) => {
        timelineTableBody.innerHTML += `
            <tr>
                <td class="fw-bold text-danger"><i class="fa-regular fa-clock me-1"></i> ${item.time}</td>
                <td>${item.title}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTimelineItem(${index})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
        mobileTimelineContainer.innerHTML += `
            <div class="mobile-timeline-card">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-danger fs-6"><i class="fa-regular fa-clock me-1"></i> ${item.time}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTimelineItem(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <p class="mb-0 text-dark fw-semibold" style="font-size: 0.95rem;">${item.title}</p>
            </div>
        `;
    });
    localStorage.setItem('wedding_timeline', JSON.stringify(timeline));
}

timelineForm.addEventListener('submit', function(e) {
    e.preventDefault();
    timeline.push({ time: document.getElementById('eventTime').value, title: document.getElementById('eventTitle').value });
    document.getElementById('eventTime').value = '';
    document.getElementById('eventTitle').value = '';
    renderTimeline();
});

function deleteTimelineItem(index) {
    if (confirm('Дали сакате да го избришете овој настан од планот?')) {
        timeline.splice(index, 1);
        renderTimeline();
    }
}

// ================= TASKS =================
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');

function renderTasks() {
    if(!tasksContainer) return;
    tasksContainer.innerHTML = '';
    let completedCount = 0;

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `<li class="list-group-item text-center text-muted py-4">Нема додадено задачи.</li>`;
        document.getElementById('tasksCountBadge').innerText = `Завршени: 0/0`;
        return;
    }

    tasks.forEach((task, index) => {
        if (task.done) completedCount++;
        tasksContainer.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                <div class="form-check me-2">
                    <input class="form-check-input" type="checkbox" id="taskCheck_${index}" ${task.done ? 'checked' : ''} onchange="toggleTaskDone(${index})">
                    <label class="form-check-label fw-semibold ${task.done ? 'task-completed' : 'text-dark'}" for="taskCheck_${index}">
                        ${task.title}
                    </label>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${index})"><i class="fa-solid fa-trash"></i></button>
            </li>
        `;
    });
    document.getElementById('tasksCountBadge').innerText = `Завршени: ${completedCount}/${tasks.length}`;
    localStorage.setItem('wedding_tasks', JSON.stringify(tasks));
}

taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    tasks.push({ title: document.getElementById('taskTitle').value, done: false });
    document.getElementById('taskTitle').value = '';
    renderTasks();
});

function toggleTaskDone(index) {
    tasks[index].done = !tasks[index].done;
    renderTasks();
}

function deleteTask(index) {
    if (confirm('Дали сакате да ја избришете оваа задача?')) {
        tasks.splice(index, 1);
        renderTasks();
    }
}

// ================= EXPENSES / BUDGET =================
const expenseForm = document.getElementById('expenseForm');
const expenseTableBody = document.getElementById('expenseTableBody');
const mobileExpensesContainer = document.getElementById('mobileExpensesContainer');

function renderExpenses() {
    if(!expenseTableBody) return;
    expenseTableBody.innerHTML = '';
    mobileExpensesContainer.innerHTML = '';

    let totalSum = 0, paidSum = 0, unpaidSum = 0;

    expenses.forEach((expense, index) => {
        const amount = parseFloat(expense.amount) || 0;
        totalSum += amount;
        if (expense.status === 'Платено') paidSum += amount;
        else unpaidSum += amount;

        let badgeClass = expense.status === 'Платено' ? 'bg-success' : 'bg-danger';

        expenseTableBody.innerHTML += `
            <tr>
                <td class="fw-semibold">${expense.title}</td>
                <td class="fw-bold">${amount} €</td>
                <td><span class="badge ${badgeClass}">${expense.status}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-success me-1" onclick="toggleExpenseStatus(${index})" title="Промени статус"><i class="fa-solid fa-arrow-rotate-left"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${index})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;

        mobileExpensesContainer.innerHTML += `
            <div class="mobile-expense-card">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold mb-0">${expense.title}</h6>
                    <span class="fw-bold fs-5 text-dark">${amount} €</span>
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span class="badge ${badgeClass}">${expense.status}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-success btn-action-mobile me-1" onclick="toggleExpenseStatus(${index})"><i class="fa-solid fa-sync me-1"></i> Смени</button>
                        <button class="btn btn-sm btn-outline-danger btn-action-mobile" onclick="deleteExpense(${index})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('totalExpensesSum').innerText = `${totalSum} €`;
    document.getElementById('paidExpensesSum').innerText = `${paidSum} €`;
    document.getElementById('unpaidExpensesSum').innerText = `${unpaidSum} €`;
    localStorage.setItem('wedding_expenses', JSON.stringify(expenses));
}

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    expenses.push({
        title: document.getElementById('expenseTitle').value,
        amount: document.getElementById('expenseAmount').value,
        status: document.getElementById('expenseStatus').value
    });
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseAmount').value = '';
    renderExpenses();
});

function toggleExpenseStatus(index) {
    expenses[index].status = expenses[index].status === 'Платено' ? 'За плаќање' : 'Платено';
    renderExpenses();
}

function deleteExpense(index) {
    if (confirm('Дали сте сигурни дека сакате да го избришете овој трошок?')) {
        expenses.splice(index, 1);
        renderExpenses();
    }
}

// ================= IMPORT / EXPORT =================
function exportData() {
    const savedTitle = localStorage.getItem('wedding_title') || 'Благој и Ирина Свадба';
    const fullData = { title: savedTitle, guests: guests, expenses: expenses, timeline: timeline, tasks: tasks };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "wedding_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                guests = imported;
            } else {
                if (imported.title) {
                    localStorage.setItem('wedding_title', imported.title);
                    renderWeddingTitle();
                }
                if (imported.guests) guests = imported.guests;
                if (imported.expenses) expenses = imported.expenses;
                if (imported.timeline) timeline = imported.timeline;
                if (imported.tasks) tasks = imported.tasks;
            }
            renderGuests();
            renderExpenses();
            renderTimeline();
            renderTasks();
            renderTablesView();
            alert('Податоците се успешно прикачени!');
        } catch (err) {
            alert('Грешка при читање: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function quickAssignToTable(index) {
    const guest = guests[index];
    const targetTable = prompt(`Vnesi broj na masa za gostinot "${guest.name}":`);
    if (targetTable !== null && targetTable.trim() !== "") {
        guest.table = targetTable.trim();
        renderGuests();
        renderTablesView();
    }
}