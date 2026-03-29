'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface MenuFormProps {
  initialData?: {
    id: string;
    name: string;
    price: number;
    abbreviation?: string;
    aliases?: string[];
  };
  onSuccess?: () => void;
}

/**
 * Generate abbreviation from item name
 * e.g., "Chicken Tikka Masala" -> "CTM"
 */
function generateAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/);
  const abbrev = words
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return abbrev.length >= 2 ? abbrev : '';
}

export function MenuForm({ initialData, onSuccess }: MenuFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [abbreviation, setAbbreviation] = useState(initialData?.abbreviation || '');
  const [aliases, setAliases] = useState(initialData?.aliases?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate abbreviation when name changes (only if abbreviation is empty)
  useEffect(() => {
    if (name && !abbreviation) {
      const autoAbbrev = generateAbbreviation(name);
      if (autoAbbrev) {
        setAbbreviation(autoAbbrev);
      }
    }
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const numPrice = parseFloat(price);

      if (!name || !price || numPrice <= 0) {
        setError('Please fill all fields with valid values');
        setLoading(false);
        return;
      }

      // Parse aliases from comma-separated string
      const aliasArray = aliases
        .split(',')
        .map(a => a.trim().toUpperCase())
        .filter(a => a.length > 0);
      
      // Add abbreviation to aliases if not already present
      if (abbreviation && !aliasArray.includes(abbreviation.toUpperCase())) {
        aliasArray.unshift(abbreviation.toUpperCase());
      }

      const menuData = {
        name,
        price: numPrice,
        abbreviation: abbreviation.toUpperCase() || null,
        aliases: aliasArray.length > 0 ? aliasArray : null,
      };

      const resp = await fetch('/api/menu/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          menuData
        })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to save menu item');
      }

      setName('');
      setPrice('');
      setAbbreviation('');
      setAliases('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Item' : 'Add New Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Biryani, Dosa, Coffee"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 50.00"
            />
          </div>

          {/* Abbreviation Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <span className="text-xs text-muted-foreground">(for quick search)</span>
            </div>
            <div className="relative">
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="e.g., CTM for Chicken Tikka Masala"
                className="pr-10"
                maxLength={10}
              />
              {name && !abbreviation && (
                <button
                  type="button"
                  onClick={() => setAbbreviation(generateAbbreviation(name))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                  title="Auto-generate abbreviation"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Customers can search "{abbreviation || 'CTM'}" to find this item
            </p>
          </div>

          {/* Aliases Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="aliases">Additional Aliases</Label>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <Input
              id="aliases"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="e.g., Butter Chicken, BC (comma separated)"
            />
            <p className="text-xs text-muted-foreground">
              Alternative names or shortcuts customers might search for
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : (initialData ? 'Update Item' : 'Add Item')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

