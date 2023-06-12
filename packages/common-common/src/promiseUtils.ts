interface PromiseResult {
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: any;
}

type SuccessFailureCounts = { successCount: number; errorCount: number };
type AllSettledCallback = (counts: SuccessFailureCounts) => void;
export async function promiseAllSettled(
  promises: Promise<any>[],
  cb?: AllSettledCallback
): Promise<SuccessFailureCounts | void> {
  const results: PromiseResult[] = await Promise.allSettled(promises);

  let successCount = 0;
  let errorCount = 0;
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else if (result.status === 'rejected') {
      errorCount++;
    }
  });

  const counts = {
    successCount,
    errorCount,
  };

  if (cb) {
    cb(counts);
  } else {
    return counts;
  }
}
