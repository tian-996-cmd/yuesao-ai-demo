import type { MaternityNurse, NurseSchedule, NurseStatus } from './nurse-types';

const names=['李秀梅','张红','刘芳','王春玲','陈桂香','赵燕','周琴','孙丽','何敏','高霞','马秀兰','郭芳','杨丽华','冯雪','袁桂英','蒋莉','谢红梅','唐静','董霞','罗英','韩梅','曹慧','许燕玲','邓芳芳','彭丽','潘琴','余红','魏萍','叶敏','杜娟','钟华','田英','梁莉','苏梅','任霞','郝静','崔艳','石芳','孟丽','白雪'];
const hometowns=['陕西','甘肃','四川','河南','山西','宁夏','湖北','山东'];
const cities=['西安','西安','咸阳','宝鸡','渭南','成都'];
const skills=[['月子餐','母乳喂养配合','新生儿护理'],['新生儿护理','夜间护理','婴儿洗护'],['月子餐','产妇照护','辅助喂养'],['夜间护理','新生儿护理','辅助喂养'],['月子餐','早教互动','产妇照护'],['母乳喂养配合','婴儿洗护','新生儿护理']];
const personalities=[['温和','边界感好'],['执行力强','主见较强'],['沟通主动','健谈'],['话少','耐心细致'],['温和','沟通主动'],['执行力强','边界感好']];
const reviewTexts=['照顾宝宝很细心，晚上起夜也主动，做饭非常不错，就是偶尔比较有自己的想法。','人很温和，跟家里老人相处得不错，做饭口味偏清淡。','护理专业，遇到问题处理得稳妥，但说话比较直接，刚开始需要磨合。','双胞胎照护确实有经验，夜间安排得很清楚，我们轻松很多。','做事麻利，边界感也好，月子餐种类如果再丰富一点会更好。','沟通主动，宝宝每天的情况都会记录，整体很放心。'];
const statuses:NurseStatus[]=['空档','空档','即将空档','已锁档','上户中','空档','休息','上户中'];

function iso(month:number,day:number){return `2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
function buildSchedule(index:number,id:string):NurseSchedule[]{
  const offset=index%8; const firstStatus=index%3===0?'上户中':index%3===1?'已锁档':'空档';
  const secondStatus=index===1?'已锁档':index%4===0?'已锁档':index%4===1?'休息':'空档';
  const rows:NurseSchedule[]=[{id:`sch_${index+1}_a`,nurseId:id,start:iso(9,2+offset),end:iso(9,22+offset%5),status:firstStatus,customerName:firstStatus==='空档'?undefined:['陈女士','王女士','刘女士'][index%3]},{id:`sch_${index+1}_b`,nurseId:id,start:iso(10,3+offset),end:iso(10,24+offset%4),status:secondStatus,customerName:secondStatus==='已锁档'?'赵女士':undefined}];
  if(index===1) rows.push({id:'sch_2_conflict',nurseId:id,start:iso(10,18),end:iso(11,8),status:'上户中',customerName:'孙女士',note:'与已锁档安排重叠'});
  return rows;
}

export const mockNurses:MaternityNurse[]=names.map((name,index)=>{
  const id=`nurse_${String(index+1).padStart(3,'0')}`; const experienced=index%9===7; const newcomer=index%9===6; const special=index%9===8; const years=experienced?11+index%4:newcomer?1+index%2:3+index%7; const serviceCount=experienced?88+index:newcomer?6+index%5:24+index*2; const base=11200+(index%8)*900+(index%9===5?5000:0); const overall=Number((newcomer?4.6:experienced?4.3:4.65+(index%4)*.08).toFixed(1));
  const skillSet=index===0?['月子餐','母乳喂养配合','新生儿护理','夜间护理']:skills[index%skills.length];
  const specialTags=special?['双胞胎','早产儿','低出生体重儿']:index%7===2?['双胞胎']:index%6===3?['高龄产妇家庭服务经历']:[];
  const schedule=buildSchedule(index,id); const status=index===0?'空档':statuses[index%statuses.length];
  return {id,name,phone:`13${index%9}****${String(4100+index*37).slice(-4)}`,age:34+index%17,hometown:hometowns[index%hometowns.length],currentCity:cities[index%cities.length],experienceYears:years,serviceCount,price26Days:base,introduction:index===0?'主要服务西北和北方家庭，擅长面食和家常月子餐。做事麻利，平时话不算多，更习惯按照宝妈的生活习惯配合。':`${years}年一线服务经验，${skillSet.slice(0,2).join('和')}是比较擅长的部分。${personalities[index%personalities.length].join('、')}，会根据家庭习惯调整工作节奏。`,status,availableFrom:index===0?'2026-10-27':iso(10+(index%2),4+index%23),skillTags:skillSet,personalityTags:personalities[index%personalities.length],specialExperienceTags:specialTags,ratings:{overall,newbornCare:Number((8.2+(index%8)*.2).toFixed(1)),postpartumCare:Number((8.1+(index%7)*.2).toFixed(1)),cooking:Number((index%9===1?7.4:8.3+(index%8)*.2).toFixed(1)),communication:Number((8.0+(index%9)*.18).toFixed(1)),boundarySense:Number((7.5+(index%8)*.2).toFixed(1)),nightCare:Number((8.1+(index%7)*.23).toFixed(1))},serviceHistory:[0,1].map(j=>({id:`his_${index+1}_${j+1}`,customerId:`customer_${String((index*2+j)%10+1).padStart(3,'0')}`,month:j?'2026年03月':'2026年06月',city:cities[(index+j)%cities.length],familyType:(index+j)%5===0?'双胞胎':(index+j)%2?'第一胎':'二胎',days:(index+j)%5===0?42:26,highlights:specialTags.length?specialTags.slice(0,2):skillSet.slice(0,2),rating:Number(Math.max(4.1,overall-(j*.1)).toFixed(1))})),reviews:[0,1,2].map(j=>({id:`rev_${index+1}_${j+1}`,customerId:`customer_${String((index*3+j)%10+1).padStart(3,'0')}`,date:`2026-0${6-j}-1${j}`,rating:Number(Math.max(4.0,overall-j*.1).toFixed(1)),content:reviewTexts[(index+j)%reviewTexts.length]})),schedule};
});

export const scheduleConflicts=mockNurses.flatMap(nurse=>nurse.id==='nurse_002'?[{id:'conflict_001',nurseId:nurse.id,nurseName:nurse.name,start:'2026-10-18',end:'2026-10-27',message:'10月18日—10月27日存在重叠安排。'}]:[]);
