import type {MediaAsset,MediaCategory,MediaVisibility} from './media-types';

const paths={
  zhang:['/demo-media/zhang-profile.webp','/demo-media/zhang-profile-thumb.webp'],
  li:['/demo-media/li-profile.webp','/demo-media/li-profile-thumb.webp'],
  candidate:['/demo-media/candidate-profile.webp','/demo-media/candidate-profile-thumb.webp'],
  breakfast:['/demo-media/meal-breakfast.webp','/demo-media/meal-breakfast-thumb.webp'],
  lunch:['/demo-media/meal-lunch.webp','/demo-media/meal-lunch-thumb.webp'],
  dinner:['/demo-media/meal-dinner.webp','/demo-media/meal-dinner-thumb.webp'],
  service:['/demo-media/service-supplies.webp','/demo-media/service-supplies-thumb.webp']
} as const;

const asset=(id:string,nurseId:string,category:MediaCategory,title:string,path:keyof typeof paths,sortOrder:number,extra:Partial<MediaAsset>={}):MediaAsset=>({id,nurseId,category,title,url:paths[path][0],thumbnailUrl:paths[path][1],visibility:'customer_shareable' as MediaVisibility,consentStatus:category==='service_case'?'confirmed':'not_required',sortOrder,createdAt:'2026-06-18T10:00:00.000Z',...extra});

const featured=[
  {id:'nurse_001',portrait:'li' as const,service:'his_1_1'},
  {id:'nurse_002',portrait:'zhang' as const,service:'his_2_1'},
  {id:'nurse_005',portrait:'candidate' as const,service:'his_5_1'},
  {id:'nurse_013',portrait:'candidate' as const,service:'his_13_1'},
  {id:'nurse_020',portrait:'candidate' as const,service:'his_20_1'}
];

export const mockMediaAssets:MediaAsset[]=featured.flatMap(({id,portrait,service},index)=>[
  asset(`${id}-avatar`,id,'avatar','当前头像',portrait,0),
  asset(`${id}-profile`,id,'profile','职业形象照',portrait,1,{caption:'用于月嫂档案与客户推荐资料'}),
  asset(`${id}-breakfast`,id,'cooking','暖心早餐','breakfast',2,{tag:'早餐',caption:'小米粥、蒸蛋与时蔬，清淡家常'}),
  asset(`${id}-lunch`,id,'cooking','月子餐 · 午餐','lunch',3,{tag:'午餐',caption:'清蒸鲈鱼、山药排骨汤与时蔬'}),
  asset(`${id}-dinner`,id,'cooking','家常晚餐','dinner',4,{tag:'晚餐',caption:'荤素搭配，少油清淡'}),
  asset(`${id}-service`,id,'service_case','护理用品整理','service',5,{serviceRecordId:service,caption:`2026年6月服务案例${index?' · 标准化整理':' · 西安'}`})
]);

export function avatarFor(nurseId:string,media:MediaAsset[]){return media.find(x=>x.nurseId===nurseId&&x.category==='avatar')}
