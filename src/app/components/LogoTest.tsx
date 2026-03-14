import React from 'react';

export default function LogoTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Logo Debug Test</h2>
      
      <div className="space-y-2">
        <p>Direct image test:</p>
        <img src="/img/tbt-logo.png" alt="Direct TBT Logo" className="w-32 h-32 border-2 border-red-500" />
      </div>
      
      <div className="space-y-2">
        <p>TBTLogo component (md):</p>
        <div className="border-2 border-blue-500 inline-block">
          {/* This will show if the TBTLogo component is working */}
        </div>
      </div>
      
      <div className="space-y-2">
        <p>Image info:</p>
        <ul className="list-disc list-inside">
          <li>File: /img/tbt-logo.png</li>
          <li>Size: 23,264 bytes</li>
          <li>Should display your uploaded logo</li>
        </ul>
      </div>
    </div>
  );
}
