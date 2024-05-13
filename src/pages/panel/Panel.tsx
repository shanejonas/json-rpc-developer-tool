import React, { useEffect, useState } from 'react';
import '@pages/panel/Panel.css';
import { Table } from '@devtools-ds/table';
import { CloseIcon, DebuggerIcon, DeleteIcon, InspectorIcon, StylesIcon } from '@devtools-ds/icon';
import { ObjectInspector } from '@devtools-ds/object-inspector';
import { Navigation } from '@devtools-ds/navigation';

// const codeToEval = `
// console.log('evallin');
// const providerDetails = {
//   info: {
//     name: 'Example Provider',
//     icon: 'https://example.com/icon.png',
//     uuid: '00000000-0000-0000-0000-000000000000',
//     rdns: 'example.com',
//   },
//   provider: {
//     on: () => {},
//     request: async (request) => {
//       return new Promise((resolve, reject) => {
//         window.dispatchEvent(
//           new CustomEvent('jsonrpc-request', {
//             detail: request,
//           }),
//         );
//         window.addEventListener('jsonrpc-response', (event) => {
//           if (event.detail.id === request.id) {
//             if (event.detail.result) {
//               resolve(event.detail.result);
//             } else {
//               reject(event.detail.error.message);
//             }
//           }
//         });
//       });
//     },
//   },
// };
// const { info, provider } = providerDetails;
// console.log('running announce', info, provider);
// window.dispatchEvent(
//   new CustomEvent('eip6963:announceProvider', {
//     detail: { info, provider },
//   }),
// );
// `;
const isJsonRPC = content => {
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    return false;
  }
  if (!json) return false;
  return json.jsonrpc === '2.0' && (json.method !== undefined || json.error !== undefined || json.result !== undefined);
};

