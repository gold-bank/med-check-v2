'use client';

/**
 * 헤더 컴포넌트
 * - 앱 타이틀
 * - 배포/빌드 날짜 표시
 * - 알람 설정 버튼
 * - 초기화 버튼
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RefreshCw, RotateCcw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlarmStore } from '@/store/useAlarmStore';

interface HeaderProps {
    buildDate?: string;
    onReset?: () => Promise<void>;
    onAlarmClick?: () => void;
}

export function Header({ buildDate, onReset, onAlarmClick }: HeaderProps) {
    const [isResetting, setIsResetting] = useState(false);
    const resetAllMeds = useAlarmStore((state) => state.resetAllMeds);

    // 빌드 날짜 포맷
    const formattedDate = buildDate
        ? format(new Date(buildDate), 'M월 d일 (EEE)', { locale: ko })
        : format(new Date(), 'M월 d일 (EEE)', { locale: ko });

    const handleReset = async () => {
        if (isResetting) return;

        const confirmed = window.confirm('오늘의 모든 체크 기록을 초기화할까요?');
        if (!confirmed) return;

        setIsResetting(true);

        try {
            // 로컬 상태 초기화
            resetAllMeds();

            // 서버 데이터도 초기화 (옵션)
            if (onReset) {
                await onReset();
            }
        } catch (error) {
            console.error('Reset failed:', error);
        } finally {
            setIsResetting(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* 로고/타이틀 */}
                <div className="flex items-center gap-2">
                    <img
                        src="/pill-icon.png"
                        alt="Med Check"
                        className="w-7 h-7"
                    />
                    <h1 className="font-bold text-lg text-zinc-800 tracking-tight">
                        약 체크
                    </h1>
                </div>

                {/* 우측 영역 */}
                <div className="flex items-center gap-2">
                    {/* 업데이트 날짜 */}
                    <span className="text-xs text-zinc-400 mr-2">
                        {formattedDate}
                    </span>

                    {/* 알람 설정 버튼 */}
                    {onAlarmClick && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAlarmClick}
                            className="h-8 w-8 text-zinc-500 hover:text-retro-blue"
                            title="알람 설정"
                        >
                            <Bell className="h-4 w-4" />
                        </Button>
                    )}

                    {/* 새로고침 버튼 */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>

                    {/* 초기화 버튼 */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        disabled={isResetting}
                        className="h-8 w-8 text-zinc-500 hover:text-red-500"
                    >
                        <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>
        </header>
    );
}
