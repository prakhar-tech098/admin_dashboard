const BRANCHES = [
    { id: 1, name: "CSE" },
    { id: 2, name: "ECE" },
    { id: 3, name: "ME" },
    { id: 4, name: "CE" }
];

document.getElementById('generateBtn').addEventListener('click', async function () {
    const statusElement = document.getElementById('status');
    const container = document.getElementById('comparison-container');

    statusElement.textContent = 'AI is calculating...';
    container.innerHTML = '';

    const token = localStorage.getItem('accessToken');

    try {
        // 1️⃣ Generate timetable
        const genResponse = await fetch(
            'http://127.0.0.1:8000/admin/timetable/generate',
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            }
        );

        if (!genResponse.ok) {
            const err = await genResponse.json();
            throw new Error(err.detail || 'Generation failed');
        }

        statusElement.textContent = 'Fetching branch timetables...';

        // 2️⃣ Fetch timetable for EACH branch
        for (const branch of BRANCHES) {
            const res = await fetch(
                `http://127.0.0.1:8000/timetable/branch/${branch.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) continue;

            const data = await res.json();
            renderBranchTimetable(branch.name, data);
        }

        statusElement.textContent = 'Analysis Complete: No Conflicts Found';

    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        console.error("Dashboard Error:", error);
    }
});

function renderBranchTimetable(branchName, data) {
    const container = document.getElementById('comparison-container');

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    // Detect max period dynamically
    const maxPeriod = Math.max(...data.map(e => e.period_no));
    const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

    // Build lookup map
    const dataMap = {};
    data.forEach(entry => {
        if (!dataMap[entry.day_of_week]) dataMap[entry.day_of_week] = {};
        dataMap[entry.day_of_week][entry.period_no] = entry;
    });

    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `<h2 class="section-title">Branch: ${branchName}</h2>`;

    let tableHtml = `<table><thead><tr><th class="slot-col">Slot</th>`;
    days.forEach(day => tableHtml += `<th>${day.slice(0, 3)}</th>`);
    tableHtml += `</tr></thead><tbody>`;

    periods.forEach(p => {
        tableHtml += `<tr><td class="slot-col">P${p}</td>`;
        days.forEach(day => {
            const entry = dataMap[day]?.[p];
            tableHtml += entry
                ? `
                <td>
                    <div class="cell-content">
                        <span class="subject">${entry.subject.subject_name}</span>
                        <span class="teacher">${entry.teacher.teacher_name}</span>
                        <span class="room">${entry.room.room_name}</span>
                    </div>
                </td>`
                : `<td class="empty-slot">—</td>`;
        });
        tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    card.innerHTML += tableHtml;
    container.appendChild(card);
}
