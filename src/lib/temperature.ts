// 2026 Predicted Daytime & Nighttime Temperature Averages by State (°C)
// Source: NiMet 2026 Seasonal Climate Prediction

export type TempRow = {
  jan: number; feb: number; mar: number; apr: number; may: number; avg: number;
};

export type StateTempData = {
  day: TempRow;
  night: TempRow;
};

const TEMP_DATA: Record<string, StateTempData> = {
  "abia":         { day: { jan:32.8, feb:33.6, mar:33.3, apr:32.6, may:31.9, avg:32.84 }, night: { jan:21.6, feb:23.1, mar:24.0, apr:24.5, may:24.4, avg:23.52 } },
  "adamawa":      { day: { jan:34.7, feb:37.2, mar:39.1, apr:38.1, may:35.4, avg:36.9  }, night: { jan:17.0, feb:19.5, mar:22.9, apr:25.5, may:24.9, avg:21.96 } },
  "akwa-ibom":    { day: { jan:32.0, feb:32.7, mar:32.2, apr:31.7, may:31.2, avg:31.96 }, night: { jan:23.0, feb:24.2, mar:24.7, apr:25.1, may:24.9, avg:24.38 } },
  "akwa ibom":    { day: { jan:32.0, feb:32.7, mar:32.2, apr:31.7, may:31.2, avg:31.96 }, night: { jan:23.0, feb:24.2, mar:24.7, apr:25.1, may:24.9, avg:24.38 } },
  "anambra":      { day: { jan:32.4, feb:33.4, mar:33.3, apr:32.5, may:31.7, avg:32.66 }, night: { jan:21.2, feb:23.1, mar:24.1, apr:24.6, may:24.4, avg:23.48 } },
  "bauchi":       { day: { jan:32.5, feb:34.8, mar:37.5, apr:39.4, may:37.0, avg:36.24 }, night: { jan:15.4, feb:17.9, mar:21.2, apr:24.5, may:24.6, avg:20.72 } },
  "bayelsa":      { day: { jan:31.1, feb:31.4, mar:31.1, apr:31.6, may:31.1, avg:31.26 }, night: { jan:23.6, feb:24.8, mar:25.1, apr:25.7, may:25.5, avg:24.94 } },
  "benue":        { day: { jan:32.4, feb:34.0, mar:34.3, apr:34.1, may:32.6, avg:33.48 }, night: { jan:18.9, feb:21.6, mar:24.0, apr:24.8, may:24.4, avg:22.74 } },
  "borno":        { day: { jan:33.5, feb:36.1, mar:39.6, apr:42.4, may:41.2, avg:38.56 }, night: { jan:15.4, feb:17.9, mar:21.9, apr:26.5, may:27.9, avg:21.92 } },
  "cross-river":  { day: { jan:32.8, feb:33.9, mar:33.5, apr:32.6, may:31.8, avg:32.92 }, night: { jan:21.0, feb:22.7, mar:24.0, apr:24.2, may:24.0, avg:23.18 } },
  "cross river":  { day: { jan:32.8, feb:33.9, mar:33.5, apr:32.6, may:31.8, avg:32.92 }, night: { jan:21.0, feb:22.7, mar:24.0, apr:24.2, may:24.0, avg:23.18 } },
  "delta":        { day: { jan:32.2, feb:32.7, mar:32.5, apr:32.0, may:31.3, avg:32.14 }, night: { jan:22.9, feb:24.3, mar:24.9, apr:25.1, may:24.9, avg:24.42 } },
  "ebonyi":       { day: { jan:30.7, feb:31.5, mar:31.4, apr:31.4, may:30.6, avg:31.12 }, night: { jan:19.9, feb:22.0, mar:23.6, apr:24.7, may:24.5, avg:22.94 } },
  "edo":          { day: { jan:31.9, feb:32.6, mar:32.4, apr:31.8, may:30.9, avg:31.92 }, night: { jan:21.3, feb:23.0, mar:24.0, apr:24.5, may:24.3, avg:23.42 } },
  "ekiti":        { day: { jan:32.7, feb:33.9, mar:33.5, apr:32.4, may:30.9, avg:32.68 }, night: { jan:19.6, feb:21.7, mar:23.0, apr:23.6, may:23.2, avg:22.22 } },
  "enugu":        { day: { jan:31.6, feb:32.4, mar:32.4, apr:31.9, may:31.0, avg:31.86 }, night: { jan:20.2, feb:22.3, mar:23.7, apr:24.4, may:24.1, avg:22.94 } },
  "fct":          { day: { jan:33.8, feb:35.1, mar:35.4, apr:33.8, may:31.7, avg:33.96 }, night: { jan:18.6, feb:21.1, mar:23.4, apr:24.5, may:23.9, avg:22.30 } },
  "federal capital territory": { day: { jan:33.8, feb:35.1, mar:35.4, apr:33.8, may:31.7, avg:33.96 }, night: { jan:18.6, feb:21.1, mar:23.4, apr:24.5, may:23.9, avg:22.30 } },
  "abuja":        { day: { jan:33.8, feb:35.1, mar:35.4, apr:33.8, may:31.7, avg:33.96 }, night: { jan:18.6, feb:21.1, mar:23.4, apr:24.5, may:23.9, avg:22.30 } },
  "gombe":        { day: { jan:33.8, feb:36.1, mar:38.3, apr:38.0, may:35.1, avg:36.26 }, night: { jan:16.6, feb:19.4, mar:22.8, apr:25.4, may:24.9, avg:21.82 } },
  "imo":          { day: { jan:31.4, feb:32.0, mar:31.7, apr:31.5, may:31.0, avg:31.52 }, night: { jan:21.4, feb:23.1, mar:24.0, apr:24.5, may:24.4, avg:23.48 } },
  "jigawa":       { day: { jan:31.7, feb:34.4, mar:37.8, apr:40.2, may:38.5, avg:36.52 }, night: { jan:14.5, feb:17.1, mar:20.8, apr:25.1, may:25.8, avg:20.66 } },
  "kaduna":       { day: { jan:32.1, feb:34.4, mar:36.3, apr:36.0, may:33.0, avg:34.36 }, night: { jan:15.4, feb:18.0, mar:20.7, apr:23.1, may:22.6, avg:19.96 } },
  "kano":         { day: { jan:31.2, feb:34.0, mar:37.3, apr:39.7, may:37.9, avg:36.02 }, night: { jan:13.9, feb:16.4, mar:20.1, apr:24.4, may:25.3, avg:20.02 } },
  "katsina":      { day: { jan:31.1, feb:33.8, mar:37.0, apr:39.0, may:37.3, avg:35.64 }, night: { jan:14.3, feb:16.9, mar:20.4, apr:24.4, may:25.1, avg:20.22 } },
  "kebbi":        { day: { jan:34.8, feb:37.2, mar:39.3, apr:39.6, may:36.6, avg:37.50 }, night: { jan:16.9, feb:19.7, mar:23.2, apr:26.7, may:26.1, avg:22.52 } },
  "kogi":         { day: { jan:33.6, feb:34.8, mar:34.9, apr:33.7, may:32.1, avg:33.82 }, night: { jan:20.1, feb:22.7, mar:24.4, apr:24.8, may:24.3, avg:23.26 } },
  "kwara":        { day: { jan:34.0, feb:35.3, mar:35.3, apr:34.0, may:32.1, avg:34.14 }, night: { jan:19.6, feb:22.1, mar:23.5, apr:24.2, may:23.7, avg:22.62 } },
  "lagos":        { day: { jan:31.7, feb:31.9, mar:31.8, apr:31.2, may:30.6, avg:31.44 }, night: { jan:24.6, feb:25.6, mar:26.1, apr:26.1, may:25.8, avg:25.64 } },
  "nasarawa":     { day: { jan:34.0, feb:35.8, mar:36.2, apr:34.5, may:32.3, avg:34.56 }, night: { jan:19.1, feb:21.9, mar:24.2, apr:25.2, may:24.5, avg:22.98 } },
  "niger":        { day: { jan:33.4, feb:34.9, mar:35.9, apr:35.4, may:33.2, avg:34.56 }, night: { jan:20.2, feb:22.5, mar:24.8, apr:26.3, may:25.6, avg:23.88 } },
  "ogun":         { day: { jan:32.6, feb:33.2, mar:32.7, apr:31.9, may:31.0, avg:32.28 }, night: { jan:23.1, feb:24.5, mar:25.0, apr:25.2, may:24.9, avg:24.54 } },
  "ondo":         { day: { jan:31.9, feb:32.7, mar:32.2, apr:31.3, may:30.5, avg:31.72 }, night: { jan:21.1, feb:22.8, mar:23.8, apr:24.1, may:23.8, avg:23.12 } },
  "osun":         { day: { jan:32.2, feb:33.1, mar:32.6, apr:31.5, may:30.4, avg:31.96 }, night: { jan:20.0, feb:22.1, mar:23.2, apr:23.7, may:23.4, avg:22.48 } },
  "oyo":          { day: { jan:33.5, feb:34.4, mar:34.0, apr:32.4, may:31.3, avg:33.12 }, night: { jan:21.3, feb:22.9, mar:23.7, apr:23.7, may:23.4, avg:23.00 } },
  "plateau":      { day: { jan:33.5, feb:35.1, mar:35.8, apr:33.9, may:31.2, avg:33.90 }, night: { jan:17.5, feb:19.8, mar:22.1, apr:23.4, may:22.9, avg:21.14 } },
  "rivers":       { day: { jan:31.1, feb:31.4, mar:31.0, apr:30.8, may:30.3, avg:30.92 }, night: { jan:23.1, feb:24.3, mar:24.9, apr:25.3, may:25.2, avg:24.56 } },
  "sokoto":       { day: { jan:33.6, feb:36.2, mar:39.3, apr:41.2, may:39.0, avg:37.86 }, night: { jan:16.6, feb:19.2, mar:22.5, apr:26.8, may:27.4, avg:22.50 } },
  "taraba":       { day: { jan:33.6, feb:35.5, mar:36.1, apr:34.0, may:31.2, avg:34.08 }, night: { jan:18.5, feb:20.8, mar:22.9, apr:23.6, may:22.8, avg:21.72 } },
  "yobe":         { day: { jan:32.4, feb:35.1, mar:38.7, apr:41.1, may:39.7, avg:37.40 }, night: { jan:15.0, feb:17.6, mar:21.4, apr:25.4, may:26.5, avg:21.18 } },
  "zamfara":      { day: { jan:33.3, feb:35.9, mar:38.5, apr:39.4, may:36.8, avg:36.78 }, night: { jan:16.1, feb:18.8, mar:22.0, apr:25.6, may:25.6, avg:21.62 } },
};

export function getStateTemp(stateName: string): StateTempData | null {
  return TEMP_DATA[stateName.trim().toLowerCase()] ?? null;
}
