'use client';

import { cn } from '@/lib/utils';

interface MedicineItemProps {
    id: string;
    name: string;
    dose: string;
    checked: boolean;
    disabled?: boolean;
    isActiveToday?: boolean;  // D3/MTX 활성일
    isDanger?: boolean;       // MTX 활성일
    badge?: string;           // D-Day 뱃지 (TODAY, D-1, D-2 등)
    dayBadge?: string;        // 요일 뱃지
    showFolicWarning?: boolean;
    onChange: (id: string, checked: boolean) => void;
    isCycleMed?: boolean;     // D3/MTX 같은 주기성 약물
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

    // 뱃지가 회색이어야 하는 조건 (v1 로직)
    const shouldBadgeBeGray = disabled || checked;

    // D-Day 뱃지 스타일 (v1 로직)
    const getDDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'bg-[#e0e0e0] text-[#777]';
        if (isDanger) return 'bg-[#ff6b6b] text-white';
        if (isActiveToday) return 'bg-[#FFB74D] text-white';
        return 'bg-[#e0e0e0] text-[#777]';
    };

    // 요일 뱃지 스타일 (v1 로직)
    const getDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'bg-[#e0e0e0] text-[#777]';
        if (isDanger) return 'bg-[#ff6b6b] text-white';
        return 'bg-[#e0e0e0] text-[#777]';
    };

    // 래퍼 클래스 (v1 로직: 오직 D3/MTX/화요일엽산만 강조)
    const wrapperClass = cn(
        disabled && 'med-disabled',
        !disabled && !checked && isActiveToday && isCycleMed && !isDanger && 'med-active-today',
        !disabled && !checked && isDanger && 'med-active-danger',
        !disabled && !checked && showFolicWarning && !isCycleMed && 'med-folic-active'
    );

    // 라벨 클래스 (v1: .med-item-label)
    const labelClass = cn(
        'med-item-label',
        checked && !disabled && 'checked'
    );

    return (
        <div className={wrapperClass}>
            <div
                className={labelClass}
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
                {/* 체크박스 원 - v1: .check-circle, 18px × 18px */}
                <div className="check-circle" />

                {/* 텍스트 래퍼 - v1: .med-text-wrapper */}
                <div className="med-text-wrapper">
                    {/* 이름 - v1: .med-name, 14px */}
                    <span className="med-name">{name}</span>

                    {/* 용량 - v1: .med-dose, 12px */}
                    {dose && <span className="med-dose">{dose}</span>}

                    {/* 화요일 엽산 경고 - v1: .folic-warning */}
                    {showFolicWarning && (
                        <span className="folic-warning">★화요일은 저녁 복용★</span>
                    )}

                    {/* 요일 뱃지 */}
                    {dayBadge && (
                        <span className={cn('med-badge', getDayBadgeClass())}>{dayBadge}</span>
                    )}

                    {/* D-Day 뱃지 */}
                    {badge && (
                        <span className={cn('med-badge', getDDayBadgeClass())}>{badge}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
