import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { addComment, deleteComment, editComment, type Comment, type ResourceAuthor } from '@/utils/resources';
import CommentUserMention from './CommentUserMention';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';

interface CommentSectionProps {
    resourceId: string;
    comments: Comment[];
    currentUser: ResourceAuthor;
    onCommentAdded?: (comment: Comment) => void;
    onCommentEdited?: (commentId: string, content: string) => void;
    onCommentDeleted?: (commentId: string) => void;
}

export default function CommentSection({
    resourceId,
    comments,
    currentUser,
    onCommentAdded,
    onCommentEdited,
    onCommentDeleted
}: CommentSectionProps) {
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [localComments, setComments] = useState<Comment[]>(comments);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const newComment = await addComment(resourceId, {
                content: commentText.trim(),
                author: currentUser,
                timestamp: new Date().toISOString(),
            });

            setCommentText('');
            onCommentAdded?.(newComment);
        } catch (err) {
            setError('Failed to add comment. Please try again.');
            console.error('Failed to add comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editText.trim()) return;

        try {
            const success = await editComment(resourceId, commentId, editText.trim(), currentUser);
            if (success) {
                onCommentEdited?.(commentId, editText.trim());
                setEditingCommentId(null);
                setEditText('');
            }
        } catch (err) {
            console.error('Failed to edit comment:', err);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            const success = await deleteComment(resourceId, commentId, currentUser);
            if (success) {
                // Filter out the deleted comment locally
                const updatedComments = comments.filter(comment => comment.id !== commentId);
                // Update parent component
                onCommentDeleted?.(commentId);
                // Re-render with filtered comments
                setComments(updatedComments);
            }
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditText(comment.content);
    };

    // Check if user can edit/delete a comment
    const canModifyComment = (comment: Comment) => {
        return comment.author.login === currentUser.login || currentUser['staff?'];
    };
    return (
        <div className="mt-4">
            <Button
                variant="ghost"
                className="flex items-center gap-2 mb-4 hover:bg-accent"
                onClick={() => setShowComments(!showComments)}
            >
                <MessageSquare className="h-4 w-4" />
                <span>{localComments.length} Comments</span>
            </Button>

            {showComments && (
                <div className="space-y-4">
                    {/* Comment Form */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="relative">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full rounded-md border p-3 bg-background text-foreground min-h-[80px]"
                                required
                                maxLength={500}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                {commentText.length}/500
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting || !commentText.trim()}
                            className="w-full"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-sm text-gray-500">No comments yet</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="border rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <img
                                            src={comment.author.image?.small || "https://github.com/shadcn.png"}
                                            alt={comment.author.name}
                                            className="h-8 w-8 rounded-full"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-baseline gap-2">
                                                        <CommentUserMention
                                                            username={comment.author.login}
                                                            name={comment.author.name}
                                                            role={comment.author.role}
                                                            image={comment.author.image?.small || "https://github.com/shadcn.png"}
                                                            isStaff={comment.author['staff?'] || false}
                                                            usual_full_name={comment.author.usual_full_name}
                                                        />
                                                        {editingCommentId === comment.id ? (
                                                            <div className="w-full mt-2">
                                                                <textarea
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    className="w-full rounded-md border p-2 bg-background text-foreground min-h-[60px]"
                                                                    maxLength={500}
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setEditingCommentId(null);
                                                                            setEditText('');
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleEdit(comment.id)}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-foreground text-sm break-words">
                                                                {comment.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {canModifyComment(comment) && !editingCommentId && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => startEditing(comment)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(comment.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}