import type { NurseStatus, ScheduleStatus } from './nurse-types';

export const skillOptions=['新生儿护理','月子餐','母乳喂养配合','产妇照护','夜间护理','婴儿洗护','辅助喂养','早教互动'];
export const personalityOptions=['温和','健谈','话少','边界感好','主见较强','执行力强','沟通主动','耐心细致'];
export const specialExperienceOptions=['双胞胎','早产儿','低出生体重儿','高龄产妇家庭服务经历'];
export const nurseStatuses:NurseStatus[]=['空档','即将空档','已锁档','上户中','休息','不可接单'];
export const scheduleStyles:Record<ScheduleStatus,string>={空档:'slot-free',已推荐:'slot-recommended',已锁档:'slot-locked',上户中:'slot-serving',休息:'slot-rest',不可接单:'slot-unavailable'};
export const nurseStatusStyles:Record<NurseStatus,string>={空档:'nurse-free',即将空档:'nurse-soon',已锁档:'nurse-locked',上户中:'nurse-serving',休息:'nurse-rest',不可接单:'nurse-unavailable'};
