export interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    status: 'draft' | 'published';
}

export interface PostMetadata {
    id: string;
    title: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published';
    tags?: string[];
}

export interface PostContent {
    content: string;
}