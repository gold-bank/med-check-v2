'use client';

/**
 * AlarmPicker 컴포넌트
 * 시간대별 알람 설정 모달
 * - 시/분 선택 (Select)
 * - ON/OFF 토글 (Switch)
 * - 레트로 디지털 시계 디자인
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/lib/db/schema';

interface AlarmSlot {
    id: TimeSlot;
    label: string;
    time: string;
    isOn: boolean;
}

interface AlarmPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slots: AlarmSlot[];
    onSave: (slots: AlarmSlot[]) => Promise<void>;
    isLoading?: boolean;
}

// 시간 옵션 (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
);

// 분 옵션 (00, 15, 30, 45)
const MINUTES = ['00', '15', '30', '45'];

// 슬롯 아이콘
const SLOT_ICONS: Record<TimeSlot, string> = {
    dawn: '🌅',
    morning: '☀️',
    noon: '🌞',
    snack: '🍪',
    evening: '🌙',
    night: '😴',
};

export function AlarmPicker({
    open,
    onOpenChange,
    slots,
    onSave,
    isLoading = false,
}: AlarmPickerProps) {
    // 로컬 상태 (모달 내에서 수정)
    const [localSlots, setLocalSlots] = useState<AlarmSlot[]>(slots);

    // props 변경 시 동기화
    useEffect(() => {
        setLocalSlots(slots);
    }, [slots]);

    // 시간 변경
    const handleTimeChange = (slotId: TimeSlot, type: 'hour' | 'minute', value: string) => {
        setLocalSlots((prev) =>
            prev.map((slot) => {
                if (slot.id !== slotId) return slot;

                const [hour, minute] = slot.time.split(':');
                const newTime = type === 'hour'
                    ? `${value}:${minute}`
                    : `${hour}:${value}`;

                return { ...slot, time: newTime };
            })
        );
    };

    // ON/OFF 토글
    const handleToggle = (slotId: TimeSlot) => {
        setLocalSlots((prev) =>
            prev.map((slot) =>
                slot.id === slotId ? { ...slot, isOn: !slot.isOn } : slot
            )
        );
    };

    // 저장
    const handleSave = async () => {
        await onSave(localSlots);
        onOpenChange(false);
    };

    // 취소 (변경 사항 리셋)
    const handleCancel = () => {
        setLocalSlots(slots);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <span>⏰</span>
                        <span>알람 설정</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {localSlots.map((slot) => {
                        const [hour, minute] = slot.time.split(':');

                        return (
                            <div
                                key={slot.id}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                                    slot.isOn
                                        ? 'border-retro-blue bg-blue-50/50'
                                        : 'border-zinc-200 bg-zinc-50/50'
                                )}
                            >
                                {/* 아이콘 */}
                                <div className="text-2xl flex-shrink-0">
                                    {SLOT_ICONS[slot.id]}
                                </div>

                                {/* 라벨 */}
                                <div className="flex-1">
                                    <Label className="font-bold text-sm text-zinc-800">
                                        {slot.label}
                                    </Label>
                                </div>

                                {/* 시간 선택 */}
                                <div className="flex items-center gap-1">
                                    {/* 시 */}
                                    <Select
                                        value={hour}
                                        onValueChange={(v) => handleTimeChange(slot.id, 'hour', v)}
                                        disabled={!slot.isOn}
                                    >
                                        <SelectTrigger className={cn(
                                            'w-16 h-10 font-digital text-lg',
                                            slot.isOn ? 'text-retro-blue' : 'text-zinc-400'
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HOURS.map((h) => (
                                                <SelectItem key={h} value={h} className="font-digital">
                                                    {h}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <span className={cn(
                                        'font-digital text-xl',
                                        slot.isOn ? 'text-retro-blue' : 'text-zinc-400'
                                    )}>
                                        :
                                    </span>

                                    {/* 분 */}
                                    <Select
                                        value={minute}
                                        onValueChange={(v) => handleTimeChange(slot.id, 'minute', v)}
                                        disabled={!slot.isOn}
                                    >
                                        <SelectTrigger className={cn(
                                            'w-16 h-10 font-digital text-lg',
                                            slot.isOn ? 'text-retro-blue' : 'text-zinc-400'
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MINUTES.map((m) => (
                                                <SelectItem key={m} value={m} className="font-digital">
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* ON/OFF 스위치 */}
                                <Switch
                                    checked={slot.isOn}
                                    onCheckedChange={() => handleToggle(slot.id)}
                                    className="data-[state=checked]:bg-retro-blue"
                                />
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-retro-blue hover:bg-blue-600"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                저장 중...
                            </>
                        ) : (
                            '설정 완료'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
