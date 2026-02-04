'use client';

import { cn } from '@/lib/utils';

interface MedicineItemProps {
    id: string;
    name: string;
    dose: string;
    checked: boolean;
    disabled?: boolean;
    isActiveToday?: boolean;   // D3 활성일 (오렌지 테두리)
    isDanger?: boolean;        // MTX 활성일 (빨간 테두리)
    badge?: string;            // D-Day 뱃지 (TODAY, D-1, D-2 등)
    dayBadge?: string;         // 요일 뱃지 (월요일 등)
    showFolicWarning?: boolean;// 엽산 경고 표시
    onChange: (id: string, checked: boolean) => void;
}

/**
 * MedicineItem 컴포넌트
 * v1 디자인을 Tailwind로 재구현
 * - 체크박스 스타일 커스텀
 * - 활성일 애니메이션 (pulse)
 * - 뱃지 스마트 색상 로직
 */
export function MedicineItem({
    id,
    name,
    dose,
    checked,
    disabled = false,
    isActiveToday = false,
    isDanger = false,
    badge,
    dayBadge,
    showFolicWarning = false,
    onChange,
}: MedicineItemProps) {
    const handleClick = () => {
        if (!disabled) {
            onChange(id, !checked);
        }
    };

    // 뱃지 색상 결정: 비활성/체크됨 → 회색, 활성 → 오렌지/빨강
    const shouldBadgeBeGray = disabled || checked;

    const getDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'badge-gray';
        if (isDanger) return 'badge-danger';
        return 'badge-gray';
    };

    const getDDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'badge-gray';
        if (isDanger) return 'badge-danger';
        if (isActiveToday) return 'badge-active';
        return 'badge-gray';
    };

    return (
        <div
            className={cn(
                // 비활성 상태
                disabled && 'pointer-events-none',
            )}
        >
            <div
                className={cn(
                    // 기본 스타일
                    'flex items-center bg-white border rounded-lg p-2 mb-1.5 cursor-pointer relative max-w-full overflow-hidden',
                    'transition-all duration-200 touch-manipulation select-none',

                    // 체크된 상태
                    checked && !disabled && 'checked-opacity bg-zinc-50 border-transparent',

                    // 비활성 상태
                    disabled && 'bg-zinc-50 border-dashed border-zinc-300 checked-opacity',

                    // 활성 상태 (체크 안된 경우만)
                    !checked && !disabled && isActiveToday && 'border-active-orange animate-pulse-border',
                    !checked && !disabled && isDanger && 'border-warning-red animate-pulse-danger',
                    !checked && !disabled && showFolicWarning && 'border-active-orange animate-pulse-border',

                    // 기본 테두리
                    !checked && !disabled && !isActiveToday && !isDanger && !showFolicWarning && 'border-zinc-200',
                )}
                onClick={handleClick}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                {/* 체크 서클 */}
                <div
                    className={cn(
                        'w-[18px] h-[18px] rounded-full border-[1.5px] mr-1.5 flex-shrink-0 relative transition-all duration-200',
                        checked || disabled
                            ? 'bg-zinc-400 border-zinc-400'
                            : 'bg-white border-zinc-300',
                    )}
                >
                    {/* 체크마크 */}
                    {(checked || disabled) && (
                        <svg
                            className="absolute inset-0 w-full h-full p-0.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>

                {/* 텍스트 영역 */}
                <div className="flex items-center flex-wrap gap-1 flex-1 min-w-0">
                    {/* 약 이름 */}
                    <span
                        className={cn(
                            'font-bold text-sm text-zinc-800',
                            (checked || disabled) && 'checked-text',
                        )}
                    >
                        {name}
                    </span>

                    {/* 용량 */}
                    {dose && (
                        <span
                            className={cn(
                                'text-xs text-zinc-500',
                                (checked || disabled) && 'checked-text',
                            )}
                        >
                            {dose}
                        </span>
                    )}

                    {/* 엽산 경고 */}
                    {showFolicWarning && (
                        <span
                            className={cn(
                                'text-xs text-zinc-500 ml-1',
                                (checked || disabled) && 'checked-text',
                            )}
                        >
                            ★화요일은 저녁 복용★
                        </span>
                    )}

                    {/* 요일 뱃지 */}
                    {dayBadge && (
                        <span
                            className={cn(
                                'inline-block text-[10px] px-1.5 py-0.5 rounded font-extrabold ml-1',
                                getDayBadgeClass(),
                            )}
                        >
                            {dayBadge}
                        </span>
                    )}

                    {/* D-Day 뱃지 */}
                    {badge && (
                        <span
                            className={cn(
                                'inline-block text-[10px] px-1.5 py-0.5 rounded font-extrabold ml-1',
                                getDDayBadgeClass(),
                            )}
                        >
                            {badge}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
