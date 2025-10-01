// File: js/logistics.js
import { renderLogisticsKPIs, renderBookingsGrid, renderOpenCollectionsGrid } from './render.js';

export function renderLogisticsPage() {
    renderLogisticsKPIs();
    renderBookingsGrid();
    renderOpenCollectionsGrid();
}
