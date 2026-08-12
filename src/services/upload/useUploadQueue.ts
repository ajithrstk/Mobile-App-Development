import { useEffect, useState } from 'react';
import { uploadManager, type UploadTask } from './uploadManager';

export function useUploadQueue() {
  const [tasks, setTasks] = useState<UploadTask[]>(uploadManager.getTasks());

  useEffect(() => {
    void uploadManager.initialize();
    const unsubscribe = uploadManager.on('change', setTasks);

    return unsubscribe;
  }, []);

  return {
    cancel: uploadManager.cancel.bind(uploadManager),
    enqueue: uploadManager.enqueue.bind(uploadManager),
    pause: uploadManager.pause.bind(uploadManager),
    remove: uploadManager.remove.bind(uploadManager),
    retry: uploadManager.retry.bind(uploadManager),
    tasks,
  };
}
