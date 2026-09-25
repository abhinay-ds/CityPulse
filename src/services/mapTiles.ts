/** OpenStreetMap raster tiles. No commercial API key. */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const PRIMARY_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const PRIMARY_TILE_ATTRIBUTION = OSM_ATTRIBUTION;

/** German OSM mirror used only if the primary tiles fail. */
export const FALLBACK_TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
