import { useState, type FC } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';

interface Props {
  connected: boolean;
  onConnect: () => void;
  onReadAll: () => void;
  onEnterDemoMode: () => void;
}

export const EmptyStateCard: FC<Props> = ({ connected, onConnect, onReadAll, onEnterDemoMode }) => {
  const [troubleOpen, setTroubleOpen] = useState(false);

  if (!connected) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full">
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <img
              src="/large_logo.webp"
              alt="くっつきー"
              className="h-[256px] w-[256px] object-contain"
            />
            <Button
              onClick={onConnect}
              aria-label="デバイスに接続"
              className="px-10 text-base font-bold shadow-md"
            >
              接続する
            </Button>

            {/* Browser support badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                  Chrome のみ対応
                </span>
                <a
                  href="https://developer.mozilla.org/docs/Web/API/WebHID_API"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  対応状況 ↗
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Firefox・Safari はご利用いただけません
              </p>
            </div>

            {/* Collapsible troubleshooting */}
            <div className="w-full max-w-sm text-center">
              <button
                onClick={() => setTroubleOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {troubleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                接続できない場合は...
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${troubleOpen ? 'max-h-40' : 'max-h-0'}`}
              >
                <ul className="mt-2 space-y-1 pl-4 text-xs text-muted-foreground">
                  <li>• USBケーブルを抜き差しし、少し待ってからリロードしてください</li>
                  <li>• ペンダントのファームウェアが最新かを確認してください</li>
                </ul>
              </div>
            </div>

            {/* Feedback link */}
            <p className="text-xs text-muted-foreground">
              ご要望は{' '}
              <a
                href="https://x.com/cue2keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                X
              </a>{' '}
              または{' '}
              <a
                href="https://github.com/esplo/cue2keys_resources"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                GitHub
              </a>{' '}
              でお知らせください
            </p>

            <Button onClick={onEnterDemoMode} aria-label="デモモードを開始" variant="outline">
              デモモードで試す
            </Button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="my-6">
      <Card>
        <CardTitle>
          {connected ? '未読み込みのパラメーターがあります' : 'デバイスに未接続です'}
        </CardTitle>
        <CardContent>
          <p className="mb-3 text-secondary-foreground">
            {connected
              ? '全ての値を読み込んでから設定を表示します。再接続または Read All を実行してください。'
              : '設定を変更するには、デバイスに接続してください。'}
          </p>
          <div className="flex gap-2">
            <Button onClick={onConnect} aria-label="デバイスに接続">
              接続する
            </Button>
            {connected && (
              <Button onClick={onReadAll} aria-label="全設定を読み込む">
                全て読み込む
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
