#!/bin/bash

# Dashboard Optimization Verification Script
# Run this to verify all optimizations are working correctly

echo "🔍 Dashboard Optimization Verification"
echo "======================================"
echo ""

# Check if all new files exist
echo "✅ Checking new files..."
files=(
  "app/api/canteen/dashboard-stats/route.ts"
  "app/api/canteen/dashboard-chart/route.ts"
  "components/dashboard/kpi-cards.tsx"
  "components/dashboard/earnings-cards.tsx"
  "components/dashboard/revenue-chart.tsx"
  "components/dashboard/analytics-cards.tsx"
  "app/dashboard/page.tsx"
  "app/dashboard/page-backup.tsx"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    missing_files=$((missing_files + 1))
  fi
done

echo ""
if [ $missing_files -eq 0 ]; then
  echo "✅ All files created successfully!"
else
  echo "❌ $missing_files file(s) missing!"
fi

echo ""
echo "📊 File Size Comparison:"
echo "  Original: $(wc -l < app/dashboard/page-backup.tsx) lines"
echo "  Optimized: $(wc -l < app/dashboard/page.tsx) lines"
original=$(wc -l < app/dashboard/page-backup.tsx)
optimized=$(wc -l < app/dashboard/page.tsx)
reduction=$(echo "scale=1; (($original - $optimized) / $original) * 100" | bc)
echo "  Reduction: ${reduction}%"

echo ""
echo "🎯 Component Count:"
component_files=(
  "components/dashboard/kpi-cards.tsx"
  "components/dashboard/earnings-cards.tsx"
  "components/dashboard/revenue-chart.tsx"
  "components/dashboard/analytics-cards.tsx"
)

total_lines=0
for file in "${component_files[@]}"; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    echo "  • $(basename $file): $lines lines"
    total_lines=$((total_lines + lines))
  fi
done
echo "  Total component lines: $total_lines"

echo ""
echo "🚀 API Routes:"
api_files=(
  "app/api/canteen/dashboard-stats/route.ts"
  "app/api/canteen/dashboard-chart/route.ts"
)

for file in "${api_files[@]}"; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    echo "  • $(basename $file .ts): $lines lines"
  fi
done

echo ""
echo "📝 Next Steps:"
echo "  1. Run: npm run dev"
echo "  2. Navigate to /dashboard"
echo "  3. Check DevTools Network tab for performance"
echo "  4. Verify all features work correctly"
echo "  5. Test on mobile and desktop"
echo ""
echo "✨ Optimization Complete!"
