"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Maximize2, Minimize2, RotateCcw, Save, User, AlignLeft, Music, Gamepad2, Link as LinkIcon, Cpu } from 'lucide-react';

// --- DATA STRUCTURES ---
export interface LayoutItem {
  id: string;
  enabled: boolean;
  size: 'half' | 'full';
}

const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: "hero", enabled: true, size: "full" },
  { id: "content", enabled: true, size: "half" },
  { id: "spotify", enabled: true, size: "half" },
  { id: "valorant", enabled: true, size: "half" },
  { id: "connections", enabled: true, size: "half" },
  { id: "gear", enabled: true, size: "full" }
];

const WIDGET_INFO: Record<string, { title: string, icon: React.ElementType, description: string }> = {
  hero: { title: "Profile Hero", icon: User, description: "Avatar & Identity" },
  content: { title: "About Me", icon: AlignLeft, description: "Bio & Links" },
  spotify: { title: "Live Music", icon: Music, description: "Spotify Sync" },
  valorant: { title: "Valorant Stats", icon: Gamepad2, description: "Riot Stats" },
  connections: { title: "Connections", icon: LinkIcon, description: "Socials & Steam" },
  gear: { title: "Hardware", icon: Cpu, description: "PC Specs" }
};

// --- VISUAL BENTO CARD COMPONENT ---
function WidgetCard({ 
  item, 
  isOverlay = false, 
  onToggleEnable, 
  onToggleSize 
}: { 
  item: LayoutItem; 
  isOverlay?: boolean;
  onToggleEnable?: (id: string) => void; 
  onToggleSize?: (id: string) => void; 
}) {
  const info = WIDGET_INFO[item.id] || { title: item.id, icon: User, description: "Widget" };
  const Icon = info.icon;
  const isFull = item.size === 'full';

  return (
    <div className={`relative flex flex-col justify-between p-4 rounded-[24px] border transition-all duration-200 text-left overflow-hidden w-full h-[110px]
      ${isOverlay 
         ? 'bg-[#18181b] border-indigo-500 shadow-2xl z-50 ring-2 ring-indigo-500/20 cursor-grabbing' 
         : 'bg-[#0c0c0e] border-white/5 hover:border-white/20 shadow-lg'
      }
      ${!item.enabled && !isOverlay ? 'opacity-40 grayscale' : ''}
    `}>
       {/* Top Row: Icon + Hover Controls */}
       <div className="flex justify-between items-start">
         <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center border shadow-inner shrink-0 ${isOverlay ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-zinc-400 group-hover:text-white transition-colors'}`}>
           <Icon className="w-5 h-5" />
         </div>
         
         {/* Action Buttons - Only visible on hover in the main grid */}
         {!isOverlay && onToggleSize && onToggleEnable && (
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 p-1 rounded-xl backdrop-blur-md border border-white/5 shadow-xl shrink-0">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSize(item.id); }} 
                className="p-1.5 rounded-lg hover:bg-indigo-600 text-zinc-400 hover:text-white transition"
                title={isFull ? "Make Half Width" : "Make Full Width"}
              >
                {isFull ? <Minimize2 className="w-3.5 h-3.5"/> : <Maximize2 className="w-3.5 h-3.5"/>}
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleEnable(item.id); }} 
                className="p-1.5 rounded-lg hover:bg-red-500 text-zinc-400 hover:text-white transition"
                title={item.enabled ? "Hide Widget" : "Show Widget"}
              >
                {item.enabled ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
              </button>
           </div>
         )}
       </div>

       {/* Bottom Row: Identity (Bento Style) */}
       <div className="mt-auto pt-2">
         <div className="font-black text-[13px] text-white truncate">{info.title}</div>
         <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate mt-0.5">{info.description}</div>
       </div>
    </div>
  );
}

// --- DRAGGABLE WRAPPER ---
function SortableWidget({ item, onToggleEnable, onToggleSize }: { item: LayoutItem; onToggleEnable: (id: string) => void; onToggleSize: (id: string) => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    // BUGFIX: We MUST use Translate instead of Transform for CSS Grids! 
    // This stops dnd-kit from trying to squish/stretch the cards during the swap animation.
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`touch-none cursor-grab active:cursor-grabbing w-full ${item.size === 'full' ? 'col-span-2' : 'col-span-1'}`}
    >
       <WidgetCard 
         item={item} 
         onToggleEnable={onToggleEnable} 
         onToggleSize={onToggleSize} 
       />
    </div>
  );
}

