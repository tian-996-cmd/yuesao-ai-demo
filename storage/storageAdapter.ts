export interface StorageAdapter{
  uploadFile(key:string,file:Blob):Promise<void>;
  deleteFile(key:string):Promise<void>;
  getFileUrl(key:string):Promise<string|undefined>;
  getSignedUrl(key:string):Promise<string|undefined>;
}
