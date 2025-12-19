import { Timestamp } from 'firebase/firestore';

export interface Book {
    id: string;
    title: string;
    description?: string;
    authorId: string;
    author?: string; // To be populated with the author's displayName
    status: 'draft' | 'published';
    coverImage?: string; 
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Chapter {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
}
