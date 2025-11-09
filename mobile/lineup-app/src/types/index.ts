export interface MissionSummary {
  id: string;
  title: string;
  description?: string;
  status: string;
  progressStatus?: string;
  paymentStatus?: string;
  location?: {
    label?: string;
  };
  scheduledAt?: string | null;
  budgetCents?: number | null;
  currency?: string | null;
  applicationsCount?: number;
  client?: {
    id: number | string;
    name?: string;
  } | null;
  liner?: {
    id: number | string;
    name?: string;
  } | null;
}

export interface MissionDetail extends MissionSummary {
  type?: string;
  location?: {
    label?: string;
    latitude?: number;
    longitude?: number;
    distanceKm?: number;
  };
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  budgetCents?: number | null;
  commissionCents?: number | null;
  progressStatus?: string | null;
  bookingStatus?: string | null;
  paymentStatus?: string | null;
  publishedAt?: string | null;
  completedAt?: string | null;
  clientRatedAt?: string | null;
  client?: {
    id: number | string;
    name?: string;
    avatarUrl?: string;
  } | null;
  liner?: {
    id: number | string;
    name?: string;
    avatarUrl?: string;
    rating?: number | null;
    missionsCompleted?: number | null;
  } | null;
}

export interface ChatMessage {
  id: string;
  missionId: string;
  userId?: string | number;
  role?: string;
  body: string;
  attachments?: { url?: string; name?: string }[];
  createdAt?: string;
  user?: {
    id: string | number;
    name?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  status: string;
  amountCents: number;
  currency: string;
  description?: string;
  counterparty?: string;
  method?: string;
  createdAt?: string;
}

export interface WalletSummary {
  wallet: {
    balance_cents?: number;
    pending_cents?: number;
    currency?: string;
    updated_at?: string;
  };
  transactions: WalletTransaction[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category?: string;
  readAt?: string | null;
  createdAt?: string;
}

export interface KycChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface KycPayload {
  status: string;
  lastSubmitted?: string;
  checklist: KycChecklistItem[];
}
