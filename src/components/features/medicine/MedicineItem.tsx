'use client';

import { cn } from '@/lib/utils';

interface MedicineItemProps {
    id: string;
    name: string;
    dose: string;
    checked: boolean;
    disabled?: boolean;
    isActiveToday?: boolean;
    isDanger?: boolean;
    badge?: string;
    dayBadge?: string;
    showFolicWarning?: boolean;
    onChange: (id: string, checked: boolean) => void;
    isCycleMed?: boolean;
}

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
    isCycleMed = false,
}: MedicineItemProps) {
    const handleClick = () => {
        if (!disabled) {
            onChange(id, !checked);
        }
    };

    // 뱃지 색상 (Tailwind 유틸리티로 변환)
    const getBadgeStyle = () => {
        if (disabled || checked) return 'bg-[#e0e0e0] text-[#777]';
        if (isDanger) return 'bg-[#ff6b6b] text-white'; // MTX
        if (isActiveToday) return 'bg-[#FFB74D] text-white'; // D3 Active
        return 'bg-[#e0e0e0] text-[#777]';
    };

    const getDayBadgeStyle = () => {
        if (disabled || checked) return 'bg-[#e0e0e0] text-[#777]';
        if (isDanger) return 'bg-[#ff6b6b] text-white';
        return 'bg-[#e0e0e0] text-[#777]';
    };

    // 컨테이너 스타일 ( v1 .med-item-label 1:1 변환 )
    const containerClass = cn(
        // 공통 레이아웃
        'flex items-center w-full relative overflow-hidden transition-all duration-200 select-none touch-manipulation',
        'bg-white border border-[#e0e0e0] rounded-[8px] p-[8px] mb-[5px] cursor-pointer',

        // 1. 체크됨 (Checked)
        checked && !disabled && 'bg-[#f9f9f9] opacity-60',

        // 2. 비활성 (Disabled)
        disabled && 'opacity-50 border-dashed cursor-not-allowed pointer-events-none bg-[#fff] border-[#ddd]',

        // 3. D3 활성 (Active Today - D3)
        !disabled && !checked && isActiveToday && isCycleMed && !isDanger &&
        'bg-[#FFFDF7] border-[#FFB74D] animate-pulse-border',

        // 4. MTX 활성 (Active Danger - MTX)
        !disabled && !checked && isDanger &&
        'bg-[#fffefe] border-[#ff6b6b] animate-pulse-danger',

        // 5. 화요일 엽산 (Folic Warning Mode)
        !disabled && !checked && showFolicWarning && !isCycleMed &&
        'bg-[#fff0f0] border-[#ffcbcb]'
    );

    // 체크박스 스타일 ( v1 .check-circle 1:1 변환 )
    const checkboxClass = cn(
        'w-[18px] h-[18px] rounded-full border-[1.5px] border-[#aaa] mr-[8px] flex-shrink-0 flex items-center justify-center bg-white transition-all duration-150',

        // 체크됨
        checked && !disabled && 'bg-[#9e9e9e] border-[#9e9e9e]',

        // 비활성
        disabled && 'bg-[#f5f5f5] border-[#ddd]'
    );

    // 텍스트 스타일 ( v1 .med-name, .med-dose )
    const nameClass = cn(
        'text-[14px] font-[600] text-[#333] whitespace-nowrap leading-tight',
        checked && !disabled && 'text-[#bbb] line-through'
    );

    const doseClass = cn(
        'text-[12px] font-[400] text-[#888] whitespace-nowrap mt-[1px]',
        checked && !disabled && 'text-[#ccc]'
    );

    return (
        <div
            className={containerClass}
            onClick={handleClick}
            role="checkbox"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
        >
            {/* 체크박스 원 */}
            <div className={checkboxClass}>
                {checked && !disabled && (
                    <span className="text-white text-[11px] font-bold leading-none">V</span>
                )}
            </div>

            {/* 텍스트 래퍼 */}
            <div className="flex-1 flex flex-wrap items-center gap-[4px] min-w-0">
                <span className={nameClass}>{name}</span>

                {dose && <span className={doseClass}>{dose}</span>}

                {/* 화요일 엽산 경고 */}
                {showFolicWarning && (
                    <span className="text-[12px] text-[#777] font-[400] ml-[2px]">★화요일은 저녁 복용★</span>
                )}

                {/* 요일 뱃지 */}
                {dayBadge && (
                    <span className={cn(
                        "inline-block text-[10px] px-[6px] py-[2px] rounded-[4px] font-[800] align-middle tracking-tight whitespace-nowrap",
                        getDayBadgeStyle()
                    )}>
                        {dayBadge}
                    </span>
                )}

                {/* D-Day 뱃지 */}
                {badge && (
                    <span className={cn(
                        "inline-block text-[10px] px-[6px] py-[2px] rounded-[4px] font-[800] align-middle tracking-tight whitespace-nowrap",
                        getBadgeStyle()
                    )}>
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
}
