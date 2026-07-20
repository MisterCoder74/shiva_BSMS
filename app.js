// Beauty Salon Management System
// Pure Vanilla JavaScript with LocalStorage

// ============================================
// DATA STORE
// ============================================

const DB = {
    settings: {
        salonName: 'Beauty Salon',
        ivaCode: '',
        address: '',
        phone: '',
        email: '',
        website: ''
    },
    clients: [],
    staff: [],
    services: [],
    products: [],
    appointments: [],
    sales: []
};

// Initialize with sample data
function initSampleData() {
    // Add sample staff
    if (DB.staff.length === 0) {
        DB.staff = [
            { id: generateId(), firstName: 'Maria', lastName: 'Rossi', phone: '+39 333 123 4567', email: 'maria@salon.com', role: 'Hair Stylist', color: '#ec4899' },
            { id: generateId(), firstName: 'Laura', lastName: 'Bianchi', phone: '+39 333 987 6543', email: 'laura@salon.com', role: 'Esthetician', color: '#8b5cf6' }
        ];
    }

    // Add sample services
    if (DB.services.length === 0) {
        DB.services = [
            { id: generateId(), name: 'Haircut Women', description: 'Complete haircut with styling', duration: 60, price: 35, category: 'Hair' },
            { id: generateId(), name: 'Haircut Men', description: 'Men\'s haircut', duration: 30, price: 20, category: 'Hair' },
            { id: generateId(), name: 'Hair Coloring', description: 'Full hair coloring', duration: 120, price: 80, category: 'Hair' },
            { id: generateId(), name: 'Manicure', description: 'Classic manicure', duration: 45, price: 25, category: 'Nails' },
            { id: generateId(), name: 'Pedicure', description: 'Classic pedicure', duration: 60, price: 35, category: 'Nails' },
            { id: generateId(), name: 'Facial Treatment', description: 'Deep cleansing facial', duration: 75, price: 65, category: 'Facial' }
        ];
    }

    // Add sample products
    if (DB.products.length === 0) {
        DB.products = [
            { id: generateId(), name: 'Professional Shampoo', description: '500ml salon quality', price: 18.50, stock: 25, category: 'Hair Care' },
            { id: generateId(), name: 'Hair Conditioner', description: '500ml moisturizing', price: 19.50, stock: 20, category: 'Hair Care' },
            { id: generateId(), name: 'Nail Polish Red', description: 'Long lasting formula', price: 12.00, stock: 15, category: 'Nails' },
            { id: generateId(), name: 'Face Cream', description: 'Anti-aging 50ml', price: 45.00, stock: 10, category: 'Skincare' }
        ];
    }

    // Add sample clients
    if (DB.clients.length === 0) {
        DB.clients = [
            { id: generateId(), firstName: 'Giulia', lastName: 'Verdi', phone: '+39 340 111 2222', email: 'giulia@email.com', dob: '1990-05-15', notes: 'Prefers morning appointments' },
            { id: generateId(), firstName: 'Anna', lastName: 'Neri', phone: '+39 340 333 4444', email: 'anna@email.com', dob: '1985-08-22', notes: '' },
            { id: generateId(), firstName: 'Sofia', lastName: 'Gialli', phone: '+39 340 555 6666', email: 'sofia@email.com', dob: '1995-03-10', notes: 'Sensitive skin' }
        ];
    }

    saveData();
}

// ============================================
// UTILITIES
// ============================================

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(time) {
    if (!time) return '';
    return time;
}

function formatCurrency(amount) {
    return '€' + parseFloat(amount || 0).toFixed(2).replace('.', ',');
}

function getInitials(firstName, lastName) {
    return ((firstName || '').charAt(0) + (lastName || '').charAt(0)).toUpperCase();
}

function getToday() {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ============================================
// DATA PERSISTENCE (one JSON file per entity via PHP API)
// ============================================

const API_URL = 'api/data.php';
const DB_ENTITIES = ['settings', 'clients', 'staff', 'services', 'products', 'appointments', 'sales'];

// saveData('clients') saves only DB.clients to data/clients.json.
// saveData('products', 'sales') saves both in parallel (e.g. a sale that also updates stock).
// saveData() with no args saves every entity (bulk import / initial seed only - avoid in hot paths).
function saveData(...entityNames) {
    const names = entityNames.length ? entityNames : DB_ENTITIES;
    Promise.all(names.map(name =>
        fetch(`${API_URL}?entity=${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(DB[name])
        })
    )).catch(err => {
        console.error('Save failed:', err);
        showSaveError();
    });
}

async function loadData() {
    try {
        const results = await Promise.all(
            DB_ENTITIES.map(name => fetch(`${API_URL}?entity=${encodeURIComponent(name)}`).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`);
                return res.json();
            }))
        );
        DB_ENTITIES.forEach((name, i) => { DB[name] = results[i]; });
    } catch (err) {
        console.error('Load failed:', err);
        showSaveError('Could not load data from server. Working offline with defaults.');
    }
}

function showSaveError(message) {
    let banner = document.getElementById('saveErrorBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'saveErrorBanner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:0.5rem 1rem;text-align:center;font-size:0.85rem;z-index:9999;';
        document.body.prepend(banner);
    }
    banner.textContent = message || '⚠️ Could not save changes. Check your connection and try again.';
    banner.style.display = 'block';
    clearTimeout(showSaveError._t);
    showSaveError._t = setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

// ============================================
// NAVIGATION
// ============================================

let currentPage = 'dashboard';
let calendarView = 'month';
let currentDate = new Date();
let selectedDate = null;
let statsPeriod = 'day';

function toggleNav() {
    document.getElementById('navOverlay').classList.toggle('active');
    document.getElementById('navSidebar').classList.toggle('active');
}

function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected page
    document.getElementById(`page-${page}`).classList.add('active');
    currentPage = page;

    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    const pageIndex = ['dashboard', 'calendar', 'appointments', 'clients', 'staff', 'services', 'products', 'stats', 'settings'].indexOf(page);
    if (navItems[pageIndex]) {
        navItems[pageIndex].classList.add('active');
    }

    // Refresh page data
    refreshPage(page);
}

