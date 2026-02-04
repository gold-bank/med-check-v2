'use client';

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * 시간대 아이콘들 (v1 Icons.tsx에서 이식)
 */
const Icons = {
    dawn: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v3M6.3 6.3l2.1 2.1M3 12h3M6.3 17.7l2.1-2.1M12 21v-3M17.7 17.7l-2.1-2.1M21 12h-3M17.7 6.3l-2.1 2.1" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    ),
    morning: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
        </svg>
    ),
    sun: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="18.36" y1="4.22" x2="19.78" y2="5.64" />
            <line x1="4.22" y1="18.36" x2="5.64" y2="19.78" />
        </svg>
    ),
    cookie: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
            <circle cx="10" cy="14" r="1" fill="currentColor" />
            <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
    ),
    moon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    wait: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
};

type IconName = keyof typeof Icons;

interface TimeCardProps {
    slotId: string;
    label: string;
    iconName: string;
    notes: string[];
    allChecked: boolean;
    onGroupToggle: () => void;
    children: ReactNode;
    alarmTime?: string;
    isAlarmOn?: boolean;
    onAlarmToggle?: () => void;
}

/**
 * TimeCard 컴포넌트
 * v1 디자인을 shadcn/ui Card + Tailwind로 재구현
 */
export function TimeCard({
    label,
    iconName,
    notes,
    allChecked,
    onGroupToggle,
    children,
    alarmTime,
    isAlarmOn = false,
    onAlarmToggle,
}: TimeCardProps) {
    const Icon = Icons[iconName as IconName] || Icons.dawn;

    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onGroupToggle();
    };

    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onAlarmToggle?.();
    };

    return (
        <div className="flex mb-4 border-b border-border pb-3 last:border-b-0 last:mb-0 last:pb-0">
            {/* 카드 비주얼 (아이콘 영역) */}
            <div className="w-[50px] pt-1 flex flex-col items-center flex-shrink-0 mr-2 relative z-10">
                {/* 아이콘 박스 - 클릭 시 그룹 토글 */}
                <div
                    className={cn(
                        'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center mb-1',
                        'cursor-pointer transition-all duration-150',
                        'touch-manipulation select-none',
                        allChecked
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 active:bg-zinc-300'
                    )}
                    onClick={handleIconClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onGroupToggle();
                        }
                    }}
                >
                    <Icon />
                </div>

                {/* 라벨 */}
                <div className="font-extrabold text-[11px] text-zinc-800 tracking-tight pointer-events-none whitespace-nowrap">
                    {label}
                </div>

                {/* 디지털 시계 - 알람 토글 */}
                {alarmTime && (
                    <div
                        className={cn(
                            'font-digital text-xs mt-0.5 cursor-pointer transition-all',
                            'touch-manipulation select-none',
                            isAlarmOn
                                ? 'text-retro-blue font-bold'
                                : 'text-zinc-300'
                        )}
                        onClick={handleClockClick}
                        role="button"
                        tabIndex={0}
                        title={isAlarmOn ? '알람 끄기' : '알람 켜기'}
                    >
                        {alarmTime}
                    </div>
                )}
            </div>

            {/* 카드 콘텐츠 */}
            <div className="flex-1 flex flex-col gap-2 md:flex-row md:gap-4 relative z-[1]">
                {/* 약 목록 */}
                <div className="flex-1 md:flex-[1.6]">
                    {children}
                </div>

                {/* 주의사항 (notes) */}
                {notes.length > 0 && (
                    <div className="flex-1 md:pl-4 md:border-l md:border-dashed md:border-zinc-200 flex flex-col justify-center">
                        {notes.map((note, index) => (
                            <div key={index} className="text-xs text-zinc-600 mb-1 flex items-start leading-tight">
                                <span className="text-zinc-400 mr-1.5">▸</span>
                                <span>
                                    {/* 마크다운 **bold** 파싱 */}
                                    {note.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**') ? (
                                            <span key={i} className="font-bold text-orange-600 bg-amber-50 px-0.5 rounded">
                                                {part.slice(2, -2)}
                                            </span>
                                        ) : (
                                            <span key={i}>{part}</span>
                                        )
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
