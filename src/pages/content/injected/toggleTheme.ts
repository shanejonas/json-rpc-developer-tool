// import jsonrpcStorage from '@src/shared/storages/jsonrpc';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/toggleTheme');

// async function doProvider() {
//   window.addEventListener('jsonrpc-request', async (event: any) => {
//     const { id, method, params } = event.detail;
//     (jsonrpcStorage as any).addRequest({ id, method, params });
//     (window as any).ethereum.request({ id, method, params }).then((result) => {
//       window.dispatchEvent(new CustomEvent('jsonrpc-response', { detail: { id, result } }));
//     });
//   });
// }
// console.log('im inside toggleTheme');
// setTimeout(() => {
//   console.log(window.ethereum)
// }, 5000)

// void doProvider();
