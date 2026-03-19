import type { FC } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Props {
  connected: boolean;
  demoMode: boolean;
  onConnect?: () => void;
  onDisconnect: () => void;
  search: string;
  onSearch: (q: string) => void;
  ready: boolean;
}

export const Header: FC<Props> = ({
  connected,
  demoMode,
  onConnect,
  onDisconnect,
  search,
  onSearch,
  ready,
}) => {
  return (
    <header
      className={`relative sticky z-30 overflow-hidden border-b border-border/50 bg-background ${
        demoMode ? 'top-[var(--demo-banner-height)]' : 'top-0'
      }`}
      role="banner"
    >
      {/* Background layers */}
      <div className="bg-rainbow-gradient absolute bottom-0 h-1 w-full" aria-hidden="true" />
      <img src="/U1.webp" className="char-walk" aria-hidden="true" alt="" />
      {/* Foreground content */}
      <div className="relative z-10">
        <div className="container flex max-w-none items-center justify-between gap-3 py-3">
          <div className="flex items-center">
            <img src="/logo.webp" alt="くっつきー" className="h-8 object-contain" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ready && (
              <Input
                aria-label="設定を検索"
                placeholder="検索..."
                value={search}
                onInput={(e) => onSearch((e.currentTarget as HTMLInputElement).value)}
                className="w-52"
              />
            )}
            {connected && (
              <Button onClick={onDisconnect} aria-label="デバイスを切断" variant="outline">
                切断
              </Button>
            )}
            {!connected && onConnect && (
              <Button onClick={onConnect} aria-label="デバイスに接続">
                接続
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