// --- MAIN LAYOUT BUILDER ---
export default function LayoutBuilder({ 
  initialLayout, 
  onSave, 
  isSaving = false 
}: { 
  initialLayout: LayoutItem[], 
  onSave: (layout: LayoutItem[]) => void,
  isSaving?: boolean
}) {
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // BUGFIX: We capture the EXACT pixel dimensions of the block the moment you click it.
  // This guarantees the drag overlay matches perfectly regardless of your screen size.
  const [activeNodeRect, setActiveNodeRect] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const currentLayout = initialLayout?.length > 0 ? initialLayout : DEFAULT_LAYOUT;
    const currentIds = currentLayout.map(i => i.id);
    const missingItems = DEFAULT_LAYOUT.filter(def => !currentIds.includes(def.id)).map(def => ({ ...def, enabled: false }));
    setItems([...currentLayout, ...missingItems]);
  }, [initialLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const rect = event.active.rect.current.initial;
    if (rect) {
      setActiveNodeRect({ width: rect.width, height: rect.height });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveNodeRect(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveNodeRect(null);
  };

  const toggleEnable = (id: string) => setItems(items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  const toggleSize = (id: string) => setItems(items.map(item => item.id === id ? { ...item, size: item.size === 'full' ? 'half' : 'full' } : item));
  const handleReset = () => { if(confirm("Reset your layout to default?")) setItems(DEFAULT_LAYOUT); };

  const activeItem = items.find(item => item.id === activeId);

  return (
    <div className="w-full space-y-6">
      
      {/* HEADER & GLOBAL CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
         <div>
            <h2 className="text-2xl font-black text-white mb-1">Visual Grid Builder</h2>
            <p className="text-sm text-zinc-400">Drag to reorder your profile. Change sizes or hide elements completely.</p>
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-bold text-zinc-300 flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
               <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button 
              onClick={() => onSave(items)}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm font-bold text-white flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
            >
               {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> : <Save className="w-4 h-4" />}
               {isSaving ? "Saving..." : "Save Layout"}
            </button>
         </div>
      </div>

      {/* THE INTERACTIVE 2D WIREFRAME GRID WITH FIXED LEFT SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center pt-4">
         
         {/* UNCHANGEABLE LEFT PROFILE MOCKUP */}
         <div className="hidden lg:flex w-[260px] shrink-0 bg-[#0a0a0c] border border-white/5 rounded-[32px] p-6 flex-col gap-4 opacity-80 pointer-events-none shadow-xl">
            <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mt-2 shadow-inner border border-white/5"></div>
            <div className="h-5 w-2/3 bg-white/10 rounded-lg mx-auto mt-2"></div>
            <div className="h-3 w-1/3 bg-white/5 rounded-full mx-auto mb-2"></div>
            
            <div className="flex gap-2 justify-center mb-4">
               <div className="w-8 h-8 rounded-xl bg-white/5"></div>
               <div className="w-8 h-8 rounded-xl bg-white/5"></div>
               <div className="w-8 h-8 rounded-xl bg-white/5"></div>
            </div>

            <div className="h-28 bg-white/5 rounded-2xl w-full border border-white/5"></div>
            <div className="h-12 bg-white/5 rounded-xl w-full border border-white/5"></div>
         </div>

         {/* DRAGGABLE RIGHT GRID */}
         <div className="flex-1 w-full max-w-[480px] bg-black/20 p-6 md:p-8 rounded-[32px] border border-white/5 shadow-inner flex justify-center">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                
                {/* Max-width applied to container, items flex perfectly inside */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
                  {items.map((item) => (
                    <SortableWidget 
                      key={item.id} 
                      item={item} 
                      onToggleEnable={toggleEnable} 
                      onToggleSize={toggleSize} 
                    />
                  ))}
                </div>

              </SortableContext>

              {/* OVERLAY BUGFIX: We apply the exact pixel dimensions recorded on drag start! */}
              <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                 {activeItem && activeNodeRect ? (
                    <div style={{ width: activeNodeRect.width, height: activeNodeRect.height }}>
                      <WidgetCard item={activeItem} isOverlay={true} />
                    </div>
                 ) : null}
              </DragOverlay>

            </DndContext>
         </div>
      </div>
      
    </div>
  );
}