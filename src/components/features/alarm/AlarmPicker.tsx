'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/lib/db/schema';

// v2 Interface
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

// 시간 옵션
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, ... 55
const PERIODS = ['오전', '오후'];

export function AlarmPicker({
    open,
    onOpenChange,
    slots,
    onSave,
    isLoading = false,
}: AlarmPickerProps) {
    // 로컬 상태
    const [localSlots, setLocalSlots] = useState<AlarmSlot[]>(slots);
    const [selectedSlotId, setSelectedSlotId] = useState<TimeSlot>('dawn');

    // 현재 선택된 슬롯의 시간 상태 (Picker용)
    const [period, setPeriod] = useState<'오전' | '오후'>('오전');
    const [hour, setHour] = useState<number>(7);
    const [minute, setMinute] = useState<number>(0);

    // 저장 중복 방지
    const [isSaving, setIsSaving] = useState(false);

    // props 변경 시 동기화
    useEffect(() => {
        if (open) {
            setLocalSlots(slots);
            // 만약 현재 선택된 슬롯이 slots에 없다면 첫 번째로 리셋
            const currentExists = slots.find(s => s.id === selectedSlotId);
            if (!currentExists && slots.length > 0) {
                setSelectedSlotId(slots[0].id);
            }
        }
    }, [open, slots]);

    // 슬롯 변경 시 Picker 상태 업데이트
    useEffect(() => {
        const targetSlot = localSlots.find(s => s.id === selectedSlotId);
        if (targetSlot) {
            parseTimeToState(targetSlot.time);
        }
    }, [selectedSlotId, localSlots]); // localSlots가 변할 때도 업데이트 필요 (초기 로드)

    // "HH:mm" -> State 변환
    const parseTimeToState = (timeStr: string) => {
        if (!timeStr) return;
        const [h, m] = timeStr.split(':').map(Number);
        if (h >= 12) {
            setPeriod('오후');
            setHour(h === 12 ? 12 : h - 12);
        } else {
            setPeriod('오전');
            setHour(h === 0 ? 12 : h);
        }
        setMinute(m);
    };

    // State -> "HH:mm" 변환
    const formatTime = (p: string, h: number, m: number): string => {
        let hour24 = h;
        if (p === '오후') {
            if (h !== 12) hour24 = h + 12;
        } else {
            if (h === 12) hour24 = 0;
        }
        return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // Picker 변경 핸들러
    const handlePickerChange = (key: 'period' | 'hour' | 'minute', value: string | number) => {
        let newPeriod = period;
        let newHour = hour;
        let newMinute = minute;

        if (key === 'period') newPeriod = value as '오전' | '오후';
        if (key === 'hour') newHour = Number(value);
        if (key === 'minute') newMinute = Number(value);

        // State 업데이트
        if (key === 'period') setPeriod(newPeriod);
        if (key === 'hour') setHour(newHour);
        if (key === 'minute') setMinute(newMinute);

        // LocalSlots 즉시 업데이트
        const newTimeStr = formatTime(newPeriod, newHour, newMinute);
        setLocalSlots(prev => prev.map(s =>
            s.id === selectedSlotId ? { ...s, time: newTimeStr } : s
        ));
    };

    // ON/OFF 토글
    const handleToggle = (e: React.MouseEvent, id: TimeSlot) => {
        e.stopPropagation(); // 슬롯 선택 방지
        setLocalSlots(prev => prev.map(s =>
            s.id === id ? { ...s, isOn: !s.isOn } : s
        ));
    };

    // 저장 핸들러
    const handleSaveClick = async () => {
        if (isSaving || isLoading) return;
        setIsSaving(true);
        try {
            await onSave(localSlots);
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
               Shadcn DialogContent 기본 스타일 오버라이드:
               - max-w-[320px] (v1 모달 너비)
               - p-0 (내부 패딩 제거)
               - gap-0 (헤더/컨텐츠 간격 제거)
               - rounded-[12px]
            */}
            <DialogContent className="max-w-[320px] p-0 gap-0 rounded-[12px] border border-[#333] shadow-[0_10px_30px_rgba(0,0,0,0.2)] bg-white overflow-hidden" showCloseButton={false}>
                <DialogTitle className="sr-only">알람 설정</DialogTitle>

                {/* 헤더 */}
                <div className="flex justify-between items-center px-[16px] py-[14px] border-b border-[#e5e5e5]">
                    <h3 className="m-0 text-[16px] font-[700] text-[#222]">알람 설정</h3>
                    <button
                        className="p-[4px] text-[#666] hover:bg-[#f5f5f5] rounded-full transition-colors"
                        onClick={() => onOpenChange(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 슬롯 리스트 - 컴팩트 레이아웃 */}
                <div className="p-[8px_12px] max-h-[50vh] overflow-y-auto">
                    {localSlots.map((slot) => (
                        <div
                            key={slot.id}
                            className={cn(
                                "flex items-center p-[8px_10px] rounded-[8px] cursor-pointer transition-colors border border-transparent mb-[2px] last:mb-0",
                                selectedSlotId === slot.id
                                    ? "bg-[#f0f0f0] border-[#333]"
                                    : "hover:bg-[#f5f5f5]"
                            )}
                            onClick={() => setSelectedSlotId(slot.id)}
                        >
                            <span className="flex-1 text-[13px] font-[500] text-[#222]">{slot.label}</span>
                            <span className={cn(
                                "font-digital text-[15px] tracking-[1px] font-bold italic mr-[8px] tabular-nums",
                                slot.isOn ? "text-[#555]" : "text-[#555] opacity-40"
                            )} style={{ fontFamily: "'DSEG7-Classic', monospace" }}>
                                {slot.time}
                            </span>
                            <button
                                className={cn(
                                    "text-[12px] font-[700] px-[8px] py-[3px] rounded-[12px] min-w-[38px] transition-colors",
                                    slot.isOn
                                        ? "bg-[#1976D2] text-white" // ON Color: Blue
                                        : "bg-[#e0e0e0] text-[#999]"
                                )}
                                onClick={(e) => handleToggle(e, slot.id)}
                            >
                                {slot.isOn ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Picker Area - 이벤트 전파/Z-index 문제 해결을 위해 relative/z-index 명시 */}
                <div className="border-t border-[#e5e5e5] bg-[#fafafa] p-[12px] relative z-50">
                    <div className="mb-[10px] text-center text-[13px] text-[#555] font-medium">
                        <span className="text-[#333] font-bold">[ {localSlots.find(s => s.id === selectedSlotId)?.label} ]</span> 시간 설정
                    </div>

                    <div className="flex justify-center gap-[10px]">
                        {/* 오전/오후 */}
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] text-[#888] mb-[3px] font-medium">오전/오후</span>
                            <Select
                                value={period}
                                onValueChange={(v) => handlePickerChange('period', v)}
                            >
                                <SelectTrigger className="w-[80px] h-[42px] bg-white border-[#ccc] text-[16px] font-bold text-center justify-center focus:ring-0 focus:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" side="top" className="max-h-[300px] z-[100]">
                                    {PERIODS.map(p => (
                                        <SelectItem key={p} value={p} className="justify-center text-center font-bold text-[16px] py-3">{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 시 */}
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] text-[#888] mb-[3px] font-medium">시</span>
                            <Select
                                value={hour.toString()}
                                onValueChange={(v) => handlePickerChange('hour', v)}
                            >
                                <SelectTrigger className="w-[70px] h-[42px] bg-white border-[#ccc] text-[22px] font-digital font-bold text-center justify-center focus:ring-0 focus:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" side="top" className="max-h-[300px] z-[100]">
                                    {HOURS.map(h => (
                                        <SelectItem key={h} value={h.toString()} className="justify-center text-center font-digital font-bold text-[22px] py-2">{h}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 분 */}
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] text-[#888] mb-[3px] font-medium">분</span>
                            <Select
                                value={minute.toString()}
                                onValueChange={(v) => handlePickerChange('minute', v)}
                            >
                                <SelectTrigger className="w-[70px] h-[42px] bg-white border-[#ccc] text-[22px] font-digital font-bold text-center justify-center focus:ring-0 focus:ring-offset-0">
                                    <SelectValue>
                                        {String(minute).padStart(2, '0')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent position="popper" side="top" className="max-h-[300px] z-[100]">
                                    {MINUTES.map(m => (
                                        <SelectItem key={m} value={m.toString()} className="justify-center text-center font-digital font-bold text-[22px] py-2">
                                            {String(m).padStart(2, '0')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Footer / Save Button */}
                <div className="p-[12px] bg-white border-t border-[#e5e5e5]">
                    <Button
                        className={cn(
                            "w-full h-[48px] text-[16px] font-bold rounded-[12px] transition-all",
                            "bg-[#222] hover:bg-black text-white",
                            (isSaving || isLoading) && "opacity-70 cursor-not-allowed"
                        )}
                        onClick={handleSaveClick}
                        disabled={isSaving || isLoading}
                    >
                        {isSaving || isLoading ? '저장 중...' : '설정 완료'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
