import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarUpdate, CanvasState } from '../types/avatar';

// In-memory store for canvas state
const canvasState: CanvasState = {
    avatars: {},
};

// Generate a random color for avatar
const generateRandomColor = (): string => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const canvasService = {
    // Add a new avatar to the canvas
    addAvatar: (username: string): Avatar => {
        const id = uuidv4();
        const avatar: Avatar = {
            id,
            username,
            x: Math.random() * 800, // Random initial position
            y: Math.random() * 600,
            color: generateRandomColor(),
        };

        canvasState.avatars[id] = avatar;
        return avatar;
    },

    // Update avatar position
    updateAvatarPosition: (update: AvatarUpdate): Avatar | null => {
        const avatar = canvasState.avatars[update.id];
        if (!avatar) return null;

        avatar.x = update.x;
        avatar.y = update.y;
        return avatar;
    },

    // Remove avatar from canvas
    removeAvatar: (id: string): boolean => {
        if (!canvasState.avatars[id]) return false;

        delete canvasState.avatars[id];
        return true;
    },

    // Get all avatars
    getAllAvatars: (): Avatar[] => {
        return Object.values(canvasState.avatars);
    },

    // Get avatar by ID
    getAvatarById: (id: string): Avatar | null => {
        return canvasState.avatars[id] || null;
    }
}; 