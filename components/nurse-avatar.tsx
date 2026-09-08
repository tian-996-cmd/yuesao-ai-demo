import type {MediaAsset} from '@/lib/media-types';
import {avatarFor} from '@/lib/mock-media';

export function NurseAvatar({nurseId,name,media,className='mini-nurse-avatar'}:{nurseId:string;name:string;media:MediaAsset[];className?:string}){const avatar=avatarFor(nurseId,media);return <span className={`${className} ${avatar?'has-photo':''}`}>{avatar?.thumbnailUrl||avatar?.url?<img src={avatar.thumbnailUrl??avatar.url} alt={`${name}头像`} loading="lazy"/>:name[0]}</span>}