function refreshPage(page) {
    switch(page) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'calendar':
            refreshCalendar();
            break;
        case 'appointments':
            refreshAppointments();
            break;
        case 'clients':
            refreshClients();
            break;
        case 'staff':
            refreshStaff();
            break;
        case 'services':
            refreshServices();
            break;
        case 'products':
            refreshProducts();
            break;
        case 'sales':
            refreshSales();
            break;
        case 'stats':
            refreshStats();
            break;
        case 'settings':
            refreshSettings();
            break;
    }
}

// ============================================
// DASHBOARD
// ============================================

function refreshDashboard() {
    const today = getToday();
    const todayAppointments = DB.appointments.filter(a => a.date === today);
    const todaySales = DB.sales.filter(s => s.date === today);

    document.getElementById('dashTodayCount').textContent = todayAppointments.length;
    document.getElementById('dashPendingCount').textContent = todayAppointments.filter(a => a.status === 'pending').length;
    document.getElementById('dashCompletedCount').textContent = todayAppointments.filter(a => a.status === 'completed' || a.status === 'paid').length;
    
    // Calculate total revenue (services + products)
    const servicesRevenue = todayAppointments
        .filter(a => a.status === 'completed' || a.status === 'paid')
        .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const productsRevenue = todaySales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const totalRevenue = servicesRevenue + productsRevenue;
    
    document.getElementById('dashRevenue').textContent = formatCurrency(totalRevenue);

    document.getElementById('dashTotalClients').textContent = DB.clients.length;
    document.getElementById('dashTotalServices').textContent = DB.services.length;
    document.getElementById('dashTotalProducts').textContent = DB.products.length;

    // Render today's appointments
    const container = document.getElementById('todayAppointments');
    if (todayAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-title">No appointments today</div>
                <p>Click the + button to add your first appointment</p>
            </div>
        `;
    } else {
        container.innerHTML = todayAppointments
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(a => renderAppointmentItem(a))
            .join('');
    }
}

function renderAppointmentItem(appointment) {
    const client = DB.clients.find(c => c.id === appointment.clientId);
    const service = DB.services.find(s => s.id === appointment.serviceId);
    const staff = DB.staff.find(s => s.id === appointment.staffId);
    
    const statusClass = `badge-${appointment.status}`;
    const statusLabel = appointment.status === 'noshow' ? 'No Show' : 
                       appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);

    return `
        <div class="list-item" onclick="editAppointment('${appointment.id}')">
            <div class="list-item-avatar" style="background: ${staff ? staff.color : 'var(--primary)'};">
                ${appointment.time}
            </div>
            <div class="list-item-content">
                <div class="list-item-title">${client ? `${client.firstName} ${client.lastName}` : 'Unknown'}</div>
                <div class="list-item-subtitle">${service ? service.name : 'Unknown Service'} • ${staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown'}</div>
            </div>
            <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
    `;
}

// ============================================
// CALENDAR
// ============================================

function refreshCalendar() {
    if (calendarView === 'month') {
        renderMonthView();
    } else {
        renderWeekView();
    }
}

function setCalendarView(view) {
    calendarView = view;
    document.getElementById('btnMonth').classList.toggle('active', view === 'month');
    document.getElementById('btnWeek').classList.toggle('active', view === 'week');
    document.getElementById('monthView').classList.toggle('active', view === 'week');
    document.getElementById('weekView').classList.toggle('active', view === 'month');
    refreshCalendar();
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    refreshCalendar();
}

function goToToday() {
    currentDate = new Date();
    refreshCalendar();
}

function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('calendarTitle').textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    let html = `
        <div class="day-header">Sun</div>
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
    `;

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
        const day = prevMonth.getDate() - i;
        html += `<div class="day-cell other-month" onclick="selectDate(${year}, ${month - 1}, ${day})"><div class="day-number">${day}</div></div>`;
    }

    const today = getToday();

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const dayAppointments = DB.appointments.filter(a => a.date === dateStr);

        html += `<div class="day-cell ${isToday ? 'today' : ''}" onclick="selectDate(${year}, ${month}, ${day})">`;
        html += `<div class="day-number">${day}</div>`;
        
        if (dayAppointments.length > 0) {
            html += `<div class="day-appointments">`;
            dayAppointments.slice(0, 3).forEach(a => {
                const client = DB.clients.find(c => c.id === a.clientId);
                html += `<div class="day-appointment ${a.status}">${a.time} ${client ? client.firstName : ''}</div>`;
            });
            if (dayAppointments.length > 3) {
                html += `<div class="day-appointment" style="background: var(--gray-200); color: var(--gray-600);">+${dayAppointments.length - 3} more</div>`;
            }
            html += `</div>`;
        }
        
        html += `</div>`;
    }

    // Next month padding
    const remainingCells = (7 - ((startPadding + daysInMonth) % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="day-cell other-month" onclick="selectDate(${year}, ${month + 1}, ${day})"><div class="day-number">${day}</div></div>`;
    }

    document.getElementById('monthGrid').innerHTML = html;
}

function renderWeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    const today = getToday();
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d);
    }

    const startStr = weekDays[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    const endStr = weekDays[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    document.getElementById('calendarTitle').textContent = `${startStr} - ${endStr}`;

    // Week header
    let headerHtml = '<div class="week-header-cell"></div>';
    weekDays.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const isToday = dateStr === today;
        headerHtml += `
            <div class="week-header-cell">
                <div class="week-day-name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="week-day-number ${isToday ? 'today' : ''}">${d.getDate()}</div>
            </div>
        `;
    });
    document.getElementById('weekHeader').innerHTML = headerHtml;

    // Time slots (8:00 - 19:00)
    let gridHtml = '';
    for (let hour = 8; hour <= 19; hour++) {
        gridHtml += `<div class="time-slot">${hour}:00</div>`;
        weekDays.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            const appointments = DB.appointments.filter(a => a.date === dateStr && a.time.startsWith(String(hour).padStart(2, '0')));
            
            gridHtml += `<div class="week-cell" onclick="selectDateTime(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()}, ${hour})">`;
            appointments.forEach(a => {
                const client = DB.clients.find(c => c.id === a.clientId);
                gridHtml += `<div class="week-appointment ${a.status}">${a.time} ${client ? client.firstName : ''}</div>`;
            });
            gridHtml += `</div>`;
        });
    }
    document.getElementById('weekGrid').innerHTML = gridHtml;
}

