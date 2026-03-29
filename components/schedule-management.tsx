"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Clock, Search, Plus, Trash2, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function calculateCompletionTime(endTime: string | null | undefined, prepTimeMins: number | null | undefined) {
  if (!endTime || !prepTimeMins) return '';
  const [h, m] = endTime.split(':').map(Number);
  const totalMins = h * 60 + m + prepTimeMins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function calculatePrepTimeMins(endTime: string | null | undefined, completionTime: string | null | undefined) {
  if (!endTime || !completionTime) return null;
  const [eh, em] = endTime.split(':').map(Number);
  const [ch, cm] = completionTime.split(':').map(Number);
  let eMins = eh * 60 + em;
  let cMins = ch * 60 + cm;
  if (cMins < eMins) {
    cMins += 24 * 60; // Next day
  }
  return cMins - eMins;
}

interface Schedule {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  cooking_time: number | null;
  capacity: number | null;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  category_id?: string;
  categories?: { name: string };
  supports_scheduled?: 'both' | 'on-demand' | 'scheduling';
}

interface MenuScheduleMapping {
  id?: string;
  menu_item_id: string;
  schedule_id: string;
}

export function ScheduleManagement() {
  const { isSuperAdmin, user, loading: authLoading } = useAuth();
  const canteenId = user?.canteen_id;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [originalSchedules, setOriginalSchedules] = useState<Schedule[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mappings, setMappings] = useState<MenuScheduleMapping[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [savingSchedule, setSavingSchedule] = useState<string | null>(null);
  const [togglingMenu, setTogglingMenu] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (canteenId) {
      fetchData();
    } else if (!authLoading && !canteenId) {
      setLoading(false);
    }
  }, [canteenId, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, menuRes, mapRes] = await Promise.all([
        fetch(`/api/schedules?canteen_id=${canteenId}`),
        fetch(`/api/menu`),
        fetch(`/api/menu-schedules?canteen_id=${canteenId}`)
      ]);

      if (!schedRes.ok) throw new Error('Failed to load schedules');
      if (!menuRes.ok) throw new Error('Failed to load menu');

      const schedData = await schedRes.json();
      const menuData = await menuRes.json();
      
      let mapData = [];
      if (mapRes.ok) {
        mapData = await mapRes.json();
      }

      setSchedules(schedData || []);
      setOriginalSchedules(JSON.parse(JSON.stringify(schedData || [])));
      setMenuItems(menuData || []);
      setMappings(mapData || []);

      if (schedData && schedData.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(schedData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load schedules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSchedule = useMemo(() => 
    schedules.find(s => s.id === selectedScheduleId),
    [schedules, selectedScheduleId]
  );

  const isDirty = useMemo(() => {
    if (!selectedSchedule) return false;
    const original = originalSchedules.find(s => s.id === selectedSchedule.id);
    if (!original) return false;
    // Compare essential fields
    return JSON.stringify(selectedSchedule) !== JSON.stringify(original);
  }, [selectedSchedule, originalSchedules]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, searchTerm]);

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    if (!canteenId) {
      toast.error("Canteen ID missing. Please refresh.");
      return;
    }
    
    try {
      setCreating(true);
      
      const payload = {
        name: newScheduleName,
        canteen_id: canteenId,
        is_active: true,
        start_time: '08:00:00',
        end_time: '22:00:00',
        cooking_time: 20
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create schedule');
      }
      
      const newSched = resData;
      setSchedules(prev => [...prev, newSched]);
      setOriginalSchedules(prev => [...prev, JSON.parse(JSON.stringify(newSched))]);
      setSelectedScheduleId(newSched.id);
      setCreateDialogOpen(false);
      setNewScheduleName('');
      toast.success('Schedule created');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleScheduleChange = (id: string, field: keyof Schedule, value: any) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveSchedule = async (sched: Schedule) => {
    try {
      setSavingSchedule(sched.id);
      
      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sched)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Update failed');
      }
      
      
      setOriginalSchedules(prev => prev.map(s => s.id === sched.id ? JSON.parse(JSON.stringify(sched)) : s));
      toast.success(`${sched.name} schedule updated`);
    } catch (err: any) {
      toast.error(`Failed to update ${sched.name}: ${err.message}`);
    } finally {
      setSavingSchedule(null);
    }
  };

  const deleteSchedule = async (sched: Schedule) => {
    if (!confirm(`Are you sure you want to delete ${sched.name}?`)) return;
    
    try {
      const res = await fetch(`/api/schedules?id=${sched.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Deleted successfully');
      setSchedules(prev => prev.filter(s => s.id !== sched.id));
      setOriginalSchedules(prev => prev.filter(s => s.id !== sched.id));
      if (selectedScheduleId === sched.id) {
        setSelectedScheduleId(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleMapping = async (menuItemId: string, scheduleId: string, isCurrentlyMapped: boolean) => {
    try {
      setTogglingMenu(menuItemId);
      
      if (isCurrentlyMapped) {
        // DELETE
        const res = await fetch(`/api/menu-schedules?menu_item_id=${menuItemId}&schedule_id=${scheduleId}`, { 
          method: 'DELETE' 
        });
        if (!res.ok) throw new Error('Failed to unmap');
        setMappings(prev => prev.filter(m => !(m.menu_item_id === menuItemId && m.schedule_id === scheduleId)));
        toast.success('Item removed from schedule');
      } else {
        // POST
        const res = await fetch(`/api/menu-schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menu_item_id: menuItemId, schedule_id: scheduleId })
        });
        if (!res.ok) throw new Error('Failed to map');
        
        const newMap = await res.json();
        setMappings(prev => [...prev, newMap]);
        toast.success('Item added to schedule');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTogglingMenu(null);
    }
  };

  if (isSuperAdmin) {
    return (
      <div className="flex justify-center items-center p-12 text-slate-500">
        Super Admin cannot manage individual canteen schedules.
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!canteenId && !isSuperAdmin) {
    return (
      <div className="flex justify-center items-center p-12 text-slate-500">
        No Canteen Profile Found.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-slate-100">
            <Clock className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-slate-400" />
            <span className="truncate">Schedule Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure meal windows and mapping menu items to windows.
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md h-10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Left Panel: Schedules List */}
        <div className="w-full md:w-1/3 flex flex-col gap-3">
          <h3 className="text-base font-bold mb-1 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-800 dark:text-slate-200">
            Schedules
          </h3>
          {schedules.length === 0 ? (
            <div className="text-slate-400 italic p-4 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed text-sm text-center">No schedules found.</div>
          ) : (
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
              {schedules.map((sched) => (
                <Button 
                  key={sched.id}
                  variant={selectedScheduleId === sched.id ? 'default' : 'outline'}
                  className={cn(
                    "shrink-0 h-12 md:h-14 justify-start text-sm font-bold rounded-xl transition-all border-slate-800",
                    selectedScheduleId === sched.id
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md border-transparent'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  )}
                  onClick={() => setSelectedScheduleId(sched.id)}
                >
                  <Clock className={cn(
                    "w-4 h-4 mr-3 shrink-0", 
                    selectedScheduleId === sched.id ? 'text-white' : 'text-slate-400'
                  )} />
                  <span className="truncate capitalize">{sched.name}</span>
                  {!sched.is_active && (
                    <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Off</span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Schedule Details & Mappings */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          {selectedScheduleId && selectedSchedule ? (
            <>
              {/* Settings Card */}
              <Card className="p-4 sm:p-6 bg-[#1e1b2e] border-slate-800 shadow-xl rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2 text-slate-100 capitalize">
                      {selectedSchedule.name} Schedule
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch 
                        checked={selectedSchedule.is_active} 
                        onCheckedChange={(c) => handleScheduleChange(selectedSchedule.id, 'is_active', c)}
                        className="data-[state=checked]:bg-green-500 scale-90"
                        id="active-status"
                      />
                      <Label htmlFor="active-status" className="text-sm font-bold text-slate-300 capitalize cursor-pointer">
                        {selectedSchedule.name} Schedule is Active
                      </Label>
                    </div>
                  </div>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSchedule(selectedSchedule)}
                    className="bg-red-600 text-white hover:bg-red-700 font-bold shadow-md h-9 px-3 border-none"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete This Schedule
                  </Button>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-slate-200 mb-3">Ordering Window</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Start Window (IST)</label>
                        <div className="relative group/time">
                          <Input 
                            type="time" 
                            value={selectedSchedule.start_time?.substring(0, 5) || ''} 
                            onChange={(e) => handleScheduleChange(selectedSchedule.id, 'start_time', e.target.value || null)}
                            className="bg-slate-900 border-slate-800 text-slate-100 h-10 font-medium pr-10"
                          />
                          {selectedSchedule.start_time && (
                            <button 
                              onClick={() => handleScheduleChange(selectedSchedule.id, 'start_time', null)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 transition-colors"
                              title="Clear time"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">End Window (IST)</label>
                        <div className="relative group/time">
                          <Input 
                            type="time" 
                            value={selectedSchedule.end_time?.substring(0, 5) || ''} 
                            onChange={(e) => handleScheduleChange(selectedSchedule.id, 'end_time', e.target.value || null)}
                            className="bg-slate-900 border-slate-800 text-slate-100 h-10 font-medium pr-10"
                          />
                          {selectedSchedule.end_time && (
                            <button 
                              onClick={() => handleScheduleChange(selectedSchedule.id, 'end_time', null)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 transition-colors"
                              title="Clear time"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                      This is the interval in which students can order. If it is null then after the cutoff time then the canteen owners will recieve orders for the next day once the end time passes in the current day.
                    </p>
                  </div>
                  
                  <div className="mt-1">
                    <div className="space-y-1.5 w-1/2 pr-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Completion Time (IST)</label>
                      <div className="relative group/time">
                        <Input 
                          type="time" 
                          value={calculateCompletionTime(selectedSchedule.end_time, selectedSchedule.cooking_time)} 
                          onChange={(e) => {
                            if (!selectedSchedule.end_time) {
                              toast.error("Please set the End Window time first");
                              return;
                            }
                            const newPrepTime = calculatePrepTimeMins(selectedSchedule.end_time, e.target.value);
                            handleScheduleChange(selectedSchedule.id, 'cooking_time', newPrepTime);
                          }}
                          className="bg-slate-900 border-slate-800 text-slate-100 h-10 font-medium pr-10"
                        />
                        {selectedSchedule.cooking_time && (
                          <button 
                            onClick={() => handleScheduleChange(selectedSchedule.id, 'cooking_time', null)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 transition-colors"
                            title="Clear time"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                      This is the time when the meal will be prepared completely by your kitchen, after the End Window passes.
                    </p>
                  </div>

                  <Button 
                    onClick={() => saveSchedule(selectedSchedule)} 
                    disabled={savingSchedule === selectedSchedule.id || !isDirty}
                    className={cn(
                      "w-full h-11 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white mt-2 shadow-lg hover:shadow-red-900/20 active:scale-[0.98] transition-all capitalize",
                      !isDirty && "opacity-50 grayscale shadow-none pointer-events-none"
                    )}
                  >
                    {savingSchedule === selectedSchedule.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save {selectedSchedule.name} timings
                  </Button>
                </div>
              </Card>

              {/* Menu Item Bindings */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-200 capitalize">
                      Menu Scheduled For {selectedSchedule.name}
                    </h4>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input 
                      placeholder="Search..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 text-xs bg-slate-900 border-slate-800 text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="bg-slate-900/50 border text-sm border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {filteredMenuItems.length === 0 ? (
                    <div className="text-slate-500 italic p-6 text-center bg-slate-900/20">
                      No matching items.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                      {filteredMenuItems.map((item) => {
                        const isMapped = mappings.some(m => m.menu_item_id === item.id && m.schedule_id === selectedScheduleId);
                        const isToggleLoading = togglingMenu === item.id;
                        
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-800 transition-colors">
                            <div className="min-w-0 pr-4">
                              <h5 className="font-semibold text-slate-200 truncate">{item.name}</h5>
                            </div>
                            <div className="shrink-0 flex items-center justify-end">
                              {isToggleLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : (
                                <Switch 
                                  checked={isMapped}
                                  onCheckedChange={() => toggleMapping(item.id, selectedScheduleId, isMapped)}
                                  disabled={item.supports_scheduled === 'on-demand'}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Card className="flex items-center justify-center p-12 bg-slate-900/30 border-slate-800 border-dashed border-2 text-slate-400 rounded-xl">
              <div className="text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a schedule profile to manage.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#1e1b2e] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>New Schedule Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-300">Profile Name</Label>
              <Input
                id="name"
                placeholder="e.g. Lunch"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-100"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleCreateSchedule} disabled={creating || !newScheduleName.trim()} className="bg-red-600 hover:bg-red-700 text-white h-9">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
