import React, { useState, useEffect } from "react";
import { LinkItem } from "../../types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, X } from "lucide-react";
import { getPlatformIcon } from "../../components/LinkIcon";

// --- Sortable Item Component ---
const SortableLinkItem: React.FC<{ link: LinkItem; onEdit: (l: LinkItem) => void; onDelete: (id: string) => void | Promise<void> }> = ({ link, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm mb-3">
      <div {...attributes} {...listeners} className="cursor-grab hover:text-rose-600 text-gray-400">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="text-gray-500">{getPlatformIcon(link.platform)}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{link.title}</p>
        <p className="text-sm text-gray-500 truncate">{link.url}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {link.is_active ? 'Active' : 'Hidden'}
        </span>
        <button onClick={() => onEdit(link)} className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(link.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function ManageLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<LinkItem> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchLinks = () => {
    fetch("/api/admin/data", {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLinks(data.links);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      // Persist order
      await fetch("/api/admin/links/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ linkIds: (newLinks as LinkItem[]).map((l: LinkItem) => l.id) }),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    await fetch(`/api/admin/links/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    });
    fetchLinks();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    const isNew = !editingLink.id;
    const url = isNew ? "/api/admin/links" : `/api/admin/links/${editingLink.id}`;
    const method = isNew ? "POST" : "PUT";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify(editingLink),
    });

    setIsModalOpen(false);
    fetchLinks();
  };

  const openNewModal = () => {
    setEditingLink({ platform: "custom", title: "", url: "", is_active: true });
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading links...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manage Links</h2>
          <p className="text-sm text-gray-500">Drag and drop to reorder.</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Link
        </button>
      </div>

      <div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links} strategy={verticalListSortingStrategy}>
            {links.map((link) => (
              <SortableLinkItem
                key={link.id}
                link={link}
                onEdit={(l) => { setEditingLink(l); setIsModalOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
        {links.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No links added yet.</p>
            <button onClick={openNewModal} className="text-rose-600 font-medium hover:underline">Create your first link</button>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingLink && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)} />
            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-medium text-gray-900">{editingLink.id ? "Edit Link" : "Add Link"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    value={editingLink.platform}
                    onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })}
                  >
                    <option value="shopee">Shopee</option>
                    <option value="tokopedia">Tokopedia</option>
                    <option value="lazada">Lazada</option>
                    <option value="tiktok">TikTok Shop</option>
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    value={editingLink.title || ""}
                    onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                    placeholder="e.g. Belanja di Shopee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    value={editingLink.url || ""}
                    onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                    placeholder="https://"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                    checked={editingLink.is_active ?? true}
                    onChange={(e) => setEditingLink({ ...editingLink, is_active: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (visible on public site)
                  </label>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-md hover:bg-rose-700"
                  >
                    Save Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
