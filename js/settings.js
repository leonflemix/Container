// File: js/settings.js
import { renderDriversList, renderChassisList, renderStatusesList, renderCollectionList } from './render.js';
import * as state from './state.js';

export function renderSettingsPage() {
    renderDriversList();
    renderChassisList();
    renderStatusesList();
    renderCollectionList('locations-list', state.locations, 'locations');
    renderCollectionList('container-types-list', state.containerTypes, 'containerTypes');
}