const Panel: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [recording, setRecording] = useState(true);
  const [startedRecording, setStartedRecording] = useState<number | undefined>();
  const [selected, setSelected] = useState('');
  const [requests, setRequests] = useState([]); // [{id: string, method: string, params: any, result: any}

  useEffect(() => {
    if (!recording) {
      return;
    }
    const handler = async (request: chrome.devtools.network.Request) => {
      const content = await new Promise(resolve => {
        request.getContent(content => {
          resolve(content);
        });
      });
      if (isJsonRPC(content) && isJsonRPC(request.request.postData.text)) {
        const req = JSON.parse(request.request.postData.text);
        const res = JSON.parse(content as string);
        const startTime = new Date(request.startedDateTime).valueOf();
        console.log(request.time);
        setRequests(requests => {
          return [
            ...requests,
            {
              request: req,
              response: res,
              url: request.request.url,
              startTime,
              responseTime: request.time,
              type: 'HTTP POST',
            },
          ];
        });
      }
    };
    chrome.devtools.network.onRequestFinished.addListener(handler);
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handler);
    };
  }, [recording]);

  useEffect(() => {
    if (recording && requests.length === 0) {
      setStartedRecording(new Date().valueOf());
    }
  }, [recording]);

  const [selectedRequest, setSelectedRequest] = useState<chrome.devtools.network.Request>();

  useEffect(() => {
    if (requests && requests.length > 0) {
      setSelectedRequest(requests[selected]);
    }
  }, [requests, selected]);

  return (
    <div className="container">
      <Navigation>
        <Navigation.Controls>
          <Navigation.Left>
            <Navigation.Button
              onClick={() => {
                setRecording(!recording);
              }}
              icon={
                <div
                  style={{
                    background: recording ? 'red' : 'gray',
                    borderRadius: '16px',
                    width: '16px',
                    height: '16px',
                  }}
                />
              }
              aria-label="Record"
            />
            <Navigation.Button
              onClick={() => {
                setRequests([]);
                setSelected(undefined);
              }}
              icon={<DeleteIcon fill="rgba(0,0,0.8)" size="medium" />}
              aria-label="Delete"
            />
            <Navigation.Divider />
            <input
              style={{
                width: '100px',
                borderRadius: '4px',
                padding: '4px',
                marginLeft: '5px',
                border: '1px solid #f3f3f3',
              }}
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter"
            />
          </Navigation.Left>
        </Navigation.Controls>
      </Navigation>
      <Table
        selected={selected}
        onSelected={id => {
          console.log('id', id);
          setSelected(id);
        }}>
        <Table.Head>
          <Table.Row>
            <Table.HeadCell style={{ width: '30%' }}>Url</Table.HeadCell>
            <Table.HeadCell style={{ width: '30%' }}>Method</Table.HeadCell>
            <Table.HeadCell style={{ width: '10%' }}>Time</Table.HeadCell>
            <Table.HeadCell style={{ width: '10%' }}>Type</Table.HeadCell>
            <Table.HeadCell>Waterfall</Table.HeadCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {requests
            .filter(val => {
              return (
                val.url.toLowerCase().includes(filter.toLowerCase()) ||
                val.request.method.toLowerCase().includes(filter.toLowerCase()) ||
                val.type.toLowerCase().includes(filter.toLowerCase())
              );
            })
            .map((req, i) => {
              return (
                <Table.Row key={i} id={i.toString()} style={{ cursor: 'pointer' }}>
                  <Table.Cell>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}>
                      <StylesIcon fill={req.response.error ? 'red' : 'green'} size="medium" />
                      {'  '}
                      <div>{req.url}</div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{req.request.method}</Table.Cell>
                  <Table.Cell>{req.responseTime.toFixed(0)}ms</Table.Cell>
                  <Table.Cell>{req.type}</Table.Cell>
                  <Table.Cell style={{ position: 'relative' }}>
                    <div
                      style={{
                        marginLeft: '5px',
                        position: 'absolute',
                        backgroundColor: 'lightblue',
                        left: requests[i - 1]
                          ? `${Math.max((requests[i - 1].startTime - startedRecording) / (new Date().valueOf() - startedRecording), 0) * 99}%`
                          : '0%',
                        width: `${Math.max(req.responseTime / (new Date().valueOf() - startedRecording), 0.05) * 99}%`,
                        height: '10px',
                      }}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          {/* <Table.Row id="one">
            <Table.Cell>eth_requestAccounts</Table.Cell>
            <Table.Cell>0.001s</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'bar' })}</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'baz' })}</Table.Cell>
          </Table.Row>
          <Table.Row id="two">
            <Table.Cell>eth_call</Table.Cell>
            <Table.Cell>0.021s</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'bar' })}</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'baz' })}</Table.Cell>
          </Table.Row>
          <Table.Row id="three">
            <Table.Cell>eth_chainId</Table.Cell>
            <Table.Cell>0.031s</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'bar' })}</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'baz' })}</Table.Cell>
          </Table.Row>
          <Table.Row id="four">
            <Table.Cell>eth_blockByNumber</Table.Cell>
            <Table.Cell>0.091s</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'bar' })}</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'baz' })}</Table.Cell>
          </Table.Row>
          <Table.Row id="five">
            <Table.Cell>wallet_requestPermissions</Table.Cell>
            <Table.Cell>0.221s</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'bar' })}</Table.Cell>
            <Table.Cell>{JSON.stringify({ foo: 'baz' })}</Table.Cell>
          </Table.Row> */}
        </Table.Body>
      </Table>
      {selected && (
        <div
          className="overlay-panel"
          style={{
            display: selected ? 'block' : 'none',
            position: 'absolute',
            right: 0,
            top: 0,
            left: '50%',
            bottom: 0,
            background: '#F3F3F3',
            borderLeft: '1px solid gray',
          }}>
          <div className="overlay-content">
            <Navigation>
              <Navigation.Controls>
                <Navigation.TabList>
                  <Navigation.Tab id="elements" icon={<InspectorIcon inline />}>
                    Request
                  </Navigation.Tab>
                  <Navigation.Tab id="console" icon={<DebuggerIcon inline />}>
                    Response
                  </Navigation.Tab>
                </Navigation.TabList>
                <Navigation.Right>
                  <Navigation.Button
                    icon={<CloseIcon inline />}
                    aria-label="Close panel"
                    onClick={() => {
                      setSelected(undefined);
                    }}
                  />
                </Navigation.Right>
              </Navigation.Controls>
              <Navigation.Panels style={{ padding: '5px 10px 5px 10px', width: '100%', height: '100%' }}>
                <Navigation.Panel>
                  <div style={{ width: '100%', height: screen.availHeight, overflow: 'auto' }}>
                    <ObjectInspector includePrototypes={false} data={selectedRequest?.request} expandLevel={3} />
                  </div>
                </Navigation.Panel>
                <Navigation.Panel>
                  <div style={{ width: '100%', height: screen.availHeight, overflow: 'auto' }}>
                    <ObjectInspector includePrototypes={false} data={selectedRequest?.response} expandLevel={3} />
                  </div>
                </Navigation.Panel>
              </Navigation.Panels>
            </Navigation>
          </div>
        </div>
      )}
    </div>
  );
};

export default Panel;
