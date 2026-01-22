import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-stone-500">Configure your Misu ERP preferences</p>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-stone-100 p-4">
            <Settings className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-700">
            Settings Coming Soon
          </h3>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            This section will include cash balance configuration, user
            preferences, and integration settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
