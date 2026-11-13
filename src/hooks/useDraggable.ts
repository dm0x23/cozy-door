import { useState, useEffect, useRef } from 'react';
import { widgetPositionsStore, type WidgetPosition } from '../stores/appStore';

export function useDraggable(
  widgetKey: 'tasks' | 'pomodoro' | 'music' | 'studyRoom',
  defaultPos: () => WidgetPosition
) {
  const [position, setPosition] = useState<WidgetPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Initialize position from store or calculate default
  useEffect(() => {
    const stored = widgetPositionsStore.get()[widgetKey];
    if (stored && stored.x >= 0 && stored.y >= 0) {
      // Clamped check
      const clampedX = Math.min(Math.max(10, stored.x), window.innerWidth - 80);
      const clampedY = Math.min(Math.max(10, stored.y), window.innerHeight - 80);
      setPosition({ x: clampedX, y: clampedY });
    } else {
      const def = defaultPos();
      setPosition(def);
      widgetPositionsStore.setKey(widgetKey, def);
    }
  }, [widgetKey]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button / touch
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;

      const newX = Math.min(Math.max(10, dragRef.current.posX + deltaX), window.innerWidth - 100);
      const newY = Math.min(Math.max(10, dragRef.current.posY + deltaY), window.innerHeight - 80);

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDragging(false);

      const deltaX = upEvent.clientX - dragRef.current.startX;
      const deltaY = upEvent.clientY - dragRef.current.startY;
      const finalX = Math.min(Math.max(10, dragRef.current.posX + deltaX), window.innerWidth - 100);
      const finalY = Math.min(Math.max(10, dragRef.current.posY + deltaY), window.innerHeight - 80);

      const finalPos = { x: finalX, y: finalY };
      setPosition(finalPos);
      widgetPositionsStore.setKey(widgetKey, finalPos);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return {
    position,
    isDragging,
    dragHandleProps: {
      onPointerDown,
      style: { cursor: isDragging ? 'grabbing' : 'grab' },
    },
  };
}

