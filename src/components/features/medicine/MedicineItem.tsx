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

                    // 비활성 상태 (Active logic에 따라 보여주기 여부 결정)
                    // D3/MTX 등 활성일이 아닌 경우 (isActiveToday === false) -> 그냥 보통 비활성 (흰색 or 투명?)
                    // 사용자 요구: 일반 약물은 항상 깨끗한 흰색 배경
                    disabled && 'bg-white border-dashed border-zinc-200 checked-opacity opacity-50',

                    // 활성 상태 (체크 안된 경우만, 그리고 오늘이 Active인 경우만)
                    !checked && !disabled && isActiveToday && 'border-[#FFB74D] bg-[#FFFDF7] animate-[pulse-border-subtle_3s_infinite]',
                    // MTX (Danger) - isActiveToday 이면서 isDanger 일때만
                    !checked && !disabled && isActiveToday && isDanger && 'border-[#ff6b6b] bg-[#fffefe] animate-[pulse-danger-subtle_3s_infinite]',

                    // 엽산 경고 - 이것도 특수 케이스, isActiveToday 체크 필요?
                    // showFolicWarning is separate; if showing warning, highlight it.
                    !checked && !disabled && showFolicWarning && 'border-[#FFB74D] bg-[#FFFDF7] animate-[pulse-border-subtle_3s_infinite]',


                    // 기본 테두리 (활성도 아니고 Danger도 아니고 Folic도 아닌 경우)
                    !checked && !disabled && (!isActiveToday && !showFolicWarning) && 'border-zinc-200',
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
                        // 체크되었거나, 비활성화된 경우(보통)
                        // 하지만 isActiveToday가 false인 특수 약물의 경우 체크표시 숨김 로직 필요
                        // 규칙: checked 이면 체크표시.
                        // 규칙: disabled (isActiveToday=false) 이면...
                        // 사용자 요구: "비타민 D3와 MTX 항목은 활성일(Today)이 아닐 경우, 체크 여부와 상관없이 체크박스 안에 'V' 표시(체크 표시)가 나타나지 않도록"

                        // isActiveToday가 false인 경우 (즉 disabled=true for D3/MTX in page.tsx) -> 회색 원만 표시? no checkmark.
                        // 일반 약은 disabled가 거의 없음 (항상 Active).
                        // page.tsx에서 D3/MTX가 아닐 때 disabled 처리를 어떻게 하는지 확인 필요.
                        // page.tsx: disabled={!med.isActiveToday}

                        // 따라서 disabled === true 이면 (Active가 아님). 이때 체크마크 숨김.

                        (checked && !disabled)
                            ? 'bg-zinc-400 border-zinc-400' // 체크됨 & 활성
                            : disabled
                                ? 'bg-zinc-100 border-zinc-200' // 비활성 (Active 아님) -> 연한 회색 원
                                : 'bg-white border-zinc-300',   // 체크안됨 & 활성 -> 빈 원
                    )}
                >
                    {/* 체크마크 */}
                    {/* checked이면서 disabled가 아니어야 함. 혹은 disabled라도 보여줬던 기존 로직 변경 */}
                    {/* 사용자 요청: 활성일이 아닐 경우(disabled) 체크표시 X */}
                    {(checked && !disabled) && (
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
                            (checked && !disabled) && 'checked-text',
                            disabled && 'text-zinc-400' // 비활성 텍스트 연하게
                        )}
                    >
                        {name}
                    </span>

                    {/* 용량 */}
                    {dose && (
                        <span
                            className={cn(
                                'text-xs text-zinc-500',
                                (checked && !disabled) && 'checked-text',
                                disabled && 'text-zinc-300'
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
