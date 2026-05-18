export type UserRole = "consumer" | "partner" | "admin";

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  neighborhood?: string;
  role: UserRole;
  companyId?: string;
  blocked: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  publicName?: string;
  category: string;
  neighborhood: string;
  city: string;
  state: string;
  ownerUserId: string;
  logoImage?: string;
  coverImage?: string;
  addressLine?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  whatsapp?: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  companyId: string;
  title: string;
  description: string;
  discountLabel: string;
  category: string;
  neighborhood: string;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
}

export type RedemptionStatus = "generated" | "used" | "expired";

export interface Redemption {
  id: string;
  userId: string;
  offerId: string;
  code: string;
  status: RedemptionStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

export interface Session {
  userId: string;
  user?: User;
  token?: string;
}

export type NotificationType = "info";

export interface AppNotification {
  id: string;
  userId: string;
  companyId?: string;
  offerId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AppData {
  users: User[];
  companies: Company[];
  offers: Offer[];
  redemptions: Redemption[];
  notifications: AppNotification[];
}
