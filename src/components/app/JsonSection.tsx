import type { FC } from 'react';
import { useState } from 'react';
import { JsonConfigCard } from '@/components/JsonConfigCard';
import { useParamStore } from '@/store/paramStore';

interface Props {
  onExport: (options: { includeSettings: boolean; includeNicknames: boolean }) => Promise<void>;
  onImport: () => boolean;
  onSaveAll: () => Promise<void>;
}

export const JsonSection: FC<Props> = ({ onExport, onImport, onSaveAll }) => {
  const { jsonText, setJsonText } = useParamStore();
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeNicknames, setIncludeNicknames] = useState(true);
  const [showSaveAll, setShowSaveAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const handleExport = async (options: { includeSettings: boolean; includeNicknames: boolean }) => {
    setExporting(true);
    try {
      await onExport(options);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    const hasParams = onImport();
    if (hasParams) setShowSaveAll(true);
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      await onSaveAll();
      setShowSaveAll(false);
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <JsonConfigCard
      jsonText={jsonText}
      onChangeText={setJsonText}
      onExport={handleExport}
      onImport={handleImport}
      exportOptions={{ includeSettings, includeNicknames }}
      onToggleExportSettings={setIncludeSettings}
      onToggleExportNicknames={setIncludeNicknames}
      showSaveAll={showSaveAll}
      onSaveAll={handleSaveAll}
      exporting={exporting}
      savingAll={savingAll}
    />
  );
};