function selectDate(year, month, day) {
    selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    openAppointmentModal();
}

function selectDateTime(year, month, day, hour) {
    selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    openAppointmentModal(null, `${String(hour).padStart(2, '0')}:00`);
}

// ============================================
// APPOINTMENTS
// ============================================

function refreshAppointments() {
    const container = document.getElementById('appointmentsList');
    const search = document.getElementById('appointmentSearch')?.value.toLowerCase() || '';
    
    let appointments = [...DB.appointments].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });

    if (search) {
        appointments = appointments.filter(a => {
            const client = DB.clients.find(c => c.id === a.clientId);
            const service = DB.services.find(s => s.id === a.serviceId);
            return (client && `${client.firstName} ${client.lastName}`.toLowerCase().includes(search)) ||
                   (service && service.name.toLowerCase().includes(search));
        });
    }

    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No appointments found</div>
                <p>${search ? 'Try a different search' : 'Start by adding appointments from the calendar'}</p>
            </div>
        `;
    } else {
        container.innerHTML = appointments.map(a => {
            const client = DB.clients.find(c => c.id === a.clientId);
            const service = DB.services.find(s => s.id === a.serviceId);
            const staff = DB.staff.find(s => s.id === a.staffId);
            
            const statusClass = `badge-${a.status}`;
            const statusLabel = a.status === 'noshow' ? 'No Show' : 
                               a.status.charAt(0).toUpperCase() + a.status.slice(1);

            return `
                <div class="list-item" onclick="editAppointment('${a.id}')">
                    <div class="list-item-avatar" style="background: ${staff ? staff.color : 'var(--primary)'};">
                        ${getInitials(client?.firstName, client?.lastName)}
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">${client ? `${client.firstName} ${client.lastName}` : 'Unknown'}</div>
                        <div class="list-item-subtitle">${formatDate(a.date)} at ${a.time} • ${service ? service.name : 'Unknown'}</div>
                    </div>
                    <span class="badge ${statusClass}">${statusLabel}</span>
                </div>
            `;
        }).join('');
    }
}

function filterAppointments() {
    refreshAppointments();
}

function openAppointmentModal(id = null, time = null) {
    populateSelect('appointmentClient', DB.clients, c => `${c.firstName} ${c.lastName}`);
    populateSelect('appointmentStaff', DB.staff, s => `${s.firstName} ${s.lastName}`);
    populateSelect('appointmentService', DB.services, s => s.name);
    populateTimeSelect();

    if (id) {
        const appointment = DB.appointments.find(a => a.id === id);
        if (appointment) {
            document.getElementById('appointmentId').value = appointment.id;
            document.getElementById('appointmentClient').value = appointment.clientId;
            document.getElementById('appointmentStaff').value = appointment.staffId;
            document.getElementById('appointmentService').value = appointment.serviceId;
            document.getElementById('appointmentDate').value = appointment.date;
            document.getElementById('appointmentTime').value = appointment.time;
            document.getElementById('appointmentPrice').value = appointment.price;
            document.getElementById('appointmentStatus').value = appointment.status;
            document.getElementById('appointmentNotes').value = appointment.notes || '';
            document.getElementById('appointmentModalTitle').textContent = 'Edit Appointment';
            document.getElementById('deleteAppointmentBtn').style.display = 'inline-flex';
        }
    } else {
        document.getElementById('appointmentId').value = '';
        document.getElementById('appointmentClient').value = '';
        document.getElementById('appointmentStaff').value = '';
        document.getElementById('appointmentService').value = '';
        document.getElementById('appointmentDate').value = selectedDate || getToday();
        document.getElementById('appointmentTime').value = time || '';
        document.getElementById('appointmentPrice').value = '';
        document.getElementById('appointmentStatus').value = 'pending';
        document.getElementById('appointmentNotes').value = '';
        document.getElementById('appointmentModalTitle').textContent = 'New Appointment';
        document.getElementById('deleteAppointmentBtn').style.display = 'none';
    }

    showModal('appointmentModal');
}

function populateSelect(id, items, labelFn) {
    const select = document.getElementById(id);
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select...</option>';
    items.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${labelFn(item)}</option>`;
    });
    select.value = currentValue;
}

function populateTimeSelect() {
    const select = document.getElementById('appointmentTime');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Time</option>';
    for (let hour = 8; hour <= 19; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            select.innerHTML += `<option value="${time}">${time}</option>`;
        }
    }
    select.value = currentValue;
}

function updateAppointmentPrice() {
    const serviceId = document.getElementById('appointmentService').value;
    if (serviceId) {
        const service = DB.services.find(s => s.id === serviceId);
        if (service) {
            document.getElementById('appointmentPrice').value = service.price;
        }
    }
}

function editAppointment(id) {
    openAppointmentModal(id);
}

