import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreVertical, Pin, PinOff, Trash2, Edit, Loader2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useToggleNotePin, Note } from '@/hooks/useNotes';
import { toast } from 'sonner';

const noteColors = [
  { id: 'default', label: 'Default', class: 'bg-card' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-50 border-blue-200' },
  { id: 'green', label: 'Green', class: 'bg-green-50 border-green-200' },
  { id: 'yellow', label: 'Yellow', class: 'bg-yellow-50 border-yellow-200' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-50 border-purple-200' },
];

export default function NotesPage() {
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useToggleNotePin();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'default' });

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned);

  const handleOpenCreate = () => {
    setSelectedNote(null);
    setFormData({ title: '', content: '', color: 'default' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setSelectedNote(note);
    setFormData({ title: note.title, content: note.content || '', color: note.color });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (selectedNote) {
        await updateNote.mutateAsync({
          id: selectedNote.id,
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          color: formData.color,
        });
        toast.success('Note updated');
      } else {
        await createNote.mutateAsync({
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          color: formData.color,
        });
        toast.success('Note created');
      }
      setIsFormOpen(false);
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    try {
      await deleteNote.mutateAsync(selectedNote.id);
      toast.success('Note deleted');
      setIsDeleteOpen(false);
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await togglePin.mutateAsync({ id: note.id, is_pinned: !note.is_pinned });
      toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned');
    } catch {
      toast.error('Failed to update note');
    }
  };

  const getColorClass = (color: string) => {
    return noteColors.find((c) => c.id === color)?.class || noteColors[0].class;
  };

  const renderNoteCard = (note: Note) => (
    <Card
      key={note.id}
      className={cn(
        'goldman-card cursor-pointer transition-all hover:shadow-md',
        getColorClass(note.color)
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {note.is_pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
            <h3 className="font-medium text-sm truncate">{note.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenEdit(note)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTogglePin(note)}>
                {note.is_pinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenDelete(note)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {note.content && (
          <p className="text-sm text-muted-foreground line-clamp-4 mb-3">{note.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(parseISO(note.updated_at), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Notes"
        description="Capture ideas and important information"
        actions={
          <Button onClick={handleOpenCreate} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <StickyNote className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notes yet</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Start capturing your thoughts, meeting notes, and ideas.
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Note
          </Button>
        </div>
      )}

      {/* Notes Grid */}
      {!isLoading && notes.length > 0 && (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Pin className="w-3 h-3" />
                Pinned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedNotes.map(renderNoteCard)}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Others</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unpinnedNotes.map(renderNoteCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedNote ? 'Edit Note' : 'New Note'}</DialogTitle>
            <DialogDescription>
              {selectedNote ? 'Update your note details.' : 'Create a new note to capture your thoughts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Textarea
                placeholder="Write your note..."
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                rows={8}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Color</p>
              <div className="flex gap-2">
                {noteColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.id }))}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color.class,
                      formData.color === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createNote.isPending || updateNote.isPending}
              className="gradient-primary text-primary-foreground"
            >
              {(createNote.isPending || updateNote.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedNote?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNote.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
