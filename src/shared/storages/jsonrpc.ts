import { createStorage, StorageType } from '@src/shared/storages/base';

const storage = createStorage<unknown[]>('jsonrpc-storage-key', [], {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const jsonrpcStorage: unknown = {
  ...storage,
  // TODO: extends your own methods
  addRequest: async request => {
    await storage.set(currentRequests => {
      return [...currentRequests, request];
    });
  },
};

export default jsonrpcStorage;