function saveAppointment() {
    const id = document.getElementById('appointmentId').value;
    const clientId = document.getElementById('appointmentClient').value;
    const staffId = document.getElementById('appointmentStaff').value;
    const serviceId = document.getElementById('appointmentService').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const price = parseFloat(document.getElementById('appointmentPrice').value) || 0;
    const status = document.getElementById('appointmentStatus').value;
    const notes = document.getElementById('appointmentNotes').value;

    if (!clientId || !staffId || !serviceId || !date || !time) {
        alert('Please fill in all required fields');
        return;
    }

    if (id) {
        const index = DB.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            DB.appointments[index] = { id, clientId, staffId, serviceId, date, time, price, status, notes };
        }
    } else {
        DB.appointments.push({ id: generateId(), clientId, staffId, serviceId, date, time, price, status, notes });
    }

    saveData('appointments');
    closeModal('appointmentModal');
    refreshCurrentPage();
}

function deleteAppointment() {
    const id = document.getElementById('appointmentId').value;
    if (confirm('Are you sure you want to delete this appointment?')) {
        DB.appointments = DB.appointments.filter(a => a.id !== id);
        saveData('appointments');
        closeModal('appointmentModal');
        refreshCurrentPage();
    }
}

// ============================================
// CLIENTS
// ============================================

function refreshClients() {
    const container = document.getElementById('clientsList');
    const search = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    
    let clients = [...DB.clients].sort((a, b) => a.lastName.localeCompare(b.lastName));

    if (search) {
        clients = clients.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(search) ||
            (c.phone && c.phone.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search))
        );
    }

    if (clients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-title">${search ? 'No clients found' : 'No clients yet'}</div>
                <p>${search ? 'Try a different search' : 'Add your first client to get started'}</p>
            </div>
        `;
    } else {
        container.innerHTML = clients.map(c => `
            <div class="list-item" onclick="editClient('${c.id}')">
                <div class="list-item-avatar">${getInitials(c.firstName, c.lastName)}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${c.firstName} ${c.lastName}</div>
                    <div class="list-item-subtitle">${c.phone || ''}${c.phone && c.email ? ' • ' : ''}${c.email || ''}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); editClient('${c.id}')">✏️</button>
                </div>
            </div>
        `).join('');
    }
}

function filterClients() {
    refreshClients();
}

function openClientModal(id = null) {
    if (id) {
        const client = DB.clients.find(c => c.id === id);
        if (client) {
            document.getElementById('clientId').value = client.id;
            document.getElementById('clientFirstName').value = client.firstName;
            document.getElementById('clientLastName').value = client.lastName;
            document.getElementById('clientPhone').value = client.phone || '';
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientDob').value = client.dob || '';
            document.getElementById('clientNotes').value = client.notes || '';
            document.getElementById('clientModalTitle').textContent = 'Edit Client';
            document.getElementById('deleteClientBtn').style.display = 'inline-flex';
        }
    } else {
        document.getElementById('clientId').value = '';
        document.getElementById('clientFirstName').value = '';
        document.getElementById('clientLastName').value = '';
        document.getElementById('clientPhone').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientDob').value = '';
        document.getElementById('clientNotes').value = '';
        document.getElementById('clientModalTitle').textContent = 'New Client';
        document.getElementById('deleteClientBtn').style.display = 'none';
    }

    showModal('clientModal');
}

function editClient(id) {
    openClientModal(id);
}

function saveClient() {
    const id = document.getElementById('clientId').value;
    const firstName = document.getElementById('clientFirstName').value.trim();
    const lastName = document.getElementById('clientLastName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const dob = document.getElementById('clientDob').value;
    const notes = document.getElementById('clientNotes').value.trim();

    if (!firstName || !lastName) {
        alert('Please enter first and last name');
        return;
    }

    if (id) {
        const index = DB.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            DB.clients[index] = { id, firstName, lastName, phone, email, dob, notes };
        }
    } else {
        DB.clients.push({ id: generateId(), firstName, lastName, phone, email, dob, notes });
    }

    saveData('clients');
    closeModal('clientModal');
    refreshCurrentPage();
}

function deleteClient() {
    const id = document.getElementById('clientId').value;
    if (confirm('Are you sure you want to delete this client?')) {
        DB.clients = DB.clients.filter(c => c.id !== id);
        saveData('clients');
        closeModal('clientModal');
        refreshCurrentPage();
    }
}

// ============================================
// STAFF
// ============================================

function refreshStaff() {
    const container = document.getElementById('staffList');
    
    if (DB.staff.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <div class="empty-state-title">No staff members yet</div>
                <p>Add your team members to manage appointments</p>
            </div>
        `;
    } else {
        container.innerHTML = DB.staff.map(s => `
            <div class="list-item" onclick="editStaff('${s.id}')">
                <div class="list-item-avatar" style="background: ${s.color};">${getInitials(s.firstName, s.lastName)}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${s.firstName} ${s.lastName}</div>
                    <div class="list-item-subtitle">${s.role || 'Staff Member'}${s.phone ? ' • ' + s.phone : ''}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); editStaff('${s.id}')">✏️</button>
                </div>
            </div>
        `).join('');
    }
}

function openStaffModal(id = null) {
    if (id) {
        const staff = DB.staff.find(s => s.id === id);
        if (staff) {
            document.getElementById('staffId').value = staff.id;
            document.getElementById('staffFirstName').value = staff.firstName;
            document.getElementById('staffLastName').value = staff.lastName;
            document.getElementById('staffPhone').value = staff.phone || '';
            document.getElementById('staffEmail').value = staff.email || '';
            document.getElementById('staffRole').value = staff.role || '';
            document.getElementById('staffColor').value = staff.color || '#ec4899';
            document.getElementById('staffModalTitle').textContent = 'Edit Staff Member';
            document.getElementById('deleteStaffBtn').style.display = 'inline-flex';
        }
    } else {
        document.getElementById('staffId').value = '';
        document.getElementById('staffFirstName').value = '';
        document.getElementById('staffLastName').value = '';
        document.getElementById('staffPhone').value = '';
        document.getElementById('staffEmail').value = '';
        document.getElementById('staffRole').value = '';
        document.getElementById('staffColor').value = '#ec4899';
        document.getElementById('staffModalTitle').textContent = 'New Staff Member';
        document.getElementById('deleteStaffBtn').style.display = 'none';
    }

    showModal('staffModal');
}

