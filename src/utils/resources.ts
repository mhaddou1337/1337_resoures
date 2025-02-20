export interface ResourceAuthor {
    name: string;
    role: string;
    login: string;
    'staff?'?: boolean;
    image?: {
        small: string | null;
    };
    usual_full_name?: string;
}

export interface ResourceVote {
    userId: string;
    value: number; // 1 for upvote, -1 for downvote, 0 for no vote
}

export interface Comment {
    id: string;
    content: string;
    author: ResourceAuthor;
    timestamp: string;
    resourceId: string;
}

export interface Resource {
    id: string;
    title: string;
    description: string;
    category: string;
    link: string;
    author: ResourceAuthor;
    timestamp: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'published';
    tags?: string[];
    votes: ResourceVote[];
    voteCount: number;
    comments: Comment[];
}

// Simple in-memory storage with localStorage backup
let resources: Resource[] = [];

// Load saved resources from localStorage
function loadResources() {
    try {
        const saved = localStorage.getItem('resources');
        if (saved) {
            resources = JSON.parse(saved).map((r: any) => ({
                ...r,
                createdAt: new Date(r.createdAt),
                updatedAt: new Date(r.updatedAt),
                votes: r.votes || [],
                voteCount: r.voteCount || 0,
                comments: r.comments || []
            }));
        }
    } catch (error) {
        console.error('Failed to load resources from storage:', error);
    }
}

// Save resources to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('resources', JSON.stringify(resources));
    } catch (error) {
        console.error('Failed to save resources to storage:', error);
    }
}

// Initialize resources
loadResources();

export async function getSharedResources(): Promise<Resource[]> {
    return resources.filter(r => r.status === 'published');
}

export async function saveResource(resource: Resource): Promise<void> {
    // Ensure votes array exists
    if (!resource.votes) {
        resource.votes = [];
        resource.voteCount = 0;
    }

    // Ensure comments array exists
    if (!resource.comments) {
        resource.comments = [];
    }

    const existingIndex = resources.findIndex(r => r.id === resource.id);
    if (existingIndex !== -1) {
        // Update existing resource
        resources[existingIndex] = resource;
    } else {
        // Add new resource
        resources.push(resource);
    }
    saveToStorage();
}

export async function deleteResource(id: string): Promise<boolean> {
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
        resources.splice(index, 1);
        saveToStorage();
        return true;
    }
    return false;
}

export async function getResourcesByCategory(category: string): Promise<Resource[]> {
    if (!category) return getSharedResources();
    return resources.filter(r => r.status === 'published' && r.category === category);
}

export async function voteResource(resourceId: string, userId: string, value: number): Promise<void> {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) throw new Error('Resource not found');

    const existingVoteIndex = resource.votes.findIndex(v => v.userId === userId);
    const existingVote = existingVoteIndex !== -1 ? resource.votes[existingVoteIndex].value : 0;

    if (existingVoteIndex !== -1) {
        if (value === 0) {
            // Remove vote
            resource.votes.splice(existingVoteIndex, 1);
        } else {
            // Update vote
            resource.votes[existingVoteIndex].value = value;
        }
    } else if (value !== 0) {
        // Add new vote
        resource.votes.push({ userId, value });
    }

    // Update vote count
    resource.voteCount = resource.votes.reduce((sum, vote) => sum + vote.value, 0);
    saveToStorage();
}

export async function addComment(resourceId: string, comment: Omit<Comment, 'id' | 'resourceId'>): Promise<Comment> {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) throw new Error('Resource not found');

    const newComment: Comment = {
        ...comment,
        id: crypto.randomUUID(),
        resourceId
    };

    resource.comments.push(newComment);
    saveToStorage();
    return newComment;
}

export async function deleteComment(resourceId: string, commentId: string, currentUser: ResourceAuthor): Promise<boolean> {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return false;

    const comment = resource.comments.find(c => c.id === commentId);
    if (!comment) return false;

    // Only allow deletion if user is comment author or staff
    if (comment.author.login !== currentUser.login && !currentUser['staff?']) {
        return false;
    }

    const commentIndex = resource.comments.findIndex(c => c.id === commentId);
    resource.comments.splice(commentIndex, 1);
    saveToStorage();
    return true;
}

export async function editComment(resourceId: string, commentId: string, newContent: string, currentUser: ResourceAuthor): Promise<boolean> {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return false;

    const comment = resource.comments.find(c => c.id === commentId);
    if (!comment) return false;

    // Only allow editing if user is comment author or staff
    if (comment.author.login !== currentUser.login && !currentUser['staff?']) {
        return false;
    }

    comment.content = newContent;
    saveToStorage();
    return true;
}

export const categories = [
    "mathematics",
    "science",
    "programming",
    "languages",
    "humanities"
] as const;

export const categoryLabels: Record<string, string> = {
    "": "Select a category",
    mathematics: "Mathematics",
    science: "Science",
    programming: "Programming",
    languages: "Languages",
    humanities: "Humanities"
};