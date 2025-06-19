// src/app/configuration/models/configuration.entity.ts

export class Configuration {
  id?: string;
  userId: string;
  userType: 'businessman' | 'supplier';
  language: string;
  batchCodeFormat: 'automatic' | 'manual';
  viewMode: 'light' | 'dark' | 'auto';
  createdAt?: string;
  updatedAt?: string;
  subscriptionPlan?: 'basic' | 'corporate';
  subscriptionStartDate?: string;
  constructor(data: {
    id?: string;
    userId: string;
    userType: 'businessman' | 'supplier';
    language: string;
    batchCodeFormat: 'automatic' | 'manual';
    viewMode: 'light' | 'dark' | 'auto';
    createdAt?: string;
    updatedAt?: string;
    subscriptionPlan?: 'basic' | 'corporate';  // ← AGREGAR
    subscriptionStartDate?: string;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.userType = data.userType;
    this.language = data.language;
    this.batchCodeFormat = data.batchCodeFormat;
    this.viewMode = data.viewMode;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.subscriptionPlan = data.subscriptionPlan;      // ← AGREGAR
    this.subscriptionStartDate = data.subscriptionStartDate;
  }
}