function editStaff(id) {
    openStaffModal(id);
}

function saveStaff() {
    const id = document.getElementById('staffId').value;
    const firstName = document.getElementById('staffFirstName').value.trim();
    const lastName = document.getElementById('staffLastName').value.trim();
    const phone = document.getElementById('staffPhone').value.trim();
    const email = document.getElementById('staffEmail').value.trim();
    const role = document.getElementById('staffRole').value.trim();
    const color = document.getElementById('staffColor').value;

    if (!firstName || !lastName) {
        alert('Please enter first and last name');
        return;
    }

    if (id) {
        const index = DB.staff.findIndex(s => s.id === id);
        if (index !== -1) {
            DB.staff[index] = { id, firstName, lastName, phone, email, role, color };
        }
    } else {
        DB.staff.push({ id: generateId(), firstName, lastName, phone, email, role, color });
    }

    saveData('staff');
    closeModal('staffModal');
    refreshCurrentPage();
}

function deleteStaff() {
    const id = document.getElementById('staffId').value;
    if (confirm('Are you sure you want to delete this staff member?')) {
        DB.staff = DB.staff.filter(s => s.id !== id);
        saveData('staff');
        closeModal('staffModal');
        refreshCurrentPage();
    }
}

// ============================================
// SERVICES
// ============================================

function refreshServices() {
    const container = document.getElementById('servicesList');
    
    if (DB.services.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✂️</div>
                <div class="empty-state-title">No services yet</div>
                <p>Add your salon services with prices</p>
            </div>
        `;
    } else {
        container.innerHTML = DB.services.map(s => `
            <div class="list-item" onclick="editService('${s.id}')">
                <div class="list-item-avatar" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">✂️</div>
                <div class="list-item-content">
                    <div class="list-item-title">${s.name}</div>
                    <div class="list-item-subtitle">${s.duration} min • ${formatCurrency(s.price)}${s.category ? ' • ' + s.category : ''}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); editService('${s.id}')">✏️</button>
                </div>
            </div>
        `).join('');
    }
}

function openServiceModal(id = null) {
    if (id) {
        const service = DB.services.find(s => s.id === id);
        if (service) {
            document.getElementById('serviceId').value = service.id;
            document.getElementById('serviceName').value = service.name;
            document.getElementById('serviceDescription').value = service.description || '';
            document.getElementById('serviceDuration').value = service.duration;
            document.getElementById('servicePrice').value = service.price;
            document.getElementById('serviceCategory').value = service.category || '';
            document.getElementById('serviceModalTitle').textContent = 'Edit Service';
            document.getElementById('deleteServiceBtn').style.display = 'inline-flex';
        }
    } else {
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceName').value = '';
        document.getElementById('serviceDescription').value = '';
        document.getElementById('serviceDuration').value = 60;
        document.getElementById('servicePrice').value = '';
        document.getElementById('serviceCategory').value = '';
        document.getElementById('serviceModalTitle').textContent = 'New Service';
        document.getElementById('deleteServiceBtn').style.display = 'none';
    }

    showModal('serviceModal');
}

function editService(id) {
    openServiceModal(id);
}

function saveService() {
    const id = document.getElementById('serviceId').value;
    const name = document.getElementById('serviceName').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const duration = parseInt(document.getElementById('serviceDuration').value) || 60;
    const price = parseFloat(document.getElementById('servicePrice').value) || 0;
    const category = document.getElementById('serviceCategory').value.trim();

    if (!name || price < 0) {
        alert('Please enter service name and price');
        return;
    }

    if (id) {
        const index = DB.services.findIndex(s => s.id === id);
        if (index !== -1) {
            DB.services[index] = { id, name, description, duration, price, category };
        }
    } else {
        DB.services.push({ id: generateId(), name, description, duration, price, category });
    }

    saveData('services');
    closeModal('serviceModal');
    refreshCurrentPage();
}

function deleteService() {
    const id = document.getElementById('serviceId').value;
    if (confirm('Are you sure you want to delete this service?')) {
        DB.services = DB.services.filter(s => s.id !== id);
        saveData('services');
        closeModal('serviceModal');
        refreshCurrentPage();
    }
}

// ============================================
// PRODUCTS
// ============================================

function refreshProducts() {
    const container = document.getElementById('productsList');
    
    if (DB.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧴</div>
                <div class="empty-state-title">No products yet</div>
                <p>Add products you sell to clients</p>
            </div>
        `;
    } else {
        container.innerHTML = DB.products.map(p => `
            <div class="list-item" onclick="editProduct('${p.id}')">
                <div class="list-item-avatar" style="background: linear-gradient(135deg, #22c55e, #3b82f6);">🧴</div>
                <div class="list-item-content">
                    <div class="list-item-title">${p.name}</div>
                    <div class="list-item-subtitle">${formatCurrency(p.price)}${p.category ? ' • ' + p.category : ''} • Stock: ${p.stock || 0}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); editProduct('${p.id}')">✏️</button>
                </div>
            </div>
        `).join('');
    }
}

