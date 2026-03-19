import type { FC } from 'react';
import { AddressEditor } from './AddressEditor';
import { Card, CardContent, CardTitle } from './ui/card';

interface Props {
  note: string;
  label: string;
  value: number;
  onSubmit: (nextAddr: number) => Promise<void> | void;
}

export const StaticAddressUpdateCard: FC<Props> = ({ note, label, value, onSubmit }) => {
  return (
    <section className="my-6">
      <Card>
        <CardTitle>ch0 アドレス更新</CardTitle>
        <CardContent>
          <p className="text-xs text-secondary-foreground">{note}</p>
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2">
            <div className="text-xs font-medium text-secondary-foreground">{label}</div>
            <AddressEditor
              value={value}
              onSubmit={(nextAddr) => onSubmit(nextAddr)}
              buttonLabel="更新"
              submitLabel="更新"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
