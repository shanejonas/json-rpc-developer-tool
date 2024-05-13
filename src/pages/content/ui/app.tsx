import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('content view loaded', window.ethereum);
  }, []);

  return <div className="">content view</div>;
}