function openProductModal(id = null) {
    if (id) {
        const product = DB.products.find(p => p.id === id);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock || 0;
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('deleteProductBtn').style.display = 'inline-flex';
        }
    } else {
        document.getElementById('productId').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productStock').value = 0;
        document.getElementById('productCategory').value = '';
        document.getElementById('productModalTitle').textContent = 'New Product';
        document.getElementById('deleteProductBtn').style.display = 'none';
    }

    showModal('productModal');
}

function editProduct(id) {
    openProductModal(id);
}

function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    const category = document.getElementById('productCategory').value.trim();

    if (!name || price < 0) {
        alert('Please enter product name and price');
        return;
    }

    if (id) {
        const index = DB.products.findIndex(p => p.id === id);
        if (index !== -1) {
            DB.products[index] = { id, name, description, price, stock, category };
        }
    } else {
        DB.products.push({ id: generateId(), name, description, price, stock, category });
    }

    saveData('products');
    closeModal('productModal');
    refreshCurrentPage();
}

function deleteProduct() {
    const id = document.getElementById('productId').value;
    if (confirm('Are you sure you want to delete this product?')) {
        DB.products = DB.products.filter(p => p.id !== id);
        saveData('products');
        closeModal('productModal');
        refreshCurrentPage();
    }
}

// ============================================
// STATISTICS
// ============================================

function setStatsPeriod(period) {
    statsPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    refreshStats();
}

