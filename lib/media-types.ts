export type MediaCategory='avatar'|'profile'|'service_case'|'cooking'|'certificate';
export type MediaVisibility='internal'|'customer_shareable'|'public';
export type MediaConsent='not_required'|'confirmed'|'unknown';
export type CookingTag='早餐'|'午餐'|'晚餐'|'汤品'|'加餐'|'主食';

export interface MediaAsset{
  id:string;
  nurseId:string;
  serviceRecordId?:string;
  category:MediaCategory;
  title?:string;
  caption?:string;
  tag?:CookingTag;
  fileName?:string;
  mimeType?:string;
  width?:number;
  height?:number;
  fileSize?:number;
  storageKey?:string;
  url?:string;
  thumbnailUrl?:string;
  visibility:MediaVisibility;
  consentStatus?:MediaConsent;
  sortOrder:number;
  createdAt:string;
  updatedAt?:string;
}

export interface MediaUploadMetadata{
  nurseId:string;
  category:Exclude<MediaCategory,'avatar'|'certificate'>;
  serviceRecordId?:string;
  title?:string;
  caption?:string;
  tag?:CookingTag;
  visibility:MediaVisibility;
}
