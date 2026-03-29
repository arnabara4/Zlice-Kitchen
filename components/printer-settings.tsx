'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Printer, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { isWebBluetoothAvailable, isPWAInstalled, forgetPrinter, getSavedPrinterName, setCachedDevice } from '@/lib/printer/pwa-printer';

export function PrinterSettings() {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState('');

  const loadStatus = () => {
    const btAvailable = isWebBluetoothAvailable();
    const pwaInstalled = isPWAInstalled();
    const printer = getSavedPrinterName();
    
    setIsBluetoothAvailable(btAvailable);
    setIsPWA(pwaInstalled);
    setSavedPrinter(printer);

    const saved = localStorage.getItem('printer-bluetooth-enabled');
    if (saved !== null) {
      setBluetoothEnabled(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggle = (checked: boolean) => {
    setBluetoothEnabled(checked);
    localStorage.setItem('printer-bluetooth-enabled', JSON.stringify(checked));
  };

  const handleForgetPrinter = () => {
    if (confirm('Forget saved printer? You will need to pair again on next print.')) {
      forgetPrinter();
      setSavedPrinter(null);
      setTestStatus('✓ Printer forgotten');
      setTimeout(() => setTestStatus(''), 2000);
    }
  };

  const testBluetooth = async () => {
    if (!isBluetoothAvailable) {
      alert('Web Bluetooth is not available on this device/browser');
      return;
    }

    setTestStatus('Requesting device...');
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fff0-0000-1000-8000-00805f9b34fb'
        ]
      });

      if (device) {
        setTestStatus('Connecting...');
        const server = await device.gatt?.connect();
        
        if (server) {
          localStorage.setItem('bluetooth-printer-id', device.id);
          localStorage.setItem('bluetooth-printer-name', device.name || 'Unknown Printer');
          setSavedPrinter(device.name || 'Unknown Printer');
          
          setCachedDevice(device);
          setTestStatus(`✓ Connected: ${device.name || 'Printer'}`);
          
          alert(`✓ Successfully connected!\n${device.name || 'Unknown Printer'}\n\nThis printer will be remembered.\nNo dialog will appear on next print.`);
          
          setTimeout(() => {
            // device.gatt?.disconnect(); // Don't disconnect! Keep it active for this session
            setTestStatus('');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Bluetooth test failed:', error);
      setTestStatus('');
      
      if (error.message?.includes('User cancelled')) {
        return;
      }
      
      alert(`Connection failed: ${error.message}\n\nMake sure:\n• Printer is on\n• In pairing mode\n• Bluetooth enabled`);
    }
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Printer Settings
        </CardTitle>
        <CardDescription>
          Configure Bluetooth thermal printer for customer bills and kitchen KOTs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">PWA Installed</span>
            </div>
            {isPWA ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                No
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Bluetooth Available</span>
            </div>
            {isBluetoothAvailable ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                No
              </Badge>
            )}
          </div>

          {savedPrinter && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    Saved Printer
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {savedPrinter}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForgetPrinter}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bluetooth-print" className="text-base">
                Bluetooth Printing
              </Label>
              <p className="text-sm text-muted-foreground">
                Direct print to thermal printer
              </p>
            </div>
            <Switch
              id="bluetooth-print"
              checked={bluetoothEnabled}
              onCheckedChange={handleToggle}
              disabled={!isBluetoothAvailable}
            />
          </div>

          {testStatus && (
            <div className="text-sm text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              {testStatus}
            </div>
          )}

          <Button
            onClick={testBluetooth}
            variant={savedPrinter ? "outline" : "default"}
            className="w-full"
            disabled={!isBluetoothAvailable || !bluetoothEnabled}
          >
            <Bluetooth className="w-4 h-4 mr-2" />
            {savedPrinter ? 'Change Printer' : 'Connect Printer'}
          </Button>
          {!bluetoothEnabled && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
              Enable Bluetooth Printing above to connect a printer
            </p>
          )}
        </div>

        {savedPrinter && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-300">
              ✓ Printer saved! No pairing dialog will appear on next print.
            </p>
          </div>
        )}

        {!isBluetoothAvailable && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Requires Chrome/Edge on Android. Install as PWA for best experience.
            </p>
          </div>
        )}

        {/* Unified Printer Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                One Printer, Two Formats
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This printer handles <strong>both customer bills</strong> (with prices) and <strong>kitchen KOTs</strong> (without prices). 
                Use the "Bill" and "KOT" buttons to print different formats to the same printer.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

