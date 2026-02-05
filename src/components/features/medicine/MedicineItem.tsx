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

    // 뱃지 색상 결정
    const getDDayBadgeClass = () => {
        if (isActiveToday) return 'badge-active';
        // 비활성일 때도 뱃지가 있다면 (D-Day 등) 표시는 하되 회색으로
        return 'badge-gray';
    };

    // 체크박스 스타일 (v1 스타일: 체크시 회색/진회색 통일)
    // 조건 1: 체크됨 & Active(Not disabled) => 회색/진회색 배경
    // 조건 2: Disabled (Inactive) => 회색 원, 체크마크 없음
    // 조건 3: Active & Not Checked => 흰색 배경, 회색 테두리
    const checkboxClass = (checked && !disabled)
        ? 'bg-zinc-500 border-zinc-500'
        : disabled
            ? 'bg-zinc-100 border-zinc-200'
            : 'bg-white border-zinc-300';

    // 컨테이너 스타일
    // 조건 1: (D3나 MTX)이고 오늘이 Active 날이고, 체크 안됐을 때 => 강조 색상
    // 조건 2: 그 외(일반 약, 혹은 체크된 상태, 혹은 Inactive) => 흰색 배경
    const isActiveHighlight = isCycleMed && isActiveToday && !checked;

    const containerClass = cn(
        'medicine-item flex items-center p-[10px_12px] rounded-[10px] border transition-all duration-200 mb-[8px] last:mb-0 relative select-none touch-manipulation',
        // 기본값: 흰색 배경, 투명 테두리, 그림자
        'bg-white border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.05)]',

        // Active Highlight (D3/MTX Only)
        isActiveHighlight && 'med-active-today', // globals.css에 정의된 클래스 사용 (단, 색상은 아래에서 오버라이드 됨을 유의, 혹은 util class 직접 사용)
        isActiveHighlight && !isDanger && 'bg-[#FFFDF7] border-[#FFB74D]', // D3 style
        isActiveHighlight && isDanger && 'bg-[#fffefe] border-[#ff6b6b]',   // MTX style (v1 danger)

        // Checked 상태
        checked && 'opacity-60 bg-zinc-50 border-zinc-100 shadow-none',

        // Disabled (Inactive day)
        disabled && 'opacity-50 bg-white border-dashed border-zinc-200 shadow-none pointer-events-none'
    );

    return (
        <div
            className={containerClass}
            onClick={handleClick}
            role="checkbox"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            {/* 체크박스 영역 */}
            <div className={cn(
                'w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center mr-[12px] transition-colors flex-shrink-0',
                checkboxClass
            )}>
                {(checked && !disabled) && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[14px] h-[14px] text-white"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </div>

            {/* 텍스트 영역 */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center flex-wrap">
                    <span className={cn(
                        "font-[600] text-[15px] text-[#333] leading-tight mr-[6px]",
                        checked && "line-through text-zinc-400",
                        disabled && 'text-zinc-400'
                    )}>
                        {name}
                    </span>

                    {/* D-Day badge (badge prop 사용) */}
                    {badge && (
                        <span className={cn(
                            "text-[10px] font-bold px-[5px] py-[2px] rounded-[4px] tracking-tight",
                            getDDayBadgeClass()
                        )}>
                            {badge}
                        </span>
                    )}

                    {/* 요일 뱃지 (dayBadge) - MTX 등 */}
                    {dayBadge && !badge && (
                        <span className={cn(
                            "text-[10px] font-bold px-[5px] py-[2px] rounded-[4px] tracking-tight",
                            getDDayBadgeClass()
                        )}>
                            {dayBadge}
                        </span>
                    )}
                </div>
                {dose && (
                    <span className={cn(
                        "text-[12px] text-[#888] font-[400] mt-[2px]",
                        checked && "text-zinc-300",
                        disabled && 'text-zinc-300'
                    )}>
                        {dose}
                    </span>
                )}
            </div>

            {/* 엽산 주의 경고 (화요일 저녁) */}
            {showFolicWarning && (
                <div className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[11px] font-bold text-[#FF6B6B] bg-[#FFF0F0] px-[6px] py-[3px] rounded-[6px] border border-[#ffcbcb] animate-pulse">
                        화요일 복용 금지!
                    </span>
                </div>
            )}
        </div>
    );
}
