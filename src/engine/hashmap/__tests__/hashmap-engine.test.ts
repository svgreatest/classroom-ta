import { describe, it, expect } from 'vitest';
import { 
  hashDjb2, 
  createInitialBuckets, 
  generateHashMapInsertSteps, 
  generateHashMapDeleteSteps 
} from '../hashmap-generator';

describe('Classroom TA - Hash Map Animation Engine (TDD)', () => {
  it('computes deterministic djb2 hash values', () => {
    const h1 = hashDjb2('apple');
    const h2 = hashDjb2('apple');
    const h3 = hashDjb2('banana');

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toBeGreaterThan(0);
  });

  it('generates steps for inserting an entry into empty bucket', () => {
    const buckets = createInitialBuckets(4);
    const steps = generateHashMapInsertSteps(buckets, 4, 0, 0.75, 'apple', 42);

    expect(steps.length).toBeGreaterThan(3);
    expect(steps[0].actionType).toBe('start');

    const hashStep = steps.find(s => s.actionType === 'hash_calc');
    expect(hashStep).toBeDefined();
    expect(hashStep?.activeKey).toBe('apple');

    const bucketStep = steps.find(s => s.actionType === 'bucket_index');
    expect(bucketStep).toBeDefined();
    expect(bucketStep?.bucketIndex).toBeDefined();

    const finalStep = steps[steps.length - 1];
    expect(finalStep.actionType).toBe('done');
    expect(finalStep.size).toBe(1);
  });

  it('detects collisions and chains multiple entries into the same bucket', () => {
    let buckets = createInitialBuckets(2);
    let size = 0;

    let steps = generateHashMapInsertSteps(buckets, 2, size, 2.0, 'key1', 10);
    buckets = steps[steps.length - 1].buckets;
    size = steps[steps.length - 1].size;

    steps = generateHashMapInsertSteps(buckets, 2, size, 2.0, 'key2', 20);
    buckets = steps[steps.length - 1].buckets;
    size = steps[steps.length - 1].size;

    steps = generateHashMapInsertSteps(buckets, 2, size, 2.0, 'key3', 30);
    buckets = steps[steps.length - 1].buckets;
    size = steps[steps.length - 1].size;

    expect(size).toBe(3);
    // At least one bucket must have length >= 2 (Pigeonhole principle: 3 items in 2 buckets)
    const hasCollision = buckets.some(b => b.entries.length >= 2);
    expect(hasCollision).toBe(true);
  });

  it('triggers dynamic rehashing when load factor exceeds threshold', () => {
    let buckets = createInitialBuckets(4);
    let capacity = 4;
    let size = 0;

    // Insert 3 items
    for (let i = 1; i <= 3; i++) {
      const steps = generateHashMapInsertSteps(buckets, capacity, size, 0.75, `item_${i}`, i * 10);
      buckets = steps[steps.length - 1].buckets;
      capacity = steps[steps.length - 1].capacity;
      size = steps[steps.length - 1].size;
    }
    expect(capacity).toBe(4);
    expect(size).toBe(3);

    // 4th item: (3 + 1) / 4 = 1.0 > 0.75 -> triggers rehash!
    const steps = generateHashMapInsertSteps(buckets, capacity, size, 0.75, 'item_4', 40);
    const rehashStep = steps.find(s => s.actionType === 'rehash_start');
    expect(rehashStep).toBeDefined();

    const finalStep = steps[steps.length - 1];
    expect(finalStep.capacity).toBe(8); // Doubled capacity!
    expect(finalStep.size).toBe(4);
  });

  it('generates steps for deleting an existing entry', () => {
    let buckets = createInitialBuckets(4);
    let steps = generateHashMapInsertSteps(buckets, 4, 0, 0.75, 'fruit', 100);
    buckets = steps[steps.length - 1].buckets;

    const delSteps = generateHashMapDeleteSteps(buckets, 4, 1, 0.75, 'fruit');
    const finalStep = delSteps[delSteps.length - 1];
    expect(finalStep.size).toBe(0);
    expect(finalStep.buckets.every(b => b.entries.length === 0)).toBe(true);
  });
});
