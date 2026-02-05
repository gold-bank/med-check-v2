'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icons';

type IconName = 'dawn' | 'morning' | 'sun' | 'cookie' | 'moon' | 'wait' | 'info-bold';

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
        <div className="flex mb-[15px] border-b border-[#ccc] pb-[12px] last:border-b-0 last:mb-0 last:pb-0 relative">
            {/* 카드 비주얼 (아이콘 영역) - Fixed width 50px */}
            <div className="w-[50px] pt-[5px] flex flex-col items-center flex-shrink-0 mr-[8px] relative z-10 self-start text-center select-none touch-none">
                {/* 아이콘 박스 - 클릭 시 그룹 토글 */}
                <div
                    className={cn(
                        'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center mb-[4px]',
                        'cursor-pointer transition-all duration-150 ease-linear',
                        allChecked
                            ? 'bg-[rgba(51,51,51,0.8)] text-white hover:bg-[rgba(51,51,51,1)]'
                            : 'bg-[#f8f9fa] text-[#555] active:bg-[#e0e0e0]'
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
                    <Icon name={iconName as IconName} />
                </div>

                {/* 라벨 */}
                <div className="font-[800] text-[11px] text-[#333] mb-[2px] tracking-[-0.5px] pointer-events-none whitespace-nowrap">
                    {label}
                </div>

                {/* 디지털 시계 - 알람 토글 */}
                {alarmTime && (
                    <div
                        className={cn(
                            'font-digital text-[12px] mt-[2px] cursor-pointer transition-all duration-200',
                            'tracking-[0.5px] text-center italic font-bold',
                            isAlarmOn
                                ? 'text-retro-blue'
                                : 'text-[#ccc]'
                        )}
                        onClick={handleClockClick}
                        role="button"
                        tabIndex={0}
                        title={isAlarmOn ? '알람 끄기' : '알람 켜기'}
                        style={{ fontFamily: "'DSEG7-Classic', monospace" }}
                    >
                        {alarmTime}
                    </div>
                )}
            </div>

            {/* 카드 콘텐츠 */}
            <div className="flex-1 flex flex-col gap-[8px] relative z-[1] md:flex-row md:gap-[15px]">
                {/* 약 목록 */}
                <div className="flex-1 md:flex-[1.6]">
                    {children}
                </div>

                {/* 주의사항 (notes) */}
                {notes.length > 0 && (
                    <div className="flex flex-col justify-center md:flex-1 md:pl-[15px] md:border-l md:border-dashed md:border-[#eee]">
                        {notes.map((note, index) => (
                            <div key={index} className="text-[12px] text-[#666] mb-[3px] flex items-start leading-[1.3]">
                                <span className="text-[#888] mr-[6px] text-[12px]">▸</span>
                                <span>
                                    {/* 마크다운 **bold** 파싱 */}
                                    {note.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**') ? (
                                            <span key={i} className="font-[700] text-[#d35400] bg-[#fff8e1] px-[3px] rounded-[3px]">
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



