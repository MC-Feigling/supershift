export const SHIFT_NAME_MIN_LENGTH = 1
export const SHIFT_NAME_MAX_LENGTH = 40
export const NOTE_MAX_LENGTH = 80
export const INVITE_TOKEN_LENGTH = 64
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
  confirm: '/bestaetigen',
  invite: '/einladung',
  setup: '/einrichten',
  shifts: '/schichten',
  share: '/teilen',
  printWeek: '/druck/woche',
  printMonth: '/druck/monat',
} as const

export const INVITE_TOKEN_STORAGE = 'schichtwerk-invite-token'

export const PLAN_QUERY = {
  date: 'datum',
  plan: 'plan',
  owner: 'von',
} as const

export const PLAN_SOURCE = {
  own: 'eigen',
  shared: 'geteilt',
} as const

export const PRINT_VIEW = {
  week: 'woche',
  month: 'monat',
} as const

export const SESSION_STATE_KEY = 'session-user'

export const TABLES = {
  shiftTypes: 'shift_types',
  placements: 'placements',
  planShares: 'plan_shares',
} as const

export const CONSTRAINTS = {
  shiftName: 'shift_types_owner_name_lower_idx',
  oneShare: 'plan_shares_one_open_idx',
} as const

export const DB_ERROR = {
  selfShare: 'self_share',
  notOwner: 'not_owner',
  onlyRevoke: 'only_revoke',
  shiftTypeMismatch: 'shift_type_mismatch',
  seriesEnd: 'series_end',
  inviteInvalid: 'invite_invalid',
  inviteRevoked: 'invite_revoked',
  inviteTaken: 'invite_taken',
  inviteEmail: 'invite_email_mismatch',
  inviteUnconfirmed: 'invite_unconfirmed',
  notAuthenticated: 'not_authenticated',
} as const

export const POSTGRES_ERROR = {
  uniqueViolation: '23505',
  undefinedTable: '42P01',
  undefinedColumn: '42703',
  insufficientPrivilege: '42501',
} as const

export const POSTGREST_ERROR = {
  schemaCache: 'PGRST205',
  functionNotFound: 'PGRST202',
  jwt: 'PGRST301',
} as const

export const PLACEHOLDER_MARKERS = ['YOUR_PROJECT', 'your-publishable-key', 'replace-with'] as const

export const PUBLIC_PATHS = [ROUTES.home, ROUTES.signIn, ROUTES.confirm, ROUTES.setup] as const

export const INVITE_PREVIEW = {
  open: 'open',
  yours: 'yours',
  closed: 'closed',
} as const
