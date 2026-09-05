import { BucketState, HashEntry, HashMapAnimationStep, HashMapActionType } from './types';

// Classical djb2 string hash algorithm (matches C implementation)
export function hashDjb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff; // Keep 31-bit positive integer
  }
  return hash;
}

export function createInitialBuckets(capacity: number): BucketState[] {
  const buckets: BucketState[] = [];
  for (let i = 0; i < capacity; i++) {
    buckets.push({ index: i, entries: [] });
  }
  return buckets;
}

export function cloneBuckets(buckets: BucketState[]): BucketState[] {
  return buckets.map(b => ({
    index: b.index,
    entries: b.entries.map(e => ({ ...e }))
  }));
}

// Generate step-by-step animation for inserting an entry
export function generateHashMapInsertSteps(
  initialBuckets: BucketState[],
  currentCapacity: number,
  currentSize: number,
  maxLoadFactor: number,
  key: string,
  value: number
): HashMapAnimationStep[] {
  const steps: HashMapAnimationStep[] = [];
  let buckets = cloneBuckets(initialBuckets);
  let capacity = currentCapacity;
  let size = currentSize;

  function pushStep(
    actionType: HashMapActionType,
    description: string,
    hashValue?: number,
    bucketIndex?: number,
    line?: number
  ) {
    const lf = capacity > 0 ? size / capacity : 0;
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      actionType,
      buckets: cloneBuckets(buckets),
      capacity,
      size,
      loadFactor: Math.round(lf * 100) / 100,
      maxLoadFactor,
      activeKey: key,
      hashValue,
      bucketIndex,
      description,
      pseudocodeLine: line
    });
  }

  pushStep('start', `Begin insertion of ("${key}", ${value})`, undefined, undefined, 1);

  // 1. Check if Rehash is needed BEFORE inserting
  if ((size + 1) / capacity > maxLoadFactor) {
    const oldCap = capacity;
    const newCap = capacity * 2;
    pushStep('rehash_start', `Load factor ${(size + 1) / capacity} > threshold ${maxLoadFactor}. Doubling capacity from ${oldCap} to ${newCap} and rehashing all keys!`, undefined, undefined, 3);

    // Perform rehash
    const newBuckets = createInitialBuckets(newCap);
    for (const b of buckets) {
      for (const entry of b.entries) {
        const newIdx = hashDjb2(entry.key) % newCap;
        newBuckets[newIdx].entries.push(entry);
      }
    }
    buckets = newBuckets;
    capacity = newCap;

    pushStep('rehash_complete', `Rehashing complete! Table doubled to ${newCap} buckets. New load factor: ${Math.round((size / newCap) * 100) / 100}`, undefined, undefined, 5);
  }

  // 2. Hash calculation
  const hashVal = hashDjb2(key);
  pushStep('hash_calc', `Computed 32-bit hash: djb2("${key}") = ${hashVal}`, hashVal, undefined, 8);

  // 3. Modulo indexing
  const targetBucket = hashVal % capacity;
  pushStep('bucket_index', `Target bucket index: ${hashVal} % ${capacity} = Bucket [${targetBucket}]`, hashVal, targetBucket, 10);

  // 4. Chain traversal & collision detection
  const bucket = buckets[targetBucket];
  const existingIdx = bucket.entries.findIndex(e => e.key === key);

  if (bucket.entries.length > 0) {
    pushStep('traverse_bucket', `Bucket [${targetBucket}] contains ${bucket.entries.length} items. Traversed chain searching for key "${key}"`, hashVal, targetBucket, 12);
  }

  if (existingIdx !== -1) {
    bucket.entries[existingIdx].value = value;
    pushStep('update_entry', `Key "${key}" already exists! Updated value to ${value} in-place in Bucket [${targetBucket}].`, hashVal, targetBucket, 14);
  } else {
    const newEntry: HashEntry = {
      id: `entry-${Date.now()}-${Math.random()}`,
      key,
      value
    };
    bucket.entries.unshift(newEntry);
    size++;
    pushStep('insert_entry', `Prepended new node ("${key}": ${value}) to Bucket [${targetBucket}]. Table size is now ${size}.`, hashVal, targetBucket, 16);
  }

  pushStep('done', `Insertion complete for ("${key}", ${value}). Current load factor: ${Math.round((size / capacity) * 100) / 100} <= ${maxLoadFactor}.`, hashVal, targetBucket, 20);

  const total = steps.length;
  steps.forEach(s => (s.totalSteps = total));
  return steps;
}

// Generate step-by-step animation for deleting an entry
export function generateHashMapDeleteSteps(
  initialBuckets: BucketState[],
  capacity: number,
  currentSize: number,
  maxLoadFactor: number,
  key: string
): HashMapAnimationStep[] {
  const steps: HashMapAnimationStep[] = [];
  const buckets = cloneBuckets(initialBuckets);
  let size = currentSize;

  function pushStep(
    actionType: HashMapActionType,
    description: string,
    hashValue?: number,
    bucketIndex?: number
  ) {
    const lf = capacity > 0 ? size / capacity : 0;
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      actionType,
      buckets: cloneBuckets(buckets),
      capacity,
      size,
      loadFactor: Math.round(lf * 100) / 100,
      maxLoadFactor,
      activeKey: key,
      hashValue,
      bucketIndex,
      description
    });
  }

  pushStep('start', `Begin deletion of key "${key}"`);

  const hashVal = hashDjb2(key);
  const targetBucket = hashVal % capacity;
  pushStep('bucket_index', `Computed bucket index: ${hashVal} % ${capacity} = Bucket [${targetBucket}]`, hashVal, targetBucket);

  const bucket = buckets[targetBucket];
  const idx = bucket.entries.findIndex(e => e.key === key);

  if (idx !== -1) {
    bucket.entries.splice(idx, 1);
    size--;
    pushStep('delete_entry', `Found and deleted key "${key}" from Bucket [${targetBucket}]. Size is now ${size}.`, hashVal, targetBucket);
  } else {
    pushStep('done', `Key "${key}" was not found in Bucket [${targetBucket}].`, hashVal, targetBucket);
  }

  pushStep('done', `Deletion finished. Table size: ${size}.`, hashVal, targetBucket);

  const total = steps.length;
  steps.forEach(s => (s.totalSteps = total));
  return steps;
}
