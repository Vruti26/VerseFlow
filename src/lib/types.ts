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
    followers?: string[];
    following?: string[];
    createdAt: Timestamp;
}

export interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
}

export interface Report {
    id: string;
    reportedItemId: string;
    reportedItemType: 'book' | 'user';
    reportedBy: string;
    reason: string;
    status: 'Pending' | 'Resolved';
    createdAt: Timestamp;
    bookTitle?: string;
    userName?: string;
}
