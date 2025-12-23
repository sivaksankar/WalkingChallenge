// src/types/challenge.ts
export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  minSteps: number;
  createdBy: string; // User ID of the admin
  createdAt: Date | string;
  participants: string[]; // Array of user emails
  isActive: boolean;
}