function refreshStats() {
    const now = new Date();
    let startDate, endDate;

    switch(statsPeriod) {
        case 'day':
            startDate = endDate = getToday();
            break;
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startDate = startOfWeek.toISOString().split('T')[0];
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endDate = endOfWeek.toISOString().split('T')[0];
            break;
        case 'month':
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
            break;
        case 'year':
            startDate = `${now.getFullYear()}-01-01`;
            endDate = `${now.getFullYear()}-12-31`;
            break;
    }

    const appointments = DB.appointments.filter(a => a.date >= startDate && a.date <= endDate);
    const sales = DB.sales.filter(s => s.date >= startDate && s.date <= endDate);
    
    // Services Revenue (from completed/paid appointments)
    const servicesRevenue = appointments
        .filter(a => a.status === 'completed' || a.status === 'paid')
        .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    
    // Products Revenue (from sales)
    const productsRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    
    const subtotal = servicesRevenue + productsRevenue;
    const tax = subtotal * 0.22;
    const netRevenue = subtotal - tax;

    document.getElementById('statsServicesRevenue').textContent = formatCurrency(servicesRevenue);
    document.getElementById('statsProductsRevenue').textContent = formatCurrency(productsRevenue);
    document.getElementById('statsSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('statsTax').textContent = formatCurrency(tax);
    document.getElementById('statsTotal').innerHTML = `<strong>${formatCurrency(netRevenue)}</strong>`;

    document.getElementById('statsTotalAppointments').textContent = appointments.length;
    document.getElementById('statsCompleted').textContent = appointments.filter(a => a.status === 'completed' || a.status === 'paid').length;
    document.getElementById('statsCancelled').textContent = appointments.filter(a => a.status === 'cancelled').length;
    document.getElementById('statsNoShow').textContent = appointments.filter(a => a.status === 'noshow').length;

    // Top services
    const serviceCounts = {};
    appointments.filter(a => a.status === 'completed' || a.status === 'paid').forEach(a => {
        serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1;
    });
    
    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topServicesContainer = document.getElementById('topServices');
    if (topServices.length === 0) {
        topServicesContainer.innerHTML = '<div class="empty-state" style="padding: 1rem;"><p>No completed appointments</p></div>';
    } else {
        topServicesContainer.innerHTML = topServices.map(([id, count]) => {
            const service = DB.services.find(s => s.id === id);
            return `
                <div class="stats-row">
                    <span class="stats-label">${service ? service.name : 'Unknown'}</span>
                    <span class="stats-value">${count} bookings</span>
                </div>
            `;
        }).join('');
    }

    // Top products
    const productCounts = {};
    const productRevenue = {};
    sales.forEach(s => {
        productCounts[s.productId] = (productCounts[s.productId] || 0) + s.quantity;
        productRevenue[s.productId] = (productRevenue[s.productId] || 0) + parseFloat(s.total || 0);
    });
    
    const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topProductsContainer = document.getElementById('topProducts');
    if (topProducts.length === 0) {
        topProductsContainer.innerHTML = '<div class="empty-state" style="padding: 1rem;"><p>No product sales</p></div>';
    } else {
        topProductsContainer.innerHTML = topProducts.map(([id, count]) => {
            const product = DB.products.find(p => p.id === id);
            const revenue = productRevenue[id] || 0;
            return `
                <div class="stats-row">
                    <span class="stats-label">${product ? product.name : 'Unknown'} (${count} sold)</span>
                    <span class="stats-value">${formatCurrency(revenue)}</span>
                </div>
            `;
        }).join('');
    }
}

// ============================================
// SALES
// ============================================

function refreshSales() {
    const container = document.getElementById('salesList');
    const search = document.getElementById('salesSearch')?.value.toLowerCase() || '';
    
    // Update quick sale product dropdown - show all products with stock status
    const quickSelect = document.getElementById('quickSaleProduct');
    if (quickSelect) {
        quickSelect.innerHTML = '<option value="">Select Product</option>';
        DB.products.forEach(p => {
            const stockInfo = p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK';
            const disabled = p.stock <= 0 ? 'disabled' : '';
            quickSelect.innerHTML += `<option value="${p.id}" ${disabled}>${p.name} (${stockInfo}) - ${formatCurrency(p.price)}</option>`;
        });
    }

    // Update product inventory list on sales page
    const productListContainer = document.getElementById('salesProductList');
    if (productListContainer) {
        if (DB.products.length === 0) {
            productListContainer.innerHTML = `
                <div class="empty-state" style="padding: 1rem;">
                    <p>No products in inventory. <a href="#" onclick="showPage('products'); return false;">Add products</a> to start selling.</p>
                </div>
            `;
        } else {
            productListContainer.innerHTML = DB.products
                .sort((a, b) => (b.stock || 0) - (a.stock || 0))
                .map(p => {
                    const stockClass = (p.stock || 0) === 0 ? 'color: var(--danger);' : 
                                      (p.stock || 0) < 5 ? 'color: var(--warning);' : 'color: var(--success);';
                    const stockStatus = (p.stock || 0) === 0 ? 'Out of Stock' : 
                                       (p.stock || 0) < 5 ? 'Low Stock' : 'In Stock';
                    return `
                        <div class="stats-row" style="cursor: pointer;" onclick="quickSelectProduct('${p.id}')">
                            <span class="stats-label">${p.name}</span>
                            <span class="stats-value" style="${stockClass}">${p.stock || 0} ${stockStatus}</span>
                        </div>
                    `;
                }).join('');
        }
    }

    // Update today's stats
    const today = getToday();
    const todaySales = DB.sales.filter(s => s.date === today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    
    document.getElementById('todaySalesCount').textContent = todaySales.length;
    document.getElementById('todaySalesRevenue').textContent = formatCurrency(todayRevenue);

    // Filter and display sales
    let sales = [...DB.sales].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (search) {
        sales = sales.filter(s => {
            const product = DB.products.find(p => p.id === s.productId);
            const client = s.clientId ? DB.clients.find(c => c.id === s.clientId) : null;
            return (product && product.name.toLowerCase().includes(search)) ||
                   (client && `${client.firstName} ${client.lastName}`.toLowerCase().includes(search));
        });
    }

    if (sales.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <div class="empty-state-title">${search ? 'No sales found' : 'No sales yet'}</div>
                <p>${search ? 'Try a different search' : 'Start selling products to your clients'}</p>
            </div>
        `;
    } else {
        container.innerHTML = sales.map(s => {
            const product = DB.products.find(p => p.id === s.productId);
            const client = s.clientId ? DB.clients.find(c => c.id === s.clientId) : null;
            
            return `
                <div class="list-item" onclick="editSale('${s.id}')">
                    <div class="list-item-avatar" style="background: linear-gradient(135deg, #22c55e, #3b82f6);">🛒</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${product ? product.name : 'Unknown Product'}</div>
                        <div class="list-item-subtitle">${formatDate(s.date)} • Qty: ${s.quantity} × ${formatCurrency(s.unitPrice)}</div>
                        ${client ? `<div class="list-item-subtitle">Client: ${client.firstName} ${client.lastName}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--success);">${formatCurrency(s.total)}</div>
                        <button class="icon-btn" onclick="event.stopPropagation(); editSale('${s.id}')">✏️</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function filterSales() {
    refreshSales();
}

function quickSelectProduct(productId) {
    const product = DB.products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        alert('This product is out of stock!');
        return;
    }
    
    document.getElementById('quickSaleProduct').value = productId;
    document.getElementById('quickSaleQty').value = 1;
    document.getElementById('quickSaleQty').focus();
}

function quickSellProduct() {
    const productId = document.getElementById('quickSaleProduct').value;
    const quantity = parseInt(document.getElementById('quickSaleQty').value) || 1;
    
    if (!productId) {
        alert('Please select a product');
        return;
    }

    const product = DB.products.find(p => p.id === productId);
    if (!product) return;

    if ((product.stock || 0) < quantity) {
        alert(`Not enough stock. Available: ${product.stock || 0}`);
        return;
    }

    // Create sale
    const sale = {
        id: generateId(),
        clientId: '',
        productId: productId,
        quantity: quantity,
        unitPrice: product.price,
        total: product.price * quantity,
        date: getToday(),
        notes: 'Quick sale',
        createdAt: new Date().toISOString()
    };

    // Update stock
    product.stock = (product.stock || 0) - quantity;
    
    DB.sales.push(sale);
    saveData('products', 'sales');
    refreshSales();
    
    // Reset quick sale form
    document.getElementById('quickSaleProduct').value = '';
    document.getElementById('quickSaleQty').value = '1';
    
    alert(`Sale completed! ${product.name} x${quantity} = ${formatCurrency(sale.total)}`);
}

function openSaleModal(id = null) {
    const sale = id ? DB.sales.find(s => s.id === id) : null;
    
    // Populate client dropdown
    const clientSelect = document.getElementById('saleClient');
    clientSelect.innerHTML = '<option value="">Walk-in Customer</option>';
    DB.clients.forEach(c => {
        clientSelect.innerHTML += `<option value="${c.id}">${c.firstName} ${c.lastName}</option>`;
    });

    // Populate product dropdown - show all products with their stock
    const productSelect = document.getElementById('saleProduct');
    productSelect.innerHTML = '<option value="">Select Product</option>';
    
    DB.products.forEach(p => {
        const stockInfo = p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK';
        const disabled = p.stock <= 0 && (!sale || sale.productId !== p.id) ? 'disabled' : '';
        productSelect.innerHTML += `<option value="${p.id}" ${disabled}>${p.name} (${stockInfo}) - ${formatCurrency(p.price)}</option>`;
    });

    if (sale) {
        document.getElementById('saleId').value = sale.id;
        document.getElementById('saleClient').value = sale.clientId || '';
        document.getElementById('saleProduct').value = sale.productId;
        document.getElementById('saleQuantity').value = sale.quantity;
        document.getElementById('saleUnitPrice').value = sale.unitPrice;
        document.getElementById('saleTotal').value = sale.total;
        document.getElementById('saleDate').value = sale.date;
        document.getElementById('saleNotes').value = sale.notes || '';
        document.getElementById('saleModalTitle').textContent = 'Edit Sale';
        document.getElementById('deleteSaleBtn').style.display = 'inline-flex';
    } else {
        document.getElementById('saleId').value = '';
        document.getElementById('saleClient').value = '';
        document.getElementById('saleProduct').value = '';
        document.getElementById('saleQuantity').value = 1;
        document.getElementById('saleUnitPrice').value = '';
        document.getElementById('saleTotal').value = '';
        document.getElementById('saleDate').value = getToday();
        document.getElementById('saleNotes').value = '';
        document.getElementById('saleModalTitle').textContent = 'New Sale';
        document.getElementById('deleteSaleBtn').style.display = 'none';
    }

    showModal('saleModal');
}

function editSale(id) {
    openSaleModal(id);
}

function updateSalePrice() {
    const productId = document.getElementById('saleProduct').value;
    if (productId) {
        const product = DB.products.find(p => p.id === productId);
        if (product) {
            document.getElementById('saleUnitPrice').value = product.price;
            updateSaleTotal();
        }
    }
}

function updateSaleTotal() {
    const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
    document.getElementById('saleTotal').value = (unitPrice * quantity).toFixed(2);
}

function saveSale() {
    const id = document.getElementById('saleId').value;
    const clientId = document.getElementById('saleClient').value;
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    const total = parseFloat(document.getElementById('saleTotal').value) || 0;
    const date = document.getElementById('saleDate').value;
    const notes = document.getElementById('saleNotes').value.trim();

    if (!productId || !date) {
        alert('Please select a product and date');
        return;
    }

    const product = DB.products.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }

    if (id) {
        // Editing existing sale - restore old stock first
        const oldSale = DB.sales.find(s => s.id === id);
        if (oldSale) {
            const oldProduct = DB.products.find(p => p.id === oldSale.productId);
            if (oldProduct) {
                oldProduct.stock = (oldProduct.stock || 0) + oldSale.quantity;
            }
        }

        if ((product.stock || 0) < quantity && product.id === oldSale?.productId) {
            // Restore original stock
            if (oldProduct) oldProduct.stock -= oldSale.quantity;
            alert(`Not enough stock. Available: ${product.stock || 0}`);
            return;
        }

        // Update sale
        const index = DB.sales.findIndex(s => s.id === id);
        if (index !== -1) {
            DB.sales[index] = { ...DB.sales[index], clientId, productId, quantity, unitPrice, total, date, notes };
        }
    } else {
        // New sale
        if ((product.stock || 0) < quantity) {
            alert(`Not enough stock. Available: ${product.stock || 0}`);
            return;
        }

        DB.sales.push({
            id: generateId(),
            clientId,
            productId,
            quantity,
            unitPrice,
            total,
            date,
            notes,
            createdAt: new Date().toISOString()
        });
    }

    // Update stock
    product.stock = (product.stock || 0) - quantity;

    saveData('products', 'sales');
    closeModal('saleModal');
    refreshCurrentPage();
}

function deleteSale() {
    const id = document.getElementById('saleId').value;
    if (confirm('Are you sure you want to delete this sale? The stock will be restored.')) {
        const sale = DB.sales.find(s => s.id === id);
        if (sale) {
            const product = DB.products.find(p => p.id === sale.productId);
            if (product) {
                product.stock = (product.stock || 0) + sale.quantity;
            }
        }
        DB.sales = DB.sales.filter(s => s.id !== id);
        saveData('products', 'sales');
        closeModal('saleModal');
        refreshCurrentPage();
    }
}

// ============================================
// SETTINGS
// ============================================

function refreshSettings() {
    document.getElementById('settingSalonName').value = DB.settings.salonName;
    document.getElementById('settingIvaCode').value = DB.settings.ivaCode;
    document.getElementById('settingAddress').value = DB.settings.address;
    document.getElementById('settingPhone').value = DB.settings.phone;
    document.getElementById('settingEmail').value = DB.settings.email;
    document.getElementById('settingWebsite').value = DB.settings.website;
}

function saveSettings() {
    DB.settings.salonName = document.getElementById('settingSalonName').value.trim() || 'Beauty Salon';
    DB.settings.ivaCode = document.getElementById('settingIvaCode').value.trim();
    DB.settings.address = document.getElementById('settingAddress').value.trim();
    DB.settings.phone = document.getElementById('settingPhone').value.trim();
    DB.settings.email = document.getElementById('settingEmail').value.trim();
    DB.settings.website = document.getElementById('settingWebsite').value.trim();

    saveData('settings');
    updateHeaderInfo();
    alert('Settings saved successfully!');
}

function updateHeaderInfo() {
    document.getElementById('headerSalonName').textContent = DB.settings.salonName;
    document.getElementById('navSalonName').textContent = DB.settings.salonName;
    document.title = DB.settings.salonName;
}

// ============================================
// DATA IMPORT/EXPORT
// ============================================

function exportData() {
    const dataStr = JSON.stringify(DB, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beauty-salon-backup-${getToday()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('This will replace all current data. Are you sure?')) {
                Object.assign(DB, data);
                saveData();
                updateHeaderInfo();
                refreshCurrentPage();
                alert('Data imported successfully!');
            }
        } catch (err) {
            alert('Error importing data: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// ============================================
// MODAL UTILITIES
// ============================================

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showAddModal() {
    showModal('addModal');
}

function refreshCurrentPage() {
    refreshPage(currentPage);
}

// ============================================
// PWA INSTALLATION
// ============================================

let deferredPrompt = null;

function showInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner && deferredPrompt) {
        banner.classList.add('show');
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choice => {
            if (choice.outcome === 'accepted') {
                document.getElementById('installBanner').classList.remove('show');
            }
            deferredPrompt = null;
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    initSampleData();
    saveData();
    updateHeaderInfo();
    refreshDashboard();

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(showInstallBanner, 2000);
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });
});
