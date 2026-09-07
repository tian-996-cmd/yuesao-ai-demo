export type NurseStatus = '空档' | '即将空档' | '已锁档' | '上户中' | '休息' | '不可接单';
export type ScheduleStatus = '空档' | '已推荐' | '已锁档' | '上户中' | '休息' | '不可接单';

export interface NurseRatings { overall:number; newbornCare:number; postpartumCare:number; cooking:number; communication:number; boundarySense:number; nightCare:number; }
export interface ServiceHistory { id:string; customerId:string; month:string; city:string; familyType:string; days:number; highlights:string[]; rating:number; }
export interface NurseReview { id:string; customerId:string; date:string; rating:number; content:string; }
export interface NurseSchedule { id:string; nurseId:string; start:string; end:string; status:ScheduleStatus; customerName?:string; note?:string; }
export interface MaternityNurse { id:string; name:string; phone:string; age:number; hometown:string; currentCity:string; experienceYears:number; serviceCount:number; price26Days:number; introduction:string; status:NurseStatus; availableFrom:string; skillTags:string[]; personalityTags:string[]; specialExperienceTags:string[]; ratings:NurseRatings; serviceHistory:ServiceHistory[]; reviews:NurseReview[]; schedule:NurseSchedule[]; }
export type NurseFormInput = Pick<MaternityNurse,'name'|'phone'|'age'|'hometown'|'currentCity'|'experienceYears'|'serviceCount'|'price26Days'|'introduction'|'availableFrom'|'skillTags'|'personalityTags'>;
