import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { saveConfig } from '../api';
import { ColorPicker } from '../components/color-picker';
import { IconPicker } from '../components/icon-picker';
import { useTheme } from '../components/theme-provider';
import { getLucideIcon } from '../icon-utils';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  Category,
  Card,
  ServiceCard,
  TextCard,
  Settings,
  ThemeMode,
  SearchEngine,
  ColorTheme,
} from '../types';
import {
  Package,
  FolderOpen,
  Search,
  BarChart3,
  Palette,
  Settings as SettingsIcon,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

function SortableCardItem({
  card,
  categoryColor,
  index,
  totalCards,
  isEditing,
  onEditToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdate,
  advancedOpen,
  setAdvancedOpen,
}: {
  card: Card;
  categoryColor: string;
  index: number;
  totalCards: number;
  isEditing: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (v: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
          <button onClick={onMoveUp} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" disabled={index === 0}>
            <ArrowUp size={16} />
          </button>
          <button onClick={onMoveDown} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" disabled={index === totalCards - 1}>
            <ArrowDown size={16} />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {card.type === 'service' ? (card as ServiceCard).name : (card as TextCard).title}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded bg-[var(--color-search-bg)]">
            {card.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditToggle}
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            {isEditing ? '收起' : '编辑'}
          </button>
          <button onClick={onDelete} className="text-[var(--color-status-offline)] hover:opacity-80">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isEditing && card.type === 'service' && (
        <ServiceEditor
          card={card as ServiceCard}
          categoryColor={categoryColor}
          advancedOpen={advancedOpen}
          setAdvancedOpen={setAdvancedOpen}
          onUpdate={onUpdate}
        />
      )}
      {isEditing && card.type === 'text' && (
        <TextEditor
          card={card as TextCard}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

function SortableCategoryItem({
  category,
  index,
  totalCategories,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onDelete,
}: {
  category: Category;
  index: number;
  totalCategories: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<Category>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComp = getLucideIcon(category.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-4"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <button
          className="cursor-grab text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <button onClick={onMoveUp} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" disabled={index === 0}>
          <ArrowUp size={16} />
        </button>
        <button onClick={onMoveDown} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" disabled={index === totalCategories - 1}>
          <ArrowDown size={16} />
        </button>
        <span style={{ color: category.color }}><IconComp size={18} /></span>
        <input
          value={category.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="px-3 py-1 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] w-32"
        />
        <IconPicker
          value={category.icon}
          onChange={(v) => onUpdate({ icon: v })}
          placeholder="Lucide 图标名"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={category.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-[var(--color-card-border)] cursor-pointer"
          />
          <span className="text-xs text-[var(--color-text-secondary)] font-mono">{category.color}</span>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">{category.cards.length} 个卡片</span>
        <button onClick={onDelete} className="text-[var(--color-status-offline)] hover:opacity-80 ml-auto">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

type AdminTab = 'services' | 'categories' | 'search' | 'monitor' | 'appearance' | 'general';

export function AdminPage() {
  const categories = useStore((s) => s.categories);
  const settings = useStore((s) => s.settings);
  const setCategories = useStore((s) => s.setCategories);
  const setSettings = useStore((s) => s.setSettings);
  const [activeTab, setActiveTab] = useState<AdminTab>('services');
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'services', label: '服务管理', icon: <Package size={18} /> },
    { id: 'categories', label: '分类管理', icon: <FolderOpen size={18} /> },
    { id: 'search', label: '搜索引擎', icon: <Search size={18} /> },
    { id: 'monitor', label: '状态监控', icon: <BarChart3 size={18} /> },
    { id: 'appearance', label: '外观设置', icon: <Palette size={18} /> },
    { id: 'general', label: '通用设置', icon: <SettingsIcon size={18} /> },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig({ categories, settings });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[var(--color-card)] border-r border-[var(--color-card-border)] transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-[var(--color-card-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">⚙️ 管理</h2>
        </div>
        <nav className="p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-[var(--color-card-border)] mt-4">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-card-border)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
          >
            <ArrowLeft size={18} />
            返回主页
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]"
            >
              <GripVertical size={20} />
            </button>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        {activeTab === 'services' && <ServicesTab categories={categories} setCategories={setCategories} />}
        {activeTab === 'categories' && <CategoriesTab categories={categories} setCategories={setCategories} />}
        {activeTab === 'search' && <SearchTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'monitor' && <MonitorTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'appearance' && <AppearanceTab settings={settings} setSettings={setSettings} />}
        {activeTab === 'general' && <GeneralTab settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}

function ServicesTab({ categories, setCategories }: { categories: Category[]; setCategories: (c: Category[]) => void }) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? '');
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const category = categories.find((c) => c.id === selectedCategory);

  const moveCard = (catId: string, fromIndex: number, toIndex: number) => {
    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      const newCards = [...cat.cards];
      const [moved] = newCards.splice(fromIndex, 1);
      newCards.splice(toIndex, 0, moved);
      return { ...cat, cards: newCards };
    });
    setCategories(newCategories);
  };

  const addCard = (catId: string, cardType: 'service' | 'text') => {
    const newCard: Card = cardType === 'service'
      ? {
          id: `svc_${Date.now()}`,
          type: 'service' as const,
          name: '新服务',
          url: 'http://',
          description: '',
          iconSource: 'favicon',
          iconValue: null,
          enableStatusCheck: null,
          openInNewTab: true,
        }
      : {
          id: `txt_${Date.now()}`,
          type: 'text' as const,
          title: '新文本卡片',
          content: '',
          icon: '',
        };

    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return { ...cat, cards: [...cat.cards, newCard] };
    });
    setCategories(newCategories);
    setEditingCard(newCard.id);
  };

  const removeCard = (catId: string, cardId: string) => {
    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return { ...cat, cards: cat.cards.filter((c) => c.id !== cardId) };
    });
    setCategories(newCategories);
  };

  const updateCard = (catId: string, cardId: string, updates: Record<string, unknown>) => {
    const newCategories = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        cards: cat.cards.map((card) => card.id === cardId ? { ...card, ...updates } as Card : card),
      };
    });
    setCategories(newCategories);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-[var(--color-text-secondary)]">分类：</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button
          onClick={() => addCard(selectedCategory, 'service')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs hover:opacity-90"
        >
          <Plus size={14} /> 添加服务
        </button>
        <button
          onClick={() => addCard(selectedCategory, 'text')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-text-primary)] text-xs hover:border-[var(--color-accent)]"
        >
          <Plus size={14} /> 添加文本卡片
        </button>
      </div>

      {category && (
        <DndContext
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              const oldIndex = category.cards.findIndex((c) => c.id === active.id);
              const newIndex = category.cards.findIndex((c) => c.id === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                const newCards = arrayMove(category.cards, oldIndex, newIndex);
                setCategories(categories.map((cat) =>
                  cat.id === category.id ? { ...cat, cards: newCards } : cat
                ));
              }
            }
          }}
        >
          <SortableContext items={category.cards.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="space-y-3">
              {category.cards.map((card, index) => (
                <SortableCardItem
                  key={card.id}
                  card={card}
                  categoryColor={category.color}
                  index={index}
                  totalCards={category.cards.length}
                  isEditing={editingCard === card.id}
                  onEditToggle={() => setEditingCard(editingCard === card.id ? null : card.id)}
                  onDelete={() => removeCard(category.id, card.id)}
                  onMoveUp={() => index > 0 && moveCard(category.id, index, index - 1)}
                  onMoveDown={() => index < category.cards.length - 1 && moveCard(category.id, index, index + 1)}
                  onUpdate={(updates) => updateCard(category.id, card.id, updates)}
                  advancedOpen={advancedOpen}
                  setAdvancedOpen={setAdvancedOpen}
                />
              ))}
              {category.cards.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">该分类暂无卡片，点击上方按钮添加</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function ServiceEditor({ card, categoryColor, advancedOpen, setAdvancedOpen, onUpdate }: {
  card: ServiceCard;
  categoryColor: string;
  advancedOpen: boolean;
  setAdvancedOpen: (v: boolean) => void;
  onUpdate: (updates: Partial<ServiceCard>) => void;
}) {
  const filledAdvanced = [card.description, card.iconSource !== 'favicon', card.enableStatusCheck !== null].filter(Boolean).length;
  const LucideIcon = card.iconSource === 'lucide' && card.iconValue ? getLucideIcon(card.iconValue) : null;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-card-border)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">名称</label>
            <input
              value={card.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">URL</label>
            <input
              value={card.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">图标快捷选择</label>
            <select
              value={card.iconSource}
              onChange={(e) => onUpdate({ iconSource: e.target.value as ServiceCard['iconSource'], iconValue: e.target.value === 'favicon' || e.target.value === 'initial' ? null : card.iconValue })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
            >
              <option value="favicon">自动（Favicon）</option>
              <option value="lucide">Lucide 图标</option>
              <option value="custom">自定义上传</option>
              <option value="initial">首字母</option>
            </select>
          </div>

          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            {advancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            高级设置{filledAdvanced > 0 ? ` (${filledAdvanced})` : ''}
          </button>

          {advancedOpen && (
            <div className="space-y-3 pl-2 border-l-2 border-[var(--color-accent)]/30">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">描述</label>
                <input
                  value={card.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
                />
              </div>
              {card.iconSource === 'lucide' && (
                 <div>
                   <label className="text-xs text-[var(--color-text-secondary)]">Lucide 图标名</label>
                   <div className="mt-1">
                     <IconPicker
                       value={card.iconValue ?? ''}
                       onChange={(v) => onUpdate({ iconValue: v })}
                       placeholder="如: hard-drive"
                     />
                   </div>
                 </div>
               )}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">状态检测</label>
                <select
                  value={card.enableStatusCheck === null ? 'inherit' : card.enableStatusCheck ? 'yes' : 'no'}
                  onChange={(e) => onUpdate({ enableStatusCheck: e.target.value === 'inherit' ? null : e.target.value === 'yes' })}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
                >
                  <option value="inherit">继承全局设置</option>
                  <option value="yes">开启</option>
                  <option value="no">关闭</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={card.openInNewTab}
                  onChange={(e) => onUpdate({ openInNewTab: e.target.checked })}
                  className="rounded"
                />
                <label className="text-xs text-[var(--color-text-secondary)]">新标签页打开</label>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">预览</label>
          <div className="inline-flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-card-border)] min-w-[140px]">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ backgroundColor: categoryColor }}>
              {LucideIcon ? <LucideIcon size={18} className="text-white" /> : <span className="text-white font-semibold text-sm">{card.name.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{card.name || '服务名称'}</span>
            {card.description && <span className="text-xs text-[var(--color-text-secondary)] text-center line-clamp-1">{card.description}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextEditor({ card, onUpdate }: { card: TextCard; onUpdate: (updates: Partial<TextCard>) => void }) {
  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-card-border)] space-y-3">
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">标题</label>
        <input
          value={card.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">Markdown 内容</label>
        <textarea
          value={card.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={6}
          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] font-mono resize-y"
        />
      </div>
       <div>
         <label className="text-xs text-[var(--color-text-secondary)]">图标（Lucide 名）</label>
         <div className="mt-1">
           <IconPicker
             value={card.icon}
             onChange={(v) => onUpdate({ icon: v })}
             placeholder="如: megaphone"
           />
         </div>
       </div>
    </div>
  );
}

function CategoriesTab({ categories, setCategories }: { categories: Category[]; setCategories: (c: Category[]) => void }) {
  const addCategory = () => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: '新分类',
      icon: 'bookmark',
      color: '#6B7280',
      cards: [],
    };
    setCategories([...categories, newCat]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const moveCategory = (fromIndex: number, toIndex: number) => {
    const newCategories = [...categories];
    const [moved] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, moved);
    setCategories(newCategories);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map((c) => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className="space-y-3">
      <button
        onClick={addCategory}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs hover:opacity-90"
      >
        <Plus size={14} /> 添加分类
      </button>
      <DndContext
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((c) => c.id === active.id);
            const newIndex = categories.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              setCategories(arrayMove(categories, oldIndex, newIndex));
            }
          }
        }}
      >
        <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
          {categories.map((cat, index) => (
            <SortableCategoryItem
              key={cat.id}
              category={cat}
              index={index}
              totalCategories={categories.length}
              onMoveUp={() => index > 0 && moveCategory(index, index - 1)}
              onMoveDown={() => index < categories.length - 1 && moveCategory(index, index + 1)}
              onUpdate={(updates) => updateCategory(cat.id, updates)}
              onDelete={() => removeCategory(cat.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SearchTab({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  const toggleSearchBar = () => setSettings({ ...settings, showSearchBar: !settings.showSearchBar });
  const toggleLocalFilter = () => setSettings({ ...settings, enableLocalFilter: !settings.enableLocalFilter });

  const addEngine = () => {
    const newEngine: SearchEngine = {
      id: `engine_${Date.now()}`,
      name: '新引擎',
      urlTemplate: 'https://example.com/search?q={query}',
      enabled: true,
      isDefault: false,
    };
    setSettings({ ...settings, searchEngines: [...settings.searchEngines, newEngine] });
  };

  const removeEngine = (id: string) => {
    setSettings({ ...settings, searchEngines: settings.searchEngines.filter((e) => e.id !== id) });
  };

  const updateEngine = (id: string, updates: Partial<SearchEngine>) => {
    setSettings({
      ...settings,
      searchEngines: settings.searchEngines.map((e) => e.id === id ? { ...e, ...updates } : e),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={settings.showSearchBar} onChange={toggleSearchBar} className="rounded" />
          <label className="text-sm text-[var(--color-text-primary)]">显示搜索框</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={settings.enableLocalFilter} onChange={toggleLocalFilter} className="rounded" />
          <label className="text-sm text-[var(--color-text-primary)]">启用内网过滤模式</label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">搜索引擎列表</h3>
          <button onClick={addEngine} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs hover:opacity-90">
            <Plus size={14} /> 添加引擎
          </button>
        </div>
        <div className="space-y-2">
          {settings.searchEngines.map((engine) => (
            <div key={engine.id} className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-lg p-3 flex-wrap">
              <input type="checkbox" checked={engine.enabled} onChange={(e) => updateEngine(engine.id, { enabled: e.target.checked })} className="rounded" />
              <input
                value={engine.name}
                onChange={(e) => updateEngine(engine.id, { name: e.target.value })}
                className="px-2 py-1 rounded bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] w-24"
              />
              <input
                value={engine.urlTemplate}
                onChange={(e) => updateEngine(engine.id, { urlTemplate: e.target.value })}
                className="flex-1 min-w-[200px] px-2 py-1 rounded bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] font-mono"
              />
              <input
                type="radio"
                name="defaultEngine"
                checked={engine.isDefault}
                onChange={() => {
                  setSettings({
                    ...settings,
                    searchEngines: settings.searchEngines.map((e) => ({ ...e, isDefault: e.id === engine.id })),
                  });
                }}
              />
              <label className="text-xs text-[var(--color-text-secondary)]">默认</label>
              <button onClick={() => removeEngine(engine.id)} className="text-[var(--color-status-offline)] hover:opacity-80">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonitorTab({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.enableStatusMonitor}
          onChange={(e) => setSettings({ ...settings, enableStatusMonitor: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm text-[var(--color-text-primary)]">启用状态监控</label>
      </div>

      {settings.enableStatusMonitor && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">检测间隔（秒）</label>
            <input
              type="number"
              value={settings.statusCheckInterval}
              onChange={(e) => setSettings({ ...settings, statusCheckInterval: Number(e.target.value) })}
              min={10}
              className="w-32 mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)]">超时时间（秒）</label>
            <input
              type="number"
              value={settings.statusCheckTimeout}
              onChange={(e) => setSettings({ ...settings, statusCheckTimeout: Number(e.target.value) })}
              min={1}
              className="w-32 mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AppearanceTab({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  const { theme, setTheme } = useTheme();

  const colorKeys: { key: keyof ColorTheme; label: string }[] = [
    { key: 'background', label: '页面背景' },
    { key: 'card', label: '卡片背景' },
    { key: 'cardBorder', label: '卡片边框' },
    { key: 'textPrimary', label: '主文字' },
    { key: 'textSecondary', label: '次文字' },
    { key: 'accent', label: '主色调' },
    { key: 'searchBg', label: '搜索框背景' },
    { key: 'searchBorder', label: '搜索框边框' },
    { key: 'categoryTitle', label: '分类标题' },
    { key: 'statusOnline', label: '状态灯在线' },
    { key: 'statusOffline', label: '状态灯离线' },
  ];

  const updateColor = (mode: 'light' | 'dark', key: keyof ColorTheme, value: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [mode]: { ...settings.colors[mode], [key]: value },
      },
    });
  };

  const resetColors = (mode: 'light' | 'dark') => {
    const defaults = mode === 'light'
      ? { background: '#FAFAFA', card: '#FFFFFF', cardBorder: '#E5E7EB', textPrimary: '#1A1A1A', textSecondary: '#666666', accent: '#3B82F6', searchBg: '#FFFFFF', searchBorder: '#D1D5DB', categoryTitle: '#1A1A1A', statusOnline: '#22C55E', statusOffline: '#EF4444' }
      : { background: '#0F0F0F', card: '#1E1E1E', cardBorder: '#333333', textPrimary: '#E5E5E5', textSecondary: '#999999', accent: '#3B82F6', searchBg: '#252525', searchBorder: '#404040', categoryTitle: '#E5E5E5', statusOnline: '#22C55E', statusOffline: '#EF4444' };
    setSettings({
      ...settings,
      colors: { ...settings.colors, [mode]: defaults },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">主题</h3>
        <div className="flex items-center gap-3">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                theme === mode
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
              }`}
            >
              {mode === 'light' ? '亮色' : mode === 'dark' ? '暗色' : '跟随系统'}
            </button>
          ))}
        </div>
      </div>

      {(['light', 'dark'] as const).map((mode) => (
        <div key={mode}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              {mode === 'light' ? '亮色模式配色' : '暗色模式配色'}
            </h3>
            <button
              onClick={() => resetColors(mode)}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              恢复默认
            </button>
          </div>
          <div className="space-y-2">
            {colorKeys.map(({ key, label }) => (
              <ColorPicker
                key={key}
                label={label}
                value={settings.colors[mode][key]}
                onChange={(value) => updateColor(mode, key, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneralTab({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">页面标题</label>
        <input
          value={settings.pageTitle}
          onChange={(e) => setSettings({ ...settings, pageTitle: e.target.value })}
          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.showClock}
          onChange={(e) => setSettings({ ...settings, showClock: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm text-[var(--color-text-primary)]">显示时钟</label>
      </div>

      <div className="border-t border-[var(--color-card-border)] pt-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">PVE 节点概览</h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={settings.enablePveOverview}
            onChange={(e) => setSettings({ ...settings, enablePveOverview: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm text-[var(--color-text-primary)]">启用 PVE 节点概览</label>
        </div>
        {settings.enablePveOverview && (
          <div className="space-y-3 pl-4 border-l-2 border-[var(--color-accent)]/30">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">PVE API 地址</label>
              <input
                value={settings.pveApiUrl}
                onChange={(e) => setSettings({ ...settings, pveApiUrl: e.target.value })}
                placeholder="https://192.168.1.10:8006/api2/json"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">节点名称</label>
              <input
                value={settings.pveNodeName}
                onChange={(e) => setSettings({ ...settings, pveNodeName: e.target.value })}
                placeholder="pve"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">API Token</label>
              <input
                type="password"
                value={settings.pveApiToken}
                onChange={(e) => setSettings({ ...settings, pveApiToken: e.target.value })}
                placeholder="PVEAPIToken=USER@REALM!TOKENID=UUID"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--color-search-bg)] border border-[var(--color-search-border)] text-sm text-[var(--color-text-primary)] font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
