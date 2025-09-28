// File: js/reports.js
import * as state from './state.js';
import * as render from './render.js';

let turnaroundChart = null;

function calculateReportData() {
    const driverFilter = document.getElementById('report-driver-filter').value;
    const startDateFilter = document.getElementById('report-start-date').value;
    const endDateFilter = document.getElementById('report-end-date').value;

    let filteredContainers = state.containers.filter(c => c.deliveredAtYardTimestamp && c.collectedAtTimestamp);

    if (driverFilter !== 'all') {
        filteredContainers = filteredContainers.filter(c => c.driver === driverFilter);
    }
    if (startDateFilter) {
        filteredContainers = filteredContainers.filter(c => new Date(c.deliveredAtYardTimestamp) >= new Date(startDateFilter));
    }
     if (endDateFilter) {
        filteredContainers = filteredContainers.filter(c => new Date(c.deliveredAtYardTimestamp) <= new Date(endDateFilter));
    }

    // Calculate Turnaround Times
    const turnaroundTimes = filteredContainers.map(c => {
        const collected = new Date(c.collectedAtTimestamp);
        const delivered = new Date(c.deliveredAtYardTimestamp);
        const diffHours = (delivered - collected) / (1000 * 60 * 60);
        return { serial: c.serial, hours: diffHours.toFixed(2) };
    });

    // Calculate Driver Performance
    const driverPerformance = state.drivers.map(driver => {
        const driverContainers = filteredContainers.filter(c => c.driver === driver.name);
        const totalDeliveries = driverContainers.length;
        if (totalDeliveries === 0) {
            return { name: driver.name, deliveries: 0, avgHours: 0 };
        }
        const totalHours = driverContainers.reduce((sum, c) => {
            const collected = new Date(c.collectedAtTimestamp);
            const delivered = new Date(c.deliveredAtYardTimestamp);
            return sum + (delivered - collected);
        }, 0);
        const avgHours = (totalHours / totalDeliveries) / (1000 * 60 * 60);
        return { name: driver.name, deliveries: totalDeliveries, avgHours: avgHours.toFixed(2) };
    });

    return { turnaroundTimes, driverPerformance };
}

export function updateReports() {
    const { turnaroundTimes, driverPerformance } = calculateReportData();
    renderDriverPerformanceTable(driverPerformance);
    renderTurnaroundChart(turnaroundTimes);
}

function renderDriverPerformanceTable(performanceData) {
    const tbody = document.getElementById('driver-performance-body');
    tbody.innerHTML = '';
    performanceData.sort((a,b) => b.deliveries - a.deliveries).forEach(driver => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b';
        row.innerHTML = `
            <td class="px-6 py-4 font-semibold">${driver.name}</td>
            <td class="px-6 py-4 text-center">${driver.deliveries}</td>
            <td class="px-6 py-4 text-center">${driver.avgHours}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderTurnaroundChart(turnaroundData) {
    const ctx = document.getElementById('turnaround-chart').getContext('2d');
    const labels = turnaroundData.map(d => d.serial);
    const data = turnaroundData.map(d => d.hours);

    if (turnaroundChart) {
        turnaroundChart.destroy();
    }

    turnaroundChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Turnaround Time (Hours)',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

export function populateDriverFilter() {
    const filter = document.getElementById('report-driver-filter');
    if (!filter) return;
    
    // Clear existing options except for "All Drivers"
    while (filter.options.length > 1) {
        filter.remove(1);
    }

    state.drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.name;
        option.textContent = driver.name;
        filter.appendChild(option);
    });
}

