export interface HashEntry {
  id: string;
  key: string;
  value: number;
}

export interface BucketState {
  index: number;
  entries: HashEntry[];
}

export type HashMapActionType =
  | 'start'
  | 'hash_calc'
  | 'bucket_index'
  | 'traverse_bucket'
  | 'insert_entry'
  | 'update_entry'
  | 'delete_entry'
  | 'rehash_start'
  | 'rehash_complete'
  | 'done';

export interface HashMapAnimationStep {
  stepIndex: number;
  totalSteps: number;
  actionType: HashMapActionType;
  buckets: BucketState[];
  capacity: number;
  size: number;
  loadFactor: number;
  maxLoadFactor: number;
  activeKey?: string;
  hashValue?: number;
  bucketIndex?: number;
  description: string;
  pseudocodeLine?: number;
}
