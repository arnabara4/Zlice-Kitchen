'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isWebBluetoothAvailable, isPWAInstalled, printReceipt } from '@/lib/printer/pwa-printer';
import { Badge } from '@/components/ui/badge';

export default function PrinterTestPage() {
  const [status, setStatus] = useState<Record<string, any>>({});
  const [testOutput, setTestOutput] = useState<string[]>([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    const output: string[] = [];
    
    // Check display modes
    const displayMode = window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                       window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                       window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser';
    
    // iOS specific
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Android specific
    const isAndroidApp = window.matchMedia('(display-mode: standalone)').matches && 
                        /Android/.test(navigator.userAgent);
    
    const statusData = {
      // PWA Detection
      displayMode,
      isPWAByFunction: isPWAInstalled(),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
      isIOSStandalone,
      isAndroidApp,
      
      // Browser Info
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      
      // Bluetooth
      hasNavigatorBluetooth: 'bluetooth' in navigator,
      isBluetoothAvailable: isWebBluetoothAvailable(),
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      
      // Service Worker
      hasServiceWorker: 'serviceWorker' in navigator,
      swController: navigator.serviceWorker?.controller ? 'Active' : 'None',
      
      // Storage
      bluetoothPref: localStorage.getItem('printer-bluetooth-enabled')
    };

    setStatus(statusData);

    // Generate output
    output.push('=== PWA STATUS ===');
    output.push(`Display Mode: ${statusData.displayMode}`);
    output.push(`Is PWA Installed: ${statusData.isPWAByFunction ? '✓ YES' : '✗ NO'}`);
    output.push(`Is Standalone: ${statusData.isStandalone ? '✓' : '✗'}`);
    output.push(`Is Fullscreen: ${statusData.isFullscreen ? '✓' : '✗'}`);
    output.push(`iOS Standalone: ${statusData.isIOSStandalone ? '✓' : '✗'}`);
    output.push(`Android App: ${statusData.isAndroidApp ? '✓' : '✗'}`);
    
    output.push('');
    output.push('=== BLUETOOTH STATUS ===');
    output.push(`Has navigator.bluetooth: ${statusData.hasNavigatorBluetooth ? '✓' : '✗'}`);
    output.push(`Is Bluetooth Available: ${statusData.isBluetoothAvailable ? '✓' : '✗'}`);
    output.push(`Is Secure Context: ${statusData.isSecureContext ? '✓' : '✗'}`);
    output.push(`Protocol: ${statusData.protocol}`);
    
    output.push('');
    output.push('=== SERVICE WORKER ===');
    output.push(`Has Service Worker: ${statusData.hasServiceWorker ? '✓' : '✗'}`);
    output.push(`SW Controller: ${statusData.swController}`);
    
    output.push('');
    output.push('=== DEVICE INFO ===');
    output.push(`Platform: ${statusData.platform}`);
    output.push(`Vendor: ${statusData.vendor}`);
    output.push(`User Agent: ${statusData.userAgent}`);
    
    setTestOutput(output);
  };

  const testBluetoothConnection = async () => {
    const output = [...testOutput];
    output.push('');
    output.push('=== TESTING BLUETOOTH ===');
    setTestOutput(output);

    try {
      output.push('Requesting device...');
      setTestOutput([...output]);

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fff0-0000-1000-8000-00805f9b34fb'
        ]
      });

      output.push(`✓ Device selected: ${device.name || 'Unknown'}`);
      output.push(`  ID: ${device.id}`);
      setTestOutput([...output]);

      output.push('Connecting to GATT server...');
      setTestOutput([...output]);

      const server = await device.gatt?.connect();
      
      if (server) {
        output.push('✓ GATT connected');
        output.push('Discovering services...');
        setTestOutput([...output]);

        const services = await server.getPrimaryServices();
        output.push(`✓ Found ${services.length} services:`);
        
        for (const service of services) {
          output.push(`  - ${service.uuid}`);
          
          try {
            const characteristics = await service.getCharacteristics();
            output.push(`    ${characteristics.length} characteristics`);
            
            for (const char of characteristics) {
              const props = [];
              if (char.properties.write) props.push('write');
              if (char.properties.writeWithoutResponse) props.push('writeWithoutResponse');
              if (char.properties.read) props.push('read');
              if (char.properties.notify) props.push('notify');
              
              output.push(`    - ${char.uuid}: ${props.join(', ')}`);
            }
          } catch (e: any) {
            output.push(`    Error reading characteristics: ${e.message}`);
          }
        }
        
        setTestOutput([...output]);

        setTimeout(() => {
          device.gatt?.disconnect();
          output.push('✓ Disconnected');
          setTestOutput([...output]);
        }, 2000);
      }
    } catch (error: any) {
      output.push(`✗ Error: ${error.message}`);
      setTestOutput([...output]);
    }
  };

  const testPrint = async () => {
    const output = [...testOutput];
    output.push('');
    output.push('=== TESTING PRINT ===');
    setTestOutput(output);

    const testReceipt = {
      canteenName: 'Test Canteen',
      canteenPhone: '1234567890',
      canteenAddress: '123 Test St',
      orderNumber: 'TEST-001',
      date: new Date().toISOString(),
      items: [
        { name: 'Test Item 1', quantity: 2, price: 50 },
        { name: 'Test Item 2', quantity: 1, price: 100 }
      ],
      total: 200,
      subtotal: 200,
      paymentMethod: 'Cash',
      createdAt: new Date().toISOString()
    };

    try {
      output.push('Calling printReceipt...');
      setTestOutput([...output]);
      
      await printReceipt(testReceipt);
      
      output.push('✓ Print function completed');
      setTestOutput([...output]);
    } catch (error: any) {
      output.push(`✗ Print error: ${error.message}`);
      setTestOutput([...output]);
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Printer Diagnostics</h1>
        <p className="text-muted-foreground">
          Test PWA installation and Bluetooth printer connectivity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
          <CardDescription>Current system capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>PWA Installed</span>
            <Badge variant={status.isPWAByFunction ? 'default' : 'secondary'}>
              {status.isPWAByFunction ? '✓ Yes' : '✗ No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Bluetooth Available</span>
            <Badge variant={status.isBluetoothAvailable ? 'default' : 'secondary'}>
              {status.isBluetoothAvailable ? '✓ Yes' : '✗ No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Display Mode</span>
            <Badge variant="outline">{status.displayMode}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Secure Context</span>
            <Badge variant={status.isSecureContext ? 'default' : 'destructive'}>
              {status.isSecureContext ? '✓ HTTPS' : '✗ HTTP'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Test printer functionality</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={runDiagnostics}>
            Refresh Diagnostics
          </Button>
          <Button onClick={testBluetoothConnection} disabled={!status.isBluetoothAvailable}>
            Test Bluetooth Connection
          </Button>
          <Button onClick={testPrint}>
            Test Print Receipt
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Output</CardTitle>
          <CardDescription>Detailed system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            {testOutput.map((line, i) => (
              <div key={i}>{line || '\u00A0'}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="text-amber-600">Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">📱 Android (Chrome)</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Open menu (⋮) → "Install app" or "Add to Home screen"</li>
              <li>Confirm installation</li>
              <li>Open app from home screen</li>
              <li>Enable Bluetooth in device settings</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🍎 iOS (Safari)</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Tap Share button</li>
              <li>Scroll down → "Add to Home Screen"</li>
              <li>Confirm</li>
              <li>Note: iOS Safari doesn't support Web Bluetooth</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🖨️ Printer Setup</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Turn on your Atpos printer</li>
              <li>Ensure it's in pairing mode (blinking LED)</li>
              <li>Test connection using button above</li>
              <li>Select your printer from the list</li>
              <li>Grant permission when prompted</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
