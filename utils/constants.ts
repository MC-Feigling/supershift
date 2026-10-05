export const SHIFT_NAME_MIN_LENGTH = 1
export const SHIFT_NAME_MAX_LENGTH = 40
export const NOTE_MAX_LENGTH = 200
export const MIN_PASSWORD_LENGTH = 8
export const EMAIL_MAX_LENGTH = 254
export const MIN_SUPABASE_KEY_LENGTH = 20
export const SERIES_MAX_DAYS = 731
export const DAYS_PER_WEEK = 7
export const MONTH_GRID_LENGTH = 42
export const MAX_VISIBLE_DAY_CHIPS = 3
export const MS_PER_DAY = 86_400_000

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

export const ROUTES = {
  home: '/',
  signIn: '/anmelden',
  signUp: '/registrieren',
  setup: '/einrichten',
  shifts: '/schichten',
  share: '/teilen',
} as const

export const SESSION_STATE_KEY = 'session-user'
export const SERVICE_WORKER_PATH = '/sw.js'
export const DAY_PANEL_TITLE_ID = 'day-panel-title'
export const SHIFT_QUICK_PICK_TITLE_ID = 'shift-quick-pick-title'
export const LONG_PRESS_MS = 500
export const LONG_PRESS_MOVE_PX = 12

export const TABLES = {
  shiftTypes: 'shift_types',
  placements: 'placements',
  planShares: 'plan_shares',
  pushSubscriptions: 'push_subscriptions',
} as const

export const CONSTRAINTS = {
  shiftName: 'shift_types_owner_name_lower_idx',
  oneShare: 'plan_shares_one_open_idx',
  placementNote: 'placements_note_len',
} as const

export const DB_ERROR = {
  selfShare: 'self_share',
  notOwner: 'not_owner',
  onlyRevoke: 'only_revoke',
  shiftTypeMismatch: 'shift_type_mismatch',
  seriesEnd: 'series_end',
} as const

export const POSTGRES_ERROR = {
  uniqueViolation: '23505',
  undefinedTable: '42P01',
  insufficientPrivilege: '42501',
} as const

export const POSTGREST_ERROR = {
  schemaCache: 'PGRST205',
  jwt: 'PGRST301',
} as const

export const PLACEHOLDER_MARKERS = ['YOUR_PROJECT', 'your-publishable-key', 'replace-with'] as const

export const PUBLIC_PATHS = [ROUTES.signIn, ROUTES.signUp, ROUTES.setup] as const
