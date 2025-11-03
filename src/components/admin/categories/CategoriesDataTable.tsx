import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoriesManagerTranslation } from "@/lib/translations/categories-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Category } from "./AdminCategoriesNew";

interface CategoriesDataTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onReorder: (newOrder: { id: string; sort_order: number }[]) => void;
}

interface SortableRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  lang: string;
  t: (key: string) => string;
  parentName?: string;
}

function SortableRow({ category, onEdit, onDelete, lang, t, parentName }: SortableRowProps) {
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

  const categoryName = lang === "ru" ? category.name_ru : category.name_en;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <div className="font-medium">{categoryName}</div>
          <div className="text-sm text-muted-foreground">{category.slug}</div>
        </div>

        <div className="text-sm">
          {category.description ? (
            <span className="text-muted-foreground line-clamp-2">
              {category.description}
            </span>
          ) : (
            <span className="text-muted-foreground/50 italic">No description</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {parentName && (
            <Badge variant="outline" className="w-fit">
              {parentName}
            </Badge>
          )}
          <div className="flex gap-2">
            <Badge variant="secondary">
              {t("productCount").replace("{count}", String(category.total_products_count))}
            </Badge>
            {category.active_products_count > 0 && (
              <Badge variant="default">
                {t("activeProducts").replace("{count}", String(category.active_products_count))}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("editButton")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("deleteButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CategoriesDataTable({
  categories,
  onEdit,
  onDelete,
  onReorder,
}: CategoriesDataTableProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getCategoriesManagerTranslation(lang, key);
  const [items, setItems] = useState(categories);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      const newOrder = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      onReorder(newOrder);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
        <p className="text-muted-foreground">{t("empty.description")}</p>
      </div>
    );
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return undefined;
    const parent = categories.find((c) => c.id === categoryId);
    return parent ? (lang === "ru" ? parent.name_ru : parent.name_en) : undefined;
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        {t("dragHint")}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((category) => (
            <SortableRow
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              lang={lang}
              t={t}
              parentName={getCategoryName(category.parent_id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
