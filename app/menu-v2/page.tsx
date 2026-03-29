"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useCanteen } from "@/lib/canteen-context";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit2,
  Plus,
  X,
  Save,
  UtensilsCrossed,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Tags,
  Image as ImageIcon,
  Eye,
  EyeOff,
  LayoutDashboard,
  IndianRupee,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuSkeleton } from "@/components/page-skeletons";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  canteen_id: string;
  created_at: string;
  is_available: boolean;
  category?: string | null;
  image_url?: string | null;
  is_recommended?: boolean;
  item_type?: "veg" | "non-veg";
  abbreviation?: string | null;
  aliases?: string[] | null;
  free_delivery_item?: boolean;
  strikethrough_value?: number | null;
  hidden_charges?: number;
  supports_scheduled?: "on-demand" | "scheduled" | "both";
  max_quantity?: number | null;
  quantity_left: number;
}

interface Category {
  id: string;
  name: string;
  canteen_id: string;
  created_at: string;
}

function MenuManagementContent() {
  const { selectedCanteen } = useCanteen();
  const { isKitchen } = useAuth();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams?.get("tab") === "categories" ? "categories" : "items";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobile, setIsMobile] = useState(false);

  // Items state
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // Item form state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormName, setItemFormName] = useState("");
  const [itemFormPrice, setItemFormPrice] = useState("");
  const [itemFormCategory, setItemFormCategory] = useState("");
  const [itemFormItemType, setItemFormItemType] = useState<"veg" | "non-veg">(
    "non-veg",
  );
  const [itemFormImageUrl, setItemFormImageUrl] = useState("");
  const [itemFormImageFile, setItemFormImageFile] = useState<File | null>(null);
  const [itemFormImageUploading, setItemFormImageUploading] = useState(false);
  const [itemFormDescription, setItemFormDescription] = useState("");
  const [itemFormAbbreviation, setItemFormAbbreviation] = useState("");
  const [itemFormAliases, setItemFormAliases] = useState("");
  const [itemFormFreeDelivery, setItemFormFreeDelivery] = useState(false);
  const [itemFormStrikethroughValue, setItemFormStrikethroughValue] =
    useState("");
  const [itemFormHiddenCharges, setItemFormHiddenCharges] = useState("");
  const [itemFormSupportsScheduled, setItemFormSupportsScheduled] = useState<"on-demand" | "scheduled" | "both">("both");
  const [itemFormMaxQuantity, setItemFormMaxQuantity] = useState("");
  const [itemFormQuantityLeft, setItemFormQuantityLeft] = useState("");
  const [itemFormError, setItemFormError] = useState("");
  const [itemFormLoading, setItemFormLoading] = useState(false);

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormError, setCategoryFormError] = useState("");
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch data
  const fetchCategories = async () => {
    if (!selectedCanteen) {
      setCategories([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/categories?canteen_id=${selectedCanteen.id}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to load categories");
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  const fetchItems = async () => {
    if (!selectedCanteen) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/menu?canteenId=${selectedCanteen.id}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to load menu items");
      const data = await response.json();
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [selectedCanteen]);

  // Item operations
  const openItemAddDialog = () => {
    setEditingItem(null);
    setItemFormName("");
    setItemFormDescription("");
    setItemFormPrice("");
    setItemFormCategory("");
    setItemFormItemType("non-veg");
    setItemFormImageUrl("");
    setItemFormImageFile(null);
    setItemFormAbbreviation("");
    setItemFormAliases("");
    setItemFormFreeDelivery(false);
    setItemFormStrikethroughValue("");
    setItemFormHiddenCharges("");
    setItemFormSupportsScheduled("both");
    setItemFormMaxQuantity("");
    setItemFormQuantityLeft("");
    setItemFormError("");
    setItemDialogOpen(true);
  };

  const openItemEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormName(item.name);
    setItemFormDescription(item.description || "");
    setItemFormPrice(item.price.toString());
    setItemFormCategory(item.category || "");
    setItemFormItemType(item.item_type || "non-veg");
    setItemFormImageUrl(item.image_url || "");
    setItemFormImageFile(null);
    setItemFormAbbreviation(item.abbreviation || "");
    setItemFormAliases(item.aliases?.join(", ") || "");
    setItemFormFreeDelivery(item.free_delivery_item ?? false);
    setItemFormStrikethroughValue(item.strikethrough_value?.toString() || "");
    setItemFormHiddenCharges(item.hidden_charges?.toString() || "");
    setItemFormSupportsScheduled(item.supports_scheduled || "both");
    setItemFormMaxQuantity(item.max_quantity?.toString() || "");
    setItemFormQuantityLeft(item.quantity_left?.toString() || "0");
    setItemFormError("");
    setItemDialogOpen(true);
  };

  const closeItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setItemFormName("");
    setItemFormDescription("");
    setItemFormPrice("");
    setItemFormCategory("");
    setItemFormItemType("non-veg");
    setItemFormImageUrl("");
    setItemFormImageFile(null);
    setItemFormAbbreviation("");
    setItemFormAliases("");
    setItemFormFreeDelivery(false);
    setItemFormStrikethroughValue("");
    setItemFormHiddenCharges("");
    setItemFormSupportsScheduled("both");
    setItemFormMaxQuantity("");
    setItemFormQuantityLeft("");
    setItemFormError("");
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setItemFormError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setItemFormError("Image size must be less than 5MB");
      return;
    }

    setItemFormImageFile(file);
    setItemFormImageUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!itemFormImageFile) return itemFormImageUrl || null;

    setItemFormImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", itemFormImageFile);
      formData.append("folder", "menu-items");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const { url } = await response.json();
      return url;
    } catch (err: any) {
      console.error("Image upload error:", err);
      setItemFormError(err.message || "Failed to upload image");
      return null;
    } finally {
      setItemFormImageUploading(false);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemFormLoading(true);
    setItemFormError("");

    if (!itemFormName.trim()) {
      setItemFormError("Item name is required");
      setItemFormLoading(false);
      return;
    }

    const price = parseFloat(itemFormPrice);
    if (isNaN(price) || price <= 0) {
      setItemFormError("Valid price is required");
      setItemFormLoading(false);
      return;
    }

    if (!selectedCanteen) {
      setItemFormError("Please select a kitchen first");
      setItemFormLoading(false);
      return;
    }

    try {
      // Upload image if new file is selected
      let imageUrl = itemFormImageUrl;
      if (itemFormImageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setItemFormLoading(false);
          return; // Error already set in uploadImage
        }
        imageUrl = uploadedUrl;
      }

      // Parse aliases from comma-separated string
      const aliasArray = itemFormAliases
        .split(",")
        .map((a) => a.trim().toUpperCase())
        .filter((a) => a.length > 0);

      // Add abbreviation to aliases if not already present
      const abbrevUpper = itemFormAbbreviation.trim().toUpperCase();
      if (abbrevUpper && !aliasArray.includes(abbrevUpper)) {
        aliasArray.unshift(abbrevUpper);
      }

      const itemData = {
        name: itemFormName.trim(),
        description: itemFormDescription.trim() || null,
        price,
        category: itemFormCategory.trim() || null,
        image_url: imageUrl || null,
        item_type: itemFormItemType,
        canteen_id: selectedCanteen.id,
        abbreviation: abbrevUpper || null,
        aliases: aliasArray.length > 0 ? aliasArray : null,
        free_delivery_item: itemFormFreeDelivery,
        strikethrough_value: itemFormStrikethroughValue
          ? parseFloat(itemFormStrikethroughValue)
          : null,
        hidden_charges: itemFormHiddenCharges
          ? parseFloat(itemFormHiddenCharges)
          : 0,
        max_quantity: itemFormMaxQuantity
          ? parseInt(itemFormMaxQuantity)
          : null,
        quantity_left: itemFormQuantityLeft
          ? parseInt(itemFormQuantityLeft)
          : 0,
      };

      const response = await fetch("/api/menu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem?.id || undefined,
          menuData: itemData,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save item");

      toast.success(`Item ${editingItem ? "updated" : "added"} successfully`);

      closeItemDialog();
      await fetchItems();
    } catch (err: any) {
      console.error("Error saving item:", err);
      setItemFormError(err.message || "An error occurred");
    } finally {
      setItemFormLoading(false);
    }
  };

  const handleItemDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete item");

      toast.success("Item deleted successfully");
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item");
    }
  };

  const toggleItemAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/menu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          menuData: { is_available: !currentStatus },
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update status");

      toast.success(
        `Item marked as ${!currentStatus ? "available" : "unavailable"}`,
      );
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, is_available: !currentStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Error updating availability:", err);
      toast.error("Failed to update availability");
    }
  };

  const toggleRecommended = async (id: string, currentStatus: boolean) => {
    // Check limit if turning ON
    if (!currentStatus) {
      const currentRecommendedCount = items.filter(
        (i) => i.is_recommended,
      ).length;
      if (currentRecommendedCount >= 7) {
        toast.error("Maximum 7 recommended items allowed");
        return;
      }
    }

    try {
      const response = await fetch("/api/menu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          menuData: { is_recommended: !currentStatus },
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update status");

      toast.success(
        `Item ${!currentStatus ? "added to" : "removed from"} recommended`,
      );
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, is_recommended: !currentStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  // Category operations
  const openCategoryAddDialog = () => {
    setEditingCategory(null);
    setCategoryFormError("");
    setCategoryDialogOpen(true);
  };

  const openCategoryEditDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormName(category.name);
    setCategoryFormError("");
    setCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryFormName("");
    setCategoryFormError("");
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormLoading(true);
    setCategoryFormError("");

    if (!categoryFormName.trim()) {
      setCategoryFormError("Category name is required");
      setCategoryFormLoading(false);
      return;
    }

    if (!selectedCanteen) {
      setCategoryFormError("Please select a kitchen first");
      setCategoryFormLoading(false);
      return;
    }

    try {
      const categoryData = {
        name: categoryFormName.trim(),
        canteen_id: selectedCanteen.id,
      };

      if (editingCategory) {
        const response = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, ...categoryData }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to update category");
        toast.success("Category updated successfully");
      } else {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 409) {
            setCategoryFormError("A category with this name already exists");
            return;
          }
          throw new Error(data.error || "Failed to add category");
        }
        toast.success("Category added successfully");
      }

      closeCategoryDialog();
      await fetchCategories();
    } catch (err: any) {
      console.error("Error saving category:", err);
      if (err.code === "23505") {
        setCategoryFormError("A category with this name already exists");
      } else {
        setCategoryFormError(err.message || "An error occurred");
      }
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleCategoryDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw { code: "23503" };
        }
        throw new Error(data.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err: any) {
      console.error("Error deleting category:", err);
      if (err.code === "23503") {
        toast.error("Cannot delete - category is in use");
      } else {
        toast.error("Failed to delete category");
      }
    }
  };

  // Filtered data
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.category &&
            item.category.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available";
      result = result.filter((item) => item.is_available === isAvailable);
    }

    return result;
  }, [items, searchQuery, categoryFilter, availabilityFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const availableItems = items.filter((item) => item.is_available).length;
    const totalRevenue = items.reduce((sum, item) => sum + item.price, 0);
    const avgPrice = items.length > 0 ? totalRevenue / items.length : 0;
    const recommendedCount = items.filter((item) => item.is_recommended).length;
    return {
      totalItems: items.length,
      availableItems,
      unavailableItems: items.length - availableItems,
      totalCategories: categories.length,
      avgPrice,
      recommendedCount,
    };
  }, [items, categories]);

  // Form render functions (avoids remounting issues vs components)
  const renderItemForm = ({
    formId = "item-form",
    hideButtons = false,
  } = {}) => (
    <form
      id={formId}
      onSubmit={handleItemSubmit}
      className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-name`}
          className="text-sm font-medium">
          Item Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${formId}-name`}
          value={itemFormName}
          onChange={(e) => setItemFormName(e.target.value)}
          placeholder="e.g., Masala Dosa, Chai, Samosa"
          className="h-10"
          autoFocus={!isMobile}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-description`}
          className="text-sm font-medium">
          Description{" "}
          <span className="text-xs font-normal text-slate-500 ml-1">
            (Optional)
          </span>
        </Label>
        <Textarea
          id={`${formId}-description`}
          value={itemFormDescription}
          onChange={(e) => setItemFormDescription(e.target.value)}
          placeholder="e.g., Crispy rice crepe served with coconut chutney and sambar"
          className="resize-none text-sm min-h-[72px]"
          maxLength={200}
        />
        {itemFormDescription.length > 0 && (
          <p className="text-[10px] text-slate-400 text-right">
            {itemFormDescription.length}/200
          </p>
        )}
      </div>

      {/* Row 1: Price and Item Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label
            htmlFor={`${formId}-price`}
            className="text-sm font-medium">
            Price (₹) <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`${formId}-price`}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={itemFormPrice}
            onChange={(e) => setItemFormPrice(e.target.value)}
            placeholder="0.00"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={`${formId}-type`}
            className="text-sm font-medium">
            Item Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={itemFormItemType}
            onValueChange={(val: "veg" | "non-veg") =>
              setItemFormItemType(val)
            }>
            <SelectTrigger
              id={`${formId}-type`}
              className="h-10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="veg">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border-2 border-green-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                  </div>
                  Veg
                </div>
              </SelectItem>
              <SelectItem value="non-veg">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border-2 border-red-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                  </div>
                  Non-Veg
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Category and Abbreviation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label
            htmlFor={`${formId}-category`}
            className="text-sm font-medium truncate block">
            Category
          </Label>
          <Select
            value={itemFormCategory || "none"}
            onValueChange={(val) =>
              setItemFormCategory(val === "none" ? "" : val)
            }>
            <SelectTrigger
              id={`${formId}-category`}
              className="h-10">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`${formId}-abbreviation`}
              className="text-sm font-medium truncate block">
              Short Code
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const words = itemFormName.trim().split(/\s+/);
                const abbrev = words
                  .map((w) => w.charAt(0).toUpperCase())
                  .join("");
                if (abbrev.length >= 2) setItemFormAbbreviation(abbrev);
              }}
              className="h-auto p-0 text-[10px] text-blue-500 hover:text-blue-400 font-normal"
              title="Auto-generate">
              Auto
            </Button>
          </div>
          <Input
            id={`${formId}-abbreviation`}
            value={itemFormAbbreviation}
            onChange={(e) =>
              setItemFormAbbreviation(e.target.value.toUpperCase())
            }
            placeholder="e.g. CTM"
            className="h-10"
            maxLength={6}
          />
        </div>
      </div>

      {/* Item Image */}
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-image`}
          className="text-sm font-medium">
          Image
        </Label>
        <div className="flex items-center gap-3">
          {itemFormImageUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group">
              <img
                src={itemFormImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setItemFormImageUrl("");
                  setItemFormImageFile(null);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <Input
              id={`${formId}-image`}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="h-10 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={itemFormImageUploading}
            />
            {itemFormImageUploading && (
              <p className="text-[10px] text-slate-500 mt-1 animate-pulse">
                Uploading...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Aliases */}
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-aliases`}
          className="text-sm font-medium">
          Search Aliases{" "}
          <span className="text-xs font-normal text-slate-500 ml-1">
            (Optional)
          </span>
        </Label>
        <Input
          id={`${formId}-aliases`}
          value={itemFormAliases}
          onChange={(e) => setItemFormAliases(e.target.value)}
          placeholder="e.g., 'BC' for Butter Chicken"
          className="h-10"
        />
      </div>

      {/* Combo Below 149 Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label
            htmlFor={`${formId}-strikethrough`}
            className="text-sm font-medium">
            Original Price (₹){" "}
            <span className="text-xs font-normal text-slate-500 ml-1">
              (For savings display)
            </span>
          </Label>
          <Input
            id={`${formId}-strikethrough`}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={itemFormStrikethroughValue}
            onChange={(e) => setItemFormStrikethroughValue(e.target.value)}
            placeholder="e.g. 199"
            className="h-10"
          />
        </div>

        {!isKitchen && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Free Delivery</Label>
            <button
              type="button"
              onClick={() => setItemFormFreeDelivery(!itemFormFreeDelivery)}
              className={`h-10 w-full rounded-lg border flex items-center justify-between px-3 text-sm font-medium transition-colors ${
                itemFormFreeDelivery
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
              }`}>
              <span>{itemFormFreeDelivery ? "✓ Enabled" : "Disabled"}</span>
              <div
                className={`w-8 h-4 rounded-full transition-colors ${itemFormFreeDelivery ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"} relative`}>
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${itemFormFreeDelivery ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </div>
            </button>
          </div>
        )}

        {!isKitchen && (
          <div className="space-y-2">
            <Label
              htmlFor={`${formId}-hidden-charges`}
              className="text-sm font-medium">
              Hidden Charges (₹){" "}
              <span className="text-xs font-normal text-slate-500 ml-1">
                (Optional)
              </span>
            </Label>
            <Input
              id={`${formId}-hidden-charges`}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={itemFormHiddenCharges}
              onChange={(e) => setItemFormHiddenCharges(e.target.value)}
              placeholder="0.00"
              className="h-10"
            />
          </div>
        )}

        {isKitchen && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supports Scheduling</Label>
            <Select
              value={itemFormSupportsScheduled}
              onValueChange={(val: any) => setItemFormSupportsScheduled(val)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both (Instant & Scheduled)</SelectItem>
                <SelectItem value="scheduled">Scheduled Orders Only</SelectItem>
                <SelectItem value="on-demand">Instant Orders Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {isKitchen && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Max Order Qty <span className="text-xs font-normal text-slate-500 ml-1">(Per Order)</span>
            </Label>
            <Input
              type="number"
              min="1"
              value={itemFormMaxQuantity}
              onChange={(e) => setItemFormMaxQuantity(e.target.value)}
              placeholder="e.g. 5"
              className="h-10"
            />
          </div>
        )}
        {isKitchen && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Available Quantity <span className="text-xs font-normal text-slate-500 ml-1">(Stock)</span>
            </Label>
            <Input
              type="number"
              min="0"
              value={itemFormQuantityLeft}
              onChange={(e) => setItemFormQuantityLeft(e.target.value)}
              placeholder="e.g. 50"
              className="h-10 border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 focus:ring-red-500"
            />
          </div>
        )}
      </div>
      {itemFormError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {itemFormError}
        </div>
      )}

      {!hideButtons && (
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeItemDialog}
            className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={itemFormLoading || itemFormImageUploading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {itemFormLoading || itemFormImageUploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {editingItem ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingItem ? "Update" : "Add Item"}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );

  const renderCategoryForm = ({
    formId = "category-form",
    hideButtons = false,
  } = {}) => (
    <form
      id={formId}
      onSubmit={handleCategorySubmit}
      className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-name`}
          className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Category Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${formId}-name`}
          value={categoryFormName}
          onChange={(e) => setCategoryFormName(e.target.value)}
          placeholder="e.g., Biryani, Drinks, Desserts"
          className="h-10 text-slate-900 dark:text-slate-100"
          autoFocus={!isMobile}
        />
      </div>

      {categoryFormError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {categoryFormError}
        </div>
      )}

      {!hideButtons && (
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeCategoryDialog}
            className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={categoryFormLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {categoryFormLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {editingCategory ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingCategory ? "Update" : "Add Category"}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 md:bg-white md:dark:bg-slate-950">
        <div className="max-w-[1600px] mx-auto px-3 md:px-4 lg:px-8 py-3 md:py-6">
          <MenuSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 md:bg-white md:dark:bg-slate-950">
      {/* Mobile Header */}
      {/* Mobile Header - Compact */}
      <div className="md:hidden sticky top-[69px] z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/60 pb-2">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Menu
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  MANAGEMENT
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Mobile Search Bar inside Sticky Header */}
        <div className="px-4 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder={
                activeTab === "categories"
                  ? "Search categories..."
                  : "Search items..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full text-sm bg-slate-900 border-slate-800 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-lg placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Inline Stats - Scrolled (Non-Sticky) */}
      <div className="md:hidden px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex gap-2 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex-1 text-center shadow-sm">
            <p className="text-lg font-bold text-white leading-none">
              {stats.totalItems}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium uppercase tracking-wider">
              Items
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex-1 text-center shadow-sm">
            <p className="text-lg font-bold text-green-400 leading-none">
              {stats.availableItems}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium uppercase tracking-wider">
              Active
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex-1 text-center shadow-sm">
            <p className="text-lg font-bold text-orange-400 leading-none">
              {stats.totalCategories}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium uppercase tracking-wider">
              Cats
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex-1 text-center shadow-sm">
            <p className="text-lg font-bold text-emerald-400 leading-none">
              ₹{Math.round(stats.avgPrice)}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium uppercase tracking-wider">
              Avg
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 md:px-4 lg:px-8 py-3 md:py-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-600 dark:bg-red-500 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Menu Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your menu items and categories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Inline Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.totalItems}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Total Items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.availableItems}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Available
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Tags className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {stats.totalCategories}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Categories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ₹{Math.round(stats.avgPrice)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Avg Price
                  </p>
                </div>
              </div>
            </div>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs">
                <LayoutDashboard className="h-3 w-3" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <TabsList className="bg-slate-800 md:bg-slate-100 md:dark:bg-slate-800 border-0 md:border border-slate-200 md:dark:border-slate-700 h-9">
              <TabsTrigger
                value="items"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs md:text-sm px-4">
                <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                Items ({items.length})
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs md:text-sm px-4">
                <Tags className="w-3.5 h-3.5 mr-1.5" />
                Categories ({categories.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === "items" && (
              <Button
                onClick={openItemAddDialog}
                size="sm"
                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            )}
            {activeTab === "categories" && (
              <Button
                onClick={openCategoryAddDialog}
                size="sm"
                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            )}
          </div>

          {/* Items Tab */}
          <TabsContent
            value="items"
            className="space-y-3 mt-0">
            {/* Filters */}
            {/* Filters - Mobile Optimized */}
            <div className="space-y-3">
              {/* Desktop Filters (Search is now Global on Mobile) */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Mobile: Horizontal Filter Chips */}
              <div className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    categoryFilter === "all"
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}>
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.name)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      categoryFilter === cat.name
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Desktop: Standard Filters */}
              <div className="hidden md:grid grid-cols-2 gap-3">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white border-slate-300">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white border-slate-300">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="unavailable">
                      Unavailable Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Grid */}
            {items.length === 0 ? (
              <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 bg-slate-900 md:bg-white md:dark:bg-slate-900">
                <CardContent className="p-12 text-center">
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-3 text-slate-600 dark:text-slate-400" />
                  <p className="text-lg text-slate-300 md:text-slate-600 md:dark:text-slate-400 mb-2">
                    No menu items yet
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                    Get started by adding your first item
                  </p>
                  <Button
                    onClick={openItemAddDialog}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 bg-slate-900 md:bg-white md:dark:bg-slate-900">
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 mx-auto mb-3 text-slate-600 dark:text-slate-400" />
                  <p className="text-lg text-slate-300 md:text-slate-600 md:dark:text-slate-400 mb-2">
                    No items found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setAvailabilityFilter("all");
                    }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`group border-0 md:border shadow-none md:shadow-sm hover:shadow-md transition-all overflow-hidden bg-slate-900 md:bg-white md:dark:bg-slate-900 border-slate-800 md:border-slate-200 md:dark:border-slate-800 ${
                      !item.is_available && "opacity-70 grayscale-[0.5]"
                    }`}>
                    <div className="flex flex-col h-full">
                      {/* Image Top */}
                      <div className="relative w-full aspect-[4/3] shrink-0 overflow-hidden bg-slate-800 md:bg-slate-100 md:dark:bg-slate-800">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.innerHTML =
                                '<div class="w-full h-full flex items-center justify-center text-slate-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-500">
                            <UtensilsCrossed className="w-8 h-8 opacity-30" />
                          </div>
                        )}

                        {/* Status Badges Overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {!item.is_available && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase tracking-wide">
                              Sold Out
                            </Badge>
                          )}
                          {item.is_recommended && (
                            <Badge className="bg-yellow-500 text-black h-5 px-1.5 text-[10px] border-0">
                              <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />{" "}
                              Auto
                            </Badge>
                          )}
                        </div>

                        {/* Edit & Delete Button Overlay (Top-Right) */}
                        <div className="md:hidden absolute top-2 right-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openItemEditDialog(item);
                            }}
                            className="h-7 w-7 p-0 rounded-full shadow-lg bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemDelete(item.id, item.name);
                            }}
                            className="h-7 w-7 p-0 rounded-full shadow-lg bg-red-900/80 hover:bg-red-900 text-white border border-white/10 backdrop-blur-md">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Visibility Toggle Overlay (Bottom-Right) */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemAvailability(item.id, item.is_available);
                          }}
                          className={`md:hidden absolute bottom-2 right-2 h-7 w-7 p-0 rounded-full shadow-lg border border-white/10 backdrop-blur-md ${item.is_available ? "bg-green-600/90 hover:bg-green-700 text-white" : "bg-slate-600/90 hover:bg-slate-700 text-slate-200"}`}>
                          {item.is_available ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        {/* Desktop Action Overlay */}
                        <div className="hidden md:flex absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openItemEditDialog(item);
                            }}
                            className="h-8 w-8 p-0 shadow-lg bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemDelete(item.id, item.name);
                            }}
                            className="h-8 w-8 p-0 shadow-lg bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-2.5 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-semibold text-sm text-white md:text-slate-900 md:dark:text-white leading-tight line-clamp-2 min-h-[1.25rem]">
                            {item.name}
                          </h3>
                          {/* Indicator */}
                          <div
                            className={`mt-0.5 w-3 h-3 rounded-sm items-center justify-center shrink-0 border-[1.5px] ${item.item_type === "veg" ? "border-green-500" : "border-red-500"}`}>
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${item.item_type === "veg" ? "bg-green-500" : "bg-red-500"}`}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-1">
                          <p className="text-sm font-bold text-red-500">
                            ₹{item.price}
                          </p>
                          {item.category && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[60px] text-right">
                              {item.category}
                            </p>
                          )}
                        </div>

                        {/* Desktop Footer Actions */}
                        <div className="hidden md:flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() =>
                              toggleRecommended(
                                item.id,
                                item.is_recommended || false,
                              )
                            }
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              item.is_recommended
                                ? "text-yellow-600 dark:text-yellow-500"
                                : "text-slate-400 hover:text-yellow-600"
                            }`}>
                            <Star
                              className={`w-3.5 h-3.5 ${item.is_recommended ? "fill-current" : ""}`}
                            />
                            {item.is_recommended ? "Yes" : "No"}
                          </button>

                          <button
                            onClick={() =>
                              toggleItemAvailability(item.id, item.is_available)
                            }
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              item.is_available
                                ? "text-green-600 dark:text-green-500"
                                : "text-slate-400 hover:text-slate-600"
                            }`}>
                            {item.is_available ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                            {item.is_available ? "Show" : "Hide"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent
            value="categories"
            className="mt-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 md:bg-white md:dark:bg-slate-900 rounded-lg border border-slate-800 md:border-slate-200 md:dark:border-slate-800">
                <Tags className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {searchQuery ||
                  categoryFilter !== "all" ||
                  availabilityFilter !== "all"
                    ? "No categories found"
                    : "No categories yet"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {searchQuery ||
                  categoryFilter !== "all" ||
                  availabilityFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start organizing your menu by adding categories"}
                </p>
                {!searchQuery &&
                  categoryFilter === "all" &&
                  availabilityFilter === "all" && (
                    <Button
                      onClick={openCategoryAddDialog}
                      className="bg-red-600 hover:bg-red-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Category
                    </Button>
                  )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    className="group border-0 md:border shadow-sm hover:shadow-md transition-all bg-slate-900 md:bg-white md:dark:bg-slate-900 border-slate-800 md:border-slate-200 md:dark:border-slate-800">
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-red-900/20 md:bg-red-100 md:dark:bg-red-900/20 flex items-center justify-center shrink-0">
                          <Tags className="w-7 h-7 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="font-semibold text-sm text-white md:text-slate-900 md:dark:text-white truncate">
                            {category.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 md:text-slate-500 md:dark:text-slate-400">
                            {new Date(category.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 w-full mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCategoryEditDialog(category)}
                            className="h-7 flex-1 text-xs">
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCategoryDelete(category.id, category.name)
                            }
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button for Mobile - Centered above Bottom Nav */}
      <div className="md:hidden fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={() =>
            activeTab === "items"
              ? openItemAddDialog()
              : openCategoryAddDialog()
          }
          className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_8px_30px_rgba(220,38,38,0.5)] border-4 border-slate-950 flex items-center justify-center transition-all active:scale-95 animate-in fade-in zoom-in duration-300"
          aria-label={activeTab === "items" ? "Add Item" : "Add Category"}>
          <Plus className="h-7 w-7 stroke-[3]" />
        </Button>
      </div>

      {/* Item Dialog/Sheet */}
      {isMobile ? (
        <Sheet
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[90vh] bg-slate-950 border-t border-slate-800 p-0 flex flex-col rounded-t-xl">
            <SheetHeader className="px-6 py-4 border-b border-slate-800">
              <SheetTitle className="text-white text-lg">
                {editingItem ? "Edit Item" : "New Item"}
              </SheetTitle>
              <SheetDescription className="text-slate-500/80 hidden">
                Form details
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-6 text-slate-100">
              {renderItemForm({
                formId: "mobile-item-form",
                hideButtons: true,
              })}
            </div>
            {/* Sticky Mobile Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-8 safe-area-bottom z-20">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeItemDialog}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12 text-base">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="mobile-item-form"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold shadow-lg shadow-red-900/40"
                  disabled={itemFormLoading || itemFormImageUploading}>
                  {itemFormLoading || itemFormImageUploading
                    ? "Saving..."
                    : editingItem
                      ? "Update Item"
                      : "Add Item"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update item details"
                  : "Fill in the details to add a new menu item"}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              {renderItemForm()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Dialog/Sheet */}
      {isMobile ? (
        <Sheet
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}>
          <SheetContent
            side="bottom"
            className="h-[auto] max-h-[90vh] bg-slate-950 border-t border-slate-800 p-0 flex flex-col rounded-t-xl">
            <SheetHeader className="px-6 py-4 border-b border-slate-800">
              <SheetTitle className="text-white text-lg">
                {editingCategory ? "Edit Category" : "New Category"}
              </SheetTitle>
              <SheetDescription className="text-slate-500/80 hidden">
                Category details
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6 text-slate-100">
              {renderCategoryForm({
                formId: "mobile-category-form",
                hideButtons: true,
              })}
            </div>
            {/* Sticky Mobile Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-8 safe-area-bottom z-20">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeCategoryDialog}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12 text-base">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="mobile-category-form"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold shadow-lg shadow-red-900/40"
                  disabled={categoryFormLoading}>
                  {categoryFormLoading
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update category details"
                  : "Create a new category to organize menu items"}
              </DialogDescription>
            </DialogHeader>
            {renderCategoryForm()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export default function MenuManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      }>
      <MenuManagementContent />
    </Suspense>
  );
}
