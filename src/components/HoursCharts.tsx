
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

const HoursCharts = () => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold text-reportronic-800">{t('hours_by_client')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-80">
          <div className="flex items-center justify-center h-full">
            <p>{t('no_data')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold text-reportronic-800">{t('hours_by_project')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-80">
          <div className="flex items-center justify-center h-full">
            <p>{t('no_data')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursCharts;
