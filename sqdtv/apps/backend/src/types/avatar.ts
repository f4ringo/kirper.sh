export interface Avatar {
    id: string;
    username: string;
    x: number;
    y: number;
    color: string;
}

export interface AvatarUpdate {
    id: string;
    x: number;
    y: number;
}

export interface CanvasState {
    avatars: Record<string, Avatar>;
} 